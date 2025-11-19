const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Lazy PDF generator instantiation
let pdfGenerator = null;
const getPDFGenerator = () => {
  if (!pdfGenerator) {
    const PDFGenerator = require('./services/pdfGenerator');
    pdfGenerator = new PDFGenerator();
  }
  return pdfGenerator;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'PDF Server Ready'
  });
});

// PDF download endpoint
app.post('/api/resume/download-pdf', async (req, res) => {
  try {
    console.log('PDF download request received');
    const { resumeText, name, email } = req.body;

    if (!resumeText || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: resumeText, name, email'
      });
    }

    // Prepare resume data
    const resumeData = {
      name,
      email,
      content: resumeText,
      personalInfo: { name, email }
    };

    console.log('Starting PDF generation for:', name);
    
    // Generate PDF with lazy instantiation
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateResume(resumeData);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned empty buffer');
    }

    // Set headers for PDF download
    const filename = `${name.replace(/\s+/g, '_')}_Resume.pdf`;
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

// Cover letter download endpoint
app.post('/api/resume/download-cover', async (req, res) => {
  try {
    console.log('Cover letter download request received');
    const { coverLetterText, name, email } = req.body;

    if (!coverLetterText || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: coverLetterText, name, email'
      });
    }

    // Prepare cover letter data
    const coverLetterData = {
      name,
      email,
      content: coverLetterText,
      personalInfo: { name, email }
    };

    console.log('Starting cover letter generation for:', name);
    
    // Generate PDF with lazy instantiation
    const generator = getPDFGenerator();
    const pdfBuffer = await generator.generateCoverLetter(coverLetterData);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Cover letter generation returned empty buffer');
    }

    // Set headers for PDF download
    const filename = `${name.replace(/\s+/g, '_')}_Cover_Letter.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
    
    console.log('Cover letter generated and sent successfully, size:', pdfBuffer.length, 'bytes');

  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cover letter: ' + error.message
    });
  }
});

const PORT = 5003; // Use different port to avoid conflicts
const HOST = '127.0.0.1';

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`PDF Server running on http://${HOST}:${PORT}`);
  console.log('Ready to generate PDFs!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});