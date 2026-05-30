const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Portfolio = require('../models/Portfolio');
const authMiddleware = require('../middleware/auth');

// Multer setup for CV PDF uploads
const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'CV-' + Date.now() + '.pdf');
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
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.filename) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    res.json({
      filename: portfolio.cvFile.filename,
      originalName: portfolio.cvFile.originalName,
      uploadedAt: portfolio.cvFile.uploadedAt,
      viewUrl: `/api/cv/view`,
      downloadUrl: `/api/cv/download`
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/cv/view  →  View CV inline in browser (public)
router.get('/view', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.filename) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    const filePath = path.join(__dirname, '../uploads', portfolio.cvFile.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'CV file not found on server.' });
    }
    // inline = view in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${portfolio.cvFile.originalName || 'CV.pdf'}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/cv/download  →  Force download CV (public)
router.get('/download', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.filename) {
      return res.status(404).json({ error: 'No CV uploaded yet.' });
    }
    const filePath = path.join(__dirname, '../uploads', portfolio.cvFile.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'CV file not found on server.' });
    }
    // attachment = force download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${portfolio.cvFile.originalName || 'HarisKhan_CV.pdf'}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/cv/upload  →  Upload new CV (admin only)
router.post('/upload', authMiddleware, uploadCV.single('cv'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    // Delete old CV file if exists
    const portfolio = await Portfolio.findOne();
    if (portfolio && portfolio.cvFile && portfolio.cvFile.filename) {
      const oldPath = path.join(__dirname, '../uploads', portfolio.cvFile.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new CV info
    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      {},
      {
        cvFile: {
          filename: req.file.filename,
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

// DELETE /api/cv  →  Delete CV (admin only)
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne();
    if (!portfolio || !portfolio.cvFile || !portfolio.cvFile.filename) {
      return res.status(404).json({ error: 'No CV to delete.' });
    }

    const filePath = path.join(__dirname, '../uploads', portfolio.cvFile.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    portfolio.cvFile = { filename: '', originalName: '', uploadedAt: null };
    await portfolio.save();

    res.json({ message: 'CV deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
