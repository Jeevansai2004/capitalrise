const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get referral details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Get investment details with loot information
    const investment = await db.get(`
      SELECT 
        i.*,
        l.title as loot_title,
        l.description as loot_description,
        l.redirect_url,
        l.max_amount,
        l.is_active as loot_is_active,
        u.username as client_name
      FROM investments i
      JOIN loots l ON i.loot_id = l.id
      JOIN users u ON i.user_id = u.id
      WHERE i.referral_code = ?
    `, [code]);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Referral link not found or invalid'
      });
    }

    // Check if loot is still active
    if (!investment.loot_is_active) {
      return res.status(400).json({
        success: false,
        message: 'This investment opportunity is no longer available'
      });
    }

    res.json({
      success: true,
      data: {
        loot_title: investment.loot_title,
        loot_description: investment.loot_description,
        max_amount: investment.max_amount,
        client_name: investment.client_name,
        referral_code: code
      }
    });
  } catch (error) {
    console.error('Get referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Submit referral form (UPI ID and redirect)
router.post('/submit', async (req, res) => {
  try {
    const { referral_code, upi_id, customer_name, customer_mobile } = req.body;

    // Validation
    if (!referral_code || !upi_id || !customer_name || !customer_mobile) {
      return res.status(400).json({
        success: false,
        message: 'Referral code, UPI ID, customer name, and mobile number are required'
      });
    }

    if (!customer_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name cannot be empty'
      });
    }

    if (!customer_mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number cannot be empty'
      });
    }

    if (!upi_id.trim()) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID cannot be empty'
      });
    }

    // Get investment details
    const investment = await db.get(`
      SELECT 
        i.*,
        l.title as loot_title,
        l.redirect_url,
        l.max_amount,
        l.is_active as loot_is_active
      FROM investments i
      JOIN loots l ON i.loot_id = l.id
      WHERE i.referral_code = ?
    `, [referral_code]);

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
    }

    // Check if loot is still active
    if (!investment.loot_is_active) {
      return res.status(400).json({
        success: false,
        message: 'This investment opportunity is no longer available'
      });
    }

    // Create referral record with pending status
    const result = await db.run(
      'INSERT INTO referrals (investment_id, customer_upi, amount, status) VALUES (?, ?, ?, ?)',
      [investment.id, upi_id.trim(), investment.amount, 'pending']
    );

    // Save customer data to client_customers table with pending status
    await db.run(
      'INSERT INTO client_customers (client_id, loot_id, investment_id, customer_upi, customer_name, customer_mobile, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [investment.user_id, investment.loot_id, investment.id, upi_id.trim(), customer_name.trim(), customer_mobile.trim(), investment.amount, 'pending']
    );

    const referral = await db.get('SELECT * FROM referrals WHERE id = ?', [result.id]);

    res.json({
      success: true,
      message: 'Referral submitted successfully! Redirecting to investment opportunity.',
      data: {
        referral,
        loot_title: investment.loot_title,
        status: 'pending',
        redirect_url: investment.redirect_url
      }
    });
  } catch (error) {
    console.error('Submit referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get referral statistics (for public display)
router.get('/stats/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Get investment and referral statistics (only completed referrals)
    const stats = await db.get(`
      SELECT 
        i.referral_code,
        l.title as loot_title,
        COUNT(CASE WHEN r.status = 'completed' THEN r.id END) as total_referrals,
        SUM(CASE WHEN r.status = 'completed' THEN r.amount ELSE 0 END) as total_amount,
        i.amount as investment_amount
      FROM investments i
      JOIN loots l ON i.loot_id = l.id
      LEFT JOIN referrals r ON i.id = r.investment_id
      WHERE i.referral_code = ?
      GROUP BY i.id
    `, [code]);

    if (!stats) {
      return res.status(404).json({
        success: false,
        message: 'Referral link not found'
      });
    }

    res.json({
      success: true,
      data: {
        referral_code: stats.referral_code,
        loot_title: stats.loot_title,
        total_referrals: stats.total_referrals || 0,
        total_amount: stats.total_amount || 0,
        investment_amount: stats.investment_amount
      }
    });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const investment = await db.get(`
      SELECT 
        i.referral_code,
        l.title as loot_title,
        l.is_active
      FROM investments i
      JOIN loots l ON i.loot_id = l.id
      WHERE i.referral_code = ?
    `, [code]);

    if (!investment) {
      return res.json({
        success: false,
        valid: false,
        message: 'Invalid referral code'
      });
    }

    if (!investment.loot_is_active) {
      return res.json({
        success: false,
        valid: false,
        message: 'This investment opportunity is no longer available'
      });
    }

    res.json({
      success: true,
      valid: true,
      data: {
        loot_title: investment.loot_title
      }
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 