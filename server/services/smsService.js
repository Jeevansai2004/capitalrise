const twilio = require('twilio');

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

class MessagingService {
  constructor() {
    this.isConfigured = !!(accountSid && authToken);
    this.smsConfigured = !!(accountSid && authToken && fromNumber);
    this.whatsappConfigured = !!(accountSid && authToken && whatsappFrom);
  }

  /**
   * Send OTP via SMS or WhatsApp
   * @param {string} to - Recipient phone number
   * @param {string} otp - 6-digit OTP code
   * @param {string} method - 'sms' or 'whatsapp' (default: 'whatsapp')
   * @returns {Promise<boolean>} - Success status
   */
  async sendOTP(to, otp, method = 'whatsapp') {
    try {
      if (method === 'whatsapp' && this.whatsappConfigured) {
        return await this.sendWhatsAppOTP(to, otp);
      } else if (method === 'sms' && this.smsConfigured) {
        return await this.sendSMSOTP(to, otp);
      } else {
        // Fallback to mock message
        console.log(`${method.toUpperCase()} not configured. Mock ${method} sent to ${to}: Your OTP is ${otp}`);
        return true;
      }
    } catch (error) {
      console.error(`${method.toUpperCase()} sending failed:`, error.message);
      return false;
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} to - Recipient phone number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<boolean>} - Success status
   */
  async sendWhatsAppOTP(to, otp) {
    try {
      // Format phone number for WhatsApp (remove + and add country code if needed)
      let formattedNumber = to;
      if (!formattedNumber.startsWith('whatsapp:')) {
        formattedNumber = formattedNumber.startsWith('+') ? formattedNumber : `+91${formattedNumber}`;
        formattedNumber = `whatsapp:${formattedNumber}`;
      }

      // Send WhatsApp message via Twilio
      const message = await client.messages.create({
        body: `🔐 *Capital Rise Verification*\n\nYour verification code is: *${otp}*\n\n⚠️ *Security Notice:*\n• Do not share this code with anyone\n• It will expire in 10 minutes\n• If you didn't request this, ignore this message\n\nBest regards,\nCapital Rise Team`,
        from: `whatsapp:${whatsappFrom}`,
        to: formattedNumber
      });

      console.log(`WhatsApp OTP sent successfully to ${formattedNumber}. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('WhatsApp OTP sending failed:', error.message);
      return false;
    }
  }

  /**
   * Send OTP via SMS
   * @param {string} to - Recipient phone number
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<boolean>} - Success status
   */
  async sendSMSOTP(to, otp) {
    try {
      // Format phone number for international format
      const formattedNumber = to.startsWith('+') ? to : `+91${to}`;

      // Send SMS via Twilio
      const message = await client.messages.create({
        body: `Your Capital Rise verification code is: ${otp}\n\n⚠️ Do not share this code with anyone. It will expire in 10 minutes.`,
        from: fromNumber,
        to: formattedNumber
      });

      console.log(`SMS OTP sent successfully to ${formattedNumber}. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('SMS OTP sending failed:', error.message);
      
      // Provide specific error messages for common issues
      if (error.message.includes('unverified')) {
        console.error(`❌ TRIAL ACCOUNT LIMITATION: The number ${to} is not verified in your Twilio trial account.`);
        console.error(`💡 SOLUTION: Add ${to} to verified numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified`);
      } else if (error.message.includes('not a valid phone number')) {
        console.error(`❌ INVALID PHONE NUMBER: ${to} is not a valid phone number format.`);
      } else if (error.message.includes('insufficient funds')) {
        console.error(`❌ INSUFFICIENT FUNDS: Your Twilio account needs more credits.`);
      }
      
      return false;
    }
  }

  /**
   * Send welcome message via WhatsApp or SMS
   * @param {string} to - Recipient phone number
   * @param {string} username - User's username
   * @param {string} method - 'sms' or 'whatsapp' (default: 'whatsapp')
   * @returns {Promise<boolean>} - Success status
   */
  async sendWelcomeMessage(to, username, method = 'whatsapp') {
    try {
      if (method === 'whatsapp' && this.whatsappConfigured) {
        return await this.sendWhatsAppWelcome(to, username);
      } else if (method === 'sms' && this.smsConfigured) {
        return await this.sendSMSWelcome(to, username);
      } else {
        console.log(`Welcome ${method.toUpperCase()} not configured. Mock message sent to ${to}: Welcome ${username} to Capital Rise!`);
        return true;
      }
    } catch (error) {
      console.error(`Welcome ${method.toUpperCase()} sending failed:`, error.message);
      return false;
    }
  }

  /**
   * Send welcome message via WhatsApp
   * @param {string} to - Recipient phone number
   * @param {string} username - User's username
   * @returns {Promise<boolean>} - Success status
   */
  async sendWhatsAppWelcome(to, username) {
    try {
      let formattedNumber = to;
      if (!formattedNumber.startsWith('whatsapp:')) {
        formattedNumber = formattedNumber.startsWith('+') ? formattedNumber : `+91${formattedNumber}`;
        formattedNumber = `whatsapp:${formattedNumber}`;
      }

      const message = await client.messages.create({
        body: `🎉 *Welcome to Capital Rise!*\n\nHi *${username}*,\n\nYour account has been successfully created! 🚀\n\n💰 *Start Earning Today:*\n• Complete your profile\n• Explore investment opportunities\n• Invite friends and earn rewards\n\n📱 *Get Started:*\nVisit our platform to begin your journey!\n\nBest regards,\nCapital Rise Team 💼`,
        from: `whatsapp:${whatsappFrom}`,
        to: formattedNumber
      });

      console.log(`WhatsApp welcome message sent successfully to ${formattedNumber}. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('WhatsApp welcome message failed:', error.message);
      return false;
    }
  }

  /**
   * Send welcome message via SMS
   * @param {string} to - Recipient phone number
   * @param {string} username - User's username
   * @returns {Promise<boolean>} - Success status
   */
  async sendSMSWelcome(to, username) {
    try {
      const formattedNumber = to.startsWith('+') ? to : `+91${to}`;

      const message = await client.messages.create({
        body: `🎉 Welcome ${username} to Capital Rise!\n\nYour account has been successfully created. Start earning today! 💰\n\nBest regards,\nCapital Rise Team`,
        from: fromNumber,
        to: formattedNumber
      });

      console.log(`SMS welcome message sent successfully to ${formattedNumber}. SID: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('SMS welcome message failed:', error.message);
      return false;
    }
  }

  /**
   * Check if messaging service is properly configured
   * @returns {object} - Configuration status for different methods
   */
  isServiceConfigured() {
    return {
      configured: this.isConfigured,
      sms: this.smsConfigured,
      whatsapp: this.whatsappConfigured,
      service: 'Twilio',
      message: this.whatsappConfigured 
        ? 'WhatsApp messaging is properly configured' 
        : this.smsConfigured 
        ? 'SMS service is properly configured' 
        : 'Messaging service not configured - using mock messages'
    };
  }

  /**
   * Get available messaging methods
   * @returns {object} - Available methods
   */
  getAvailableMethods() {
    return {
      whatsapp: this.whatsappConfigured,
      sms: this.smsConfigured
    };
  }
}

module.exports = new MessagingService(); 