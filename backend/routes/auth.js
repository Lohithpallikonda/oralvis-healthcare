const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const router = express.Router();

// Initialize database connection
const dbPath = path.join(__dirname, '../database/database.db');
const db = new Database(dbPath);

// POST /login - Authenticate user and return JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Find user in database
    const findUserQuery = db.prepare('SELECT id, email, password, role FROM users WHERE email = ?');
    const user = findUserQuery.get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'oralvis-healthcare',
        audience: 'oralvis-users'
      }
    );

    // Log successful login (for development)
    console.log(`✅ User logged in: ${user.email} (${user.role}) at ${new Date().toISOString()}`);

    // Return success response with token and user info
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
});

// POST /verify-token - Verify if a token is valid (optional endpoint for frontend)
router.post('/verify-token', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    res.status(200).json({
      message: 'Token is valid',
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    } else {
      return res.status(500).json({
        error: 'Token verification failed',
        message: 'Internal server error'
      });
    }
  }
});

// GET /test-users - Development endpoint to see available test users
router.get('/test-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, email, role, createdAt FROM users').all();
    
    res.status(200).json({
      message: 'Available test users',
      users: users,
      credentials: [
        { email: 'technician@oralvis.com', password: 'technician123', role: 'Technician' },
        { email: 'dentist@oralvis.com', password: 'dentist123', role: 'Dentist' }
      ]
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      error: 'Database error',
      message: 'Could not retrieve users'
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

module.exports = router;