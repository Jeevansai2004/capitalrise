const express = require('express');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const { connectToDatabase } = require('../config/database');
const moment = require('moment-timezone');

const router = express.Router();

// Get chat messages
router.get('/messages', auth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let messages = [];
    if (req.user.role === 'admin') {
      // Admin can see all messages
      messages = await db.collection('messages')
        .find({})
        .sort({ created_at: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();
    } else {
      // Clients can only see their own messages with admin
      messages = await db.collection('messages')
        .find({
          $or: [
            { sender_id: userId, receiver_id: null },
            { receiver_id: userId }
          ]
        })
        .sort({ created_at: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .toArray();
    }

    // Mark messages as read for the current user
    if (req.user.role === 'client') {
      await db.collection('messages').updateMany(
        { receiver_id: userId, is_read: false },
        { $set: { is_read: true } }
      );
    }

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send message
router.post('/messages', auth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { message, receiver_id } = req.body;
    const senderId = req.user.id;

    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    let receiverId = receiver_id;
    let isAdminMessage = false;

    if (req.user.role === 'admin') {
      // Admin can send to specific client or broadcast
      isAdminMessage = true;
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID is required for admin messages'
        });
      }
    } else {
      // Clients can only send to admin (receiver_id will be null)
      receiverId = null;
    }

    // Create message with UTC ISO timestamp
    const timestamp = new Date().toISOString();
    const result = await db.collection('messages').insertOne({
      sender_id: senderId,
      receiver_id: receiverId,
      message: message.trim(),
      is_admin_message: isAdminMessage,
      is_read: false,
      created_at: timestamp
    });

    const newMessage = await db.collection('messages').findOne({ _id: result.insertedId });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = req.user.id;
    let count;

    if (req.user.role === 'admin') {
      // Admin gets count of all unread messages
      const result = await db.collection('messages').countDocuments({ is_read: false });
      count = result.count;
    } else {
      // Clients get count of their unread messages from admin
      const result = await db.collection('messages').countDocuments({ receiver_id: userId, is_read: false });
      count = result.count;
    }

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mark messages as read
router.put('/messages/read', auth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = req.user.id;
    const { message_ids } = req.body;

    if (message_ids && Array.isArray(message_ids)) {
      // Mark specific messages as read
      await db.collection('messages').updateMany(
        { _id: { $in: message_ids.map(id => new ObjectId(id)) } },
        { $set: { is_read: true } }
      );
    } else {
      // Mark all messages from admin as read for the user
      await db.collection('messages').updateMany(
        { receiver_id: userId, sender_id: { $in: (await db.collection('users').find({ role: 'admin' }).toArray()).map(admin => admin.id) }, is_read: false },
        { $set: { is_read: true } }
      );
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chat participants (for admin)
router.get('/participants', adminAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const participants = await db.collection('users')
      .aggregate([
        { $match: { role: 'client' } },
        {
          $lookup: {
            from: 'messages',
            localField: 'id',
            foreignField: { $or: [{ sender_id: '$_id' }, { receiver_id: '$_id' }] },
            as: 'messages'
          }
        },
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            role: 1,
            message_count: { $size: '$messages' },
            last_message_at: { $max: '$messages.created_at' }
          }
        },
        { $sort: { last_message_at: -1 } }
      ])
      .toArray();

    res.json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get conversation with specific client (for admin)
router.get('/conversation/:clientId', adminAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { clientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify client exists
    const client = await db.collection('users').findOne({ _id: new ObjectId(clientId), role: 'client' });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const messages = await db.collection('messages')
      .find({
        $or: [
          { sender_id: clientId, receiver_id: null },
          { receiver_id: clientId, sender_id: { $in: (await db.collection('users').find({ role: 'admin' }).toArray()).map(admin => admin.id) } }
        ]
      })
      .sort({ created_at: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    // Mark messages as read
    await db.collection('messages').updateMany(
      { sender_id: clientId, receiver_id: null, is_read: false },
      { $set: { is_read: true } }
    );
    await db.collection('messages').updateMany(
      { receiver_id: clientId, sender_id: { $in: (await db.collection('users').find({ role: 'admin' }).toArray()).map(admin => admin.id) }, is_read: false },
      { $set: { is_read: true } }
    );

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 