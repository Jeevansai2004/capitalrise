# Admin Dashboard Setup Guide

## 🔐 Admin Credentials

Your admin user has been created successfully! Here are the credentials:

### **Admin Login Credentials:**
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@capitalrise.com`
- **Role**: `admin`

## 🚀 How to Access Admin Dashboard

### Step 1: Login as Admin
1. Go to the login page: http://localhost:3000/login
2. Use the admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Click "Login"

### Step 2: Access Admin Dashboard
After successful login, you'll be redirected to the admin dashboard at: http://localhost:3000/admin

## 🔧 Admin Dashboard Features

### **User Management**
- View all clients
- Block/unblock users
- Delete users
- View user details and activities

### **Investment Management**
- Create investment opportunities ("loots")
- Set maximum amounts and redirection URLs
- Monitor investment performance

### **Withdrawal Management**
- Approve/reject withdrawal requests
- Manage withdrawal passwords
- View withdrawal history

### **Analytics & Reports**
- Platform performance metrics
- User engagement statistics
- Revenue and investment tracking

### **Support & Chat**
- Respond to client messages
- Handle support requests
- Manage user issues

## 🔒 Security Features

### **Credentials Access**
To view sensitive client credentials:
1. Go to the "Credentials" section in admin dashboard
2. Enter admin password: `admin123`
3. Access client withdrawal passwords and UPI IDs

### **Admin Actions**
- All admin actions are logged
- Sensitive operations require confirmation
- User blocking requires reason specification

## 📊 Database Collections for Admin

The admin dashboard works with these collections:
- `users` - All user accounts
- `investments` - Investment records
- `referrals` - Referral tracking
- `withdrawals` - Withdrawal requests
- `messages` - Chat messages
- `balances` - User balances
- `loots` - Investment opportunities

## 🛠️ Admin Commands

### Create Admin User
```bash
npm run db:create-admin
```

### Initialize Database
```bash
npm run db:init
```

### Backup Data
```bash
npm run db:backup
```

### Restore Data
```bash
npm run db:restore <backup-file>
```

## 🔍 Troubleshooting

### Issue: "Invalid credentials"
**Solution**: Use the correct admin credentials:
- Username: `admin`
- Password: `admin123`

### Issue: Admin user not found
**Solution**: Run the admin creation script:
```bash
npm run db:create-admin
```

### Issue: Cannot access admin dashboard
**Solution**: 
1. Make sure you're logged in as admin
2. Check if the user has `role: 'admin'` in the database
3. Verify the JWT token is valid

## 🚨 Security Recommendations

1. **Change Default Password**: Change `admin123` to a strong password
2. **Use Environment Variables**: Store admin credentials in environment variables
3. **Enable 2FA**: Consider adding two-factor authentication
4. **Regular Backups**: Backup admin data regularly
5. **Monitor Access**: Log all admin actions

## 📞 Support

If you encounter any issues:
1. Check the server logs for errors
2. Verify database connection
3. Ensure all collections are initialized
4. Check network connectivity

Your admin dashboard is now ready to use! 🎉 