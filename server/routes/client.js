const express = require('express');
const bcrypt = require('bcryptjs');
const { clientAuth } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get available loots
router.get('/loots', clientAuth, async (req, res) => {
  try {
    const loots = await db.all(`
      SELECT 
        l.*,
        COUNT(i.id) as investment_count,
        SUM(i.amount) as total_invested
      FROM loots l
      LEFT JOIN investments i ON l.id = i.loot_id
      WHERE l.is_active = 1
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

// Submit investment
router.post('/invest', clientAuth, async (req, res) => {
  try {
    console.log('Investment request received:', req.body);
    const { loot_id, customer_amount, earn_amount, total_amount } = req.body;
    const userId = req.user.id;

    console.log('Parsed values:', { loot_id, customer_amount, earn_amount, total_amount, userId });

    // Validation
    if (!loot_id || !customer_amount || !earn_amount || !total_amount) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        success: false,
        message: 'Loot ID, customer amount, earn amount, and total amount are required'
      });
    }

    if (customer_amount <= 0 || earn_amount <= 0 || total_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'All amounts must be greater than 0'
      });
    }

    if (earn_amount >= customer_amount) {
      return res.status(400).json({
        success: false,
        message: 'Earn amount should be less than customer amount'
      });
    }

    // Check if loot exists and is active
    const loot = await db.get('SELECT * FROM loots WHERE id = ? AND is_active = 1', [loot_id]);
    if (!loot) {
      return res.status(404).json({
        success: false,
        message: 'Loot not found or inactive'
      });
    }

    // Check if total amount exceeds max amount
    if (total_amount > loot.max_amount) {
      return res.status(400).json({
        success: false,
        message: `Total amount cannot exceed ${loot.max_amount}`
      });
    }

    // Allow multiple investments in the same loot for referral generation
    // Each investment will generate a unique referral code

    // Generate unique referral code
    const referralCode = `${userId}_${loot_id}_${uuidv4().substring(0, 8)}`;

    // Create investment with custom amounts
    const result = await db.run(
      'INSERT INTO investments (user_id, loot_id, amount, customer_amount, earn_amount, referral_code) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, loot_id, total_amount, customer_amount, earn_amount, referralCode]
    );

    const investment = await db.get('SELECT * FROM investments WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Custom offer created successfully',
      data: {
        investment,
        referralCode,
        referralUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/referral/${referralCode}`
      }
    });
  } catch (error) {
    console.error('Create investment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client balance
router.get('/balance', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const balance = await db.get(
      'SELECT balance, total_earned FROM client_balances WHERE user_id = ?',
      [userId]
    );

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Balance not found'
      });
    }

    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Request withdrawal
