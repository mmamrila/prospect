const crypto = require('crypto'); const uuidv4 = () => crypto.randomUUID();
const bcrypt = require('bcryptjs');
const { initializeDatabase, getDatabase } = require('../database/init');

// Sample data
const industries = [
  'Technology', 'Healthcare', 'Financial Services', 'Manufacturing', 
  'Retail', 'Education', 'Real Estate', 'Consulting', 'Media & Entertainment',
  'Transportation', 'Energy', 'Telecommunications'
];

const positions = [
  'CEO', 'CTO', 'VP Sales', 'VP Marketing', 'VP Engineering', 'Director of Sales',
  'Director of Marketing', 'Sales Manager', 'Marketing Manager', 'Head of Growth',
  'Business Development Manager', 'Account Executive', 'Sales Director',
  'Chief Marketing Officer', 'Chief Revenue Officer', 'Senior Manager'
];

const companySizes = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-500 employees', '501-1000 employees', '1000+ employees'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Los Angeles, CA', 'Chicago, IL',
  'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Denver, CO', 'Atlanta, GA',
  'Miami, FL', 'Portland, OR', 'Nashville, TN', 'Charlotte, NC', 'Phoenix, AZ'
];

const companies = [
  'Salesforce', 'Microsoft', 'Google', 'Apple', 'Amazon', 'Meta', 'Tesla',
  'Netflix', 'Adobe', 'Oracle', 'IBM', 'Intel', 'Cisco', 'VMware', 'Zoom',
  'Slack', 'Shopify', 'Square', 'PayPal', 'Stripe', 'Uber', 'Airbnb',
  'DocuSign', 'Zendesk', 'HubSpot', 'Atlassian', 'Twilio', 'Okta'
];

const firstNames = [
  'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'James', 'Ashley', 'Robert',
  'Jennifer', 'John', 'Lisa', 'William', 'Michelle', 'Christopher', 'Amanda',
  'Matthew', 'Melissa', 'Anthony', 'Kimberly', 'Mark', 'Donna', 'Steven',
  'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Laura', 'Kenneth'
];

const lastNames = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee',
  'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez'
];

const tags = [
  'High Priority', 'Enterprise', 'SMB', 'Startup', 'Fortune 500', 'Tech Leader',
  'Decision Maker', 'Influencer', 'Budget Holder', 'Champion', 'Warm Lead',
  'Cold Outreach', 'Referral', 'Event Contact', 'LinkedIn Connect', 'Email Campaign'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, max = 3) {
  const count = Math.floor(Math.random() * max) + 1;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateEmail(firstName, lastName, company) {
  const domain = company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generatePhone() {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${area}) ${prefix}-${suffix}`;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  // Initialize database
  initializeDatabase();
  
  const db = getDatabase();
  
  try {
    // Create demo user
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash('demo123', 12);
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, company, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, 
        'demo@prospectai.com', 
        passwordHash, 
        'Demo', 
        'User', 
        'ProspectAI', 
        'Sales Manager'
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Demo user created (email: demo@prospectai.com, password: demo123)');
    
    // Generate contacts
    const contactIds = [];
    const contactPromises = [];
    
    for (let i = 0; i < 250; i++) {
      const contactId = uuidv4();
      contactIds.push(contactId);
      
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const company = getRandomElement(companies);
      const position = getRandomElement(positions);
      const industry = getRandomElement(industries);
      const location = getRandomElement(locations);
      const companySize = getRandomElement(companySizes);
      const score = Math.floor(Math.random() * 40) + 60; // 60-100 score range
      
      const contactPromise = new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO contacts (
            id, first_name, last_name, email, phone, company, position, 
            industry, location, company_size, score, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
        `, [
          contactId, firstName, lastName, generateEmail(firstName, lastName, company),
          Math.random() > 0.3 ? generatePhone() : null, company, position, industry,
          location, companySize, score, userId, Math.floor(Math.random() * 90)
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            // Add random tags
            const contactTags = getRandomElements(tags, 3);
            const tagPromises = contactTags.map(tag => 
              new Promise((tagResolve, tagReject) => {
                db.run(
                  'INSERT INTO contact_tags (contact_id, tag) VALUES (?, ?)',
                  [contactId, tag],
                  (tagErr) => tagErr ? tagReject(tagErr) : tagResolve()
                );
              })
            );
            
            Promise.all(tagPromises)
              .then(() => resolve())
              .catch(reject);
          }
        });
      });
      
      contactPromises.push(contactPromise);
    }
    
    await Promise.all(contactPromises);
    console.log('✅ Created 250 sample contacts');
    
    // Create sample lists
    const listNames = [
      'Enterprise SaaS Prospects',
      'Q4 Healthcare Leads', 
      'West Coast Startups',
      'Fortune 500 Decision Makers',
      'Tech Industry VPs',
      'Marketing Directors',
      'Sales Leaders Network'
    ];
    
    const listPromises = listNames.map(async (name, index) => {
      const listId = uuidv4();
      
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO prospect_lists (id, name, description, created_by, created_at)
          VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
        `, [
          listId,
          name,
          `Curated list of ${name.toLowerCase()} for targeted outreach`,
          userId,
          Math.floor(Math.random() * 30)
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            // Add random contacts to list
            const listContactIds = getRandomElements(contactIds, 15);
            const contactPromises = listContactIds.map(contactId =>
              new Promise((contactResolve, contactReject) => {
                db.run(
                  'INSERT INTO list_contacts (list_id, contact_id) VALUES (?, ?)',
                  [listId, contactId],
                  (contactErr) => contactErr ? contactReject(contactErr) : contactResolve()
                );
              })
            );
            
            // Add list tags
            const listTags = getRandomElements(['Active', 'Priority', 'Q4', 'Nurture', 'Outreach'], 2);
            const tagPromises = listTags.map(tag =>
              new Promise((tagResolve, tagReject) => {
                db.run(
                  'INSERT INTO list_tags (list_id, tag) VALUES (?, ?)',
                  [listId, tag],
                  (tagErr) => tagErr ? tagReject(tagErr) : tagResolve()
                );
              })
            );
            
            Promise.all([...contactPromises, ...tagPromises])
              .then(() => resolve())
              .catch(reject);
          }
        });
      });
    });
    
    await Promise.all(listPromises);
    console.log('✅ Created 7 sample prospect lists');
    
    // Add some search history
    const searchQueries = [
      { query: 'VP Sales', filters: { industries: ['Technology'], positions: ['VP Sales'] } },
      { query: 'Salesforce', filters: { companies: ['Salesforce'] } },
      { query: 'marketing director', filters: { positions: ['Director of Marketing'] } },
      { query: '', filters: { industries: ['Healthcare'], companySizes: ['1000+ employees'] } }
    ];
    
    const historyPromises = searchQueries.map((search, index) =>
      new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO search_history (user_id, query, filters, results_count, created_at)
          VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
        `, [
          userId,
          search.query,
          JSON.stringify(search.filters),
          Math.floor(Math.random() * 50) + 10,
          index * 3
        ], (err) => err ? reject(err) : resolve());
      })
    );
    
    await Promise.all(historyPromises);
    console.log('✅ Added sample search history');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    db.close();
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Account Details:');
    console.log('Email: demo@prospectai.com');
    console.log('Password: demo123');
    console.log('\n🚀 Start the development server with: npm run dev');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };