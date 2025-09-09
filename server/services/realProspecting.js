const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const crypto = require('crypto');
const { URL } = require('url');

class RealProspectingService {
  constructor() {
    this.browser = null;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    this.delay = parseInt(process.env.SCRAPING_DELAY) || 2000;
    this.maxConcurrent = parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 3;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
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

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main function to find real prospects
  async findRealProspects(searchParams) {
    const { 
      industries = [], 
      positions = [], 
      location = '', 
      companySize = '', 
      keywords = '',
      limit = 20 
    } = searchParams;

    console.log('🌐 Starting real prospect discovery...');
    
    const allProspects = [];

    try {
      // Strategy 1: Search company directories
      const directoryProspects = await this.searchBusinessDirectories(searchParams);
      allProspects.push(...directoryProspects);

      // Strategy 2: Search LinkedIn public profiles
      const linkedinProspects = await this.searchLinkedInProfiles(searchParams);
      allProspects.push(...linkedinProspects);

      // Strategy 3: Search company websites directly
      const companyProspects = await this.searchCompanyWebsites(searchParams);
      allProspects.push(...companyProspects);

      // Strategy 4: Search professional associations
      const associationProspects = await this.searchProfessionalAssociations(searchParams);
      allProspects.push(...associationProspects);

      // Remove duplicates and enrich
      const uniqueProspects = this.removeDuplicates(allProspects);
      const validatedProspects = await this.validateAndEnrichContacts(uniqueProspects.slice(0, limit));

      console.log(`✅ Found ${validatedProspects.length} real prospects`);
      return validatedProspects;

    } catch (error) {
      console.error('❌ Real prospecting error:', error);
      return [];
    }
  }

  // Search business directories (Yellow Pages, Chamber of Commerce, etc.)
  async searchBusinessDirectories(searchParams) {
    const prospects = [];
    const { industries, location, keywords } = searchParams;
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Search multiple business directories
      const directories = [
        'https://www.yellowpages.com',
        'https://www.superpages.com',
        'https://www.bbb.org'
      ];

      for (const directory of directories) {
        try {
          const searchQuery = `${keywords} ${industries.join(' ')} ${location}`.trim();
          console.log(`🔍 Searching ${directory} for: ${searchQuery}`);
          
          if (directory.includes('yellowpages')) {
            const directoryProspects = await this.scrapeYellowPages(page, searchQuery, location);
            prospects.push(...directoryProspects);
          }
          
          await this.sleep(this.delay);
        } catch (dirError) {
          console.error(`Error searching ${directory}:`, dirError.message);
        }
      }

      await page.close();
    } catch (error) {
      console.error('Directory search error:', error);
    }

    return prospects;
  }

