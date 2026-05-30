const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Portfolio = require('../models/Portfolio');
const authMiddleware = require('../middleware/auth');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio-profile',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }]
  }
});

const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper: get or create the single portfolio document
async function getPortfolio() {
  let portfolio = await Portfolio.findOne();
  if (!portfolio) portfolio = await Portfolio.create({});
  return portfolio;
}

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    res.json(portfolio);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ─── ADMIN ROUTES (protected) ─────────────────────────────────────────────────

// PUT /api/portfolio/personal-info
router.put('/personal-info', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.personalInfo = { ...portfolio.personalInfo.toObject(), ...req.body };
    await portfolio.save();
    res.json({ message: 'Personal info updated!', data: portfolio.personalInfo });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/portfolio/profile-image (Cloudinary)
router.post('/profile-image', authMiddleware, uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });
    const portfolio = await getPortfolio();
    // Cloudinary returns full URL in req.file.path
    portfolio.personalInfo.image = req.file.path;
    await portfolio.save();
    res.json({ message: 'Profile image updated!', image: req.file.path });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── EDUCATION ─────────────────────────────────────────────────────────────────

router.post('/education', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.education.push(req.body);
    await portfolio.save();
    const added = portfolio.education[portfolio.education.length - 1];
    res.status(201).json({ message: 'Education added!', data: added });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/education/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    const item = portfolio.education.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Education not found.' });
    Object.assign(item, req.body);
    await portfolio.save();
    res.json({ message: 'Education updated!', data: item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/education/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.education.pull({ _id: req.params.id });
    await portfolio.save();
    res.json({ message: 'Education deleted!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── SKILLS ────────────────────────────────────────────────────────────────────

router.put('/skills', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    if (req.body.technical !== undefined) portfolio.skills.technical = req.body.technical;
    if (req.body.soft !== undefined) portfolio.skills.soft = req.body.soft;
    await portfolio.save();
    res.json({ message: 'Skills updated!', data: portfolio.skills });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── HOBBIES ───────────────────────────────────────────────────────────────────

router.post('/hobbies', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.hobbies.push(req.body);
    await portfolio.save();
    const added = portfolio.hobbies[portfolio.hobbies.length - 1];
    res.status(201).json({ message: 'Hobby added!', data: added });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/hobbies/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    const item = portfolio.hobbies.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Hobby not found.' });
    Object.assign(item, req.body);
    await portfolio.save();
    res.json({ message: 'Hobby updated!', data: item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/hobbies/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.hobbies.pull({ _id: req.params.id });
    await portfolio.save();
    res.json({ message: 'Hobby deleted!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PROJECTS ──────────────────────────────────────────────────────────────────

router.post('/projects', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    if (typeof req.body.tech === 'string') {
      req.body.tech = req.body.tech.split(',').map(t => t.trim()).filter(Boolean);
    }
    portfolio.projects.push(req.body);
    await portfolio.save();
    const added = portfolio.projects[portfolio.projects.length - 1];
    res.status(201).json({ message: 'Project added!', data: added });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.put('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    const item = portfolio.projects.id(req.params.id);
    if (!item) return res.status(404).json({ error: 'Project not found.' });
    if (typeof req.body.tech === 'string') {
      req.body.tech = req.body.tech.split(',').map(t => t.trim()).filter(Boolean);
    }
    Object.assign(item, req.body);
    await portfolio.save();
    res.json({ message: 'Project updated!', data: item });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

router.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const portfolio = await getPortfolio();
    portfolio.projects.pull({ _id: req.params.id });
    await portfolio.save();
    res.json({ message: 'Project deleted!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
