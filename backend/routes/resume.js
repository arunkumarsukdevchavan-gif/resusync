const express=require('express');
const router=express.Router();
const multer=require('multer');
const pdf = require('pdf-parse');
const fs=require('fs');
const path=require('path');
const Resume=require('../models/Resume');
const LocalResumeAI = require('../ai/localModel');
const enhancedAI = require('../ai/index');
const dotenv=require('dotenv');
dotenv.config();

// Configure multer for file uploads (resume and photo) with enhanced error handling
const upload = multer({
  dest: './uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2 // Maximum 2 files (resume + photo)
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      timestamp: new Date().toISOString()
    });
    
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
        console.log('✅ Resume file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Resume file rejected:', file.originalname, file.mimetype);
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed for resume'), false);
      }
    } else if (file.fieldname === 'photo') {
      // Accept image files for photo
      if (file.mimetype.startsWith('image/')) {
        console.log('✅ Photo file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('❌ Photo file rejected:', file.originalname, file.mimetype);
        cb(new Error('Only image files are allowed for photo'), false);
      }
    } else {
      console.log('⚠️  Unknown field name:', file.fieldname, '- allowing through');
      cb(null, false); // Reject unknown fields instead of allowing
    }
  }
});

// Initialize Local AI Model
const localAI = new LocalResumeAI();

// Lazy instantiation of PDF generator to prevent server crashes
let pdfGenerator = null;
const getPDFGenerator = () => {
  if (!pdfGenerator) {
    const PDFGenerator = require('../services/pdfGenerator');
    pdfGenerator = new PDFGenerator();
  }
  return pdfGenerator;
};

// Helper functions for extracting contact information
const extractPhone = (text) => {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
};

const extractLinkedIn = (text) => {
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
  const match = text.match(linkedinRegex);
  return match ? `https://${match[0]}` : null;
};

const extractGitHub = (text) => {
  const githubRegex = /github\.com\/[\w-]+/i;
  const match = text.match(githubRegex);
  return match ? `https://${match[0]}` : null;
};

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

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.log('Multer error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 2 files allowed.'
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Only "resume" and "photo" fields are allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    console.log('File filter error:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// Request deduplication cache
const recentRequests = new Map();
const REQUEST_TIMEOUT = 5000; // 5 seconds

// Cleanup old requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentRequests.entries()) {
    if (now - timestamp > REQUEST_TIMEOUT) {
      recentRequests.delete(key);
    }
  }
}, 10000); // Cleanup every 10 seconds

