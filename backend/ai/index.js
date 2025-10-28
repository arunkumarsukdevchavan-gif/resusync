// Main AI module entry point
const LocalResumeAI = require('./localModel');
const ModelTrainer = require('./modelTrainer');

// Initialize and export the AI system
const aiSystem = {
  localAI: new LocalResumeAI(),
  trainer: new ModelTrainer(),
  
  async initialize() {
    console.log('🚀 Initializing Local AI System...');
    await this.localAI.initialize();
    console.log('✅ Local AI System ready!');
  },
  
  async trainModel() {
    console.log('🎯 Starting model training...');
    const trainedModel = await this.trainer.trainModel();
    console.log('✅ Model training completed!');
    return trainedModel;
  },
  
  async analyzeResume(resumeText, jobDescription) {
    return await this.localAI.analyzeSuggestions(resumeText, jobDescription);
  },
  
  async generateResume(originalResume, jobDescription) {
    return await this.localAI.generateResume(originalResume, jobDescription);
  },
  
  async generateCoverLetter(name, jobDescription, resumeHighlights) {
    return await this.localAI.generateCover(name, jobDescription, resumeHighlights);
  }
};

module.exports = aiSystem;
