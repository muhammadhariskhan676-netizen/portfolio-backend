const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    title: String,
    bio: String,
    email: String,
    phone: String,
    location: String,
    github: String,
    linkedin: String,
    image: String  // Cloudinary URL
  },
  education: [{
    degree: String,
    institution: String,
    year: String,
    description: String,
    score: String
  }],
  skills: {
    technical: [String],
    soft: [String]
  },
  hobbies: [{
    name: String,
    icon: String
  }],
  projects: [{
    title: String,
    description: String,
    tech: [String],
    link: String,
    github: String
  }],
  cvFile: {
    url: { type: String, default: '' },         // Cloudinary URL
    publicId: { type: String, default: '' },    // Cloudinary public_id (for deletion)
    originalName: { type: String, default: '' },
    uploadedAt: { type: Date, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
