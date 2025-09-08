const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.userId;
    
    // Get multiple statistics in parallel
    const queries = [
      // Total contacts
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM contacts WHERE created_by = ?', 
          [userId], (err, row) => {
          if (err) reject(err);
          else resolve({ totalContacts: row.count });
        });
      }),
      
      // Total lists
      new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM prospect_lists WHERE created_by = ?', 
          [userId], (err, row) => {
          if (err) reject(err);
          else resolve({ totalLists: row.count });
        });
      }),
      
      // Recent activity (contacts added in last 7 days)
      new Promise((resolve, reject) => {
        db.get(`
          SELECT COUNT(*) as count FROM contacts 
          WHERE created_by = ? AND created_at >= date('now', '-7 days')
        `, [userId], (err, row) => {
          if (err) reject(err);
          else resolve({ recentActivity: row.count });
        });
      }),
      
      // Top industries
      new Promise((resolve, reject) => {
        db.all(`
          SELECT industry, COUNT(*) as count 
          FROM contacts 
          WHERE created_by = ? 
          GROUP BY industry 
          ORDER BY count DESC 
          LIMIT 5
        `, [userId], (err, rows) => {
          if (err) reject(err);
          else resolve({ topIndustries: rows.map(row => ({ industry: row.industry, count: row.count })) });
        });
      }),
      
      // Monthly growth (contacts added this month vs last month)
      new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            SUM(CASE WHEN created_at >= date('now', 'start of month') THEN 1 ELSE 0 END) as thisMonth,
            SUM(CASE WHEN created_at >= date('now', 'start of month', '-1 month') 
                     AND created_at < date('now', 'start of month') THEN 1 ELSE 0 END) as lastMonth
          FROM contacts 
          WHERE created_by = ?
        `, [userId], (err, rows) => {
          if (err) reject(err);
          else {
            const thisMonth = rows[0].thisMonth || 0;
            const lastMonth = rows[0].lastMonth || 0;
            const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
            resolve({ monthlyGrowth: Math.round(growth * 10) / 10 });
          }
        });
      }),
      
      // Average contact score
      new Promise((resolve, reject) => {
        db.get('SELECT AVG(score) as avgScore FROM contacts WHERE created_by = ?', 
          [userId], (err, row) => {
          if (err) reject(err);
          else resolve({ averageScore: Math.round((row.avgScore || 0) * 10) / 10 });
        });
      })
    ];
    
    Promise.all(queries)
      .then(results => {
        db.close();
        
        // Merge all results
        const stats = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        
        res.json({ stats });
      })
      .catch(err => {
        db.close();
        console.error('Dashboard stats error:', err);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
      });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity feed
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = getDatabase();
    const userId = req.user.userId;
    
    // Get recent contacts added
    db.all(`
      SELECT 
        'contact_added' as action,
        c.first_name || ' ' || c.last_name || ' (' || c.company || ')' as description,
        c.created_at as timestamp
      FROM contacts c
      WHERE c.created_by = ?
      
      UNION ALL
      
      SELECT 
        'list_created' as action,
        pl.name as description,
        pl.created_at as timestamp
      FROM prospect_lists pl
      WHERE pl.created_by = ?
      
      UNION ALL
      
      SELECT 
        'list_updated' as action,
        pl.name as description,
        pl.updated_at as timestamp
      FROM prospect_lists pl
      WHERE pl.created_by = ? AND pl.updated_at != pl.created_at
      
      ORDER BY timestamp DESC
      LIMIT ?
    `, [userId, userId, userId, parseInt(limit)], (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const activities = rows.map(row => ({
        action: row.action,
        description: row.description,
        timestamp: row.timestamp
      }));
      
      res.json({ activities });
    });
    
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get contact distribution by industry
router.get('/industry-distribution', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const userId = req.user.userId;
    
    db.all(`
      SELECT 
        industry,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM contacts WHERE created_by = ?), 1) as percentage
      FROM contacts 
      WHERE created_by = ? 
      GROUP BY industry 
      ORDER BY count DESC
      LIMIT 10
    `, [userId, userId], (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      res.json({ 
        distribution: rows.map(row => ({
          industry: row.industry,
          count: row.count,
          percentage: row.percentage
        }))
      });
    });
    
  } catch (error) {
    console.error('Industry distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly contact growth chart data
router.get('/growth-chart', authenticateToken, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const db = getDatabase();
    const userId = req.user.userId;
    
    db.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM contacts 
      WHERE created_by = ? 
        AND created_at >= date('now', '-${parseInt(months)} months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `, [userId], (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      // Fill in missing months with 0
      const monthsData = [];
      const now = new Date();
      
      for (let i = parseInt(months) - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthData = rows.find(r => r.month === monthKey);
        
        monthsData.push({
          month: monthKey,
          count: monthData ? monthData.count : 0
        });
      }
      
      res.json({ growthData: monthsData });
    });
    
  } catch (error) {
    console.error('Growth chart error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get top performing contacts by score
router.get('/top-contacts', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const db = getDatabase();
    const userId = req.user.userId;
    
    db.all(`
      SELECT 
        first_name,
        last_name,
        company,
        position,
        industry,
        score
      FROM contacts 
      WHERE created_by = ? 
      ORDER BY score DESC, created_at DESC
      LIMIT ?
    `, [userId, parseInt(limit)], (err, rows) => {
      db.close();
      
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      const topContacts = rows.map(row => ({
        firstName: row.first_name,
        lastName: row.last_name,
        company: row.company,
        position: row.position,
        industry: row.industry,
        score: row.score
      }));
      
      res.json({ topContacts });
    });
    
  } catch (error) {
    console.error('Top contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;