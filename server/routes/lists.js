const express = require('express');
const crypto = require('crypto'); const uuidv4 = () => crypto.randomUUID();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all lists for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        pl.*,
        COUNT(lc.contact_id) as contact_count,
        GROUP_CONCAT(DISTINCT lt.tag) as tags
      FROM prospect_lists pl
      LEFT JOIN list_contacts lc ON pl.id = lc.list_id
      LEFT JOIN list_tags lt ON pl.id = lt.list_id
      WHERE pl.created_by = ? OR pl.is_shared = 1
      GROUP BY pl.id
      ORDER BY pl.updated_at DESC
    `;
    
    db.all(query, [req.user.userId], (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const lists = rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        contactCount: row.contact_count,
        tags: row.tags ? row.tags.split(',') : [],
        isShared: Boolean(row.is_shared),
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json({ lists });
    });
    
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new list
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray(),
  body('contactIds').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, tags = [], contactIds = [] } = req.body;
    const listId = uuidv4();
    
    const db = getDatabase();
    
    db.run(`
      INSERT INTO prospect_lists (id, name, description, created_by)
      VALUES (?, ?, ?, ?)
    `, [listId, name, description, req.user.userId], function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Failed to create list' });
      }
      
      const promises = [];
      
      // Add tags
      if (tags.length > 0) {
        tags.forEach(tag => {
          promises.push(new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO list_tags (list_id, tag) VALUES (?, ?)',
              [listId, tag],
              (err) => err ? reject(err) : resolve()
            );
          }));
        });
      }
      
      // Add contacts
      if (contactIds.length > 0) {
        contactIds.forEach(contactId => {
          promises.push(new Promise((resolve, reject) => {
            // Verify contact belongs to user first
            db.get('SELECT id FROM contacts WHERE id = ? AND created_by = ?', 
              [contactId, req.user.userId], (err, row) => {
              if (err) return reject(err);
              if (!row) return resolve(); // Skip invalid contacts
              
              db.run(
                'INSERT OR IGNORE INTO list_contacts (list_id, contact_id) VALUES (?, ?)',
                [listId, contactId],
                (err) => err ? reject(err) : resolve()
              );
            });
          }));
        });
      }
      
      Promise.all(promises)
        .then(() => {
          db.close();
          res.status(201).json({
            message: 'List created successfully',
            list: {
              id: listId,
              name,
              description,
              tags,
              contactCount: contactIds.length,
              createdAt: new Date().toISOString()
            }
          });
        })
        .catch(err => {
          console.error('List creation error:', err);
          db.close();
          res.status(500).json({ message: 'Failed to complete list creation' });
        });
    });
    
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get list details with contacts
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const listId = req.params.id;
    const db = getDatabase();
    
    // Get list info
    db.get(`
      SELECT pl.*, GROUP_CONCAT(DISTINCT lt.tag) as tags
      FROM prospect_lists pl
      LEFT JOIN list_tags lt ON pl.id = lt.list_id
      WHERE pl.id = ? AND (pl.created_by = ? OR pl.is_shared = 1)
      GROUP BY pl.id
    `, [listId, req.user.userId], (err, listRow) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!listRow) {
        db.close();
        return res.status(404).json({ message: 'List not found' });
      }
      
      // Get contacts in list
      db.all(`
        SELECT 
          c.*,
          lc.added_at,
          GROUP_CONCAT(ct.tag) as contact_tags
        FROM list_contacts lc
        INNER JOIN contacts c ON lc.contact_id = c.id
        LEFT JOIN contact_tags ct ON c.id = ct.contact_id
        WHERE lc.list_id = ?
        GROUP BY c.id
        ORDER BY lc.added_at DESC
      `, [listId], (err, contactRows) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        const contacts = contactRows.map(row => ({
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
          tags: row.contact_tags ? row.contact_tags.split(',') : [],
          addedAt: row.added_at,
          createdAt: row.created_at
        }));
        
        res.json({
          list: {
            id: listRow.id,
            name: listRow.name,
            description: listRow.description,
            tags: listRow.tags ? listRow.tags.split(',') : [],
            isShared: Boolean(listRow.is_shared),
            createdBy: listRow.created_by,
            createdAt: listRow.created_at,
            updatedAt: listRow.updated_at,
            contacts
          }
        });
      });
    });
    
  } catch (error) {
    console.error('Get list details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add contacts to list
router.post('/:id/contacts', authenticateToken, [
  body('contactIds').isArray().isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const listId = req.params.id;
    const { contactIds } = req.body;
    
    const db = getDatabase();
    
    // Verify list belongs to user
    db.get('SELECT id FROM prospect_lists WHERE id = ? AND created_by = ?', 
      [listId, req.user.userId], (err, listRow) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!listRow) {
        db.close();
        return res.status(404).json({ message: 'List not found' });
      }
      
      // Add contacts (verify they belong to user)
      const promises = contactIds.map(contactId => 
        new Promise((resolve, reject) => {
          db.get('SELECT id FROM contacts WHERE id = ? AND created_by = ?', 
            [contactId, req.user.userId], (err, contactRow) => {
            if (err) return reject(err);
            if (!contactRow) return resolve({ skipped: true }); // Skip invalid contacts
            
            db.run(
              'INSERT OR IGNORE INTO list_contacts (list_id, contact_id) VALUES (?, ?)',
              [listId, contactId],
              function(err) {
                if (err) return reject(err);
                resolve({ added: this.changes > 0 });
              }
            );
          });
        })
      );
      
      Promise.all(promises)
        .then(results => {
          const added = results.filter(r => r.added).length;
          const skipped = results.filter(r => r.skipped).length;
          
          // Update list timestamp
          db.run('UPDATE prospect_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [listId], () => {
            db.close();
            res.json({ 
              message: `Added ${added} contacts to list`,
              added,
              skipped
            });
          });
        })
        .catch(err => {
          console.error('Add contacts error:', err);
          db.close();
          res.status(500).json({ message: 'Failed to add contacts' });
        });
    });
    
  } catch (error) {
    console.error('Add contacts to list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove contact from list
router.delete('/:id/contacts/:contactId', authenticateToken, async (req, res) => {
  try {
    const { id: listId, contactId } = req.params;
    const db = getDatabase();
    
    // Verify list belongs to user
    db.get('SELECT id FROM prospect_lists WHERE id = ? AND created_by = ?', 
      [listId, req.user.userId], (err, listRow) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!listRow) {
        db.close();
        return res.status(404).json({ message: 'List not found' });
      }
      
      db.run('DELETE FROM list_contacts WHERE list_id = ? AND contact_id = ?', 
        [listId, contactId], function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (this.changes === 0) {
          db.close();
          return res.status(404).json({ message: 'Contact not found in list' });
        }
        
        // Update list timestamp
        db.run('UPDATE prospect_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
          [listId], () => {
          db.close();
          res.json({ message: 'Contact removed from list' });
        });
      });
    });
    
  } catch (error) {
    console.error('Remove contact from list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete list
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const listId = req.params.id;
    const db = getDatabase();
    
    db.run('DELETE FROM prospect_lists WHERE id = ? AND created_by = ?', 
      [listId, req.user.userId], function(err) {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'List not found' });
      }
      
      res.json({ message: 'List deleted successfully' });
    });
    
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;