# Capital Rise - Investment Platform

A web-based investment platform with admin and client dashboards, real-time chat, and referral system.

## Features

- **User Authentication**: Secure login/register system
- **Admin Dashboard**: Manage users, investments, and platform settings
- **Client Dashboard**: View investments, chat with admin, manage profile
- **Real-time Chat**: Socket.io powered chat between clients and admin
- **Referral System**: Track and manage user referrals
- **SMS Integration**: Twilio-powered SMS notifications
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB
- **Authentication**: JWT
- **SMS**: Twilio
- **Deployment**: Render

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Twilio account (for SMS features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Jeevansai2004/capitalrise.git
cd capital-rise
```

2. Install dependencies:
```bash
npm run install-all
```

3. Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key
MONGO_URI=mongodb://localhost:27017
MONGO_DB=capital_rise
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Deployment on Render

### Automatic Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use the following settings:
   - **Build Command**: `npm run install-all`
   - **Start Command**: `npm start`
   - **Environment**: Node

### Environment Variables

Set these environment variables in Render:

- `NODE_ENV`: `production`
- `PORT`: `10000` (or let Render assign)
- `MONGO_URI`: Your MongoDB connection string
- `MONGO_DB`: `capital_rise`
- `JWT_SECRET`: Your JWT secret key
- `CLIENT_URL`: Your Render app URL
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number
- `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp number

### Manual Deployment

1. Push your code to GitHub
2. Render will automatically detect the `render.yaml` configuration
3. The service will be deployed with the specified settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:id/approve` - Approve user
- `POST /api/admin/users/:id/reject` - Reject user

### Client Routes
- `GET /api/client/dashboard` - Client dashboard data
- `POST /api/client/profile` - Update profile
- `GET /api/client/investments` - Get user investments

### Chat Routes
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Send message

### Referral Routes
- `GET /api/referral/stats` - Get referral statistics
- `POST /api/referral/generate` - Generate referral code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@capitalrise.com or create an issue in the GitHub repository. 