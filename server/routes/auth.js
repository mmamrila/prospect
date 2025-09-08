const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); const uuidv4 = () => crypto.randomUUID();
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('company').optional().trim(),
  body('role').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, company, role } = req.body;
    
    const db = getDatabase();
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (row) {
        db.close();
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create user
      const userId = uuidv4();
      
      db.run(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, company, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, passwordHash, firstName, lastName, company, role],
        function(err) {
          db.close();
          
          if (err) {
            return res.status(500).json({ message: 'Failed to create user' });
          }
          
          // Create JWT token
          const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
          );
          
          res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
              id: userId,
              email,
              firstName,
              lastName,
              company,
              role
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    const db = getDatabase();
    
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (!user) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Create JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            company: user.company,
            role: user.role,
            avatar: user.avatar
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    db.get(
      'SELECT id, email, first_name, last_name, company, role, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId],
      (err, user) => {
        db.close();
        
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          company: user.company,
          role: user.role,
          avatar: user.avatar,
          createdAt: user.created_at
        });
      }
    );
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;