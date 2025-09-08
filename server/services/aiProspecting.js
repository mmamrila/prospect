const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const { parse } = require('node-html-parser');
const crypto = require('crypto');

class AIProspectingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Main AI prospecting function
  async findProspects(searchParams) {
    const { 
      industries = [], 
      positions = [], 
      location = '', 
      companySize = '', 
      keywords = '',
      limit = 20 
    } = searchParams;

    try {
      console.log('🤖 Starting AI prospect discovery...');
      
      // Use AI to generate targeted search queries
      const searchQueries = await this.generateSearchQueries({
        industries, positions, location, keywords
      });

      const allProspects = [];
      
      // Search using multiple strategies
      for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries for demo
        const prospects = await this.searchProspectsWithAI(query, {
          industries, positions, location, companySize, limit: Math.ceil(limit / 3)
        });
        allProspects.push(...prospects);
      }

      // Remove duplicates and enrich data
      const uniqueProspects = this.removeDuplicates(allProspects);
      const enrichedProspects = await this.enrichProspectData(uniqueProspects.slice(0, limit));

      console.log(`✅ Found ${enrichedProspects.length} AI-generated prospects`);
      return enrichedProspects;

    } catch (error) {
      console.error('❌ AI prospecting error:', error);
      return [];
    }
  }

  // Generate smart search queries using AI
  async generateSearchQueries(params) {
    const prompt = `
You are an expert B2B sales prospecting AI. Generate 5 highly targeted search queries to find potential prospects based on these parameters:

Industries: ${params.industries.join(', ')}
Positions: ${params.positions.join(', ')}
Location: ${params.location}
Keywords: ${params.keywords}

Generate search queries that would find decision-makers and influencers in these industries. Each query should be different and target a specific angle:
1. Direct role + industry search
2. Company + location search
3. Technology/keyword-based search
4. Network/community-based search
5. News/announcement-based search

Return as JSON array of search query strings.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content.trim();
      const queries = JSON.parse(content);
      return Array.isArray(queries) ? queries : [params.keywords || 'sales prospects'];
    } catch (error) {
      console.error('Error generating search queries:', error);
      return ['sales prospects', 'business development', 'decision makers'];
    }
  }

  // Search for prospects using AI-enhanced web scraping
  async searchProspectsWithAI(query, filters) {
    const prospects = [];
    
    try {
      // Simulate AI-powered prospect generation based on real patterns
      const aiGeneratedProspects = await this.generateRealisticProspects(query, filters);
      prospects.push(...aiGeneratedProspects);

      // In a real implementation, you would:
      // 1. Use LinkedIn Sales Navigator API (requires license)
      // 2. Integrate with ZoomInfo, Apollo.io, or similar APIs
      // 3. Use Google Search API for company research
      // 4. Scrape public business directories (legally)
      
    } catch (error) {
      console.error('Error searching prospects:', error);
    }

    return prospects;
  }

  // Generate realistic prospects using AI patterns
  async generateRealisticProspects(query, filters) {
    const { industries, positions, location, companySize } = filters;
    
    const prompt = `
Generate realistic B2B prospect data based on this search: "${query}"

Filters:
- Industries: ${industries.join(', ')}
- Positions: ${positions.join(', ')}
- Location: ${location}
- Company Size: ${companySize}

Create 5-7 realistic prospects with:
- First and last name (realistic for the region)
- Professional email (format: first.last@company.com)
- Company name (real or realistic for the industry)
- Job title (matching the position filters)
- Industry (from the specified industries)
- Location (near the specified location)
- LinkedIn-style summary (2-3 sentences)
- Phone number (realistic format)
- Company size category
- Estimated revenue range

Make the data feel authentic and diverse. Return as JSON array.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content.trim();
      let prospects = JSON.parse(content);
      
      // Ensure prospects have required fields and add IDs
      prospects = prospects.map(prospect => ({
        id: crypto.randomUUID(),
        firstName: prospect.firstName || prospect.first_name || 'John',
        lastName: prospect.lastName || prospect.last_name || 'Doe',
        email: prospect.email || `${prospect.firstName?.toLowerCase() || 'john'}.${prospect.lastName?.toLowerCase() || 'doe'}@example.com`,
        phone: prospect.phone || '+1 (555) 123-4567',
        company: prospect.company || 'Tech Corp',
        position: prospect.position || prospect.title || 'Manager',
        industry: prospect.industry || industries[0] || 'Technology',
        location: prospect.location || location || 'San Francisco, CA',
        linkedinUrl: `https://linkedin.com/in/${prospect.firstName?.toLowerCase() || 'john'}-${prospect.lastName?.toLowerCase() || 'doe'}`,
        companySize: prospect.companySize || companySize || '51-200 employees',
        revenue: prospect.revenue || '$10M - $50M',
        score: Math.floor(Math.random() * 30) + 70, // Random score 70-99
        summary: prospect.summary || 'Experienced professional in the industry.',
        tags: ['AI Generated', 'New Prospect'],
        source: 'AI Discovery',
        confidence: Math.floor(Math.random() * 20) + 80, // 80-99% confidence
        lastUpdated: new Date().toISOString(),
        createdAt: new Date()
      }));

      return prospects;

    } catch (error) {
      console.error('Error generating AI prospects:', error);
      return [];
    }
  }

  // Enrich prospect data with AI insights
  async enrichProspectData(prospects) {
    const enrichedProspects = [];

    for (const prospect of prospects) {
      try {
        // Generate AI insights about the prospect
        const insights = await this.generateProspectInsights(prospect);
        
        const enrichedProspect = {
          ...prospect,
          insights,
          talkingPoints: insights.talkingPoints,
          outreachStrategy: insights.outreachStrategy,
          personalizationData: insights.personalizationData
        };

        enrichedProspects.push(enrichedProspect);
        
        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error enriching prospect ${prospect.id}:`, error);
        enrichedProspects.push(prospect);
      }
    }

    return enrichedProspects;
  }

  // Generate AI insights for a prospect
  async generateProspectInsights(prospect) {
    const prompt = `
Analyze this B2B prospect and provide sales intelligence:

Name: ${prospect.firstName} ${prospect.lastName}
Company: ${prospect.company}
Position: ${prospect.position}
Industry: ${prospect.industry}
Location: ${prospect.location}

Generate:
1. 3 personalized talking points for outreach
2. Best outreach strategy (email, LinkedIn, phone)
3. Potential pain points they might have
4. Company insights and news opportunities
5. Personalization data for messaging

Return as JSON with: talkingPoints[], outreachStrategy, painPoints[], companyInsights, personalizationData
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 800
      });

      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
      
    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        talkingPoints: ['Industry expertise', 'Company growth', 'Market trends'],
        outreachStrategy: 'LinkedIn connection followed by email',
        painPoints: ['Scaling challenges', 'Efficiency improvements'],
        companyInsights: 'Growing company in competitive market',
        personalizationData: 'Recent company developments'
      };
    }
  }

  // Remove duplicate prospects
  removeDuplicates(prospects) {
    const seen = new Set();
    return prospects.filter(prospect => {
      const key = `${prospect.email.toLowerCase()}_${prospect.company.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Search for company information
  async searchCompanyInfo(companyName) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Search for company on Google (basic implementation)
      await page.goto(`https://www.google.com/search?q="${companyName}" company info`);
      await page.waitForTimeout(2000);
      
      // Extract basic company information
      const companyInfo = await page.evaluate(() => {
        const results = document.querySelectorAll('.g');
        const info = {
          description: '',
          website: '',
          industry: '',
          size: ''
        };
        
        // Extract information from search results
        if (results.length > 0) {
          const firstResult = results[0];
          info.description = firstResult.querySelector('.VwiC3b')?.textContent || '';
          info.website = firstResult.querySelector('a')?.href || '';
        }
        
        return info;
      });
      
      await page.close();
      return companyInfo;
      
    } catch (error) {
      console.error('Error searching company info:', error);
      return null;
    }
  }

  // Score prospects using AI
  async scoreProspects(prospects) {
    const scoringPrompt = `
Score these B2B prospects from 1-100 based on:
- Position seniority and decision-making power
- Company size and revenue potential
- Industry attractiveness
- Contact data quality

Prospects: ${JSON.stringify(prospects.map(p => ({
  name: `${p.firstName} ${p.lastName}`,
  position: p.position,
  company: p.company,
  industry: p.industry
})))}

Return array of scores (numbers only) in same order.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: scoringPrompt }],
        temperature: 0.3,
        max_tokens: 200
      });

      const scores = response.choices[0].message.content.trim()
        .split(/\s+/)
        .map(s => parseInt(s))
        .filter(s => !isNaN(s));

      // Apply scores to prospects
      prospects.forEach((prospect, index) => {
        if (scores[index]) {
          prospect.score = scores[index];
        }
      });

    } catch (error) {
      console.error('Error scoring prospects:', error);
    }

    return prospects;
  }
}

module.exports = AIProspectingService;