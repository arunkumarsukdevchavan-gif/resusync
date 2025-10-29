const express=require('express');
const router=express.Router();
const multer=require('multer');
const pdf = require('pdf-parse');
const fs=require('fs');
const path=require('path');
const Resume=require('../models/Resume');
const LocalResumeAI = require('../ai/localModel');
const enhancedAI = require('../ai/index');
const PDFGenerator = require('../services/pdfGenerator');
const dotenv=require('dotenv');
dotenv.config();

// Configure multer for file uploads (resume and photo)
const upload=multer({
  dest:'./uploads/',
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'resume') {
      // Accept PDF, DOC, DOCX, and TXT files for resume
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype) || 
          file.originalname.match(/\.(pdf|doc|docx|txt)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed for resume'), false);
      }
    } else if (file.fieldname === 'photo') {
      // Accept image files for photo
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for photo'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Initialize Local AI Model and PDF Generator
const localAI = new LocalResumeAI();
const pdfGenerator = new PDFGenerator();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Resume API is working!',
    timestamp: new Date().toISOString()
  });
});

// helper to extract text from uploaded file or text field
async function extractText(file){
  if(!file) return '';
  
  try {
    const data = fs.readFileSync(file.path);
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Handle different file types
    switch(fileExtension) {
      case '.pdf':
        try {
          const result = await pdf(data);
          return result.text;
        } catch (e) {
          console.log('PDF parsing failed, trying as text:', e.message);
          return data.toString('utf8');
        }
        
      case '.txt':
        return data.toString('utf8');
        
      case '.doc':
      case '.docx':
        // For now, treat as text - in production you might want to use a proper DOC parser
        try {
          return data.toString('utf8');
        } catch (e) {
          console.log('DOC/DOCX parsing failed:', e.message);
          return '';
        }
        
      default:
        // Fallback to text
        return data.toString('utf8');
    }
  } catch (e) {
    console.log('File extraction error:', e.message);
    return '';
  }
}

