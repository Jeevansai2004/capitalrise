# MongoDB Atlas Connection Troubleshooting

## 🔍 Current Issue: Authentication Failed

The connection is failing with "bad auth : authentication failed". Here's how to fix it:

## 📋 Step-by-Step Fix

### 1. **Verify Database User**

1. Go to [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Click "Database Access" in the left sidebar
3. Check if user `saijeevan362` exists
4. If NOT, create it:
   ```
   Username: saijeevan362
   Password: JeevanSai@123
   Role: Read and write to any database
   ```

### 2. **Check Network Access**

1. Go to "Network Access" in MongoDB Atlas
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 3. **Get Fresh Connection String**

1. Go to "Database" in MongoDB Atlas
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with `JeevanSai@123`

### 4. **Test Connection**

Run this command with your fresh connection string:

```bash
node test-mongodb-atlas.js
```

## 🔧 Alternative Solutions

### Option 1: Create New User
If the current user doesn't work, create a new one:
```
Username: capitalrise_user
Password: CapitalRise2024!
Role: Read and write to any database
```

### Option 2: Reset Password
1. Go to "Database Access"
2. Click "Edit" on user `saijeevan362`
3. Click "Edit Password"
4. Set new password: `CapitalRise2024!`

### Option 3: Use Different Authentication
Try MongoDB Atlas App Services or different authentication method.

## 📞 Common Issues

### Issue 1: User Doesn't Exist
**Solution**: Create the database user in MongoDB Atlas

### Issue 2: Wrong Password
**Solution**: Reset password or verify the correct password

### Issue 3: IP Not Whitelisted
**Solution**: Add your IP to Network Access

### Issue 4: Cluster Not Running
**Solution**: Check cluster status in Atlas dashboard

## 🚀 Quick Test

Once you have the correct connection string, test it:

```bash
# Test connection
node test-mongodb-atlas.js

# If successful, initialize database
npm run db:init

# Start application
npm run dev
```

## 📞 Need Help?

If you're still having issues:
1. Check MongoDB Atlas documentation
2. Verify cluster is in the correct region
3. Ensure you're using the correct cluster name
4. Try creating a new cluster if needed

Your data persistence setup is ready - we just need to get the connection working! 🎯 