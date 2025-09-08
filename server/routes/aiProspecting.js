const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const AIProspectingService = require('../services/aiProspecting');

const router = express.Router();
const aiService = new AIProspectingService();

// AI-powered prospect discovery
router.post('/discover', [
  body('industries').optional().isArray(),
  body('positions').optional().isArray(),
  body('location').optional().trim(),
  body('companySize').optional().trim(),
  body('keywords').optional().trim(),
  body('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      industries = [],
      positions = [],
      location = '',
      companySize = '',
      keywords = '',
      limit = 20
    } = req.body;

    console.log('🔍 AI Prospect Discovery Request:', {
      industries, positions, location, companySize, keywords, limit
    });

    // Use AI service to find prospects
    const prospects = await aiService.findProspects({
      industries,
      positions,
      location,
      companySize,
      keywords,
      limit
    });

    // Store discovered prospects in database for future reference
    const db = getDatabase();
    const savedProspects = [];

    for (const prospect of prospects) {
      try {
        // Check if prospect already exists
        const existing = await new Promise((resolve) => {
          db.get(
            'SELECT id FROM contacts WHERE email = ? OR (first_name = ? AND last_name = ? AND company = ?)',
            [prospect.email, prospect.firstName, prospect.lastName, prospect.company],
            (err, row) => resolve(row)
          );
        });

        if (!existing) {
          // Insert new prospect
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO contacts (
                id, first_name, last_name, email, phone, company, position,
                industry, location, linkedin_url, company_size, revenue,
                score, notes, created_by, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              prospect.id,
              prospect.firstName,
              prospect.lastName,
              prospect.email,
              prospect.phone,
              prospect.company,
              prospect.position,
              prospect.industry,
              prospect.location,
              prospect.linkedinUrl,
              prospect.companySize,
              prospect.revenue,
              prospect.score,
              `AI Generated: ${prospect.summary || 'Discovered via AI prospecting'}`,
              'ai-system',
              new Date().toISOString()
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          // Add AI-specific tags
          if (prospect.tags && prospect.tags.length > 0) {
            for (const tag of prospect.tags) {
              await new Promise((resolve, reject) => {
                db.run(
                  'INSERT OR IGNORE INTO contact_tags (contact_id, tag) VALUES (?, ?)',
                  [prospect.id, tag],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            }
          }

          savedProspects.push(prospect);
        } else {
          // Return existing prospect with AI enrichment
          const enrichedExisting = { ...existing, ...prospect, id: existing.id };
          savedProspects.push(enrichedExisting);
        }
      } catch (dbError) {
        console.error('Database error for prospect:', dbError);
        // Still return the prospect even if save failed
        savedProspects.push(prospect);
      }
    }

    db.close();

    res.json({
      prospects: savedProspects,
      metadata: {
        total: savedProspects.length,
        newProspects: savedProspects.filter(p => p.source === 'AI Discovery').length,
        searchQuery: keywords,
        aiGenerated: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Prospecting error:', error);
    res.status(500).json({ 
      message: 'AI prospecting failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get AI insights for a specific prospect
router.post('/enrich/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // Get prospect from database
    const db = getDatabase();
    const prospect = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    if (!prospect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    // Convert database format to service format
    const prospectData = {
      id: prospect.id,
      firstName: prospect.first_name,
      lastName: prospect.last_name,
      email: prospect.email,
      company: prospect.company,
      position: prospect.position,
      industry: prospect.industry,
      location: prospect.location
    };

    // Generate AI insights
    const insights = await aiService.generateProspectInsights(prospectData);

    res.json({
      prospect: prospectData,
      insights
    });

  } catch (error) {
    console.error('AI Enrichment error:', error);
    res.status(500).json({ 
      message: 'AI enrichment failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Generate AI-powered outreach messages
router.post('/outreach/:contactId', [
  body('messageType').isIn(['email', 'linkedin', 'phone']),
  body('tone').optional().isIn(['professional', 'casual', 'direct']),
  body('objective').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contactId } = req.params;
    const { messageType, tone = 'professional', objective = 'introductory meeting' } = req.body;

    // Get prospect from database
    const db = getDatabase();
    const prospect = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    if (!prospect) {
      return res.status(404).json({ message: 'Prospect not found' });
    }

    // Generate AI-powered outreach message
    const prompt = `
Create a personalized ${messageType} outreach message for:

Name: ${prospect.first_name} ${prospect.last_name}
Company: ${prospect.company}
Position: ${prospect.position}
Industry: ${prospect.industry}

Message requirements:
- Type: ${messageType}
- Tone: ${tone}
- Objective: ${objective}
- Length: ${messageType === 'email' ? '150-200 words' : messageType === 'linkedin' ? '100-150 words' : '30-60 seconds'}

Make it highly personalized, relevant, and compelling. Include a clear call-to-action.
${messageType === 'email' ? 'Include subject line.' : ''}
    `;

    try {
      const response = await aiService.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 400
      });

      const message = response.choices[0].message.content.trim();
      
      res.json({
        prospect: {
          name: `${prospect.first_name} ${prospect.last_name}`,
          company: prospect.company,
          position: prospect.position
        },
        message: {
          type: messageType,
          tone,
          objective,
          content: message,
          generated: true,
          timestamp: new Date().toISOString()
        }
      });

    } catch (aiError) {
      console.error('AI message generation error:', aiError);
      res.status(500).json({ message: 'Failed to generate AI message' });
    }

  } catch (error) {
    console.error('Outreach generation error:', error);
    res.status(500).json({ 
      message: 'Outreach generation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Batch AI scoring for prospects
router.post('/score', [
  body('contactIds').isArray().withMessage('Contact IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contactIds } = req.body;

    if (contactIds.length === 0) {
      return res.status(400).json({ message: 'No contact IDs provided' });
    }

    // Get prospects from database
    const db = getDatabase();
    const prospects = await new Promise((resolve, reject) => {
      const placeholders = contactIds.map(() => '?').join(',');
      db.all(
        `SELECT * FROM contacts WHERE id IN (${placeholders})`,
        contactIds,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    db.close();

    if (prospects.length === 0) {
      return res.status(404).json({ message: 'No prospects found' });
    }

    // Convert to service format
    const prospectData = prospects.map(p => ({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      company: p.company,
      position: p.position,
      industry: p.industry
    }));

    // Score prospects using AI
    const scoredProspects = await aiService.scoreProspects(prospectData);

    res.json({
      scoredProspects,
      metadata: {
        total: scoredProspects.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Scoring error:', error);
    res.status(500).json({ 
      message: 'AI scoring failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;