const fs = require('fs');
const path = require('path');

const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS and referral links)
CLIENT_URL=http://localhost:3000

# JWT Secret (change this in production)
JWT_SECRET=capital-rise-super-secret-jwt-key-2024

# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://saijeevan362:7XHXg9dQM2uuIdm4@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority&appName=CapitalRiseCluster
MONGO_DB=capital_rise

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin Default Credentials (change in production)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@capitalrise.com
ADMIN_PASSWORD=admin123

# Security
SESSION_SECRET=capital-rise-session-secret-key-2024
COOKIE_SECRET=capital-rise-cookie-secret-key-2024

# Logging
LOG_LEVEL=info

# Twilio Messaging Configuration
TWILIO_ACCOUNT_SID=ACb1c00f9c8b880c515332a82ff7b0c2c8
TWILIO_AUTH_TOKEN=d80f54c08215c8e41eef23ccd4338c72
TWILIO_PHONE_NUMBER=+3197010208105
TWILIO_WHATSAPP_NUMBER=+3197010208105
`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file updated successfully!');
  console.log('🔗 MongoDB Atlas connection string configured with your new password');
  console.log('📝 Username: saijeevan362');
  console.log('🔐 Password: 7XHXg9dQM2uuIdm4');
  console.log('\n🚀 Next steps:');
  console.log('1. Test connection: node test-mongodb-atlas.js');
  console.log('2. Initialize database: npm run db:init');
  console.log('3. Start application: npm run dev');
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
} 