const express = require('express');
const router = express.Router();

// Debug endpoint to check environment variables
router.get('/env-check', (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const keyLength = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0;
  const keyStart = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set';
  
  console.log('🔍 Environment Debug:');
  console.log('- OpenAI Key Present:', hasOpenAIKey);
  console.log('- Key Length:', keyLength);
  console.log('- Key Start:', keyStart);
  console.log('- Node ENV:', process.env.NODE_ENV);
  
  res.json({
    openaiKeyPresent: hasOpenAIKey,
    keyLength: keyLength,
    keyStart: keyStart,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI connection
router.post('/test-openai', async (req, res) => {
  try {
    const OpenAI = require('openai');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found in environment');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('🤖 Testing OpenAI connection...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      max_tokens: 50
    });

    console.log('✅ OpenAI test successful');
    
    res.json({
      success: true,
      message: 'OpenAI connection successful',
      response: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ OpenAI test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;