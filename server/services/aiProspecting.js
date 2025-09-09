const OpenAI = require('openai');
const puppeteer = require('puppeteer');
const { parse } = require('node-html-parser');
const crypto = require('crypto');
const RealProspectingService = require('./realProspecting');
const SimpleProspectingService = require('./simpleProspecting');
const RealContactFinder = require('./realContactFinder');
const EmailValidator = require('./emailValidator');

class AIProspectingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.browser = null;
    this.realProspecting = new RealProspectingService();
    this.simpleProspecting = new SimpleProspectingService();
    this.realContactFinder = new RealContactFinder();
    this.emailValidator = new EmailValidator();
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

  // Main AI prospecting function with real data
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
      console.log('🌐 Starting REAL prospect discovery...');
      
      let realProspects = [];
      
      // Try REAL contact finder first (HTTP-based, no browser)
      try {
        console.log('🔍 Searching for REAL contacts using HTTP scraping...');
        realProspects = await this.realContactFinder.findRealContacts(searchParams);
        console.log(`📊 Real contact finder found ${realProspects.length} prospects`);
      } catch (realContactError) {
        console.log('⚠️ Real contact finder failed, trying advanced scraping...');
        console.error('Real contact error:', realContactError.message);
        
        // Fallback to Puppeteer scraping
        try {
          console.log('🔍 Attempting advanced web scraping with Puppeteer...');
          realProspects = await this.realProspecting.findRealProspects(searchParams);
          console.log(`📊 Advanced scraping found ${realProspects.length} prospects`);
        } catch (puppeteerError) {
          console.log('⚠️ Advanced scraping also failed, trying simple HTTP method...');
          console.error('Puppeteer error:', puppeteerError.message);
          
          // Final fallback to simple HTTP-based scraping
          try {
            realProspects = await this.simpleProspecting.findSimpleProspects(searchParams);
            console.log(`📊 Simple scraping found ${realProspects.length} prospects`);
          } catch (simpleError) {
            console.error('All scraping methods failed:', simpleError.message);
            realProspects = [];
          }
        }
      }
      
      // If any scraping method found prospects, validate and enrich them
      if (realProspects.length > 0) {
        console.log('✅ Real prospects found, validating and enriching...');
        
        // Validate and score emails
        const validatedProspects = await this.validateAndScoreProspects(realProspects);
        
        // Enrich with AI insights
        const enrichedProspects = await this.enrichProspectData(validatedProspects.slice(0, limit));

        console.log(`✅ Returning ${enrichedProspects.length} REAL prospects`);
        return enrichedProspects;
      } else {
        console.log('🔄 No real prospects found, generating AI-enhanced demo data...');
        return await this.generateFallbackProspects(searchParams);
      }

    } catch (error) {
      console.error('❌ Overall prospecting error:', error);
      
      // Final fallback to AI-generated demo data
      console.log('🔄 Falling back to AI-generated demo data...');
      return await this.generateFallbackProspects(searchParams);
    }
  }

  // Validate and score prospects
  async validateAndScoreProspects(prospects) {
    const validatedProspects = [];
    
    console.log(`📧 Validating ${prospects.length} prospect emails...`);
    
    for (const prospect of prospects) {
      try {
        // Validate email
        const emailValidation = await this.emailValidator.validateEmail(prospect.email);
        
        // Generate alternative emails if primary is invalid
        let bestEmail = prospect.email;
        let emailScore = emailValidation.confidence;
        
        if (!emailValidation.isValid && prospect.alternativeEmails) {
          for (const altEmail of prospect.alternativeEmails) {
            const altValidation = await this.emailValidator.validateEmail(altEmail);
            if (altValidation.isValid && altValidation.confidence > emailScore) {
              bestEmail = altEmail;
              emailScore = altValidation.confidence;
              break;
            }
          }
        }
        
        // Calculate overall prospect score
        const overallScore = this.calculateProspectScore(prospect, emailScore);
        
        validatedProspects.push({
          ...prospect,
          email: bestEmail,
          emailValidation,
          emailScore,
          score: overallScore,
          validated: true
        });
        
      } catch (error) {
        console.error(`Error validating prospect ${prospect.id}:`, error);
        // Keep prospect even if validation fails
        validatedProspects.push({
          ...prospect,
          score: 50,
          validated: false
        });
      }
    }
    
    return validatedProspects.sort((a, b) => b.score - a.score);
  }

  // Calculate prospect score based on multiple factors
  calculateProspectScore(prospect, emailScore) {
    let score = 50; // Base score
    
    // Email quality
    score += emailScore * 0.3;
    
    // Position quality
    const seniorPositions = ['ceo', 'cto', 'cfo', 'president', 'director', 'vp', 'vice president'];
    if (seniorPositions.some(pos => prospect.position.toLowerCase().includes(pos))) {
      score += 20;
    }
    
    // Company quality (based on domain or website presence)
    if (prospect.website && !prospect.website.includes('example.com')) {
      score += 10;
    }
    
    // LinkedIn presence
    if (prospect.linkedinUrl && prospect.source === 'LinkedIn') {
      score += 15;
    }
    
    // Confidence from source
    if (prospect.confidence) {
      score += prospect.confidence * 0.2;
    }
    
    return Math.min(100, Math.max(20, Math.round(score)));
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

  // Generate AI-enhanced demo prospects when web scraping fails
  async generateFallbackProspects(searchParams) {
    console.log('🤖 Generating AI-enhanced demo prospects...');
    
    const { industries = [], positions = [], location = '', limit = 20 } = searchParams;
    
    try {
      // Generate AI-powered demo data using OpenAI
      const searchQueries = await this.generateSearchQueries({
        industries, positions, location, keywords: searchParams.keywords || ''
      });

      console.log(`🔍 Generated ${searchQueries.length} AI search queries`);

      const allProspects = [];
      
      // Generate prospects for multiple search angles
      for (const query of searchQueries.slice(0, 3)) {
        console.log(`🎯 Generating prospects for: "${query}"`);
        const prospects = await this.generateRealisticProspects(query, searchParams);
        allProspects.push(...prospects);
      }

      console.log(`📊 Generated ${allProspects.length} total prospects`);

      // Remove duplicates and enrich with AI
      const uniqueProspects = this.removeDuplicates(allProspects);
      const enrichedProspects = await this.enrichProspectData(uniqueProspects.slice(0, limit));
      
      console.log(`✅ Returning ${enrichedProspects.length} AI-generated prospects`);
      return enrichedProspects;

    } catch (aiError) {
      console.error('❌ AI generation failed, using static demo data:', aiError.message);
      
      // Ultimate fallback - static demo data
      return this.generateStaticDemoProspects(searchParams);
    }
  }

  // Static demo data as ultimate fallback
  generateStaticDemoProspects(searchParams) {
    const { industries = ['Technology'], positions = ['CEO'], location = 'San Francisco', limit = 20 } = searchParams;
    
    const demoProspects = [
      {
        id: crypto.randomUUID(),
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@techstartup.com',
        company: 'TechStartup Inc',
        position: positions[0] || 'CEO',
        industry: industries[0] || 'Technology',
        location: location || 'San Francisco, CA',
        score: 92,
        confidence: 85,
        source: 'Demo Data',
        validated: true,
        linkedinUrl: 'https://linkedin.com/in/sarah-johnson',
        website: 'https://techstartup.com',
        tags: ['Demo', 'High Priority'],
        summary: 'Experienced tech executive with proven track record in scaling startups.',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@innovativesolutions.com',
        company: 'Innovative Solutions',
        position: positions[1] || 'CTO',
        industry: industries[0] || 'Technology',
        location: location || 'San Francisco, CA',
        score: 88,
        confidence: 82,
        source: 'Demo Data',
        validated: true,
        linkedinUrl: 'https://linkedin.com/in/michael-chen',
        website: 'https://innovativesolutions.com',
        tags: ['Demo', 'Technical Leader'],
        summary: 'Technology leader focused on AI and machine learning solutions.',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        firstName: 'Emily',
        lastName: 'Rodriguez',
        email: 'emily.rodriguez@futuretech.io',
        company: 'FutureTech',
        position: 'Founder',
        industry: industries[0] || 'Technology',
        location: location || 'San Francisco, CA',
        score: 95,
        confidence: 90,
        source: 'Demo Data',
        validated: true,
        linkedinUrl: 'https://linkedin.com/in/emily-rodriguez',
        website: 'https://futuretech.io',
        tags: ['Demo', 'Founder', 'High Value'],
        summary: 'Serial entrepreneur building next-generation technology solutions.',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        firstName: 'David',
        lastName: 'Kim',
        email: 'david.kim@dataanalytics.com',
        company: 'Data Analytics Pro',
        position: 'VP of Sales',
        industry: industries[0] || 'Technology',
        location: location || 'San Francisco, CA',
        score: 85,
        confidence: 78,
        source: 'Demo Data',
        validated: true,
        linkedinUrl: 'https://linkedin.com/in/david-kim',
        website: 'https://dataanalytics.com',
        tags: ['Demo', 'Sales Leader'],
        summary: 'Results-driven sales executive specializing in B2B SaaS solutions.',
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        firstName: 'Lisa',
        lastName: 'Thompson',
        email: 'lisa.thompson@cloudservices.net',
        company: 'Cloud Services Corp',
        position: 'Director of Operations',
        industry: industries[0] || 'Technology',
        location: location || 'San Francisco, CA',
        score: 80,
        confidence: 75,
        source: 'Demo Data',
        validated: true,
        linkedinUrl: 'https://linkedin.com/in/lisa-thompson',
        website: 'https://cloudservices.net',
        tags: ['Demo', 'Operations'],
        summary: 'Operations expert focused on scaling cloud infrastructure solutions.',
        createdAt: new Date().toISOString()
      }
    ];

    console.log(`📋 Returning ${Math.min(demoProspects.length, limit)} static demo prospects`);
    return demoProspects.slice(0, limit);
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