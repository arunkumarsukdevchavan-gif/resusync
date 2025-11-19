const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
  constructor() {
    this.browser = null;
    this.initializationPromise = null;
  }

  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (!this.browser) {
      this.initializationPromise = puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      }).then(browser => {
        this.browser = browser;
        console.log('Puppeteer browser initialized successfully');
        return browser;
      }).catch(error => {
        console.error('Failed to initialize Puppeteer browser:', error);
        this.initializationPromise = null;
        throw error;
      });
      
      await this.initializationPromise;
    }
  }

  // Main method called from routes
  async generateResume(resumeData, withPhoto = false) {
    let page = null;
    
    try {
      await this.initialize();
      
      console.log('Creating new page for PDF generation');
      page = await this.browser.newPage();
      
      // Set a timeout for the page
      await page.setDefaultTimeout(10000);
      
      // Generate HTML content
      const htmlContent = this.generateResumeHTML(resumeData, { withPhoto });
      
      console.log('Setting HTML content and waiting for load');
      // Set content and wait for fonts to load with timeout
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 8000
      });
      
      // Wait a bit more for any dynamic content
      await page.waitForTimeout(500);
      
      console.log('Generating PDF buffer');
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true,
        timeout: 10000
      });
      
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      return pdfBuffer;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    } finally {
      if (page) {
        try {
          await page.close();
          console.log('Page closed successfully');
        } catch (closeError) {
          console.error('Error closing page:', closeError);
        }
      }
    }
  }

  generateResumeHTML(resumeData, options = {}) {
    const { withPhoto = false } = options;
    const { personalInfo, content, jobRole, type } = resumeData;
    
    // Handle different document types
    if (type === 'cover') {
      return this.generateCoverLetterHTML(resumeData, options);
    }
    
    // Format the resume content with proper styling for single-page layout
    const formattedContent = this.formatSinglePageResumeContent(content);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo?.name || 'Professional Resume'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.3;
            color: #333;
            background: white;
            font-size: 10px;
            padding: 20px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            min-height: 297mm;
        }
        
        /* Centered Name */
        .name {
            text-align: center;
            font-size: 18px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        
        /* Contact Line */
        .contact-line {
            text-align: center;
            font-size: 9px;
            color: #555;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        
        /* Section Headers */
        .section-header {
            font-size: 12px;
            font-weight: 600;
            color: #2c3e50;
            margin-top: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Section Content */
        .section-content {
            margin-bottom: 10px;
            font-size: 10px;
            line-height: 1.4;
        }
        
        /* Objective specific styling */
        .objective-content {
            text-align: justify;
            margin-bottom: 10px;
            font-size: 10px;
            line-height: 1.4;
        }
        
        /* Education compact format */
        .education-item {
            margin-bottom: 4px;
            font-size: 10px;
        }
        
        /* Skills compact format */
        .skills-item {
            margin-bottom: 3px;
            font-size: 10px;
        }
        
        /* Experience/Internship format */
        .experience-title {
            font-weight: 600;
            font-size: 10px;
            margin-bottom: 2px;
            color: #2c3e50;
        }
        
        .experience-bullet {
            margin-left: 15px;
            margin-bottom: 2px;
            font-size: 9px;
        }
        
        /* Projects format */
        .project-title {
            font-weight: 600;
            font-size: 10px;
            margin-bottom: 2px;
            margin-top: 4px;
            color: #2c3e50;
        }
        
        .project-bullet {
            margin-left: 15px;
            margin-bottom: 2px;
            font-size: 9px;
        }
        
        /* Achievements format */
        .achievement-item {
            margin-bottom: 2px;
            font-size: 9px;
            margin-left: 15px;
        }
        
        /* Compact spacing for single page */
        .section {
            margin-bottom: 8px;
        }
        
        /* Bold text */
        .bold {
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        ${formattedContent}
    </div>
</body>
</html>
    `;
  }

  // Format single-page resume content
  formatSinglePageResumeContent(content) {
    if (!content) return '';
    
    const lines = content.split('\n');
    let formattedHTML = '';
    let currentSection = '';
    let isFirstLine = true;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Check if this is the name (first non-empty line)
      if (isFirstLine) {
        formattedHTML += `<div class="name">${this.escapeHtml(line)}</div>\n`;
        isFirstLine = false;
        continue;
      }
      
      // Check if this is the contact line (contains | or email)
      if (line.includes('|') || line.includes('@')) {
        formattedHTML += `<div class="contact-line">${this.escapeHtml(line)}</div>\n`;
        continue;
      }
      
      // Check if this is a section header (Objective, Education, etc.)
      if (this.isSectionHeader(line)) {
        currentSection = line.toLowerCase();
        formattedHTML += `<div class="section-header">${this.escapeHtml(line)}</div>\n`;
        continue;
      }
      
      // Format content based on section
      if (currentSection === 'objective') {
        formattedHTML += `<div class="objective-content">${this.escapeHtml(line)}</div>\n`;
      } else if (currentSection === 'education') {
        formattedHTML += `<div class="education-item">${this.escapeHtml(line)}</div>\n`;
      } else if (currentSection === 'skills') {
        formattedHTML += `<div class="skills-item">${this.escapeHtml(line)}</div>\n`;
      } else if (currentSection === 'experience' || currentSection === 'internship') {
        if (line.startsWith('**') && line.endsWith('**')) {
          // Experience title
          const title = line.replace(/\*\*/g, '');
          formattedHTML += `<div class="experience-title">${this.escapeHtml(title)}</div>\n`;
        } else if (line.startsWith('•')) {
          // Experience bullet
          const bullet = line.substring(1).trim();
          formattedHTML += `<div class="experience-bullet">• ${this.escapeHtml(bullet)}</div>\n`;
        } else {
          formattedHTML += `<div class="experience-title">${this.escapeHtml(line)}</div>\n`;
        }
      } else if (currentSection === 'projects') {
        if (line.startsWith('**') && line.endsWith('**')) {
          // Project title
          const title = line.replace(/\*\*/g, '');
          formattedHTML += `<div class="project-title">${this.escapeHtml(title)}</div>\n`;
        } else if (line.startsWith('•')) {
          // Project bullet
          const bullet = line.substring(1).trim();
          formattedHTML += `<div class="project-bullet">• ${this.escapeHtml(bullet)}</div>\n`;
        } else {
          formattedHTML += `<div class="project-title">${this.escapeHtml(line)}</div>\n`;
        }
      } else if (currentSection === 'achievements') {
        if (line.startsWith('•')) {
          const achievement = line.substring(1).trim();
          formattedHTML += `<div class="achievement-item">• ${this.escapeHtml(achievement)}</div>\n`;
        } else {
          formattedHTML += `<div class="achievement-item">${this.escapeHtml(line)}</div>\n`;
        }
      } else {
        // Default formatting
        formattedHTML += `<div class="section-content">${this.escapeHtml(line)}</div>\n`;
      }
    }
    
    return formattedHTML;
  }

  // Format resume content with proper section styling
  formatResumeContent(content) {
    if (!content) return '';
    
    const lines = content.split('\n');
    let formattedHTML = '';
    let currentSection = '';
    let sectionContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // Check if line is a section header
      if (this.isSectionHeader(line)) {
        // Save previous section
        if (currentSection && sectionContent) {
          formattedHTML += this.formatSection(currentSection, sectionContent);
        }
        
        currentSection = line;
        sectionContent = '';
      } else {
        sectionContent += line + '\n';
      }
    }
    
    // Add the last section
    if (currentSection && sectionContent) {
      formattedHTML += this.formatSection(currentSection, sectionContent);
    }
    
    return formattedHTML;
  }

  // Check if a line is a section header
  isSectionHeader(line) {
    const headers = ['OBJECTIVE', 'EDUCATION', 'SKILLS', 'INTERNSHIPS', 'PROJECTS', 'ACHIEVEMENTS & CERTIFICATIONS', 'EXPERIENCE', 'CERTIFICATIONS'];
    return headers.some(header => line.toUpperCase().includes(header));
  }

  // Format individual sections
  formatSection(sectionTitle, content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    let sectionHTML = `<div class="section">
      <div class="section-title">${sectionTitle}</div>
      <div class="section-content">`;
    
    if (sectionTitle.toUpperCase().includes('OBJECTIVE')) {
      sectionHTML += `<div class="objective">${lines.join(' ')}</div>`;
    } else if (sectionTitle.toUpperCase().includes('EDUCATION')) {
      sectionHTML += '<ul>';
      lines.forEach(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        sectionHTML += `<li class="education-item">${this.formatEducationLine(cleanLine)}</li>`;
      });
      sectionHTML += '</ul>';
    } else if (sectionTitle.toUpperCase().includes('SKILLS')) {
      sectionHTML += '<ul>';
      lines.forEach(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        sectionHTML += `<li class="skill-item">${this.formatSkillLine(cleanLine)}</li>`;
      });
      sectionHTML += '</ul>';
    } else {
      sectionHTML += '<ul>';
      lines.forEach(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        sectionHTML += `<li>${cleanLine}</li>`;
      });
      sectionHTML += '</ul>';
    }
    
    sectionHTML += '</div></div>';
    return sectionHTML;
  }

  // Format education lines with scores
  formatEducationLine(line) {
    // Extract percentage or CGPA from the line
    const scoreMatch = line.match(/\((\d+(?:\.\d+)?(?:%|CGPA|GPA))\)/);
    if (scoreMatch) {
      const beforeScore = line.substring(0, line.indexOf(scoreMatch[0])).trim();
      return `<span class="education-degree">${beforeScore}</span> <span class="education-score">(${scoreMatch[1]})</span>`;
    }
    return `<span class="education-degree">${line}</span>`;
  }

  // Format skill lines with categories
  formatSkillLine(line) {
    if (line.includes(':')) {
      const [category, skills] = line.split(':');
      return `<span class="skill-category">${category.trim()}:</span> ${skills.trim()}`;
    }
    return line;
  }

  // Generate cover letter HTML
  generateCoverLetterHTML(resumeData, options = {}) {
    const { personalInfo, content } = resumeData;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Cover Letter'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            font-size: 12px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
        }
        
        .header {
            text-align: right;
            margin-bottom: 30px;
        }
        
        .name {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .contact {
            font-size: 11px;
            color: #555;
        }
        
        .content {
            white-space: pre-wrap;
            text-align: justify;
            line-height: 1.8;
        }
        
        .date {
            text-align: right;
            margin-bottom: 30px;
            font-size: 11px;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">${personalInfo.name || 'Your Name'}</div>
            <div class="contact">
                ${personalInfo.email ? personalInfo.email : ''}
                ${personalInfo.email && personalInfo.phone ? ' | ' : ''}
                ${personalInfo.phone ? personalInfo.phone : ''}
            </div>
        </div>
        
        <div class="date">${new Date().toLocaleDateString()}</div>
        
        <div class="content">
            ${content || ''}
        </div>
    </div>
</body>
</html>`;
  }

  // Generate cover letter PDF with improved error handling
  async generateCoverLetter(coverLetterData) {
    let page = null;
    
    try {
      await this.initialize();
      
      console.log('Creating new page for cover letter PDF generation');
      page = await this.browser.newPage();
      
      // Set a timeout for the page
      await page.setDefaultTimeout(10000);
      
      // Generate HTML content for cover letter
      const htmlContent = this.generateCoverLetterHTML(coverLetterData);
      
      console.log('Setting cover letter HTML content and waiting for load');
      // Set content and wait for fonts to load with timeout
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 8000
      });
      
      // Wait a bit more for any dynamic content
      await page.waitForTimeout(500);
      
      console.log('Generating cover letter PDF buffer');
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        printBackground: true,
        timeout: 10000
      });
      
      console.log('Cover letter PDF generated successfully, size:', pdfBuffer.length);
      return pdfBuffer;
      
    } catch (error) {
      console.error('Cover letter PDF generation error:', error);
      throw new Error('Failed to generate cover letter PDF: ' + error.message);
    } finally {
      if (page) {
        try {
          await page.close();
          console.log('Cover letter page closed successfully');
        } catch (closeError) {
          console.error('Error closing cover letter page:', closeError);
        }
      }
    }
  }

  // Generate HTML for cover letter
  generateCoverLetterHTML(data) {
    const { content, name, email } = data;
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${name} - Cover Letter</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 12px;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
                padding: 0;
            }
            
            .cover-letter {
                max-width: 100%;
                margin: 0 auto;
                padding: 0;
            }
            
            .cover-letter-content {
                white-space: pre-line;
                text-align: left;
                line-height: 1.8;
            }
            
            .header-name {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: left;
            }
            
            .greeting {
                margin-bottom: 15px;
                font-weight: 600;
            }
            
            .paragraph {
                margin-bottom: 15px;
                text-align: justify;
            }
            
            .signature {
                margin-top: 30px;
                text-align: left;
            }
            
            .contact-info {
                margin-top: 10px;
                font-size: 11px;
                color: #666;
            }
            
            @media print {
                body {
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }
            }
        </style>
    </head>
    <body>
        <div class="cover-letter">
            <div class="cover-letter-content">${this.escapeHtml(content)}</div>
        </div>
    </body>
    </html>
    `;
  }

  // Escape HTML special characters to prevent XSS
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }

  // Clean up browser resources
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PDFGenerator;