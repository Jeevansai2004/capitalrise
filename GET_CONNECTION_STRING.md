# How to Get Your MongoDB Atlas Connection String

## 🔍 Current Issue
The authentication is failing, which means we need to get the exact connection string from your MongoDB Atlas dashboard.

## 📋 Step-by-Step Instructions

### Step 1: Go to MongoDB Atlas
1. Open [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Sign in with your account

### Step 2: Select Your Cluster
1. Click on your cluster: `CapitalRiseCluster`
2. Make sure it's running (green status)

### Step 3: Get Connection String
1. Click the **"Connect"** button
2. Choose **"Connect your application"**
3. Select **"Node.js"** as your driver
4. Copy the connection string

### Step 4: Update Your Connection String
The connection string will look like this:
```
mongodb+srv://saijeevan362:<password>@capitalrisecluster.fauhhu9.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password: `wRPku4pajH3WnZgc`

### Step 5: Test the Connection
Run this command with your exact connection string:

```bash
node test-mongodb-atlas.js
```

## 🔧 Alternative: Create New Database User

If the current user doesn't work:

### Option 1: Create New User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: `capitalrise_user`
4. Password: `CapitalRise2024!`
5. Role: "Read and write to any database"

### Option 2: Reset Current User
1. Go to "Database Access"
2. Find user `saijeevan362`
3. Click "Edit"
4. Click "Edit Password"
5. Set new password: `CapitalRise2024!`

## 🌐 Network Access
Make sure your IP is whitelisted:
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

## 📞 Quick Test Commands

Once you have the correct connection string:

```bash
# Test connection
node test-mongodb-atlas.js

# If successful, initialize database
npm run db:init

# Start your application
npm run dev
```

## 🎯 What to Look For

The connection string should contain:
- ✅ Correct username: `saijeevan362`
- ✅ Correct password: `wRPku4pajH3WnZgc`
- ✅ Correct cluster: `capitalrisecluster.fauhhu9.mongodb.net`
- ✅ Correct database: `capital_rise`

## 🚨 Common Issues

1. **Wrong Password**: Double-check the password
2. **User Doesn't Exist**: Create the database user
3. **IP Not Whitelisted**: Add your IP to Network Access
4. **Cluster Not Running**: Check cluster status
5. **Wrong Cluster Name**: Verify cluster name in connection string

## 📞 Need Help?

If you're still having issues:
1. Screenshot your MongoDB Atlas dashboard
2. Check if the cluster is in the correct region
3. Verify the database user exists and has correct permissions
4. Try creating a new cluster if needed

Your data persistence setup is ready - we just need the correct connection string! 🎯 