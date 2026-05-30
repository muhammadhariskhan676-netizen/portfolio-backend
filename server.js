const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (CV, images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio')
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await seedAdminUser();
    await seedInitialData();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ─── Seed Admin User ──────────────────────────────────────────────────────────
async function seedAdminUser() {
  const Admin = require('./models/Admin');
  const bcrypt = require('bcryptjs');
  const existing = await Admin.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await Admin.create({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: hashed
    });
    console.log('✅ Admin user created. Username: admin, Password: admin123');
    console.log('⚠️  Please change the password after first login!');
  }
}

// ─── Seed Initial Portfolio Data ─────────────────────────────────────────────
async function seedInitialData() {
  const Portfolio = require('./models/Portfolio');
  const existing = await Portfolio.findOne();
  if (!existing) {
    await Portfolio.create({
      personalInfo: {
        name: "Muhammad Haris Khan",
        title: "MERN Stack Developer",
        bio: "Passionate developer with expertise in creating beautiful and functional web applications. I love turning ideas into reality through code.",
        email: "muhammadhariskhan676@gmail.com",
        phone: "+92 344 0880541",
        location: "Mianwali (Pakistan)",
        github: "https://github.com/muhammadhariskhan676-netizen",
        linkedin: "https://www.linkedin.com/in/muhammad-haris-khan-0568b7378",
        image: "/uploads/haris.png"
      },
      education: [
        {
          degree: "Bachelor of Software Engineering",
          institution: "University of Mianwali",
          year: "2023 - 2027",
          description: "Graduated with honors, focusing on software engineering and web technologies.",
          score: "Currently in 5th semester with a CGPA of 3.2"
        },
        {
          degree: "Intermediate in Engineering",
          institution: "Govt: Higher Secondary School Daud Khel",
          year: "2021 - 2023",
          description: "Specialized in Physics, Chemistry, and Mathematics.",
          score: "Score: 753 / 1100"
        },
        {
          degree: "Matriculation in Science",
          institution: "Islamia Public High School Daud Khel",
          year: "2019 - 2021",
          description: "Specialized in Physics, Chemistry, Biology, and Mathematics.",
          score: "Score: 926 / 1100"
        }
      ],
      skills: {
        technical: ["React.js", "JavaScript", "HTML5", "CSS3", "Node.js", "Python", "Git", "MongoDB"],
        soft: ["Problem Solving", "Team Collaboration", "Communication", "Time Management"]
      },
      hobbies: [
        { name: "Coding", icon: "💻" },
        { name: "Reading", icon: "📚" },
        { name: "Photography", icon: "📷" },
        { name: "Traveling", icon: "✈️" }
      ],
      projects: [
        {
          title: "Currency Converter",
          description: "A real-time currency conversion tool featuring live exchange rates, historical data charts, and multi-currency support.",
          tech: ["JavaScript", "HTML", "CSS"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project1"
        },
        {
          title: "Weather App",
          description: "Get accurate, real-time weather updates and forecasts anytime, anywhere.",
          tech: ["JavaScript", "HTML", "CSS"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project2"
        },
        {
          title: "Recipe App",
          description: "Discover, create, and share delicious recipes anytime, anywhere.",
          tech: ["JavaScript", "HTML", "CSS"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project3"
        },
        {
          title: "Dictionary App",
          description: "Instantly find meanings, synonyms, and pronunciations of any word.",
          tech: ["JavaScript", "HTML", "CSS"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project4"
        },
        {
          title: "Movie Guide App",
          description: "Explore movies with full details — duration, cast, images, and more at your fingertips.",
          tech: ["JavaScript", "HTML", "CSS"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project5"
        },
        {
          title: "Portfolio Website",
          description: "Modern, responsive portfolio website with smooth animations.",
          tech: ["React", "CSS3", "JavaScript"],
          link: "https://example.com",
          github: "https://github.com/yourusername/project6"
        }
      ]
    });
    console.log('✅ Initial portfolio data seeded');
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/cv',        require('./routes/cv'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Portfolio API is running 🚀' });
});
app.get('/', (req, res) => {
  res.send('Backend Running Successfully');
});

app.get('/test', (req, res) => {
  res.json({ success: true });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Docs: http://localhost:${PORT}/api/health`);
});
