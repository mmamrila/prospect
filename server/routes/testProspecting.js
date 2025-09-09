const express = require('express');
const RealProspectingService = require('../services/realProspecting');
const AIProspectingService = require('../services/aiProspecting');

const router = express.Router();

// Test real prospecting system
router.post('/test-real-prospecting', async (req, res) => {
  try {
    console.log('🧪 Testing real prospecting system...');
    
    const testParams = {
      industries: ['Technology', 'Software'],
      positions: ['CEO', 'CTO', 'Director'],
      location: 'San Francisco',
      keywords: 'startup tech',
      limit: 5
    };

    const realProspectingService = new RealProspectingService();
    const prospects = await realProspectingService.findRealProspects(testParams);
    
    await realProspectingService.closeBrowser();

    res.json({
      success: true,
      message: 'Real prospecting test completed',
      prospectsFound: prospects.length,
      prospects: prospects,
      testParams
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Test full AI + Real prospecting integration
router.post('/test-full-system', async (req, res) => {
  try {
    console.log('🧪 Testing full integrated prospecting system...');
    
    const testParams = req.body || {
      industries: ['Technology'],
      positions: ['CEO', 'Founder'],
      location: 'New York',
      keywords: 'AI software',
      limit: 3
    };

    const aiProspectingService = new AIProspectingService();
    const prospects = await aiProspectingService.findProspects(testParams);
    
    await aiProspectingService.closeBrowser();
    await aiProspectingService.realProspecting.closeBrowser();

    res.json({
      success: true,
      message: 'Full system test completed',
      prospectsFound: prospects.length,
      prospects: prospects,
      testParams
    });

  } catch (error) {
    console.error('❌ Full system test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Full system test failed',
      error: error.message
    });
  }
});

// Test email validation
router.post('/test-email-validation', async (req, res) => {
  try {
    console.log('🧪 Testing email validation system...');
    
    const EmailValidator = require('../services/emailValidator');
    const emailValidator = new EmailValidator();
    
    const testEmails = [
      'john.doe@google.com',
      'invalid-email@nonexistentdomain12345.com',
      'founder@openai.com',
      'ceo@microsoft.com'
    ];

    const results = await emailValidator.validateEmails(testEmails);

    res.json({
      success: true,
      message: 'Email validation test completed',
      results
    });

  } catch (error) {
    console.error('❌ Email validation test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email validation test failed',
      error: error.message
    });
  }
});

module.exports = router;