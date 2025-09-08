const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search contacts (temporarily removing auth for demo)
router.post('/', [
  body('query').optional().trim(),
  body('industries').optional().isArray(),
  body('positions').optional().isArray(),
  body('companySizes').optional().isArray(),
  body('locations').optional().isArray(),
  body('page').optional().isInt({ min: 1 }),
  body('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      query = '',
      industries = [],
      positions = [],
      companySizes = [],
      locations = [],
      page = 1,
      limit = 20
    } = req.body;

    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    // Build WHERE clause
    let whereConditions = [];
    let params = [];
    
    if (query) {
      whereConditions.push(`(
        c.first_name LIKE ? OR 
        c.last_name LIKE ? OR 
        c.company LIKE ? OR 
        c.position LIKE ? OR 
        c.email LIKE ?
      )`);
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (industries.length > 0) {
      const placeholders = industries.map(() => '?').join(',');
      whereConditions.push(`c.industry IN (${placeholders})`);
      params.push(...industries);
    }
    
    if (positions.length > 0) {
      const positionConditions = positions.map(() => 'c.position LIKE ?').join(' OR ');
      whereConditions.push(`(${positionConditions})`);
      positions.forEach(pos => params.push(`%${pos}%`));
    }
    
    if (companySizes.length > 0) {
      const placeholders = companySizes.map(() => '?').join(',');
      whereConditions.push(`c.company_size IN (${placeholders})`);
      params.push(...companySizes);
    }
    
    if (locations.length > 0) {
      const locationConditions = locations.map(() => 'c.location LIKE ?').join(' OR ');
      whereConditions.push(`(${locationConditions})`);
      locations.forEach(loc => params.push(`%${loc}%`));
    }
    
    const whereClause = whereConditions.length > 0 ? 
      `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM contacts c
      ${whereClause}
    `;
    
    db.get(countQuery, params, (err, countResult) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      const total = countResult.total;
      
      // Get paginated results
      const searchQuery = `
        SELECT 
          c.*,
          GROUP_CONCAT(ct.tag) as tags
        FROM contacts c
        LEFT JOIN contact_tags ct ON c.id = ct.contact_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.score DESC, c.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(searchQuery, [...params, limit, offset], (err, rows) => {
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
          createdAt: row.created_at
        }));
        
        // Save search history (skip for demo)
        // const historyDb = getDatabase();
        // historyDb.run(
        //   `INSERT INTO search_history (user_id, query, filters, results_count) 
        //    VALUES (?, ?, ?, ?)`,
        //   [
        //     'demo-user-id',
        //     query,
        //     JSON.stringify({ industries, positions, companySizes, locations }),
        //     total
        //   ],
        //   () => historyDb.close()
        // );
        
        res.json({
          contacts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + contacts.length < total
          }
        });
      });
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get search suggestions (temporarily removing auth for demo)
router.get('/suggestions', async (req, res) => {
  try {
    const { type, query = '' } = req.query;
    
    const db = getDatabase();
    
    let sqlQuery = '';
    let params = [];
    
    switch (type) {
      case 'companies':
        sqlQuery = `
          SELECT DISTINCT company as value, COUNT(*) as count
          FROM contacts 
          WHERE company LIKE ?
          GROUP BY company
          ORDER BY count DESC, company ASC
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;
        
      case 'industries':
        sqlQuery = `
          SELECT DISTINCT industry as value, COUNT(*) as count
          FROM contacts 
          WHERE industry LIKE ?
          GROUP BY industry
          ORDER BY count DESC, industry ASC
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;
        
      case 'positions':
        sqlQuery = `
          SELECT DISTINCT position as value, COUNT(*) as count
          FROM contacts 
          WHERE position LIKE ?
          GROUP BY position
          ORDER BY count DESC, position ASC
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;
        
      case 'locations':
        sqlQuery = `
          SELECT DISTINCT location as value, COUNT(*) as count
          FROM contacts 
          WHERE location LIKE ?
          GROUP BY location
          ORDER BY count DESC, location ASC
          LIMIT 10
        `;
        params = [`%${query}%`];
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid suggestion type' });
    }
    
    db.all(sqlQuery, params, (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({
        suggestions: rows.map(row => ({
          value: row.value,
          count: row.count
        }))
      });
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get search history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    db.all(
      `SELECT * FROM search_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.user.userId],
      (err, rows) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        const history = rows.map(row => ({
          id: row.id,
          query: row.query,
          filters: JSON.parse(row.filters || '{}'),
          resultsCount: row.results_count,
          createdAt: row.created_at
        }));
        
        res.json({ history });
      }
    );
    
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;