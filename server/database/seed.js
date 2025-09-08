const { getDatabase } = require('./init');
const crypto = require('crypto');

const sampleContacts = [
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@salesforce.com',
    phone: '+1 (415) 555-0123',
    company: 'Salesforce',
    position: 'VP of Sales',
    industry: 'Software & SaaS',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 92,
    tags: ['High Priority', 'Enterprise']
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@microsoft.com',
    phone: '+1 (425) 555-0124',
    company: 'Microsoft',
    position: 'Director of Engineering',
    industry: 'Software & SaaS',
    location: 'Seattle, WA',
    linkedinUrl: 'https://linkedin.com/in/michaelchen',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 88,
    tags: ['Tech Leader']
  },
  {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@stripe.com',
    phone: '+1 (646) 555-0125',
    company: 'Stripe',
    position: 'Head of Marketing',
    industry: 'FinTech',
    location: 'New York, NY',
    linkedinUrl: 'https://linkedin.com/in/emilyrodriguez',
    companySize: '1,001-5,000 employees',
    revenue: '$1B - $5B',
    score: 85,
    tags: ['Marketing', 'Decision Maker']
  },
  {
    firstName: 'David',
    lastName: 'Park',
    email: 'david.park@uber.com',
    phone: '+1 (415) 555-0126',
    company: 'Uber',
    position: 'Senior Product Manager',
    industry: 'Transportation & Logistics',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/davidpark',
    companySize: '10,000+ employees',
    revenue: '$10M - $50M',
    score: 78,
    tags: ['Product', 'Growth']
  },
  {
    firstName: 'Jessica',
    lastName: 'Williams',
    email: 'jessica.williams@adobe.com',
    phone: '+1 (408) 555-0127',
    company: 'Adobe',
    position: 'VP of Customer Success',
    industry: 'Software & SaaS',
    location: 'San Jose, CA',
    linkedinUrl: 'https://linkedin.com/in/jessicawilliams',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 91,
    tags: ['Customer Success', 'Executive']
  },
  {
    firstName: 'Robert',
    lastName: 'Thompson',
    email: 'robert.thompson@tesla.com',
    phone: '+1 (512) 555-0128',
    company: 'Tesla',
    position: 'Director of Operations',
    industry: 'Automotive Manufacturing',
    location: 'Austin, TX',
    linkedinUrl: 'https://linkedin.com/in/robertthompson',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 89,
    tags: ['Operations', 'Manufacturing']
  },
  {
    firstName: 'Amanda',
    lastName: 'Davis',
    email: 'amanda.davis@netflix.com',
    phone: '+1 (408) 555-0129',
    company: 'Netflix',
    position: 'Chief Marketing Officer',
    industry: 'Media & Entertainment',
    location: 'Los Gatos, CA',
    linkedinUrl: 'https://linkedin.com/in/amandadavis',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 94,
    tags: ['C-Level', 'Marketing', 'Media']
  },
  {
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@shopify.com',
    phone: '+1 (613) 555-0130',
    company: 'Shopify',
    position: 'VP of Engineering',
    industry: 'E-commerce',
    location: 'Ottawa, ON',
    linkedinUrl: 'https://linkedin.com/in/jameswilson',
    companySize: '5,001-10,000 employees',
    revenue: '$1B - $5B',
    score: 86,
    tags: ['Engineering', 'E-commerce']
  },
  {
    firstName: 'Lisa',
    lastName: 'Garcia',
    email: 'lisa.garcia@airbnb.com',
    phone: '+1 (415) 555-0131',
    company: 'Airbnb',
    position: 'Head of Business Development',
    industry: 'Hospitality & Travel',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/lisagarcia',
    companySize: '5,001-10,000 employees',
    revenue: '$1B - $5B',
    score: 82,
    tags: ['Business Development', 'Travel']
  },
  {
    firstName: 'Kevin',
    lastName: 'Martinez',
    email: 'kevin.martinez@zoom.us',
    phone: '+1 (408) 555-0132',
    company: 'Zoom',
    position: 'Director of Sales',
    industry: 'Software & SaaS',
    location: 'San Jose, CA',
    linkedinUrl: 'https://linkedin.com/in/kevinmartinez',
    companySize: '5,001-10,000 employees',
    revenue: '$1B - $5B',
    score: 87,
    tags: ['Sales', 'SaaS']
  },
  {
    firstName: 'Rachel',
    lastName: 'Anderson',
    email: 'rachel.anderson@square.com',
    phone: '+1 (415) 555-0133',
    company: 'Square',
    position: 'VP of Product',
    industry: 'FinTech',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/rachelanderson',
    companySize: '1,001-5,000 employees',
    revenue: '$500M - $1B',
    score: 83,
    tags: ['Product', 'FinTech']
  },
  {
    firstName: 'Christopher',
    lastName: 'Lee',
    email: 'christopher.lee@slack.com',
    phone: '+1 (415) 555-0134',
    company: 'Slack',
    position: 'Senior Engineering Manager',
    industry: 'Software & SaaS',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/christopherlee',
    companySize: '1,001-5,000 employees',
    revenue: '$500M - $1B',
    score: 81,
    tags: ['Engineering', 'Management']
  },
  {
    firstName: 'Michelle',
    lastName: 'Taylor',
    email: 'michelle.taylor@hubspot.com',
    phone: '+1 (617) 555-0135',
    company: 'HubSpot',
    position: 'Director of Marketing',
    industry: 'MarTech',
    location: 'Cambridge, MA',
    linkedinUrl: 'https://linkedin.com/in/michelletaylor',
    companySize: '1,001-5,000 employees',
    revenue: '$500M - $1B',
    score: 84,
    tags: ['Marketing', 'MarTech']
  },
  {
    firstName: 'Daniel',
    lastName: 'Brown',
    email: 'daniel.brown@twilio.com',
    phone: '+1 (415) 555-0136',
    company: 'Twilio',
    position: 'VP of Customer Success',
    industry: 'Cloud Computing',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/danielbrown',
    companySize: '1,001-5,000 employees',
    revenue: '$1B - $5B',
    score: 88,
    tags: ['Customer Success', 'Cloud']
  },
  {
    firstName: 'Stephanie',
    lastName: 'Miller',
    email: 'stephanie.miller@dropbox.com',
    phone: '+1 (415) 555-0137',
    company: 'Dropbox',
    position: 'Head of Operations',
    industry: 'Cloud Computing',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/stephaniemiller',
    companySize: '1,001-5,000 employees',
    revenue: '$500M - $1B',
    score: 79,
    tags: ['Operations', 'Cloud Storage']
  },
  {
    firstName: 'Thomas',
    lastName: 'Moore',
    email: 'thomas.moore@oracle.com',
    phone: '+1 (650) 555-0138',
    company: 'Oracle',
    position: 'Enterprise Sales Manager',
    industry: 'Software & SaaS',
    location: 'Redwood City, CA',
    linkedinUrl: 'https://linkedin.com/in/thomasmoore',
    companySize: '10,000+ employees',
    revenue: '$5B+',
    score: 90,
    tags: ['Enterprise Sales', 'Database']
  },
  {
    firstName: 'Jennifer',
    lastName: 'White',
    email: 'jennifer.white@atlassian.com',
    phone: '+1 (415) 555-0139',
    company: 'Atlassian',
    position: 'Product Marketing Manager',
    industry: 'Software & SaaS',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/jenniferwhite',
    companySize: '5,001-10,000 employees',
    revenue: '$1B - $5B',
    score: 76,
    tags: ['Product Marketing', 'SaaS']
  },
  {
    firstName: 'Brian',
    lastName: 'Harris',
    email: 'brian.harris@servicenow.com',
    phone: '+1 (408) 555-0140',
    company: 'ServiceNow',
    position: 'Director of Customer Success',
    industry: 'Software & SaaS',
    location: 'Santa Clara, CA',
    linkedinUrl: 'https://linkedin.com/in/brianharris',
    companySize: '10,000+ employees',
    revenue: '$1B - $5B',
    score: 85,
    tags: ['Customer Success', 'Enterprise']
  },
  {
    firstName: 'Nicole',
    lastName: 'Clark',
    email: 'nicole.clark@zendesk.com',
    phone: '+1 (415) 555-0141',
    company: 'Zendesk',
    position: 'VP of Marketing',
    industry: 'Software & SaaS',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/nicoleclark',
    companySize: '1,001-5,000 employees',
    revenue: '$500M - $1B',
    score: 82,
    tags: ['Marketing', 'Customer Service']
  },
  {
    firstName: 'Gregory',
    lastName: 'Lewis',
    email: 'gregory.lewis@workday.com',
    phone: '+1 (925) 555-0142',
    company: 'Workday',
    position: 'Chief Revenue Officer',
    industry: 'HR Tech',
    location: 'Pleasanton, CA',
    linkedinUrl: 'https://linkedin.com/in/gregorylewis',
    companySize: '10,000+ employees',
    revenue: '$1B - $5B',
    score: 95,
    tags: ['C-Level', 'Revenue', 'HR Tech']
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...');
  
  const db = getDatabase();
  
  try {
    // Create a test user first
    const testUserId = crypto.randomUUID();
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, company, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          testUserId,
          'demo@prospectai.com',
          '$2b$10$dummy.hash.for.demo.purposes.only',
          'Demo',
          'User',
          'ProspectAI',
          'admin'
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log('✅ Test user created');
    
    // Clear existing contacts
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM contact_tags', (err) => {
        if (err) reject(err);
        else {
          db.run('DELETE FROM contacts', (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
    
    console.log('✅ Existing contacts cleared');
    
    // Insert sample contacts
    for (const contact of sampleContacts) {
      const contactId = crypto.randomUUID();
      
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO contacts (
            id, first_name, last_name, email, phone, company, position, 
            industry, location, linkedin_url, company_size, revenue, 
            score, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            contactId,
            contact.firstName,
            contact.lastName,
            contact.email,
            contact.phone,
            contact.company,
            contact.position,
            contact.industry,
            contact.location,
            contact.linkedinUrl,
            contact.companySize,
            contact.revenue,
            contact.score,
            testUserId
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      
      // Insert tags for this contact
      if (contact.tags && contact.tags.length > 0) {
        for (const tag of contact.tags) {
          await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO contact_tags (contact_id, tag) VALUES (?, ?)',
              [contactId, tag],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        }
      }
    }
    
    console.log(`✅ Inserted ${sampleContacts.length} sample contacts`);
    
    // Verify the data
    await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM contacts', (err, row) => {
        if (err) reject(err);
        else {
          console.log(`📊 Total contacts in database: ${row.count}`);
          resolve();
        }
      });
    });
    
    console.log('🎉 Database seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

module.exports = { seedDatabase };

// Run if called directly
if (require.main === module) {
  seedDatabase();
}