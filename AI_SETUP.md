# AI-Powered Prospecting Setup Guide

This guide will help you set up the AI features for real-life prospecting using OpenAI and other services.

## 🚀 Quick Start

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment Variables

Create a `.env` file in the `/server` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file and add your API key:

```env
# Required for AI features
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Database
DB_PATH=./database.sqlite

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Settings
CORS_ORIGIN=http://localhost:3000

# Development
NODE_ENV=development
PORT=5000
```

### 3. Install and Run

```bash
# From the root directory
npm install
npm run dev
```

## 🤖 AI Features Overview

### Current AI Capabilities

✅ **AI Prospect Discovery**
- Generate realistic prospects based on search criteria
- Smart search query generation using AI
- Automatic prospect scoring and ranking

✅ **AI-Powered Insights**
- Personalized talking points for each prospect
- Pain point analysis
- Outreach strategy recommendations

✅ **AI Message Generation**
- Email templates
- LinkedIn connection requests
- Phone call scripts
- Customizable tone and objectives

✅ **Intelligent Scoring**
- AI-based prospect quality scoring
- Decision-maker identification
- Lead prioritization

### How to Use AI Features

1. **Navigate to Search Page**: Click on the "🤖 AI Discovery" tab
2. **Set Your Criteria**: Select industries, positions, location, etc.
3. **Click "Discover Prospects with AI"**: Let AI find realistic prospects
4. **Get AI Insights**: Click "AI Insights" on any prospect for personalized intelligence
5. **Generate Messages**: Use the AI message generator for outreach

## 🔧 Advanced Configuration

### For Real-Life Prospecting (Optional)

To connect to real data sources, you can integrate with:

#### Professional Data APIs
```env
# Add to your .env file
ZOOMINFO_API_KEY=your-zoominfo-key
APOLLO_API_KEY=your-apollo-key
LINKEDIN_API_KEY=your-linkedin-key
```

#### Web Scraping Settings
```env
SCRAPING_DELAY=1000
MAX_CONCURRENT_REQUESTS=3
```

### API Endpoints

The AI service provides these endpoints:

- `POST /api/ai/discover` - AI prospect discovery
- `POST /api/ai/enrich/:contactId` - Get AI insights
- `POST /api/ai/outreach/:contactId` - Generate outreach messages  
- `POST /api/ai/score` - Batch prospect scoring

## 💰 Cost Considerations

### OpenAI API Pricing (as of 2024)
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- Average prospect discovery: ~500 tokens
- Cost per AI search: ~$0.001
- Monthly usage for 1000 searches: ~$1

### Recommendations
- Start with GPT-3.5-turbo (cheaper and faster)
- Set usage limits in OpenAI dashboard
- Monitor API usage in OpenAI console

## 🛡️ Security & Privacy

### Best Practices
- Never commit API keys to version control
- Use environment variables for all secrets
- Implement rate limiting for production
- Consider data retention policies
- Follow GDPR/privacy regulations

### Environment Security
```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore
```

## 🔍 Troubleshooting

### Common Issues

**"AI prospecting failed" Error**
- Check if OPENAI_API_KEY is set correctly
- Verify API key is valid and has credits
- Check network connectivity

**No prospects found**
- Try broader search criteria
- Check server logs for errors
- Verify database connectivity

**Slow AI responses**
- OpenAI API can be slow during peak hours
- Consider implementing caching
- Use GPT-3.5-turbo instead of GPT-4

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm run dev
```

## 📈 Production Deployment

### Environment Setup
```env
NODE_ENV=production
OPENAI_API_KEY=your-production-key
JWT_SECRET=super-secure-production-secret
DB_PATH=/data/database.sqlite
```

### Scaling Considerations
- Implement Redis for session storage
- Add database connection pooling
- Set up API rate limiting
- Monitor OpenAI usage costs
- Implement error tracking (Sentry)

## 🚀 Next Steps

### Potential Enhancements

1. **Real Data Integration**
   - Connect to LinkedIn Sales Navigator
   - Integrate with ZoomInfo/Apollo APIs
   - Add company news/events data

2. **Advanced AI Features**
   - Sentiment analysis of prospects
   - Competitive intelligence
   - Market trend analysis
   - Automated follow-up sequences

3. **Analytics & Tracking**
   - Conversion rate tracking
   - A/B test AI messages
   - ROI analytics
   - User behavior insights

### Contributing

Want to enhance the AI features? Check out:
- `/server/services/aiProspecting.js` - Core AI logic
- `/server/routes/aiProspecting.js` - API endpoints  
- `/client/src/components/AIProspecting.tsx` - Frontend UI
- `/client/src/services/aiService.ts` - Frontend API client

## 📞 Support

Having issues? Check:
1. This README file
2. OpenAI API documentation
3. Server logs for errors
4. GitHub issues for common problems

---

🎉 **You're now ready to use AI-powered prospecting!**

The system will generate realistic prospects based on your criteria and provide AI-driven insights for better outreach success.