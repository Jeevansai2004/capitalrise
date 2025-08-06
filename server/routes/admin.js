const express = require('express');
const { adminAuth } = require('../middleware/auth');
const { connectToDatabase } = require('../config/database');

const router = express.Router();

// Get all loots
router.get('/loots', adminAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    // Aggregate loots with investment and referral counts and sums
    const loots = await db.collection('loots').aggregate([
      {
        $lookup: {
          from: 'investments',
          localField: '_id',
          foreignField: 'loot_id',
          as: 'investments'
        }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'loot_id',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          investment_count: { $size: '$investments' },
          total_invested: { $sum: '$investments.amount' },
          referral_count: { $size: '$referrals' },
          total_referrals: { $sum: '$referrals.amount' }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const { title, description, max_amount, redirect_url } = req.body;

    if (!title || !max_amount || !redirect_url) {
      return res.status(400).json({
        success: false,
        message: 'Title, max amount, and redirect URL are required'
      });
    }

    const result = await db.collection('loots').insertOne({
      title,
      description,
      max_amount,
      redirect_url,
      is_active: true,
      created_at: new Date()
    });

    const newLoot = await db.collection('loots').findOne({ _id: result.insertedId });

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
    const db = await connectToDatabase();
    const { id } = req.params;
    const { title, description, max_amount, redirect_url, is_active } = req.body;

    const existingLoot = await db.collection('loots').findOne({ _id: req.params.id });
    if (!existingLoot) {
      return res.status(404).json({
        success: false,
        message: 'Loot not found'
      });
    }

    await db.collection('loots').updateOne(
      { _id: req.params.id },
      {
        $set: {
          title,
          description,
          max_amount,
          redirect_url,
          is_active,
          updated_at: new Date()
        }
      }
    );

    const updatedLoot = await db.collection('loots').findOne({ _id: req.params.id });

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
    const db = await connectToDatabase();
    const { id } = req.params;
    const loot = await db.collection('loots').findOne({ _id: req.params.id });
    if (!loot) {
      return res.status(404).json({ success: false, message: 'Loot not found' });
    }
    await db.collection('loots').deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Loot deleted successfully' });
  } catch (error) {
    console.error('Delete loot error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all clients
router.get('/clients', adminAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const clients = await db.collection('users').aggregate([
      { $match: { role: 'client', deleted_at: null } },
      {
        $lookup: {
          from: 'client_balances',
          localField: '_id',
          foreignField: 'user_id',
          as: 'client_balance'
        }
      },
      {
        $lookup: {
          from: 'investments',
          localField: '_id',
          foreignField: 'user_id',
          as: 'investments'
        }
      },
      {
        $lookup: {
          from: 'referrals',
          localField: '_id',
          foreignField: 'investment_id',
          as: 'referrals'
        }
      },
      {
        $addFields: {
          balance: { $first: '$client_balance.balance' },
          total_earned: { $first: '$client_balance.total_earned' },
          total_investments: { $size: '$investments' },
          total_referrals: { $size: '$referrals' }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const { id } = req.params;
    // Get client info
    const client = await db.collection('users').findOne({ _id: req.params.id, role: 'client' });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Get investments with custom amounts
    const investments = await db.collection('investments').find({ user_id: req.params.id }).sort({ created_at: -1 }).toArray();
    // Get withdrawals
    const withdrawals = await db.collection('withdrawals').find({ user_id: req.params.id }).sort({ created_at: -1 }).toArray();
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
    const db = await connectToDatabase();
    const issues = await db.collection('password_reset_requests').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'new_registrations',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'new_registration'
        }
      },
      {
        $addFields: {
          username: { $first: '$user.username' },
          mobile: { $first: '$user.mobile' },
          password: { $first: '$new_registration.password' }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const { id } = req.params;
    const { status } = req.body;

    const issue = await db.collection('password_reset_requests').findOne({ _id: req.params.id });
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    await db.collection('password_reset_requests').updateOne(
      { _id: req.params.id },
      { $set: { status } }
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
    const db = await connectToDatabase();
    // Get all client users with their original passwords from new_registrations
    const existingUsers = await db.collection('users').aggregate([
      { $match: { role: 'client' } },
      {
        $lookup: {
          from: 'new_registrations',
          localField: '_id',
          foreignField: 'user_id',
          as: 'new_registration'
        }
      },
      {
        $addFields: {
          password: { $first: '$new_registration.password' },
          type: 'new_registration'
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const totalClients = await db.collection('users').countDocuments({ role: 'client' });
    const totalLoots = await db.collection('loots').countDocuments();
    const totalInvestments = await db.collection('investments').countDocuments();
    const totalReferrals = await db.collection('referrals').countDocuments({ status: 'completed' });
    const totalEarned = await db.collection('client_balances').aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]).next();
    const pendingWithdrawals = await db.collection('withdrawals').countDocuments({ status: 'pending' });

    // Get recent investments with custom amounts
    const recentInvestments = await db.collection('investments').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'loots',
          localField: 'loot_id',
          foreignField: '_id',
          as: 'loot'
        }
      },
      {
        $addFields: {
          username: { $first: '$user.username' },
          loot_title: { $first: '$loot.title' },
          customer_amount: 1, // Placeholder, actual value would be from investment
          earn_amount: 1, // Placeholder, actual value would be from investment
          total_amount: 1 // Placeholder, actual value would be from investment
        }
      },
      { $sort: { created_at: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get recent referrals (only completed)
    const recentReferrals = await db.collection('referrals').aggregate([
      {
        $lookup: {
          from: 'investments',
          localField: 'investment_id',
          foreignField: '_id',
          as: 'investment'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'investment.user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'loots',
          localField: 'investment.loot_id',
          foreignField: '_id',
          as: 'loot'
        }
      },
      {
        $addFields: {
          username: { $first: '$user.username' },
          loot_title: { $first: '$loot.title' }
        }
      },
      { $match: { status: 'completed' } },
      { $sort: { created_at: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({
      success: true,
      data: {
        overview: {
          totalClients: totalClients.count,
          totalLoots: totalLoots.count,
          totalInvestments: totalInvestments.count,
          totalReferrals: totalReferrals.count,
          totalEarned: totalEarned?.total || 0,
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
    const db = await connectToDatabase();
    const withdrawals = await db.collection('withdrawals').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const { id } = req.params;
    const { status, notes, reference_number } = req.body;

    const withdrawal = await db.collection('withdrawals').findOne({ _id: req.params.id });
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

    await db.collection('withdrawals').updateOne(
      { _id: req.params.id },
      {
        $set: {
          status,
          notes,
          reference_number: reference_number || null,
          updated_at: new Date()
        }
      }
    );

    if (status === 'approved') {
      await db.collection('client_balances').updateOne(
        { user_id: withdrawal.user_id },
        { $inc: { balance: -withdrawal.amount } }
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
    const db = await connectToDatabase();
    const { user_id, amount } = req.body;
    if (!user_id || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid user_id and amount required' });
    }
    // Ensure user exists and is a client
    const user = await db.collection('users').findOne({ _id: user_id, role: 'client' });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    // Try to update balance
    const result = await db.collection('client_balances').updateOne({ user_id: user_id }, { $inc: { balance: amount } }, { upsert: true });
    const updated = await db.collection('client_balances').findOne({ user_id: user_id });
    res.json({ success: true, message: 'Balance credited', data: updated });
  } catch (error) {
    console.error('Credit client balance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Block user
router.post('/block-user/:id', adminAuth, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user exists and is a client
    const user = await db.collection('users').findOne({ _id: id });
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
    await db.collection('users').updateOne(
      { _id: id },
      { $set: { is_blocked: true } }
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
    const db = await connectToDatabase();
    const { id } = req.params;

    // Check if user exists and is a client
    const user = await db.collection('users').findOne({ _id: id });
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
    await db.collection('users').updateOne(
      { _id: id },
      { $set: { is_blocked: false } }
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
    const db = await connectToDatabase();
    const blockedUsers = await db.collection('users').aggregate([
      { $match: { role: 'client', is_blocked: true, deleted_at: null } },
      {
        $lookup: {
          from: 'client_balances',
          localField: '_id',
          foreignField: 'user_id',
          as: 'client_balance'
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const deletedUsers = await db.collection('users').find({ role: 'client', deleted_at: { $ne: null } }).sort({ deleted_at: -1 }).toArray();

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
    const db = await connectToDatabase();
    const { client_id, loot_id } = req.query;

    let query = { client_id: client_id || { $exists: true } };

    if (loot_id) {
      query.loot_id = loot_id;
    }

    // Only show completed customers by default, but allow filtering
    const { status } = req.query;
    if (status) {
      query.status = status;
    } else {
      // Default to showing only completed customers
      query.status = 'completed';
    }

    query.sort = { created_at: -1 };

    const customers = await db.collection('client_customers').find(query).toArray();

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
    const db = await connectToDatabase();
    const clientsSummary = await db.collection('users').aggregate([
      { $match: { role: 'client', deleted_at: null } },
      {
        $lookup: {
          from: 'client_customers',
          localField: '_id',
          foreignField: 'client_id',
          as: 'customers'
        }
      },
      {
        $addFields: {
          total_loots: { $size: { $filter: { input: '$customers', as: 'c', cond: { $eq: ['$$c.status', 'completed'] } } } },
          total_customers: { $size: '$customers' },
          total_amount: { $sum: { $filter: { input: '$customers', as: 'c', cond: { $eq: ['$$c.status', 'completed'] } } } },
          last_customer_date: { $max: '$customers.created_at' }
        }
      },
      { $sort: { total_customers: -1, total_amount: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const pendingReferrals = await db.collection('referrals').aggregate([
      {
        $lookup: {
          from: 'investments',
          localField: 'investment_id',
          foreignField: '_id',
          as: 'investment'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'investment.user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'loots',
          localField: 'investment.loot_id',
          foreignField: '_id',
          as: 'loot'
        }
      },
      { $match: { status: 'pending' } },
      { $sort: { created_at: -1 } }
    ]).toArray();

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
    const db = await connectToDatabase();
    const { id } = req.params;

    // Get referral details
    const referral = await db.collection('referrals').findOne({ _id: id });

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
    await db.collection('referrals').updateOne({ _id: id }, { $set: { status: 'completed' } });

    // Update client_customers status to completed
    await db.collection('client_customers').updateMany(
      { investment_id: referral.investment_id, customer_upi: referral.customer_upi },
      { $set: { status: 'completed' } }
    );

    // Update client balance - only credit the earn_amount (client's portion)
    const earnAmount = referral.earn_amount || referral.amount; // fallback to total amount if earn_amount is null
    await db.collection('client_balances').updateOne(
      { user_id: referral.user_id },
      { $inc: { balance: earnAmount, total_earned: earnAmount } }
    );

    res.json({
      success: true,
      message: 'Referral approved successfully',
      data: {
        referral_id: id,
        redirect_url: referral.redirect_url
      }
    });
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
    const db = await connectToDatabase();
    const { id } = req.params;
    const { reason } = req.body;

    // Get referral details
    const referral = await db.collection('referrals').findOne({ _id: id });

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
    await db.collection('referrals').updateOne(
      { _id: id },
      { $set: { status: 'rejected', rejection_reason: reason || 'No reason provided' } }
    );

    // Update client_customers status to rejected
    await db.collection('client_customers').updateMany(
      { investment_id: referral.investment_id, customer_upi: referral.customer_upi },
      { $set: { status: 'rejected' } }
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
    const db = await connectToDatabase();
    const { id } = req.params;

    // Check if user exists and is a client
    const user = await db.collection('users').findOne({ _id: id });
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
    await db.collection('messages').deleteMany({ sender_id: id, receiver_id: id });
    await db.collection('password_reset_requests').deleteMany({ user_id: id });
    await db.collection('new_registrations').deleteMany({ user_id: id });
    await db.collection('referrals').deleteMany({ investment_id: { $in: await db.collection('investments').find({ user_id: id }).project({ _id: 1 }).toArray() } });
    await db.collection('investments').deleteMany({ user_id: id });
    await db.collection('withdrawals').deleteMany({ user_id: id });

    // Get the current balance before deleting
    const balanceInfo = await db.collection('client_balances').findOne({ user_id: id });
    
    // Soft delete the user (keep username, email, mobile, balance info, and mark as deleted)
    await db.collection('users').updateOne(
      { _id: id },
      {
        $set: {
          deleted_at: new Date(),
          password: '[DELETED]',
          upi_id: null,
          withdrawal_password: null,
          has_setup_withdrawal: null,
          is_blocked: false,
          is_verified: null,
          verification_code: null,
          deleted_balance: balanceInfo?.balance || 0,
          deleted_total_earned: balanceInfo?.total_earned || 0
        }
      }
    );

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
    const db = await connectToDatabase();
    const { user_id } = req.params;
    const { new_withdrawal_password } = req.body;

    if (!new_withdrawal_password || new_withdrawal_password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'New withdrawal password must be at least 4 characters long'
      });
    }

    // Check if user exists
    const user = await db.collection('users').findOne({ _id: user_id, role: 'client' });
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
    await db.collection('users').updateOne(
      { _id: user_id },
      { $set: { withdrawal_password: hashedPassword, has_setup_withdrawal: true } }
    );

    // Update password reset request status
    await db.collection('password_reset_requests').updateMany(
      { user_id: user_id, type: 'withdrawal_password' },
      { $set: { status: 'completed' } }
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
    const db = await connectToDatabase();
    const requests = await db.collection('password_reset_requests').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'new_registrations',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'new_registration'
        }
      },
      {
        $addFields: {
          password: { $first: '$new_registration.password' },
          username: { $first: '$user.username' },
          mobile: { $first: '$user.mobile' }
        }
      },
      { $match: { type: 'withdrawal_password' } },
      { $sort: { created_at: -1 } }
    ]).toArray();

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