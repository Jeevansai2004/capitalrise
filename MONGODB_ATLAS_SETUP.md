# MongoDB Atlas Setup Guide

## 🗄️ Setting Up Persistent Cloud Database

Your data will be stored permanently in MongoDB Atlas cloud database, so it will never be lost!

### Step 1: Create .env File

Create a `.env` file in your project root with this content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS and referral links)
CLIENT_URL=http://localhost:3000

# JWT Secret (change this in production)
JWT_SECRET=capital-rise-super-secret-jwt-key-2024

# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://saijeevan362:JeevanSai%40123@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority&appName=CapitalRiseCluster
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
```

### Step 2: Test Connection

Run this command to test your MongoDB Atlas connection:

```bash
node test-mongodb-atlas.js
```

### Step 3: Initialize Database

Once connection is successful, initialize your database:

```bash
npm run db:init
```

### Step 4: Start Your Application

```bash
npm run dev
```

## 🔧 MongoDB Atlas Configuration

### Network Access
1. Go to MongoDB Atlas Dashboard
2. Click "Network Access"
3. Add your IP address or use "0.0.0.0/0" for all IPs (for development)

### Database User
1. Go to "Database Access"
2. Create a user with "Read and write to any database" permissions
3. Use the username: `saijeevan362`
4. Password: `JeevanSai@123`

### Connection String Format
```
mongodb+srv://saijeevan362:JeevanSai%40123@capitalrisecluster.fauhhu9.mongodb.net/capital_rise?retryWrites=true&w=majority&appName=CapitalRiseCluster
```

**Note**: The `@` symbol in your password is URL-encoded as `%40`

## 📊 Database Collections

Your application will automatically create these collections:
- `users` - User accounts and profiles
- `investments` - Investment records
- `referrals` - Referral tracking
- `withdrawals` - Withdrawal requests
- `messages` - Chat messages
- `balances` - User balances
- `loots` - Investment opportunities

## 💾 Data Backup

### Create Backup
```bash
npm run db:backup
```

### Restore Backup
```bash
npm run db:restore <backup-file-path>
```

## 🚀 Render Deployment

For Render deployment, set these environment variables:

- `MONGO_URI`: Your MongoDB Atlas connection string
- `MONGO_DB`: `capital_rise`
- `NODE_ENV`: `production`
- `CLIENT_URL`: Your Render app URL

## ✅ Benefits of MongoDB Atlas

1. **Permanent Storage**: Data never gets lost
2. **Automatic Backups**: Built-in backup system
3. **Scalability**: Can handle growing data
4. **Security**: Enterprise-grade security
5. **Monitoring**: Built-in performance monitoring
6. **Global Access**: Access from anywhere

## 🔍 Troubleshooting

### Connection Issues
1. **Authentication Failed**: 
   - Verify username: `saijeevan362`
   - Verify password: `JeevanSai@123`
   - Check if user exists in MongoDB Atlas
2. **Network Issues**:
   - Add your IP to MongoDB Atlas Network Access
   - Use "0.0.0.0/0" for all IPs (development only)
3. **Cluster Issues**:
   - Ensure cluster is running
   - Check cluster status in Atlas dashboard

### Password Encoding
- `@` becomes `%40` in URL
- `#` becomes `%23`
- `%` becomes `%25`
- `+` becomes `%2B`

## 📈 Monitoring

Monitor your database in MongoDB Atlas:
- Performance metrics
- Query analytics
- Storage usage
- Connection statistics

Your data is now safe and permanent! 🎉 