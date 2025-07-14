require('dotenv').config();

console.log('Testing environment variables:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER);
console.log('TWILIO_WHATSAPP_NUMBER:', process.env.TWILIO_WHATSAPP_NUMBER);

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('\nConfiguration check:');
console.log('isConfigured:', !!(accountSid && authToken));
console.log('smsConfigured:', !!(accountSid && authToken && fromNumber));
console.log('whatsappConfigured:', !!(accountSid && authToken && whatsappFrom)); 