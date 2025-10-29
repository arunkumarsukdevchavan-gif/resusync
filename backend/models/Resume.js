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
  
  // Professional ATS Analysis System (Enterprise-Grade)
  professionalATSAnalysis: {
    overallATSScore: { type: Number, default: 0, min: 0, max: 100 },
    content: {
      score: { type: Number, default: 0 },
      parseRate: { type: Number, default: 0 },
      quantification: { type: Number, default: 0 },
      repetition: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 }
    },
    sections: {
      score: { type: Number, default: 0 },
      essentialSections: { type: mongoose.Schema.Types.Mixed, default: {} },
      contactInfo: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    atsEssentials: {
      score: { type: Number, default: 0 },
      format: { type: Number, default: 0 },
      design: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      hyperlinks: { type: Number, default: 0 }
    },
    tailoring: {
      score: { type: Number, default: 0 },
      hardSkills: { type: mongoose.Schema.Types.Mixed, default: {} },
      softSkills: { type: mongoose.Schema.Types.Mixed, default: {} },
      actionVerbs: { type: mongoose.Schema.Types.Mixed, default: {} },
      tailoredTitle: { type: mongoose.Schema.Types.Mixed, default: {} }
    }
  },

  // 4-Factor Enhanced Scoring System (Legacy Support)
  enhancedScoring: {
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    skillsMatch: { type: Number, default: 0, min: 0, max: 100 },
    contentQuality: { type: Number, default: 0, min: 0, max: 100 },
    formatScore: { type: Number, default: 0, min: 0, max: 100 },
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    // Additional ATS insights
    keywordMatchPercentage: { type: Number, default: 0 },
    quantifiableAchievements: { type: Number, default: 0 }
  },
  
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
