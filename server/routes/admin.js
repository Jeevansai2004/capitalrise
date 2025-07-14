const express = require('express');
const { adminAuth } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Get all loots
router.get('/loots', adminAuth, async (req, res) => {
  try {
    const loots = await db.all(`
      SELECT 
        l.*,
        COUNT(i.id) as investment_count,
        SUM(i.amount) as total_invested,
        COUNT(r.id) as referral_count,
        SUM(r.amount) as total_referrals
      FROM loots l
      LEFT JOIN investments i ON l.id = i.loot_id
      LEFT JOIN referrals r ON i.id = r.investment_id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);

    res.json({
      success: true,
      data: loots
    });
  } catch (error) {
    console.error('Get loots error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new loot
router.post('/loots', adminAuth, async (req, res) => {
  try {
    const { title, description, max_amount, redirect_url } = req.body;

    if (!title || !max_amount || !redirect_url) {
      return res.status(400).json({
        success: false,
        message: 'Title, max amount, and redirect URL are required'
      });
    }

    const result = await db.run(
      'INSERT INTO loots (title, description, max_amount, redirect_url) VALUES (?, ?, ?, ?)',
      [title, description, max_amount, redirect_url]
    );

    const newLoot = await db.get('SELECT * FROM loots WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Loot created successfully',
      data: newLoot
    });
  } catch (error) {
    console.error('Create loot error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update loot
router.put('/loots/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, max_amount, redirect_url, is_active } = req.body;

    const existingLoot = await db.get('SELECT id FROM loots WHERE id = ?', [id]);
    if (!existingLoot) {
      return res.status(404).json({
        success: false,
        message: 'Loot not found'
      });
    }

    await db.run(
      'UPDATE loots SET title = ?, description = ?, max_amount = ?, redirect_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, max_amount, redirect_url, is_active, id]
    );

    const updatedLoot = await db.get('SELECT * FROM loots WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Loot updated successfully',
      data: updatedLoot
    });
  } catch (error) {
    console.error('Update loot error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete loot
router.delete('/loots/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const loot = await db.get('SELECT * FROM loots WHERE id = ?', [id]);
    if (!loot) {
      return res.status(404).json({ success: false, message: 'Loot not found' });
    }
    await db.run('DELETE FROM loots WHERE id = ?', [id]);
    res.json({ success: true, message: 'Loot deleted successfully' });
  } catch (error) {
    console.error('Delete loot error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all clients
router.get('/clients', adminAuth, async (req, res) => {
  try {
    const clients = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.is_blocked,
        cb.balance,
        cb.total_earned,
        COUNT(DISTINCT i.id) as total_investments,
        COUNT(DISTINCT r.id) as total_referrals
      FROM users u
      LEFT JOIN client_balances cb ON u.id = cb.user_id
      LEFT JOIN investments i ON u.id = i.user_id
      LEFT JOIN referrals r ON i.id = r.investment_id
      WHERE u.role = 'client' AND u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single client details
router.get('/clients/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Get client info
    const client = await db.get(`
      SELECT u.id, u.username, u.email, u.created_at, cb.balance, cb.total_earned
      FROM users u
      LEFT JOIN client_balances cb ON u.id = cb.user_id
      WHERE u.id = ? AND u.role = 'client'
    `, [id]);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Get investments with custom amounts
    const investments = await db.all(`
      SELECT 
        i.*, 
        l.title as loot_title,
        i.customer_amount,
        i.earn_amount,
        i.amount as total_amount
      FROM investments i
      LEFT JOIN loots l ON i.loot_id = l.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `, [id]);
    // Get withdrawals
    const withdrawals = await db.all(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC
    `, [id]);
    res.json({
      success: true,
      data: { client, investments, withdrawals }
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get password reset requests (issues)
router.get('/issues', adminAuth, async (req, res) => {
  try {
    const issues = await db.all(`
      SELECT 
        prr.id,
        prr.email,
        prr.status,
        prr.created_at,
        u.username,
        u.mobile,
        COALESCE(nr.password, u.password) as password
      FROM password_reset_requests prr
      JOIN users u ON prr.user_id = u.id
      LEFT JOIN new_registrations nr ON u.id = nr.user_id
      ORDER BY prr.created_at DESC
    `);

    res.json({
      success: true,
      data: issues
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update issue status
router.put('/issues/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const issue = await db.get('SELECT * FROM password_reset_requests WHERE id = ?', [id]);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    await db.run(
      'UPDATE password_reset_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Issue status updated successfully'
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client credentials (including new registrations)
router.get('/credentials', adminAuth, async (req, res) => {
  try {
    // Get all client users with their original passwords from new_registrations
    const existingUsers = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.mobile,
        COALESCE(nr.password, u.password) as password,
        u.created_at,
        CASE 
          WHEN nr.id IS NOT NULL THEN 'new_registration'
          ELSE 'existing'
        END as type
      FROM users u
      LEFT JOIN new_registrations nr ON u.id = nr.user_id
      WHERE u.role = 'client'
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: existingUsers
    });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get platform analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const totalClients = await db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['client']);
    const totalLoots = await db.get('SELECT COUNT(*) as count FROM loots');
    const totalInvestments = await db.get('SELECT COUNT(*) as count FROM investments');
    const totalReferrals = await db.get('SELECT COUNT(*) as count FROM referrals WHERE status = ?', ['completed']);
    const totalEarned = await db.get('SELECT SUM(total_earned) as total FROM client_balances');
    const pendingWithdrawals = await db.get('SELECT COUNT(*) as count FROM withdrawals WHERE status = ?', ['pending']);

    // Get recent investments with custom amounts
    const recentInvestments = await db.all(`
      SELECT 
        i.*,
        u.username,
        l.title as loot_title,
        i.customer_amount,
        i.earn_amount,
        i.amount as total_amount
      FROM investments i
      JOIN users u ON i.user_id = u.id
      JOIN loots l ON i.loot_id = l.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `);

    // Get recent referrals (only completed)
    const recentReferrals = await db.all(`
      SELECT 
        r.*,
        u.username,
        l.title as loot_title
      FROM referrals r
      JOIN investments i ON r.investment_id = i.id
      JOIN users u ON i.user_id = u.id
      JOIN loots l ON i.loot_id = l.id
      WHERE r.status = 'completed'
      ORDER BY r.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        overview: {
          totalClients: totalClients.count,
          totalLoots: totalLoots.count,
          totalInvestments: totalInvestments.count,
          totalReferrals: totalReferrals.count,
          totalEarned: totalEarned.total || 0,
          pendingWithdrawals: pendingWithdrawals.count
        },
        recentActivities: {
          investments: recentInvestments,
          referrals: recentReferrals
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all withdrawal requests
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const withdrawals = await db.all(`
      SELECT 
        w.*,
        u.username,
        u.email
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle withdrawal requests
router.put('/withdrawals/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, reference_number } = req.body;

    const withdrawal = await db.get('SELECT * FROM withdrawals WHERE id = ?', [id]);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    // Validate reference number for approval
    if (status === 'approved') {
      if (!reference_number || typeof reference_number !== 'string' || reference_number.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Reference number is required for approval'
        });
      }
      
      // Check if reference number contains only numbers
      if (!/^\d+$/.test(reference_number)) {
        return res.status(400).json({
          success: false,
          message: 'Reference number must contain only numbers'
        });
      }
    }

    await db.run(
      'UPDATE withdrawals SET status = ?, notes = ?, reference_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, notes, reference_number || null, id]
    );

    if (status === 'approved') {
      await db.run(
        'UPDATE client_balances SET balance = balance - ? WHERE user_id = ?',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    res.json({
      success: true,
      message: `Withdrawal ${status} successfully`
    });
  } catch (error) {
    console.error('Handle withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Credit client balance
router.post('/credit', adminAuth, async (req, res) => {
  try {
    const { user_id, amount } = req.body;
    if (!user_id || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid user_id and amount required' });
    }
    // Ensure user exists and is a client
    const user = await db.get('SELECT * FROM users WHERE id = ? AND role = "client"', [user_id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Try to update balance
    const result = await db.run('UPDATE client_balances SET balance = balance + ? WHERE user_id = ?', [amount, user_id]);
    if (result.changes === 0) {
      // No row existed, insert new
      await db.run('INSERT INTO client_balances (user_id, balance, total_earned) VALUES (?, ?, 0)', [user_id, amount]);
    }
    const updated = await db.get('SELECT balance FROM client_balances WHERE user_id = ?', [user_id]);
    res.json({ success: true, message: 'Balance credited', data: updated });
  } catch (error) {
    console.error('Credit client balance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Block user
router.post('/block-user/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user exists and is a client
    const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Can only block client accounts'
      });
    }

    // Block the user
    await db.run(
      'UPDATE users SET is_blocked = 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `User ${user.username} has been blocked successfully`,
      data: {
        user_id: id,
        username: user.username,
        email: user.email,
        blocked: true,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Unblock user
router.post('/unblock-user/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is a client
    const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Can only unblock client accounts'
      });
    }

    // Unblock the user
    await db.run(
      'UPDATE users SET is_blocked = 0 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `User ${user.username} has been unblocked successfully`,
      data: {
        user_id: id,
        username: user.username,
        email: user.email,
        blocked: false
      }
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get blocked users
router.get('/blocked-users', adminAuth, async (req, res) => {
  try {
    const blockedUsers = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.mobile,
        u.created_at,
        cb.balance,
        cb.total_earned
      FROM users u
      LEFT JOIN client_balances cb ON u.id = cb.user_id
      WHERE u.role = 'client' AND u.is_blocked = 1 AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: blockedUsers
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get deleted users
router.get('/deleted-users', adminAuth, async (req, res) => {
  try {
    const deletedUsers = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.mobile,
        u.deleted_at,
        u.deleted_balance,
        u.deleted_total_earned
      FROM users u
      WHERE u.role = 'client' AND u.deleted_at IS NOT NULL
      ORDER BY u.deleted_at DESC
    `);

    res.json({
      success: true,
      data: deletedUsers
    });
  } catch (error) {
    console.error('Get deleted users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client customers data
router.get('/client-customers', adminAuth, async (req, res) => {
  try {
    const { client_id, loot_id } = req.query;

    let query = `
      SELECT 
        cc.*,
        u.username as client_name,
        l.title as loot_title
      FROM client_customers cc
      JOIN users u ON cc.client_id = u.id
      JOIN loots l ON cc.loot_id = l.id
    `;

    const params = [];

    if (client_id) {
      query += ' WHERE cc.client_id = ?';
      params.push(client_id);
    }

    if (loot_id) {
      query += client_id ? ' AND cc.loot_id = ?' : ' WHERE cc.loot_id = ?';
      params.push(loot_id);
    }

    // Only show completed customers by default, but allow filtering
    const { status } = req.query;
    if (status) {
      query += (client_id || loot_id) ? ' AND cc.status = ?' : ' WHERE cc.status = ?';
      params.push(status);
    } else {
      // Default to showing only completed customers
      query += (client_id || loot_id) ? ' AND cc.status = ?' : ' WHERE cc.status = ?';
      params.push('completed');
    }

    query += ' ORDER BY cc.created_at DESC';

    const customers = await db.all(query, params);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get client customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all clients with their customer data summary
router.get('/clients-customers-summary', adminAuth, async (req, res) => {
  try {
    const clientsSummary = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.mobile,
        COUNT(DISTINCT CASE WHEN cc.status = 'completed' THEN cc.loot_id END) as total_loots,
        COUNT(CASE WHEN cc.status = 'completed' THEN cc.id END) as total_customers,
        SUM(CASE WHEN cc.status = 'completed' THEN cc.amount ELSE 0 END) as total_amount,
        MAX(CASE WHEN cc.status = 'completed' THEN cc.created_at END) as last_customer_date
      FROM users u
      LEFT JOIN client_customers cc ON u.id = cc.client_id
      WHERE u.role = 'client' AND u.deleted_at IS NULL
      GROUP BY u.id
      ORDER BY total_customers DESC, total_amount DESC
    `);

    res.json({
      success: true,
      data: clientsSummary
    });
  } catch (error) {
    console.error('Get clients customers summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending referrals for admin approval
router.get('/pending-referrals', adminAuth, async (req, res) => {
  try {
    const pendingReferrals = await db.all(`
      SELECT 
        r.id,
        r.investment_id,
        r.customer_upi,
        r.amount,
        r.status,
        r.created_at,
        i.referral_code,
        i.customer_amount,
        i.earn_amount,
        u.username as client_name,
        u.email as client_email,
        l.title as loot_title,
        l.redirect_url
      FROM referrals r
      JOIN investments i ON r.investment_id = i.id
      JOIN users u ON i.user_id = u.id
      JOIN loots l ON i.loot_id = l.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      data: pendingReferrals
    });
  } catch (error) {
    console.error('Get pending referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve referral
router.put('/approve-referral/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get referral details
    const referral = await db.get(`
      SELECT 
        r.*,
        i.user_id as client_id,
        i.amount,
        i.earn_amount,
        l.redirect_url
      FROM referrals r
      JOIN investments i ON r.investment_id = i.id
      JOIN loots l ON i.loot_id = l.id
      WHERE r.id = ?
    `, [id]);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Referral is not pending'
      });
    }

    // Start transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Update referral status to completed
      await db.run(
        'UPDATE referrals SET status = ? WHERE id = ?',
        ['completed', id]
      );

      // Update client_customers status to completed
      await db.run(
        'UPDATE client_customers SET status = ? WHERE investment_id = ? AND customer_upi = ?',
        ['completed', referral.investment_id, referral.customer_upi]
      );

      // Update client balance - only credit the earn_amount (client's portion)
      const earnAmount = referral.earn_amount || referral.amount; // fallback to total amount if earn_amount is null
      await db.run(
        'UPDATE client_balances SET balance = balance + ?, total_earned = total_earned + ? WHERE user_id = ?',
        [earnAmount, earnAmount, referral.client_id]
      );

      // Commit transaction
      await db.run('COMMIT');

      res.json({
        success: true,
        message: 'Referral approved successfully',
        data: {
          referral_id: id,
          redirect_url: referral.redirect_url
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Approve referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject referral
router.put('/reject-referral/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get referral details
    const referral = await db.get(`
      SELECT 
        r.*,
        i.user_id as client_id
      FROM referrals r
      JOIN investments i ON r.investment_id = i.id
      WHERE r.id = ?
    `, [id]);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found'
      });
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Referral is not pending'
      });
    }

    // Update referral status to rejected and save reason
    await db.run(
      'UPDATE referrals SET status = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', reason || 'No reason provided', id]
    );

    // Update client_customers status to rejected
    await db.run(
      'UPDATE client_customers SET status = ? WHERE investment_id = ? AND customer_upi = ?',
      ['rejected', referral.investment_id, referral.customer_upi]
    );

    res.json({
      success: true,
      message: 'Referral rejected successfully',
      data: {
        referral_id: id,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Reject referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (soft delete)
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and is a client
    const user = await db.get('SELECT id, username, email, mobile, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'client') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete client accounts'
      });
    }

    // Start transaction to ensure all deletions are atomic
    await db.run('BEGIN TRANSACTION');

    try {
      // Delete all associated data but keep user record with soft delete
      
      // 1. Delete messages (both sent and received)
      await db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [id, id]);
      
      // 2. Delete password reset requests
      await db.run('DELETE FROM password_reset_requests WHERE user_id = ?', [id]);
      
      // 3. Delete new registrations
      await db.run('DELETE FROM new_registrations WHERE user_id = ?', [id]);
      
      // 4. Delete referrals (through investments)
      await db.run(`
        DELETE FROM referrals 
        WHERE investment_id IN (SELECT id FROM investments WHERE user_id = ?)
      `, [id]);
      
      // 5. Delete investments
      await db.run('DELETE FROM investments WHERE user_id = ?', [id]);
      
      // 6. Delete withdrawals
      await db.run('DELETE FROM withdrawals WHERE user_id = ?', [id]);
      
      // 7. Get the current balance before deleting
      const balanceInfo = await db.get('SELECT balance, total_earned FROM client_balances WHERE user_id = ?', [id]);
      
      // 8. Delete client balance
      await db.run('DELETE FROM client_balances WHERE user_id = ?', [id]);
      
      // 9. Soft delete the user (keep username, email, mobile, balance info, and mark as deleted)
      await db.run(`
        UPDATE users 
        SET deleted_at = CURRENT_TIMESTAMP,
            password = '[DELETED]',
            upi_id = NULL,
            withdrawal_password = NULL,
            has_setup_withdrawal = NULL,
            is_blocked = 0,
            is_verified = NULL,
            verification_code = NULL,
            deleted_balance = ?,
            deleted_total_earned = ?
        WHERE id = ?
      `, [balanceInfo?.balance || 0, balanceInfo?.total_earned || 0, id]);

      // Commit transaction
      await db.run('COMMIT');

      res.json({
        success: true,
        message: `User ${user.username} has been deleted and all data cleared`,
        data: {
          user_id: id,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          deleted: true
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update withdrawal password for user
router.put('/update-withdrawal-password/:user_id', adminAuth, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { new_withdrawal_password } = req.body;

    if (!new_withdrawal_password || new_withdrawal_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New withdrawal password must be at least 4 characters long'
      });
    }

    // Check if user exists
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ? AND role = ?', [user_id, 'client']);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash the new withdrawal password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(new_withdrawal_password, 10);

    // Update user's withdrawal password
    await db.run(
      'UPDATE users SET withdrawal_password = ?, has_setup_withdrawal = 1 WHERE id = ?',
      [hashedPassword, user_id]
    );

    // Update password reset request status
    await db.run(
      'UPDATE password_reset_requests SET status = ? WHERE user_id = ? AND type = ?',
      ['completed', user_id, 'withdrawal_password']
    );

    res.json({
      success: true,
      message: `Withdrawal password updated successfully for user ${user.username}`,
      data: {
        user_id: user_id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update withdrawal password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get withdrawal password requests
router.get('/withdrawal-password-requests', adminAuth, async (req, res) => {
  try {
    const requests = await db.all(`
      SELECT 
        prr.id,
        prr.user_id,
        prr.email,
        prr.status,
        prr.created_at,
        u.username,
        u.mobile,
        COALESCE(nr.password, u.password) as password
      FROM password_reset_requests prr
      JOIN users u ON prr.user_id = u.id
      LEFT JOIN new_registrations nr ON u.id = nr.user_id
      WHERE prr.type = 'withdrawal_password'
      ORDER BY prr.created_at DESC
    `);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get withdrawal password requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 