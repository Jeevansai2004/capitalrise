# SMS Service Setup Guide

This guide will help you set up Twilio SMS service for OTP verification in Capital Rise.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A verified phone number in Twilio
3. Your Twilio Account SID and Auth Token

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com and sign up for a free account
2. Verify your email and phone number
3. Complete the account setup

## Step 2: Get Your Twilio Credentials

1. Log in to your Twilio Console
2. Go to Dashboard → Account Info
3. Copy your **Account SID** and **Auth Token**

## Step 3: Get a Twilio Phone Number

1. In Twilio Console, go to Phone Numbers → Manage → Active numbers
2. Click "Get a trial number" (free for trial accounts)
3. Choose a number and note it down

## Step 4: Configure Environment Variables

Create a `.env` file in your project root (if not exists) and add:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

Replace the values with your actual Twilio credentials.

## Step 5: Test the Setup

1. Start your server: `npm run server`
2. Check SMS service status: `GET /api/auth/sms-status`
3. Try registering a new user to test OTP sending

## Features

### OTP SMS
- Sends 6-digit OTP codes
- Valid for 10 minutes
- Includes security warning

### Welcome SMS
- Sent after successful registration
- Personalized with username
- Encourages user engagement

## Fallback Behavior

- If Twilio is not configured, the system uses mock SMS (console logs)
- In development mode, mock SMS is always available as fallback
- No registration failures due to SMS issues

## Troubleshooting

### Common Issues

1. **"SMS not configured" message**
   - Check your environment variables
   - Ensure all three Twilio variables are set

2. **"SMS sending failed" error**
   - Verify your Twilio credentials
   - Check if your Twilio account has credits
   - Ensure the phone number is verified

3. **"Invalid phone number" error**
   - Twilio requires international format
   - Indian numbers are automatically prefixed with +91

### Testing

- Use the `/api/auth/sms-status` endpoint to check configuration
- Monitor server logs for SMS delivery status
- Check Twilio Console for message logs

## Security Notes

- Never commit your Twilio credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate your Auth Token
- Monitor SMS usage to prevent abuse

## Cost Considerations

- Twilio trial accounts have limited free SMS
- Production accounts charge per SMS sent
- Consider implementing rate limiting for OTP requests
- Monitor usage to control costs

## Alternative SMS Services

If you prefer other SMS services, you can modify `server/services/smsService.js`:

- **AWS SNS**: Good for AWS-based deployments
- **MessageBird**: Popular in Europe
- **Vonage**: Formerly Nexmo, global coverage
- **SendGrid**: Good for transactional SMS

## Support

For Twilio-specific issues:
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com

For Capital Rise SMS integration issues:
- Check server logs for detailed error messages
- Verify environment variable configuration
- Test with the SMS status endpoint 