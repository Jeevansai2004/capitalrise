const express = require('express');
const { auth, adminAuth, clientAuth } = require('../middleware/auth');
const db = require('../config/database');
const moment = require('moment-timezone');

const router = express.Router();

// Get chat messages
router.get('/messages', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let messages;
    
    if (req.user.role === 'admin') {
      // Admin can see all messages
      messages = await db.all(`
        SELECT 
          m.*,
          u.username as sender_name,
          u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);
    } else {
      // Clients can only see their own messages with admin
      messages = await db.all(`
        SELECT 
          m.*,
          u.username as sender_name,
          u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE (m.sender_id = ? AND m.receiver_id IS NULL) OR (m.receiver_id = ? AND m.sender_id IN (SELECT id FROM users WHERE role = 'admin'))
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, userId, limit, offset]);
    }

    // Mark messages as read for the current user
    if (req.user.role === 'client') {
      await db.run(
        'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0',
        [userId]
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
    const result = await db.run(
      'INSERT INTO messages (sender_id, receiver_id, message, is_admin_message, created_at) VALUES (?, ?, ?, ?, ?)',
      [senderId, receiverId, message.trim(), isAdminMessage, timestamp]
    );

    const newMessage = await db.get(`
      SELECT 
        m.*,
        u.username as sender_name,
        u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [result.id]);

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
    const userId = req.user.id;
    let count;

    if (req.user.role === 'admin') {
      // Admin gets count of all unread messages
      const result = await db.get('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
      count = result.count;
    } else {
      // Clients get count of their unread messages from admin
      const result = await db.get(
        'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND sender_id IN (SELECT id FROM users WHERE role = \'admin\') AND is_read = 0',
        [userId]
      );
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
    const userId = req.user.id;
    const { message_ids } = req.body;

    if (message_ids && Array.isArray(message_ids)) {
      // Mark specific messages as read
      const placeholders = message_ids.map(() => '?').join(',');
      await db.run(
        `UPDATE messages SET is_read = 1 WHERE id IN (${placeholders}) AND receiver_id = ?`,
        [...message_ids, userId]
      );
    } else {
      // Mark all messages from admin as read for the user
      await db.run(
        'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id IN (SELECT id FROM users WHERE role = \'admin\') AND is_read = 0',
        [userId]
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
    const participants = await db.all(`
      SELECT DISTINCT
        u.id,
        u.username,
        u.email,
        u.role,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM users u
      LEFT JOIN messages m ON u.id = m.sender_id OR u.id = m.receiver_id
      WHERE u.role = 'client'
      GROUP BY u.id
      ORDER BY last_message_at DESC NULLS LAST
    `);

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
    const { clientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify client exists
    const client = await db.get('SELECT id FROM users WHERE id = ? AND role = ?', [clientId, 'client']);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    const messages = await db.all(`
      SELECT 
        m.*,
        u.username as sender_name,
        u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id IS NULL) OR (m.receiver_id = ? AND m.sender_id IN (SELECT id FROM users WHERE role = 'admin'))
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [clientId, clientId, limit, offset]);

    // Mark messages as read
    await db.run(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id IS NULL AND is_read = 0',
      [clientId]
    );
    await db.run(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id IN (SELECT id FROM users WHERE role = \'admin\') AND is_read = 0',
      [clientId]
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