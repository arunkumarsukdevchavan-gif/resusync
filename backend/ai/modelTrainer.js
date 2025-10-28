const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const trainingData = require('./trainingData');
const fs = require('fs');
const path = require('path');

class ModelTrainer {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.vocabulary = new Map();
    this.maxSequenceLength = 512;
    this.embeddingDim = 128;
    this.vocabSize = 10000;
  }

  async trainModel() {
    console.log('Starting Local AI Model Training...');
    
    // Step 1: Prepare training data
    const { inputs, outputs } = this.prepareTrainingData();
    
    // Step 2: Create and compile model
    const model = this.createModel();
    
    // Step 3: Train the model
    await this.trainModelWithData(model, inputs, outputs);
    
    // Step 4: Save the trained model
    await this.saveTrainedModel(model);
    
    console.log('Model training completed successfully!');
    return model;
  }

  prepareTrainingData() {
    console.log('Preparing training data...');
    
    const inputs = [];
    const outputs = [];
    
    // Process resume-job pairs
    trainingData.resumeJobPairs.forEach(pair => {
      // Create input sequences
      const resumeTokens = this.tokenizeAndPad(pair.resume);
      const jobTokens = this.tokenizeAndPad(pair.jobDescription);
      
      // Combine resume and job description
      const combinedInput = [...resumeTokens, ...jobTokens].slice(0, this.maxSequenceLength);
      
      // Create output sequences for suggestions
      const suggestionTokens = this.tokenizeAndPad(pair.suggestions.join(' '));
      
      inputs.push(combinedInput);
      outputs.push(suggestionTokens);
    });

    // Add synthetic training data
    this.generateSyntheticData(inputs, outputs);
    
    console.log(`Prepared ${inputs.length} training samples`);
    
    return {
      inputs: tf.tensor2d(inputs),
      outputs: tf.tensor2d(outputs)
    };
  }

  generateSyntheticData(inputs, outputs) {
    // Generate synthetic training examples
    const industries = ['software', 'marketing', 'business'];
    const skills = Object.keys(trainingData.skillMappings);
    
    for (let i = 0; i < 100; i++) {
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const skill = skills[Math.floor(Math.random() * skills.length)];
      
      const syntheticResume = this.generateSyntheticResume(industry, skill);
      const syntheticJob = this.generateSyntheticJob(industry, skill);
      const syntheticSuggestions = this.generateSyntheticSuggestions(industry, skill);
      
      const resumeTokens = this.tokenizeAndPad(syntheticResume);
      const jobTokens = this.tokenizeAndPad(syntheticJob);
      const combinedInput = [...resumeTokens, ...jobTokens].slice(0, this.maxSequenceLength);
      const suggestionTokens = this.tokenizeAndPad(syntheticSuggestions);
      
      inputs.push(combinedInput);
      outputs.push(suggestionTokens);
    }
  }

  generateSyntheticResume(industry, skill) {
    const template = trainingData.industryTemplates[industry];
    if (!template) return `Professional with experience in ${skill}`;
    
    return template.summary.replace('{years}', Math.floor(Math.random() * 8) + 2)
                           .replace('{technologies}', skill)
                           .replace('{specialization}', skill)
                           .replace('{area}', skill);
  }

  generateSyntheticJob(industry, skill) {
    return `We are looking for a ${industry} professional with expertise in ${skill}. 
            The ideal candidate will have experience in ${skill} and related technologies.
            Join our team to work on exciting projects and grow your career.`;
  }

  generateSyntheticSuggestions(industry, skill) {
    return `Add more specific experience with ${skill}. 
            Include quantified achievements in ${industry}.
            Highlight relevant certifications and training.
            Emphasize leadership and collaboration skills.`;
  }

  tokenizeAndPad(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const tokenIds = tokens.map(token => {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size + 1);
      }
      return this.vocabulary.get(token);
    });
    
    // Pad or truncate to maxSequenceLength
    if (tokenIds.length > this.maxSequenceLength) {
      return tokenIds.slice(0, this.maxSequenceLength);
    } else {
      const padding = new Array(this.maxSequenceLength - tokenIds.length).fill(0);
      return [...tokenIds, ...padding];
    }
  }

  createModel() {
    console.log('Creating neural network model...');
    
    const model = tf.sequential({
      layers: [
        // Embedding layer
        tf.layers.embedding({
          inputDim: this.vocabSize,
          outputDim: this.embeddingDim,
          inputLength: this.maxSequenceLength,
          name: 'embedding'
        }),
        
        // LSTM layers for sequence processing
        tf.layers.lstm({
          units: 256,
          returnSequences: true,
          dropout: 0.3,
          recurrentDropout: 0.3,
          name: 'lstm1'
        }),
        
        tf.layers.lstm({
          units: 128,
          dropout: 0.3,
          recurrentDropout: 0.3,
          name: 'lstm2'
        }),
        
        // Dense layers for classification/generation
        tf.layers.dense({
          units: 512,
          activation: 'relu',
          name: 'dense1'
        }),
        
        tf.layers.dropout({ rate: 0.5 }),
        
        tf.layers.dense({
          units: 256,
          activation: 'relu',
          name: 'dense2'
        }),
        
        tf.layers.dropout({ rate: 0.3 }),
        
        // Output layer
        tf.layers.dense({
          units: this.maxSequenceLength,
          activation: 'softmax',
          name: 'output'
        })
      ]
    });

    // Compile the model
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    console.log('Model architecture created');
    model.summary();
    
    return model;
  }

  async trainModelWithData(model, inputs, outputs) {
    console.log('Training the model...');
    
    const batchSize = 32;
    const epochs = 50;
    const validationSplit = 0.2;
    
    const history = await model.fit(inputs, outputs, {
      batchSize,
      epochs,
      validationSplit,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${epochs} - Loss: ${logs.loss.toFixed(4)} - Accuracy: ${logs.acc.toFixed(4)}`);
        }
      }
    });
    
    console.log('Training completed');
    return history;
  }

  async saveTrainedModel(model) {
    const modelDir = path.join(__dirname, 'weights');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    const modelPath = `file://${path.join(modelDir, 'trained_model.json')}`;
    await model.save(modelPath);
    
    // Save vocabulary
    const vocabPath = path.join(modelDir, 'vocabulary.json');
    fs.writeFileSync(vocabPath, JSON.stringify(Object.fromEntries(this.vocabulary)));
    
    console.log('Model and vocabulary saved successfully');
  }

  async loadTrainedModel() {
    try {
      const modelPath = path.join(__dirname, 'weights', 'trained_model.json');
      const vocabPath = path.join(__dirname, 'weights', 'vocabulary.json');
      
      if (fs.existsSync(modelPath) && fs.existsSync(vocabPath)) {
        const model = await tf.loadLayersModel(`file://${modelPath}`);
        const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
        this.vocabulary = new Map(Object.entries(vocabData));
        
        console.log('Trained model loaded successfully');
        return model;
      }
    } catch (error) {
      console.log('No trained model found, will use rule-based approach');
    }
    
    return null;
  }

  // Continuous learning method
  async updateModelWithFeedback(resumeText, jobDescription, userFeedback) {
    console.log('Updating model with user feedback...');
    
    // This would implement online learning to improve the model
    // based on user feedback and interactions
    
    // For now, we'll save the feedback for future training
    const feedbackData = {
      timestamp: new Date().toISOString(),
      resume: resumeText,
      job: jobDescription,
      feedback: userFeedback
    };
    
    const feedbackPath = path.join(__dirname, 'feedback', 'user_feedback.jsonl');
    const feedbackDir = path.dirname(feedbackPath);
    
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }
    
    fs.appendFileSync(feedbackPath, JSON.stringify(feedbackData) + '\n');
    console.log('User feedback saved for future model improvements');
  }
}

module.exports = ModelTrainer;