router.post('/withdraw', clientAuth, async (req, res) => {
  try {
    const { amount, withdrawal_password } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!withdrawal_password) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal password is required'
      });
    }

    // Check client balance
    const balance = await db.get(
      'SELECT balance FROM client_balances WHERE user_id = ?',
      [userId]
    );

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Balance not found'
      });
    }

    if (amount > balance.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Get user's withdrawal password and UPI ID
    const user = await db.get(
      'SELECT withdrawal_password, upi_id FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify withdrawal password
    const isValidPassword = await bcrypt.compare(withdrawal_password, user.withdrawal_password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect withdrawal password'
      });
    }

    if (!user.upi_id) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID not set. Please set your UPI ID in profile first.'
      });
    }

    // Save withdrawal with stored UPI ID
    const result = await db.run('INSERT INTO withdrawals (user_id, amount, upi_id, status) VALUES (?, ?, ?, ?)', [req.user.id, amount, user.upi_id, 'pending']);

    const withdrawal = await db.get('SELECT * FROM withdrawals WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client investments
router.get('/investments', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const investments = await db.all(`
      SELECT 
        i.*,
        l.title as loot_title,
        l.description as loot_description,
        COUNT(CASE WHEN r.status = 'completed' THEN r.id END) as referral_count,
        SUM(CASE WHEN r.status = 'completed' THEN i.earn_amount ELSE 0 END) as referral_amount
      FROM investments i
      JOIN loots l ON i.loot_id = l.id
      LEFT JOIN referrals r ON i.id = r.investment_id
      WHERE i.user_id = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: investments
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client withdrawals
router.get('/withdrawals', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const withdrawals = await db.all(
      'SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

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

// Get referral history
router.get('/referrals', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const referrals = await db.all(`
      SELECT 
        r.*, 
        i.referral_code, 
        i.earn_amount, 
        l.title as loot_title,
        r.rejection_reason
      FROM referrals r
      JOIN investments i ON r.investment_id = i.id
      JOIN loots l ON i.loot_id = l.id
      WHERE i.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: referrals
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get client profile (UPI ID)
router.get('/profile', clientAuth, async (req, res) => {
  try {
    const user = await db.get('SELECT upi_id FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: { upi_id: user?.upi_id || '' } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update client profile (UPI ID)
router.put('/profile', clientAuth, async (req, res) => {
  try {
    const { upi_id } = req.body;
    if (!upi_id || typeof upi_id !== 'string' || upi_id.length < 3) {
      return res.status(400).json({ success: false, message: 'Valid UPI ID required' });
    }
    await db.run('UPDATE users SET upi_id = ? WHERE id = ?', [upi_id, req.user.id]);
    res.json({ success: true, message: 'UPI ID updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== LEADERBOARD ROUTES ====================

// Get current leaderboard position for client
router.get('/leaderboard/position', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get active season
    const activeSeason = await db.get(
      'SELECT * FROM leaderboard_seasons WHERE status = ?',
      ['active']
    );

    if (!activeSeason) {
      return res.json({
        success: true,
        data: {
          hasActiveSeason: false,
          message: 'No active leaderboard season'
        }
      });
    }

    // Get client's entry in current leaderboard
    const clientEntry = await db.get(
      'SELECT * FROM leaderboard_entries WHERE season_id = ? AND user_id = ?',
      [activeSeason.id, userId]
    );

    // Get top 10 entries for leaderboard display
    const topEntries = await db.all(`
      SELECT username, total_earned, rank 
      FROM leaderboard_entries 
      WHERE season_id = ? 
      ORDER BY total_earned DESC 
      LIMIT 10
    `, [activeSeason.id]);

    // Get total participants
    const totalParticipants = await db.get(
      'SELECT COUNT(*) as count FROM leaderboard_entries WHERE season_id = ?',
      [activeSeason.id]
    );

    res.json({
      success: true,
      data: {
        hasActiveSeason: true,
        season: activeSeason,
        clientEntry: clientEntry,
        topEntries: topEntries,
        totalParticipants: totalParticipants.count
      }
    });
  } catch (error) {
    console.error('Get leaderboard position error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get leaderboard history for client
router.get('/leaderboard/history', clientAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all ended seasons where client participated
    const seasons = await db.all(`
      SELECT 
        ls.id,
        ls.name,
        ls.start_date,
        ls.end_date,
        ls.bonus_amount,
        le.total_earned,
        le.rank,
        lw.bonus_amount as won_bonus
      FROM leaderboard_seasons ls
      LEFT JOIN leaderboard_entries le ON ls.id = le.season_id AND le.user_id = ?
      LEFT JOIN leaderboard_winners lw ON ls.id = lw.season_id AND lw.user_id = ?
      WHERE ls.status = 'ended'
      ORDER BY ls.end_date DESC
    `, [userId, userId]);

    res.json({
      success: true,
      data: seasons
    });
  } catch (error) {
    console.error('Get leaderboard history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all winners history
router.get('/leaderboard/winners-history', clientAuth, async (req, res) => {
  try {
    const winners = await db.all(`
      SELECT 
        ls.name as season_name,
        ls.start_date,
        ls.end_date,
        lw.username,
        lw.rank,
        lw.total_earned,
        lw.bonus_amount,
        lw.announced_at
      FROM leaderboard_winners lw
      JOIN leaderboard_seasons ls ON lw.season_id = ls.id
      WHERE ls.status = 'ended'
      ORDER BY ls.end_date DESC, lw.rank ASC
    `);

    res.json({
      success: true,
      data: winners
    });
  } catch (error) {
    console.error('Get winners history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 