// POST /api/resume/analyze - Enhanced with photo upload support
router.post('/analyze', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, jobDescription, resumeText } = req.body;
    
    let originalText = '';
    let photoPath = null;

    // Extract text from uploaded PDF resume if provided
    if (req.files && req.files.resume && req.files.resume[0]) {
      try {
        const buffer = fs.readFileSync(req.files.resume[0].path);
        const data = await pdf(buffer);
        originalText = data.text;
        
        console.log('PDF text extraction successful');
        console.log('Extracted text preview:', originalText.substring(0, 500));
        
        // If PDF text extraction resulted in poor quality, try alternative parsing
        if (!originalText || originalText.trim().length < 50) {
          console.log('PDF text extraction yielded poor results, using fallback...');
          originalText = resumeText || 'PDF parsing failed - please use text input';
        }
      } catch (error) {
        console.log('PDF parsing error:', error.message);
        originalText = resumeText || '';
      }
    } else if (resumeText) {
      originalText = resumeText;
    }

    // Handle photo if uploaded
    if (req.files && req.files.photo && req.files.photo[0]) {
      photoPath = req.files.photo[0].path;
    }

    // Combine all text inputs
    originalText = (originalText || '') + '\n' + (resumeText || '');

    console.log('Processing request for:', name, email);
    console.log('Job description length:', jobDescription.length);
    console.log('Resume text length:', originalText.length);
    console.log('Photo uploaded:', !!photoPath);

    // Validate inputs
    if (!name || !email || !jobDescription || !originalText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, jobDescription, and resume content are required'
      });
    }

    try {
      console.log('🚀 Using Enhanced AI Model with 4-Factor Scoring...');
      
      // Use the new enhanced AI system
      const analysisResult = await enhancedAI.analyzeResume(originalText, jobDescription, { name, email });
      
      // Calculate overall score from the Professional ATS Analysis
      const professionalATS = analysisResult.professional_ats_analysis;
      const overallScore = professionalATS.overallATSScore;
      
      console.log(`🏆 Professional ATS Analysis Complete:`);
      console.log(`   📝 Content: ${professionalATS.content.score}% | 📋 Sections: ${professionalATS.sections.score}%`);
      console.log(`   🎯 ATS Essentials: ${professionalATS.atsEssentials.score}% | 🔧 Tailoring: ${professionalATS.tailoring.score}%`);
      console.log(`   🌟 Overall ATS Score: ${overallScore}%`);
      
      // Enhanced scoring object for database storage
      const enhancedScoring = {
        atsScore: overallScore,
        skillsMatch: professionalATS.tailoring.details.hardSkills.score,
        contentQuality: professionalATS.content.score,
        formatScore: professionalATS.atsEssentials.score,
        overallScore: overallScore,
        // Additional professional insights
        keywordMatchPercentage: professionalATS.tailoring.details.hardSkills.matchRate,
        quantifiableAchievements: professionalATS.content.details.quantification
      };
      
      // Extract personal information from resume
      const personalInfo = await localAI.extractPersonalInformation(originalText);
      
      // Detect job role from job description  
      const jobRole = await localAI.detectJobRole(jobDescription);
      
      // Format intelligent suggestions properly for database storage and frontend display
      let formattedSuggestions = '';
      if (Array.isArray(analysisResult.suggestions)) {
        // New intelligent suggestions format - each suggestion is an object
        formattedSuggestions = analysisResult.suggestions.map(suggestion => {
          if (typeof suggestion === 'object' && suggestion.category) {
            return `${suggestion.priority} PRIORITY - ${suggestion.title}\n` +
                   `Category: ${suggestion.category}\n` +
                   `Issue: ${suggestion.issue}\n` +
                   `Suggestion: ${suggestion.suggestion}\n` +
                   `Impact: ${suggestion.impact}\n` +
                   `Keywords: ${suggestion.keywords ? suggestion.keywords.join(', ') : 'N/A'}`;
          }
          return suggestion.toString();
        }).join('\n\n---\n\n');
      } else if (typeof analysisResult.suggestions === 'string') {
        formattedSuggestions = analysisResult.suggestions;
      } else {
        formattedSuggestions = JSON.stringify(analysisResult.suggestions);
      }
      
      const doc = await Resume.create({
        userId: req.body.userId || null, // Associate with authenticated user if provided
        name: personalInfo.name || name,
        email: personalInfo.email || email,
        originalText,
        jobDescription,
        suggestions: formattedSuggestions,
        generatedResume: analysisResult.generated_resume,
        coverLetter: analysisResult.cover_letter,
        personalInfo: JSON.stringify(personalInfo),
        jobRole,
        photoPath,
        // Save the Professional ATS Analysis
        professionalATSAnalysis: analysisResult.professional_ats_analysis,
        // Save the enhanced 4-factor scoring (legacy support)
        enhancedScoring: enhancedScoring
      });
      
      return res.json({
        success: true,
        data: {
          id: doc._id,
          suggestions: formattedSuggestions,
          generated_resume: analysisResult.generated_resume,
          cover_letter: analysisResult.cover_letter,
          personal_info: personalInfo,
          job_role: jobRole,
          has_photo: !!photoPath,
          // Return Professional ATS Analysis for frontend display
          professional_ats_analysis: analysisResult.professional_ats_analysis,
          enhanced_scoring: enhancedScoring,
          // Return intelligent suggestions in structured format
          intelligent_suggestions: analysisResult.suggestions,
          resume_analysis: analysisResult.resume_analysis,
          // Legacy analysis format for backward compatibility
          analysis: {
            atsScore: enhancedScoring.atsScore,
            keywordMatch: enhancedScoring.skillsMatch,
            contentQuality: enhancedScoring.contentQuality,
            format: enhancedScoring.formatScore,
            impact: enhancedScoring.overallScore
          }
        },
        note: '🏆 Generated using Professional Enterprise-Grade ATS Analysis System!'
      });
      
    } catch (localAIError) {
      console.log('Enhanced Local AI Model error:', localAIError.message);
      console.error('Full error:', localAIError);
      
      // Fallback to basic local AI
      try {
        const [suggestions, generated_resume, cover_letter] = await Promise.all([
          localAI.analyzeSuggestions(originalText, jobDescription),
          localAI.generateOptimizedResume(originalText, jobDescription, { name, email }),
          localAI.generateCoverLetter(originalText, jobDescription, { name, email })
        ]);

        // Format fallback suggestions properly
        let formattedSuggestions = '';
        if (suggestions && typeof suggestions === 'object' && suggestions.suggestions) {
          if (Array.isArray(suggestions.suggestions) && suggestions.suggestions.length > 0) {
            formattedSuggestions = suggestions.suggestions.map(s => 
              `${s.priority || 'MEDIUM'} PRIORITY - ${s.title || 'Suggestion'}\n${s.suggestion || ''}\n\nImpact: ${s.impact || 'Not specified'}\n${s.keywords ? `Keywords to add: ${s.keywords.join(', ')}` : ''}`
            ).join('\n\n---\n\n');
          } else {
            formattedSuggestions = `Job Role: ${suggestions.jobRole || 'General'}\nATS Score: ${suggestions.overallScore || 'Not calculated'}%`;
          }
        } else if (Array.isArray(suggestions)) {
          formattedSuggestions = suggestions.join('\n\n');
        } else if (typeof suggestions === 'string') {
          formattedSuggestions = suggestions;
        } else {
          formattedSuggestions = 'Unable to generate specific suggestions. Please review your resume for ATS optimization.';
        }

        const doc = await Resume.create({
          name,
          email,
          originalText,
          jobDescription,
          suggestions: formattedSuggestions,
          generatedResume: generated_resume,
          coverLetter: cover_letter,
          photoPath
        });
        
        return res.json({
          success: true,
          data: {
            id: doc._id,
            suggestions: formattedSuggestions,
            generated_resume,
            cover_letter,
            has_photo: !!photoPath
          },
          note: 'Generated using Basic Local AI Model - Fallback mode'
        });
        
      } catch (fallbackError) {
        console.log('Fallback AI also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    
  } catch (e) {
    console.error('Server error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/resume/:id to fetch stored result
router.get('/:id',async (req,res)=>{
  try{
    const doc=await Resume.findById(req.params.id);
    if(!doc) return res.status(404).json({ok:false});
    res.json({ok:true,doc});
  }catch(e){res.status(500).json({ok:false,error:e.message})}
});

// GET /api/resume/history - Fetch authenticated user's history
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in with Google to access your history.',
        requiresAuth: true
      });
    }

    // Find resumes associated with the authenticated user
    const docs = await Resume.find({ userId }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      history: docs,
      message: docs.length > 0 ? `Found ${docs.length} previous analyses` : 'No previous analyses found'
    });
    
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});

