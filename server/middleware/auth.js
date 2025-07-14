const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.userId]);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied.' 
    });
  }
};

const clientAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'client') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Client privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied.' 
    });
  }
};

module.exports = { auth, adminAuth, clientAuth }; 