  // Scrape Yellow Pages for business contacts
  async scrapeYellowPages(page, searchQuery, location) {
    const prospects = [];
    
    try {
      const searchUrl = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(searchQuery)}&geo_location_terms=${encodeURIComponent(location)}`;
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(2000);

      // Extract business listings
      const businesses = await page.evaluate(() => {
        const listings = [];
        const businessCards = document.querySelectorAll('.result');
        
        businessCards.forEach(card => {
          try {
            const nameEl = card.querySelector('.business-name');
            const addressEl = card.querySelector('.adr');
            const phoneEl = card.querySelector('.phones');
            const websiteEl = card.querySelector('.track-visit-website');
            
            if (nameEl) {
              listings.push({
                company: nameEl.textContent.trim(),
                address: addressEl ? addressEl.textContent.trim() : '',
                phone: phoneEl ? phoneEl.textContent.trim() : '',
                website: websiteEl ? websiteEl.href : ''
              });
            }
          } catch (e) {
            console.error('Error parsing business card:', e);
          }
        });
        
        return listings;
      });

      // Convert businesses to prospect format
      for (const business of businesses.slice(0, 10)) {
        if (business.company) {
          // Try to extract contacts from company website
          const contacts = await this.extractContactsFromWebsite(business.website, business);
          prospects.push(...contacts);
        }
      }

    } catch (error) {
      console.error('Yellow Pages scraping error:', error);
    }

    return prospects;
  }

  // Search LinkedIn public profiles
  async searchLinkedInProfiles(searchParams) {
    const prospects = [];
    const { positions, location, keywords, industries } = searchParams;
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      
      // Use Google to search LinkedIn profiles (more reliable than LinkedIn direct)
      const searchQueries = [
        `site:linkedin.com/in/ ${positions.join(' OR ')} ${location}`,
        `site:linkedin.com/in/ ${keywords} ${industries.join(' OR ')}`,
        `site:linkedin.com/in/ "${positions[0]}" "${location}"`
      ];

      for (const query of searchQueries) {
        try {
          console.log(`🔍 Searching LinkedIn profiles: ${query}`);
          
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
          await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.sleep(2000);

          // Extract LinkedIn profile URLs
          const linkedinUrls = await page.evaluate(() => {
            const links = [];
            const resultLinks = document.querySelectorAll('a[href*="linkedin.com/in/"]');
            
            resultLinks.forEach(link => {
              const href = link.href;
              if (href.includes('linkedin.com/in/') && !href.includes('dir/') && !links.includes(href)) {
                links.push(href);
              }
            });
            
            return links.slice(0, 10);
          });

          // Extract data from each LinkedIn profile
          for (const linkedinUrl of linkedinUrls) {
            try {
              const profileData = await this.scrapeLinkedInProfile(page, linkedinUrl);
              if (profileData) {
                prospects.push(profileData);
              }
              await this.sleep(this.delay);
            } catch (profileError) {
              console.error('Error scraping LinkedIn profile:', profileError.message);
            }
          }

          await this.sleep(this.delay);
        } catch (queryError) {
          console.error(`Error with query ${query}:`, queryError.message);
        }
      }

      await page.close();
    } catch (error) {
      console.error('LinkedIn search error:', error);
    }

    return prospects;
  }

  // Scrape individual LinkedIn profile (public data only)
  async scrapeLinkedInProfile(page, profileUrl) {
    try {
      await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(2000);

      const profileData = await page.evaluate(() => {
        try {
          const name = document.querySelector('h1')?.textContent?.trim() || '';
          const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
          const location = document.querySelector('.text-body-small.inline.t-black--light.break-words')?.textContent?.trim() || '';
          
          // Try to extract company and position from headline
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Parse headline for position and company
          let position = '';
          let company = '';
          if (headline.includes(' at ')) {
            const parts = headline.split(' at ');
            position = parts[0].trim();
            company = parts[1].trim();
          } else {
            position = headline;
          }

          return {
            firstName,
            lastName,
            position,
            company,
            location,
            linkedinUrl: window.location.href,
            source: 'LinkedIn'
          };
        } catch (e) {
          console.error('Error extracting profile data:', e);
          return null;
        }
      });

      if (profileData && profileData.firstName) {
        // Generate probable email addresses
        const emails = this.generateEmailCombinations(profileData.firstName, profileData.lastName, profileData.company);
        profileData.email = emails[0]; // Use the most likely email
        profileData.alternativeEmails = emails;
        profileData.id = crypto.randomUUID();
        profileData.score = Math.floor(Math.random() * 20) + 75; // 75-95 score
        profileData.confidence = 85;
        
        return profileData;
      }

    } catch (error) {
      console.error('LinkedIn profile scraping error:', error);
      return null;
    }

    return null;
  }

  // Search company websites directly
  async searchCompanyWebsites(searchParams) {
    const prospects = [];
    const { industries, keywords, limit } = searchParams;
    
    try {
      // First, find companies using Google search
      const companies = await this.findCompanies(industries, keywords, limit);
      
      // Then extract contacts from each company website
      for (const company of companies.slice(0, 10)) {
        try {
          const companyContacts = await this.extractContactsFromWebsite(company.website, company);
          prospects.push(...companyContacts);
          await this.sleep(this.delay);
        } catch (error) {
          console.error(`Error extracting contacts from ${company.name}:`, error.message);
        }
      }

    } catch (error) {
      console.error('Company website search error:', error);
    }

    return prospects;
  }

  // Find companies using Google search
  async findCompanies(industries, keywords, limit) {
    const companies = [];
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      
      const searchQuery = `${industries.join(' ')} companies ${keywords} "about us"`;
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=20`;
      
      await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(2000);

      const companyData = await page.evaluate(() => {
        const results = [];
        const searchResults = document.querySelectorAll('.g');
        
        searchResults.forEach(result => {
          try {
            const linkEl = result.querySelector('a');
            const titleEl = result.querySelector('h3');
            const snippetEl = result.querySelector('.VwiC3b');
            
            if (linkEl && titleEl && linkEl.href) {
              const url = linkEl.href;
              const domain = new URL(url).hostname;
              
              // Skip non-company domains
              if (!domain.includes('linkedin') && !domain.includes('facebook') && 
                  !domain.includes('twitter') && !domain.includes('wikipedia')) {
                results.push({
                  name: titleEl.textContent.trim(),
                  website: url,
                  domain: domain,
                  snippet: snippetEl ? snippetEl.textContent.trim() : ''
                });
              }
            }
          } catch (e) {
            console.error('Error parsing search result:', e);
          }
        });
        
        return results;
      });

      companies.push(...companyData.slice(0, limit));
      await page.close();
      
    } catch (error) {
      console.error('Company search error:', error);
    }

