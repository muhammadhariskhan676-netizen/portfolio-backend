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

// Cloudinary storage for CV PDF
const cvStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'portfolio-cv',
    resource_type: 'raw',  // required for PDF files
    allowed_formats: ['pdf'],
    public_id: () => 'CV-' + Date.now()
  }
});

const uploadCV = multer({
  storage: cvStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed!'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// GET /api/cv  →  CV file info (public)
router.get('/', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.url) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    res.json({
      originalName: portfolio.cvFile.originalName,
      uploadedAt: portfolio.cvFile.uploadedAt,
      viewUrl: `/api/cv/view`,
      downloadUrl: `/api/cv/download`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/cv/view  →  Redirect to Cloudinary URL (public)
router.get('/view', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.url) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    res.redirect(portfolio.cvFile.url);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/cv/download  →  Force download from Cloudinary (public)
router.get('/download', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.url) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    // Add fl_attachment to force download
    const downloadUrl = portfolio.cvFile.url.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/cv/upload  →  Upload new CV to Cloudinary (admin only)
router.post('/upload', authMiddleware, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    // Delete old CV from Cloudinary if exists
    const portfolio = await Portfolio.findOne();
    if (portfolio && portfolio.cvFile && portfolio.cvFile.publicId) {
      try {
        await cloudinary.uploader.destroy(portfolio.cvFile.publicId, { resource_type: 'raw' });
      } catch (e) {
        console.log('Old CV delete error (ignored):', e.message);
      }
    }

    // Save new CV info to MongoDB
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      {},
      {
        cvFile: {
          url: req.file.path,
          publicId: req.file.filename,
          originalName: req.file.originalname,
          uploadedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'CV uploaded successfully!',
      cvFile: updatedPortfolio.cvFile
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE /api/cv  →  Delete CV from Cloudinary (admin only)
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.url) {
      return res.status(404).json({ error: 'No CV to delete.' });
    }

    // Delete from Cloudinary
    if (portfolio.cvFile.publicId) {
      await cloudinary.uploader.destroy(portfolio.cvFile.publicId, { resource_type: 'raw' });
    }

    portfolio.cvFile = { url: '', publicId: '', originalName: '', uploadedAt: null };
    await portfolio.save();

    res.json({ message: 'CV deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
