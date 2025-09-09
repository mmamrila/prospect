const express = require('express');
const RealProspectingService = require('../services/realProspecting');
const EmailValidator = require('../services/emailValidator');

const router = express.Router();

// Demo real prospecting without OpenAI
router.post('/discover-no-ai', async (req, res) => {
  try {
    console.log('🌐 Demo: Real prospecting WITHOUT OpenAI...');
    
    const {
      industries = ['Technology'],
      positions = ['CEO', 'CTO'],
      location = 'San Francisco',
      companySize = '',
      keywords = 'startup',
      limit = 10
    } = req.body;

    const searchParams = {
      industries,
      positions,
      location,
      companySize,
      keywords,
      limit
    };

    // Use real prospecting service directly
    const realProspectingService = new RealProspectingService();
    const emailValidator = new EmailValidator();

    console.log('🔍 Starting web scraping for real contacts...');
    
    // Get real prospects from web scraping
    const realProspects = await realProspectingService.findRealProspects(searchParams);
    
    console.log(`📧 Found ${realProspects.length} prospects, validating emails...`);
    
    // Validate emails
    const validatedProspects = [];
    for (const prospect of realProspects) {
      try {
        const emailValidation = await emailValidator.validateEmail(prospect.email);
        
        validatedProspects.push({
          ...prospect,
          emailValidation,
          validated: true,
          source: prospect.source || 'Web Scraping'
        });
      } catch (error) {
        console.error('Email validation error:', error);
        validatedProspects.push({
          ...prospect,
          validated: false,
          source: prospect.source || 'Web Scraping'
        });
      }
    }

    await realProspectingService.closeBrowser();

    // Sort by score
    validatedProspects.sort((a, b) => (b.score || 50) - (a.score || 50));

    res.json({
      prospects: validatedProspects.slice(0, limit),
      metadata: {
        total: validatedProspects.length,
        newProspects: validatedProspects.length,
        searchQuery: keywords,
        aiGenerated: false,
        realDataOnly: true,
        webScrapingOnly: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Demo prospecting failed:', error);
    
    // Generate some demo prospects to show the interface
    const demoProspects = generateDemoProspects(req.body);
    
    res.json({
      prospects: demoProspects,
      metadata: {
        total: demoProspects.length,
        newProspects: demoProspects.length,
        searchQuery: req.body.keywords || 'demo',
        aiGenerated: false,
        realDataOnly: false,
        demoMode: true,
        error: 'Web scraping failed, showing demo data',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Generate demo prospects when scraping fails
function generateDemoProspects(searchParams) {
  const { industries = ['Technology'], positions = ['CEO'], location = 'San Francisco', limit = 5 } = searchParams;
  
  const demoData = [
    {
      id: 'demo-1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techstartup.com',
      company: 'TechStartup Inc',
      position: 'CEO',
      industry: industries[0],
      location: location,
      score: 92,
      source: 'Demo Data',
      validated: true,
      linkedinUrl: 'https://linkedin.com/in/sarah-johnson',
      website: 'https://techstartup.com'
    },
    {
      id: 'demo-2',
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@innovativesolutions.com',
      company: 'Innovative Solutions',
      position: positions[0],
      industry: industries[0],
      location: location,
      score: 88,
      source: 'Demo Data',
      validated: true,
      linkedinUrl: 'https://linkedin.com/in/michael-chen',
      website: 'https://innovativesolutions.com'
    },
    {
      id: 'demo-3',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@futuretech.io',
      company: 'FutureTech',
      position: 'CTO',
      industry: industries[0],
      location: location,
      score: 85,
      source: 'Demo Data',
      validated: true,
      linkedinUrl: 'https://linkedin.com/in/emily-rodriguez',
      website: 'https://futuretech.io'
    }
  ];

  return demoData.slice(0, limit);
}

module.exports = router;