// POST /api/resume/analyze - Enhanced with photo upload support
router.post('/analyze', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), handleMulterError, async (req, res) => {
  try {
    console.log('=== ANALYZE REQUEST RECEIVED ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
    
    // Extract request data
    const { name, email, jobDescription, resumeText } = req.body;
    
    // Create request fingerprint for deduplication
    const requestFingerprint = `${name}_${email}_${jobDescription?.substring(0, 100)}_${req.files?.resume?.[0]?.originalname || 'no-file'}`;
    const requestTime = Date.now();
    
    // Check for duplicate request
    if (recentRequests.has(requestFingerprint)) {
      const lastRequestTime = recentRequests.get(requestFingerprint);
      if (requestTime - lastRequestTime < REQUEST_TIMEOUT) {
        console.log('⚠️  Duplicate request detected, ignoring');
        return res.status(429).json({
          success: false,
          message: 'Duplicate request detected. Please wait before submitting again.'
        });
      }
    }
    
    // Record this request
    recentRequests.set(requestFingerprint, requestTime);
    
    let originalText = '';
    let photoPath = null;

    // Extract text from uploaded PDF resume if provided
    if (req.files && req.files.resume && req.files.resume[0]) {
      console.log('Processing uploaded resume file:', req.files.resume[0].originalname);
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
      console.log('Using provided resume text, length:', resumeText.length);
      originalText = resumeText;
    }

    // Handle photo if uploaded
    if (req.files && req.files.photo && req.files.photo[0]) {
      photoPath = req.files.photo[0].path;
      console.log('Photo uploaded:', req.files.photo[0].originalname);
    }

    // Only add resumeText if no file was uploaded to avoid duplication
    if (!req.files?.resume && resumeText && originalText !== resumeText) {
      originalText = originalText || resumeText;
    }

    console.log('Final processing summary:');
    console.log('- Name:', name);
    console.log('- Email:', email);
    console.log('- Job description length:', jobDescription?.length || 0);
    console.log('- Resume text length:', originalText?.length || 0);
    console.log('- Photo uploaded:', !!photoPath);

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
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateResume(resumeData, includePhoto);

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
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateResume(resumeData, includePhoto === 'true');

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

// POST /api/resume/download-pdf - Generate and download customized resume as PDF
router.post('/download-pdf', async (req, res) => {
  try {
    console.log('PDF download request received:', req.body);
    const { resumeId, resumeText, name, email } = req.body;
    
    let resumeData;
    
    if (resumeId) {
      // Get resume from database
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
      
      resumeData = {
        name: resume.name,
        email: resume.email,
        content: resume.generatedResume, // PDF generator expects 'content' property
        personalInfo: typeof resume.personalInfo === 'string' ? 
          JSON.parse(resume.personalInfo) : resume.personalInfo
      };
    } else if (resumeText && name && email) {
      // Use provided data - enhanced with contact extraction
      console.log('Using provided resume data for PDF generation');
      
      // Extract contact information from text
      const extractedPhone = extractPhone(resumeText);
      const extractedLinkedIn = extractLinkedIn(resumeText);
      const extractedGitHub = extractGitHub(resumeText);
      
      resumeData = {
        name,
        email,
        content: resumeText, // PDF generator expects 'content' property
        personalInfo: { 
          name, 
          email,
          phone: extractedPhone,
          linkedin: extractedLinkedIn,
          github: extractedGitHub
        }
      };
      console.log('PDF data prepared with contact info:', {
        name: resumeData.name,
        email: resumeData.email,
        extractedInfo: {
          phone: extractedPhone,
          linkedin: extractedLinkedIn,
          github: extractedGitHub
        }
      });
    } else {
      console.log('Missing required fields for PDF generation');
      return res.status(400).json({
        success: false,
        message: 'Either resumeId or resumeText with name/email is required'
      });
    }

    console.log('Starting PDF generation for preview:', resumeData.name);
    
    // Generate PDF with lazy instantiation
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateResume(resumeData);
    
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned empty buffer');
    }
    
    // Set headers for PDF download
    const filename = `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log('PDF generated and sent successfully, size:', pdfBuffer.length, 'bytes');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF: ' + error.message
    });
  }
});

// POST /api/resume/preview-pdf - Generate PDF preview as base64
router.post('/preview-pdf', async (req, res) => {
  try {
    const { resumeId, resumeText, name, email } = req.body;
    
    let resumeData;
    
    if (resumeId) {
      // Get resume from database
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
      
      resumeData = {
        name: resume.name,
        email: resume.email,
        content: resume.generatedResume, // PDF generator expects 'content' property
        personalInfo: typeof resume.personalInfo === 'string' ? 
          JSON.parse(resume.personalInfo) : resume.personalInfo
      };
    } else if (resumeText && name && email) {
      // Use provided data
      resumeData = {
        name,
        email,
        content: resumeText, // PDF generator expects 'content' property
        personalInfo: { name, email }
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either resumeId or resumeText with name/email is required'
      });
    }

    console.log('Generating PDF preview for:', resumeData.name);
    
    // Generate PDF
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateResume(resumeData);
    
    // Convert to base64 for preview
    const pdfBase64 = pdfBuffer.toString('base64');
    
    res.json({
      success: true,
      data: {
        pdfPreview: `data:application/pdf;base64,${pdfBase64}`,
        filename: `${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`
      }
    });
    
    console.log('PDF preview generated successfully');
    
  } catch (error) {
    console.error('Error generating PDF preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF preview: ' + error.message
    });
  }
});

// POST /api/resume/preview-cover - Generate cover letter PDF preview
router.post('/preview-cover', async (req, res) => {
  try {
    const { resumeId, resumeText, name, email, jobDescription } = req.body;
    
    let coverLetterData;
    
    if (resumeId) {
      // Fetch from database
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
      
      coverLetterData = {
        name: resume.name,
        email: resume.email,
        content: resume.coverLetter || 'Cover letter not available',
        personalInfo: { name: resume.name, email: resume.email, contact: resume.contact }
      };
    } else if (resumeText && name && email && jobDescription) {
      // Generate cover letter from provided data
      const personalInfo = await localAI.extractPersonalInformation(resumeText);
      personalInfo.name = name;
      personalInfo.email = email;
      
      const coverLetter = await localAI.generateCoverLetter(resumeText, jobDescription, personalInfo);
      
      coverLetterData = {
        name,
        email,
        content: coverLetter,
        personalInfo
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either resumeId or resumeText with name/email/jobDescription is required'
      });
    }

    console.log('Starting cover letter PDF generation for:', coverLetterData.name);
    
    // Generate PDF with lazy instantiation
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateCoverLetter(coverLetterData);
    
    // Convert to base64 for preview
    const pdfBase64 = pdfBuffer.toString('base64');
    
    res.json({
      success: true,
      data: {
        pdfPreview: `data:application/pdf;base64,${pdfBase64}`,
        filename: `${coverLetterData.name.replace(/\s+/g, '_')}_Cover_Letter.pdf`
      }
    });
    
    console.log('Cover letter PDF preview generated successfully');
    
  } catch (error) {
    console.error('Error generating cover letter PDF preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cover letter PDF preview: ' + error.message
    });
  }
});

// POST /api/resume/download-cover - Download cover letter as PDF
router.post('/download-cover', async (req, res) => {
  try {
    const { resumeId, resumeText, name, email, jobDescription } = req.body;
    
    let coverLetterData;
    
    if (resumeId) {
      // Fetch from database
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
      }
      
      coverLetterData = {
        name: resume.name,
        email: resume.email,
        content: resume.coverLetter || 'Cover letter not available',
        personalInfo: { name: resume.name, email: resume.email, contact: resume.contact }
      };
    } else if (resumeText && name && email && jobDescription) {
      // Generate cover letter from provided data
      const personalInfo = await localAI.extractPersonalInformation(resumeText);
      personalInfo.name = name;
      personalInfo.email = email;
      
      const coverLetter = await localAI.generateCoverLetter(resumeText, jobDescription, personalInfo);
      
      coverLetterData = {
        name,
        email,
        content: coverLetter,
        personalInfo
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either resumeId or resumeText with name/email/jobDescription is required'
      });
    }

    console.log('Generating cover letter PDF download for:', coverLetterData.name);
    
    // Generate PDF
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateCoverLetter(coverLetterData);
    
    // Set headers for file download
    const filename = `${coverLetterData.name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF
    res.send(pdfBuffer);
    
    console.log('Cover letter PDF download sent successfully');
    
  } catch (error) {
    console.error('Error downloading cover letter PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download cover letter PDF: ' + error.message
    });
  }
});

module.exports=router;
