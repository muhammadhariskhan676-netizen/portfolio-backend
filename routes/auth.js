const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Login successful!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/change-password  (protected)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const admin = await Admin.findById(req.admin.id);
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/auth/update-credentials  (protected) — change username and/or email
router.put('/update-credentials', authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const admin = await Admin.findById(req.admin.id);

    // Check if new username is taken by another admin
    if (username !== admin.username) {
      const exists = await Admin.findOne({ username });
      if (exists) {
        return res.status(400).json({ error: 'Username already taken.' });
      }
    }

    admin.username = username;
    if (email !== undefined) admin.email = email;
    await admin.save();

    // Issue new token with updated username
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({ message: 'Credentials updated successfully!', token });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/auth/me  (get current admin info)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/auth/verify  (check if token is valid)
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin.username });
});

module.exports = router;