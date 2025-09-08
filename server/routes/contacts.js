const express = require('express');
const crypto = require('crypto'); const uuidv4 = () => crypto.randomUUID();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const csv = require('csv-parser');
const multer = require('multer');
const { Parser } = require('json2csv');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all contacts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    // Get total count
    db.get('SELECT COUNT(*) as total FROM contacts WHERE created_by = ?', [req.user.userId], (err, countResult) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      const total = countResult.total;
      
      // Get contacts with tags
      const query = `
        SELECT 
          c.*,
          GROUP_CONCAT(ct.tag) as tags
        FROM contacts c
        LEFT JOIN contact_tags ct ON c.id = ct.contact_id
        WHERE c.created_by = ?
        GROUP BY c.id
        ORDER BY c.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `;
      
      db.all(query, [req.user.userId, limit, offset], (err, rows) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        const contacts = rows.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          company: row.company,
          position: row.position,
          industry: row.industry,
          location: row.location,
          linkedinUrl: row.linkedin_url,
          companySize: row.company_size,
          revenue: row.revenue,
          score: row.score,
          lastContacted: row.last_contacted,
          notes: row.notes,
          tags: row.tags ? row.tags.split(',') : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
        
        res.json({
          contacts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
      });
    });
    
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create contact
router.post('/', authenticateToken, [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('company').trim().isLength({ min: 1 }),
  body('position').trim().isLength({ min: 1 }),
  body('industry').trim().isLength({ min: 1 }),
  body('location').optional().trim(),
  body('linkedinUrl').optional().isURL(),
  body('companySize').optional().trim(),
  body('revenue').optional().trim(),
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('tags').optional().isArray(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName, lastName, email, phone, company, position, industry,
      location, linkedinUrl, companySize, revenue, score = 0, tags = [], notes
    } = req.body;

    const contactId = uuidv4();
    const db = getDatabase();
    
    db.run(`
      INSERT INTO contacts (
        id, first_name, last_name, email, phone, company, position, industry,
        location, linkedin_url, company_size, revenue, score, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      contactId, firstName, lastName, email, phone, company, position, industry,
      location, linkedinUrl, companySize, revenue, score, notes, req.user.userId
    ], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Failed to create contact' });
      }
      
      // Add tags if provided
      if (tags.length > 0) {
        const tagPromises = tags.map(tag => {
          return new Promise((resolve, reject) => {
            db.run(
              'INSERT OR IGNORE INTO contact_tags (contact_id, tag) VALUES (?, ?)',
              [contactId, tag],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });
        
        Promise.all(tagPromises)
          .then(() => {
            db.close();
            res.status(201).json({
              message: 'Contact created successfully',
              contact: {
                id: contactId,
                firstName, lastName, email, phone, company, position, industry,
                location, linkedinUrl, companySize, revenue, score, tags, notes,
                createdAt: new Date().toISOString()
              }
            });
          })
          .catch(err => {
            db.close();
            res.status(500).json({ message: 'Failed to add tags' });
          });
      } else {
        db.close();
        res.status(201).json({
          message: 'Contact created successfully',
          contact: {
            id: contactId,
            firstName, lastName, email, phone, company, position, industry,
            location, linkedinUrl, companySize, revenue, score, tags: [], notes,
            createdAt: new Date().toISOString()
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export contacts to CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT 
        c.first_name, c.last_name, c.email, c.phone, c.company, 
        c.position, c.industry, c.location, c.linkedin_url, 
        c.company_size, c.revenue, c.score, c.notes,
        GROUP_CONCAT(ct.tag) as tags
      FROM contacts c
      LEFT JOIN contact_tags ct ON c.id = ct.contact_id
    `;
    
    let params = [];
    
    if (listId) {
      query += ` INNER JOIN list_contacts lc ON c.id = lc.contact_id WHERE lc.list_id = ? AND c.created_by = ?`;
      params = [listId, req.user.userId];
    } else {
      query += ` WHERE c.created_by = ?`;
      params = [req.user.userId];
    }
    
    query += ` GROUP BY c.id ORDER BY c.first_name, c.last_name`;
    
    db.all(query, params, (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const contacts = rows.map(row => ({
        'First Name': row.first_name,
        'Last Name': row.last_name,
        'Email': row.email || '',
        'Phone': row.phone || '',
        'Company': row.company,
        'Position': row.position,
        'Industry': row.industry,
        'Location': row.location || '',
        'LinkedIn URL': row.linkedin_url || '',
        'Company Size': row.company_size || '',
        'Revenue': row.revenue || '',
        'Score': row.score,
        'Tags': row.tags || '',
        'Notes': row.notes || ''
      }));
      
      try {
        const parser = new Parser();
        const csv = parser.parse(contacts);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=contacts-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
        
      } catch (csvError) {
        console.error('CSV generation error:', csvError);
        res.status(500).json({ message: 'Failed to generate CSV' });
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact
router.put('/:id', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('score').optional().isInt({ min: 0, max: 100 }),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const contactId = req.params.id;
    const updates = req.body;
    const { tags, ...contactData } = updates;
    
    const db = getDatabase();
    
    // Verify contact belongs to user
    db.get('SELECT id FROM contacts WHERE id = ? AND created_by = ?', [contactId, req.user.userId], (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        db.close();
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      // Build update query
      const fields = Object.keys(contactData).map(key => {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        return `${dbField} = ?`;
      });
      
      if (fields.length > 0) {
        const updateQuery = `UPDATE contacts SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        const values = [...Object.values(contactData), contactId];
        
        db.run(updateQuery, values, (err) => {
          if (err) {
            db.close();
            return res.status(500).json({ message: 'Failed to update contact' });
          }
          
          // Update tags if provided
          if (tags !== undefined) {
            // Delete existing tags
            db.run('DELETE FROM contact_tags WHERE contact_id = ?', [contactId], (err) => {
              if (err) {
                db.close();
                return res.status(500).json({ message: 'Failed to update tags' });
              }
              
              // Insert new tags
              if (tags.length > 0) {
                const tagInserts = tags.map(tag => 
                  new Promise((resolve, reject) => {
                    db.run(
                      'INSERT INTO contact_tags (contact_id, tag) VALUES (?, ?)',
                      [contactId, tag],
                      (err) => err ? reject(err) : resolve()
                    );
                  })
                );
                
                Promise.all(tagInserts)
                  .then(() => {
                    db.close();
                    res.json({ message: 'Contact updated successfully' });
                  })
                  .catch(() => {
                    db.close();
                    res.status(500).json({ message: 'Failed to update tags' });
                  });
              } else {
                db.close();
                res.json({ message: 'Contact updated successfully' });
              }
            });
          } else {
            db.close();
            res.json({ message: 'Contact updated successfully' });
          }
        });
      } else {
        db.close();
        res.json({ message: 'No changes made' });
      }
    });
    
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contactId = req.params.id;
    const db = getDatabase();
    
    db.run('DELETE FROM contacts WHERE id = ? AND created_by = ?', [contactId, req.user.userId], function(err) {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json({ message: 'Contact deleted successfully' });
    });
    
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;