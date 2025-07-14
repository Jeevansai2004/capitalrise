# Capital Rise - Investment Platform

A comprehensive web-based investment platform that supports admin and client dashboards with referral-based marketing, investment tracking, and client management.

## Features

### Admin Dashboard
- Secure authentication and authorization
- Create and manage investment opportunities ("loots")
- Set maximum amounts and redirection URLs for each loot
- View all client activities and earnings
- Respond to client support messages via built-in chat
- Monitor platform performance and user engagement

### Client Dashboard
- User registration and authentication
- Browse available investment opportunities
- Set custom amounts (within admin limits)
- Generate unique referral links for each loot
- Track earnings and balance
- Request withdrawals (up to available balance)
- Chat with admin for support

### Referral System
- Unique referral links tied to client ID and loot
- Beautiful landing pages for customers
- UPI ID collection and redirection
- Automatic balance updates
- Comprehensive tracking system

## Tech Stack

- **Frontend**: React.js with modern UI components
- **Backend**: Node.js with Express.js
- **Database**: SQLite for data persistence
- **Real-time Communication**: Socket.io for chat functionality
- **Authentication**: JWT tokens with bcrypt
- **Security**: Helmet, CORS, rate limiting

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd capital-rise
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
capital-rise/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/         # Page components
│       ├── context/       # React context providers
│       ├── hooks/         # Custom React hooks
│       └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── config/           # Database and app configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── utils/           # Utility functions
├── database/            # Database files and migrations
└── docs/               # Documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Client registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### Admin Routes
- `GET /api/admin/loots` - Get all loots
- `POST /api/admin/loots` - Create new loot
- `PUT /api/admin/loots/:id` - Update loot
- `DELETE /api/admin/loots/:id` - Delete loot
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/analytics` - Get platform analytics

### Client Routes
- `GET /api/client/loots` - Get available loots
- `POST /api/client/invest` - Submit investment
- `GET /api/client/balance` - Get client balance
- `POST /api/client/withdraw` - Request withdrawal
- `GET /api/client/referrals` - Get referral history

### Chat Routes
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Send message

### Referral Routes
- `GET /api/referral/:code` - Get referral details
- `POST /api/referral/submit` - Submit referral form

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts (admin and clients)
- `loots` - Investment opportunities
- `investments` - Client investments
- `referrals` - Referral tracking
- `withdrawals` - Withdrawal requests
- `messages` - Chat messages
- `client_balances` - Client balance tracking

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 