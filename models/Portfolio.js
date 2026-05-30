const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  personalInfo: {
    name:     { type: String, default: '' },
    title:    { type: String, default: '' },
    bio:      { type: String, default: '' },
    email:    { type: String, default: '' },
    phone:    { type: String, default: '' },
    location: { type: String, default: '' },
    github:   { type: String, default: '' },
    linkedin: { type: String, default: '' },
    image:    { type: String, default: '' }
  },
  education: [{
    degree:      { type: String, required: true },
    institution: { type: String, required: true },
    year:        { type: String, required: true },
    description: { type: String, default: '' },
    score:       { type: String, default: '' }
  }],
  skills: {
    technical: [{ type: String }],
    soft:      [{ type: String }]
  },
  hobbies: [{
    name: { type: String, required: true },
    icon: { type: String, default: '⭐' }
  }],
  projects: [{
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    tech:        [{ type: String }],
    link:        { type: String, default: '' },
    github:      { type: String, default: '' }
  }],
  cvFile: {
    filename:     { type: String, default: '' },
    originalName: { type: String, default: '' },
    uploadedAt:   { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
