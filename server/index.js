const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const moment = require('moment-timezone');
require('dotenv').config();

// Set timezone to India (Mumbai)
// moment.tz.setDefault('Asia/Kolkata');

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const chatRoutes = require('./routes/chat');
const referralRoutes = require('./routes/referral');

const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const clients = {};
let adminSocket = null;

io.on('connection', (socket) => {
  socket.on('join-client', (userId) => {
    clients[userId] = socket.id;
  });

  socket.on('join-admin', () => {
    adminSocket = socket.id;
  });

  socket.on('send-message', (msg) => {
    // Add UTC ISO timestamp
    const timestamp = new Date().toISOString();
    const messageWithTime = {
      ...msg,
      timestamp: timestamp,
      timezone: 'UTC'
    };
    // If admin sending to specific client
    if (msg.sender_role === 'admin' && msg.toUserId && clients[msg.toUserId]) {
      io.to(clients[msg.toUserId]).emit('new-message', messageWithTime);
    }
    // If client sending to admin
    else if (msg.sender_role === 'client') {
      if (adminSocket) {
        io.to(adminSocket).emit('new-message', messageWithTime);
      }
    }
  });

  socket.on('typing', data => {
    if (data.sender_role === 'client') {
      // Notify admin
      if (adminSocket) {
        io.to(adminSocket).emit('client-typing', { userId: data.userId });
      }
    } else if (data.sender_role === 'admin') {
      // Notify client
      if (data.toUserId && clients[data.toUserId]) {
        io.to(clients[data.toUserId]).emit('admin-typing');
      }
    }
  });

  socket.on('disconnect', () => {
    // Remove from clients/adminSocket if needed
    Object.keys(clients).forEach((id) => {
      if (clients[id] === socket.id) delete clients[id];
    });
    if (adminSocket === socket.id) adminSocket = null;
  });
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/referral', referralRoutes);

// Static files (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Socket.io connection handling
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Join admin room
//   socket.on('join-admin', () => {
//     socket.join('admin');
//     console.log('Admin joined admin room');
//   });

//   // Join client room
//   socket.on('join-client', (userId) => {
//     socket.join(`client-${userId}`);
//     console.log(`Client ${userId} joined their room`);
//   });

//   // Handle chat messages
//   socket.on('send-message', (data) => {
//     // Broadcast to appropriate room
//     if (data.toAdmin) {
//       socket.to('admin').emit('new-message', data);
//     } else {
//       socket.to(`client-${data.toUserId}`).emit('new-message', data);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// Serve React app for all non-API routes (only in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
db.initialize()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Capital Rise server running on port ${PORT}`);
      console.log(`📊 Database initialized successfully`);
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = { app, io }; 