// POST /api/resume/download-pdf - Generate and download PDF resume
router.post('/download-pdf/:id', async (req, res) => {
  try {
    const { includePhoto, type } = req.body;
    const resumeId = req.params.id;

    // Fetch resume data from database
    const resumeDoc = await Resume.findById(resumeId);
    if (!resumeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Parse personal info if stored as string
    let personalInfo = resumeDoc.personalInfo;
    if (typeof personalInfo === 'string') {
      try {
        personalInfo = JSON.parse(personalInfo);
      } catch (e) {
        personalInfo = {};
      }
    }

    // Prepare data for PDF generation based on type
    const content = type === 'cover' ? resumeDoc.coverLetter : resumeDoc.generatedResume;
    const resumeData = {
      personalInfo: personalInfo || {
        name: resumeDoc.name,
        email: resumeDoc.email,
        phone: '',
        address: '',
        linkedin: '',
        github: ''
      },
      content: content || resumeDoc.originalText,
      jobRole: resumeDoc.jobRole || 'Professional',
      photoPath: includePhoto && resumeDoc.photoPath ? resumeDoc.photoPath : null,
      type: type || 'resume'
    };

    console.log('Generating PDF for:', resumeData.personalInfo.name, '- Type:', type);
    console.log('Include photo:', !!resumeData.photoPath);

    // Generate PDF using the PDF generator service
    const pdfBuffer = await pdfGenerator.generateResume(resumeData, includePhoto);

    // Set response headers for file download
    const documentType = type === 'cover' ? 'CoverLetter' : 'Resume';
    const filename = `${resumeData.personalInfo.name.replace(/\s+/g, '_')}_${documentType}${includePhoto ? '_with_photo' : ''}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF: ' + error.message
    });
  }
});

// GET /api/resume/preview-pdf/:id - Preview PDF resume in browser
router.get('/preview-pdf/:id', async (req, res) => {
  try {
    const { includePhoto } = req.query;
    const resumeId = req.params.id;

    // Fetch resume data from database
    const resumeDoc = await Resume.findById(resumeId);
    if (!resumeDoc) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Parse personal info if stored as string
    let personalInfo = resumeDoc.personalInfo;
    if (typeof personalInfo === 'string') {
      try {
        personalInfo = JSON.parse(personalInfo);
      } catch (e) {
        personalInfo = {};
      }
    }

    // Prepare resume data for PDF generation
    const resumeData = {
      personalInfo: personalInfo || {
        name: resumeDoc.name,
        email: resumeDoc.email,
        phone: '',
        address: '',
        linkedin: '',
        github: ''
      },
      content: resumeDoc.generatedResume || resumeDoc.originalText,
      jobRole: resumeDoc.jobRole || 'Professional',
      photoPath: (includePhoto === 'true') && resumeDoc.photoPath ? resumeDoc.photoPath : null
    };

    // Generate PDF using the PDF generator service
    const pdfBuffer = await pdfGenerator.generateResume(resumeData, includePhoto === 'true');

    // Set response headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer for inline viewing
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error previewing PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview PDF: ' + error.message
    });
  }
});

module.exports=router;
