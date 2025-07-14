const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const smsService = require('../services/smsService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP for mobile verification
router.post('/send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    // Check if mobile is already registered
    const existingUser = await db.get(
      'SELECT id FROM users WHERE mobile = ? AND deleted_at IS NULL',
      [mobile]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is already registered'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await db.run(
      'INSERT INTO mobile_otps (mobile, otp, expires_at) VALUES (?, ?, ?)',
      [mobile, otp, expiresAt.toISOString()]
    );

    // Send OTP via SMS (default) or WhatsApp
    const method = req.body.method || 'sms'; // Default to SMS
    const smsSent = await smsService.sendOTP(mobile, otp, method);
    if (!smsSent) {
      // Check if it's a trial account limitation
      const errorMessage = method === 'sms' 
        ? 'Failed to send SMS OTP. This might be due to trial account limitations. Please verify your number in Twilio console or try WhatsApp verification.'
        : 'Failed to send WhatsApp OTP. Please try SMS verification instead.';
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: 'TRIAL_ACCOUNT_LIMITATION'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your mobile number'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and OTP are required'
      });
    }

    // Find the latest OTP for this mobile
    const otpRecord = await db.get(
      'SELECT * FROM mobile_otps WHERE mobile = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1',
      [mobile]
    );

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this mobile number'
      });
    }

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Mark OTP as used
    await db.run(
      'UPDATE mobile_otps SET is_used = 1 WHERE id = ?',
      [otpRecord.id]
    );

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check messaging service status
router.get('/messaging-status', async (req, res) => {
  try {
    const status = smsService.isServiceConfigured();
    const methods = smsService.getAvailableMethods();
    res.json({
      success: true,
      data: {
        ...status,
        availableMethods: methods,
        defaultMethod: 'sms'
      }
    });
  } catch (error) {
    console.error('Messaging status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Client Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, mobile, password } = req.body;

    // Validation
    if (!username || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, mobile, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate mobile number (10 digits only)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be exactly 10 digits'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if email already exists (including deleted accounts)
    const existingEmail = await db.get(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if username already exists (including deleted accounts)
    const existingUsername = await db.get(
      'SELECT id FROM users WHERE username = ? AND deleted_at IS NULL',
      [username]
    );
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedWithdrawalPassword = await bcrypt.hash('default_withdrawal_password', 10); // Default withdrawal password

    // Create user (verified by default)
    const result = await db.run(
      'INSERT INTO users (username, email, mobile, password, withdrawal_password, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, mobile, hashedPassword, hashedWithdrawalPassword, 'client', 1]
    );

    // Create client balance record
    await db.run(
      'INSERT INTO client_balances (user_id) VALUES (?)',
      [result.id]
    );

    // Save registration details for admin panel
    await db.run(
      'INSERT INTO new_registrations (user_id, username, email, mobile, password) VALUES (?, ?, ?, ?, ?)',
      [result.id, username, email, mobile, password]
    );

    // Send welcome message via SMS (default) or WhatsApp (non-blocking)
    const method = req.body.method || 'sms';
    smsService.sendWelcomeMessage(mobile, username, method).catch(err => {
      console.error(`Welcome ${method.toUpperCase()} failed:`, err);
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      data: {
        user: {
          id: result.id,
          username,
          email,
          mobile,
          role: 'client',
          is_verified: 1
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Client Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await db.get(
      'SELECT id, username, email, password, role, has_setup_withdrawal, upi_id, is_blocked FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been temporarily blocked. Please contact support.'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get client balance if it's a client
    let balance = null;
    if (user.role === 'client') {
      const balanceRecord = await db.get(
        'SELECT balance, total_earned FROM client_balances WHERE user_id = ?',
        [user.id]
      );
      balance = balanceRecord;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          has_setup_withdrawal: user.has_setup_withdrawal,
          upi_id: user.upi_id
        },
        token,
        balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin user
    const user = await db.get(
      'SELECT id, username, email, password, role FROM users WHERE username = ? AND role = ?',
      [username, 'admin']
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user exists
    const user = await db.get(
      'SELECT id, username, email, password FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check your email or create a new account.'
      });
    }

    // Create password reset request
    await db.run(
      'INSERT INTO password_reset_requests (user_id, email, status) VALUES (?, ?, ?)',
      [user.id, email, 'pending']
    );

    res.json({
      success: true,
      message: 'Password reset request submitted successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot withdrawal password
router.post('/forgot-withdrawal-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user exists
    const user = await db.get(
      'SELECT id, username, email, mobile FROM users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check your email or create a new account.'
      });
    }

    // Create password reset request for withdrawal password
    await db.run(
      'INSERT INTO password_reset_requests (user_id, email, type, status) VALUES (?, ?, ?, ?)',
      [user.id, email, 'withdrawal_password', 'pending']
    );

    // Send email to admin (you can customize this message)
    const adminEmail = 'admin@capitalrise.com'; // Replace with actual admin email
    const subject = 'Withdrawal Password Reset Request';
    const message = `
      A user has requested to reset their withdrawal password.
      
      User Details:
      - Username: ${user.username}
      - Email: ${user.email}
      - Mobile: ${user.mobile}
      - Request Type: Withdrawal Password Reset
      
      Please provide the new withdrawal password for this user.
    `;

    // Here you would send the email to admin
    // For now, we'll just log it
    console.log('Withdrawal password reset request:', {
      to: adminEmail,
      subject,
      message,
      user: user.username,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Withdrawal password reset request sent to admin. You will receive your new password soon.'
    });
  } catch (error) {
    console.error('Forgot withdrawal password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, username, email, mobile, role, upi_id, has_setup_withdrawal, is_blocked FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get client balance if it's a client
    let balance = null;
    if (user.role === 'client') {
      const balanceRecord = await db.get(
        'SELECT balance, total_earned FROM client_balances WHERE user_id = ?',
        [user.id]
      );
      balance = balanceRecord;
    }

    res.json({
      success: true,
      data: {
        user,
        balance
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Setup withdrawal password and UPI ID
router.post('/setup-withdrawal', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { withdrawal_password, upi_id } = req.body;

    // Validation
    if (!withdrawal_password || !upi_id) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal password and UPI ID are required'
      });
    }

    if (withdrawal_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal password must be at least 4 characters long'
      });
    }

    // Hash withdrawal password
    const hashedWithdrawalPassword = await bcrypt.hash(withdrawal_password, 10);

    // Update user
    await db.run(
      'UPDATE users SET withdrawal_password = ?, upi_id = ?, has_setup_withdrawal = 1 WHERE id = ?',
      [hashedWithdrawalPassword, upi_id, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Withdrawal setup completed successfully'
    });
  } catch (error) {
    console.error('Setup withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get(
      'SELECT id, username, email, mobile, upi_id, has_setup_withdrawal FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change withdrawal password
router.post('/change-withdrawal-password', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { current_withdrawal_password, new_withdrawal_password } = req.body;

    // Validation
    if (!current_withdrawal_password || !new_withdrawal_password) {
      return res.status(400).json({
        success: false,
        message: 'Current and new withdrawal passwords are required'
      });
    }

    if (new_withdrawal_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New withdrawal password must be at least 4 characters long'
      });
    }

    // Get user with withdrawal password
    const user = await db.get(
      'SELECT withdrawal_password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current withdrawal password
    const isValidPassword = await bcrypt.compare(current_withdrawal_password, user.withdrawal_password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current withdrawal password is incorrect'
      });
    }

    // Hash new withdrawal password
    const hashedNewPassword = await bcrypt.hash(new_withdrawal_password, 10);

    // Update withdrawal password
    await db.run(
      'UPDATE users SET withdrawal_password = ? WHERE id = ?',
      [hashedNewPassword, decoded.userId]
    );

    res.json({
      success: true,
      message: 'Withdrawal password changed successfully'
    });
  } catch (error) {
    console.error('Change withdrawal password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change UPI ID
router.post('/change-upi', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { account_password, new_upi_id } = req.body;

    // Validation
    if (!account_password || !new_upi_id) {
      return res.status(400).json({
        success: false,
        message: 'Account password and new UPI ID are required'
      });
    }

    // Get user with account password
    const user = await db.get(
      'SELECT password FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify account password
    const isValidPassword = await bcrypt.compare(account_password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Account password is incorrect'
      });
    }

    // Update UPI ID
    await db.run(
      'UPDATE users SET upi_id = ? WHERE id = ?',
      [new_upi_id, decoded.userId]
    );

    res.json({
      success: true,
      message: 'UPI ID changed successfully'
    });
  } catch (error) {
    console.error('Change UPI ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 