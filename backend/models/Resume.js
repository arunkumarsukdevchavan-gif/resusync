const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  // User association (for authenticated users)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  name: { type: String, required: true },
  email: { type: String, required: true },
  originalText: { type: String, required: true },
  jobDescription: { type: String, required: true },
  suggestions: { type: String, required: true },
  generatedResume: { type: String, required: true },
  coverLetter: { type: String, required: true },
  
  // Enhanced fields for improved functionality
  personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} }, // Extracted personal information
  jobRole: { type: String, default: 'Professional' }, // Detected job role
  photoPath: { type: String, default: null }, // Path to uploaded photo
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for faster queries
resumeSchema.index({ email: 1, createdAt: -1 });
resumeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
