const dns = require('dns').promises;
const net = require('net');

class EmailValidator {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Validate email format
  isValidFormat(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Check if domain has MX record
  async hasMXRecord(domain) {
    try {
      const mxRecords = await dns.resolveMx(domain);
      return mxRecords && mxRecords.length > 0;
    } catch (error) {
      return false;
    }
  }

  // Basic email validation (format + MX record)
  async validateEmail(email) {
    if (!email || !this.isValidFormat(email)) {
      return {
        email,
        isValid: false,
        reason: 'Invalid format',
        confidence: 0
      };
    }

    const domain = email.split('@')[1];
    
    // Check cache first
    const cacheKey = `mx_${domain}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return {
          email,
          isValid: cached.hasValidMX,
          reason: cached.hasValidMX ? 'Valid format and domain' : 'Domain has no MX record',
          confidence: cached.hasValidMX ? 75 : 25
        };
      }
    }

    // Check MX record
    const hasValidMX = await this.hasMXRecord(domain);
    
    // Cache result
    this.cache.set(cacheKey, {
      hasValidMX,
      timestamp: Date.now()
    });

    return {
      email,
      isValid: hasValidMX,
      reason: hasValidMX ? 'Valid format and domain' : 'Domain has no MX record',
      confidence: hasValidMX ? 75 : 25
    };
  }

  // Batch validate multiple emails
  async validateEmails(emails) {
    const results = [];
    
    // Process in batches to avoid overwhelming DNS
    const batchSize = 10;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map(email => this.validateEmail(email));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            email: batch[index],
            isValid: false,
            reason: 'Validation error',
            confidence: 0
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Score email likelihood based on patterns
  scoreEmailPattern(email, firstName, lastName, company) {
    if (!email || !firstName || !lastName) return 0;

    let score = 0;
    const emailLower = email.toLowerCase();
    const firstLower = firstName.toLowerCase();
    const lastLower = lastName.toLowerCase();
    const domain = email.split('@')[1]?.toLowerCase();

    // Check if email contains name components
    if (emailLower.includes(firstLower)) score += 30;
    if (emailLower.includes(lastLower)) score += 30;
    
    // Check common patterns
    if (emailLower === `${firstLower}.${lastLower}@${domain}`) score += 25;
    if (emailLower === `${firstLower}@${domain}`) score += 20;
    if (emailLower === `${firstLower}${lastLower}@${domain}`) score += 20;
    
    // Check if domain matches company
    if (company) {
      const companyWords = company.toLowerCase().replace(/[^a-z]/g, '');
      if (domain.includes(companyWords) || companyWords.includes(domain.replace(/\.(com|org|net)/, ''))) {
        score += 15;
      }
    }

    // Penalize generic domains for business emails
    const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (genericDomains.includes(domain)) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  // Generate and score email combinations
  generateScoredEmailCombinations(firstName, lastName, company, domain) {
    if (!firstName || !lastName) return [];

    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');
    
    let emailDomain = domain;
    if (!emailDomain && company) {
      // Try to guess domain from company name
      emailDomain = company.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|corp|llc|ltd)$/, '') + '.com';
    }
    
    if (!emailDomain) return [];

    const combinations = [
      `${first}.${last}@${emailDomain}`,
      `${first}@${emailDomain}`,
      `${last}@${emailDomain}`,
      `${first}${last}@${emailDomain}`,
      `${first}_${last}@${emailDomain}`,
      `${first.charAt(0)}${last}@${emailDomain}`,
      `${first}${last.charAt(0)}@${emailDomain}`,
      `${first}.${last.charAt(0)}@${emailDomain}`
    ];

    return combinations.map(email => ({
      email,
      score: this.scoreEmailPattern(email, firstName, lastName, company),
      pattern: this.getPatternName(email, first, last)
    })).sort((a, b) => b.score - a.score);
  }

  getPatternName(email, first, last) {
    const localPart = email.split('@')[0];
    
    if (localPart === `${first}.${last}`) return 'first.last';
    if (localPart === first) return 'first';
    if (localPart === last) return 'last';
    if (localPart === `${first}${last}`) return 'firstlast';
    if (localPart === `${first}_${last}`) return 'first_last';
    if (localPart === `${first.charAt(0)}${last}`) return 'flast';
    if (localPart === `${first}${last.charAt(0)}`) return 'firstl';
    if (localPart === `${first}.${last.charAt(0)}`) return 'first.l';
    
    return 'custom';
  }

  // Clean up cache periodically
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = EmailValidator;