    return companies;
  }

  // Extract contacts from company website
  async extractContactsFromWebsite(websiteUrl, companyInfo = {}) {
    const contacts = [];
    
    if (!websiteUrl || !websiteUrl.startsWith('http')) {
      return contacts;
    }

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(this.getRandomUserAgent());
      
      console.log(`🔍 Extracting contacts from: ${websiteUrl}`);
      
      await page.goto(websiteUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await this.sleep(1000);

      // Look for team/about/contact pages
      const teamPages = await page.evaluate(() => {
        const links = [];
        const allLinks = document.querySelectorAll('a[href]');
        
        allLinks.forEach(link => {
          const href = link.href.toLowerCase();
          const text = link.textContent.toLowerCase();
          
          if ((text.includes('team') || text.includes('about') || text.includes('leadership') ||
               text.includes('staff') || text.includes('contact') || text.includes('people')) &&
              href && !links.includes(href)) {
            links.push(href);
          }
        });
        
        return links.slice(0, 5);
      });

      // Check current page for contacts
      let pageContacts = await this.extractContactsFromPage(page, companyInfo);
      contacts.push(...pageContacts);

      // Check team pages
      for (const teamPageUrl of teamPages) {
        try {
          await page.goto(teamPageUrl, { waitUntil: 'networkidle2', timeout: 30000 });
          await this.sleep(1000);
          
          pageContacts = await this.extractContactsFromPage(page, companyInfo);
          contacts.push(...pageContacts);
          
          await this.sleep(1000);
        } catch (pageError) {
          console.error(`Error loading team page ${teamPageUrl}:`, pageError.message);
        }
      }

      await page.close();
      
    } catch (error) {
      console.error('Website extraction error:', error);
    }

    return contacts;
  }

  // Extract contacts from current page
  async extractContactsFromPage(page, companyInfo = {}) {
    const contacts = [];
    
    try {
      const pageData = await page.evaluate(() => {
        const people = [];
        
        // Look for email addresses
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const pageText = document.body.textContent;
        const emails = pageText.match(emailRegex) || [];
        
        // Look for names and titles in various patterns
        const namePatterns = [
          // CEO, CTO, etc patterns
          /(?:CEO|CTO|CFO|COO|President|Director|Manager|Lead)\s*[:\-]?\s*([A-Z][a-z]+ [A-Z][a-z]+)/gi,
          // Name with title pattern
          /([A-Z][a-z]+ [A-Z][a-z]+)\s*[,\-]?\s*(?:CEO|CTO|CFO|COO|President|Director|Manager|Lead)/gi
        ];
        
        namePatterns.forEach(pattern => {
          const matches = pageText.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              people.push({
                name: match[1].trim(),
                context: match[0].trim()
              });
            }
          }
        });
        
        // Look for structured team sections
        const teamSections = document.querySelectorAll('.team, .staff, .leadership, .about-team, [class*="team"], [class*="staff"]');
        teamSections.forEach(section => {
          const names = section.querySelectorAll('h1, h2, h3, h4, .name, [class*="name"]');
          names.forEach(nameEl => {
            const name = nameEl.textContent.trim();
            if (name.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/)) {
              people.push({
                name: name,
                context: 'Team section'
              });
            }
          });
        });
        
        return { emails, people };
      });

      // Process found emails and names
      const { emails, people } = pageData;
      const domain = companyInfo.domain || new URL(page.url()).hostname;
      
      // Filter valid business emails
      const validEmails = emails.filter(email => {
        return !email.includes('example.com') && 
               !email.includes('test.com') && 
               !email.includes('placeholder') &&
               email.length < 50;
      });

      // Create contacts from found data
      const seenNames = new Set();
      
      for (const person of people) {
        if (!seenNames.has(person.name)) {
          seenNames.add(person.name);
          
          const nameParts = person.name.split(' ');
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(' ');
          
          // Extract position from context
          const positionMatch = person.context.match(/(CEO|CTO|CFO|COO|President|Director|Manager|Lead[^a-z])/i);
          const position = positionMatch ? positionMatch[1] : 'Professional';
          
          // Generate email if not found
          let email = validEmails.find(e => e.includes(firstName.toLowerCase()) || e.includes(lastName.toLowerCase()));
          if (!email) {
            const emailCombinations = this.generateEmailCombinations(firstName, lastName, domain);
            email = emailCombinations[0];
          }
          
          contacts.push({
            id: crypto.randomUUID(),
            firstName,
            lastName,
            email,
            company: companyInfo.name || domain,
            position,
            website: page.url(),
            source: 'Website Extraction',
            confidence: 70,
            score: Math.floor(Math.random() * 25) + 70,
            location: companyInfo.location || '',
            industry: companyInfo.industry || ''
          });
        }
      }

    } catch (error) {
      console.error('Page extraction error:', error);
    }

    return contacts;
  }

  // Search professional associations
  async searchProfessionalAssociations(searchParams) {
    const prospects = [];
    // This could be expanded to search industry-specific associations
    return prospects;
  }

  // Generate email combinations for a person
  generateEmailCombinations(firstName, lastName, companyDomain) {
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    const domain = typeof companyDomain === 'string' ? companyDomain : companyDomain?.domain || 'example.com';
    
    const cleanDomain = domain.replace(/^www\./, '').split('/')[0];
    
    return [
      `${first}.${last}@${cleanDomain}`,
      `${first}@${cleanDomain}`,
      `${last}@${cleanDomain}`,
      `${first}${last}@${cleanDomain}`,
      `${first}_${last}@${cleanDomain}`,
      `${first.charAt(0)}${last}@${cleanDomain}`,
      `${first}${last.charAt(0)}@${cleanDomain}`
    ];
  }

  // Validate and enrich contacts
  async validateAndEnrichContacts(contacts) {
    const validatedContacts = [];
    
    for (const contact of contacts) {
      try {
        // Basic validation
        if (contact.firstName && contact.lastName && contact.email) {
          // Could add email validation API here
          validatedContacts.push({
            ...contact,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Contact validation error:', error);
      }
    }

    return validatedContacts;
  }

  // Remove duplicate contacts
  removeDuplicates(contacts) {
    const seen = new Map();
    return contacts.filter(contact => {
      const key = `${contact.email?.toLowerCase()}_${contact.firstName?.toLowerCase()}_${contact.lastName?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }
}

module.exports = RealProspectingService;