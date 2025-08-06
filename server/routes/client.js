const express = require('express');
const bcrypt = require('bcryptjs');
const { clientAuth } = require('../middleware/auth');
const { connectToDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get available loots
router.get('/loots', clientAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const loots = await db.collection('loots').find({ is_active: true }).sort({ created_at: -1 }).toArray();
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
    const db = await connectToDatabase();
    const loot = await db.collection('loots').findOne({ _id: loot_id, is_active: true });
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
    const result = await db.collection('investments').insertOne({
      user_id: userId,
      loot_id: loot_id,
      amount: total_amount,
      customer_amount: customer_amount,
      earn_amount: earn_amount,
      referral_code: referralCode,
      created_at: new Date()
    });

    const investment = await db.collection('investments').findOne({ _id: result.insertedId });

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
    const db = await connectToDatabase();
    const userId = req.user.id;

    const balance = await db.collection('client_balances').findOne({ user_id: userId });

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
    const db = await connectToDatabase();
    const balance = await db.collection('client_balances').findOne({ user_id: userId });

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
    const user = await db.collection('users').findOne({ _id: userId });

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
    const result = await db.collection('withdrawals').insertOne({
      user_id: userId,
      amount: amount,
      upi_id: user.upi_id,
      status: 'pending',
      created_at: new Date()
    });

    const withdrawal = await db.collection('withdrawals').findOne({ _id: result.insertedId });

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
    const db = await connectToDatabase();
    const userId = req.user.id;

    const investments = await db.collection('investments').find({ user_id: userId }).sort({ created_at: -1 }).toArray();

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
    const db = await connectToDatabase();
    const userId = req.user.id;

    const withdrawals = await db.collection('withdrawals').find({ user_id: userId }).sort({ created_at: -1 }).toArray();

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
    const db = await connectToDatabase();
    const userId = req.user.id;

    const referrals = await db.collection('referrals').find({ investment_id: { $in: await db.collection('investments').find({ user_id: userId }).project({ _id: 1 }).toArray() } }).sort({ created_at: -1 }).toArray();

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
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: req.user.id });
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
    const db = await connectToDatabase();
    await db.collection('users').updateOne({ _id: req.user.id }, { $set: { upi_id: upi_id } });
    res.json({ success: true, message: 'UPI ID updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ==================== LEADERBOARD ROUTES ====================

// Get current leaderboard position for client
router.get('/leaderboard/position', clientAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userId = req.user.id;

    // Get active season
    const activeSeason = await db.collection('leaderboard_seasons').findOne({ status: 'active' });

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
    const clientEntry = await db.collection('leaderboard_entries').findOne({ season_id: activeSeason._id, user_id: userId });

    // Get top 10 entries for leaderboard display
    const topEntries = await db.collection('leaderboard_entries').find({ season_id: activeSeason._id }).sort({ total_earned: -1 }).limit(10).toArray();

    // Get total participants
    const totalParticipants = await db.collection('leaderboard_entries').countDocuments({ season_id: activeSeason._id });

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
    const db = await connectToDatabase();
    const userId = req.user.id;

    // Get all ended seasons where client participated
    const seasons = await db.collection('leaderboard_seasons').find({ status: 'ended' }).sort({ end_date: -1 }).toArray();

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
    const db = await connectToDatabase();
    const winners = await db.collection('leaderboard_winners').find({ season_id: { $in: await db.collection('leaderboard_seasons').find({ status: 'ended' }).project({ _id: 1 }).toArray() } }).sort({ announced_at: -1 }).toArray();

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