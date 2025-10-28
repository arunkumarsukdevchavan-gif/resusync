const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  // Main method called from routes
  async generateResume(resumeData, withPhoto = false) {
    await this.initialize();
    
    try {
      const page = await this.browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateResumeHTML(resumeData, { withPhoto });
      
      // Set content and wait for fonts to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        printBackground: true
      });
      
      await page.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  generateResumeHTML(resumeData, options = {}) {
    const { withPhoto = false } = options;
    const { personalInfo, content, jobRole, type } = resumeData;
    
    // Handle different document types
    if (type === 'cover') {
      return this.generateCoverLetterHTML(resumeData, options);
    }
    
    // Process photo if available
    let photoHTML = '';
    if (withPhoto && resumeData.photoPath) {
      try {
        const photoBuffer = fs.readFileSync(resumeData.photoPath);
        const photoBase64 = photoBuffer.toString('base64');
        const photoExtension = path.extname(resumeData.photoPath).toLowerCase();
        let mimeType = 'image/jpeg';
        
        if (photoExtension === '.png') mimeType = 'image/png';
        else if (photoExtension === '.jpg' || photoExtension === '.jpeg') mimeType = 'image/jpeg';
        
        photoHTML = `
          <div class="photo-container">
            <img src="data:${mimeType};base64,${photoBase64}" alt="Profile Photo" class="profile-photo">
          </div>
        `;
      } catch (error) {
        console.log('Error processing photo:', error.message);
        photoHTML = '';
      }
    }

    // Format the resume content with proper styling
    const formattedContent = this.formatResumeContent(content);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${personalInfo.name || 'Professional Resume'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.4;
            color: #333;
            background: white;
            font-size: 11px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 15px;
        }
        
        .name {
            font-size: 24px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
        
        .contact-info {
            font-size: 11px;
            color: #555;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            text-transform: uppercase;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 3px;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }
        
        .section-content {
            font-size: 11px;
            line-height: 1.5;
        }
        
        .education-item {
            margin-bottom: 8px;
            padding-left: 0px;
        }
        
        .education-degree {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .education-score {
            font-weight: 600;
            color: #27ae60;
        }
        
        .skill-category {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .photo-container {
            float: right;
            margin-left: 20px;
            margin-bottom: 15px;
        }
        
        .profile-photo {
            width: 100px;
            height: 120px;
            object-fit: cover;
            border-radius: 5px;
            border: 2px solid #2c3e50;
        }
        
        ul {
            list-style: none;
            padding: 0;
        }
        
        li {
            margin-bottom: 5px;
            position: relative;
            padding-left: 15px;
        }
        
        li:before {
            content: "•";
            color: #2c3e50;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .objective {
            font-style: italic;
            color: #555;
            text-align: justify;
        }
    </style>
</head>
<body>
    <div class="container">
        ${photoHTML}
        <div class="header">
            <div class="name">${personalInfo.name || 'Professional Name'}</div>
            <div class="contact-info">
                ${personalInfo.email ? personalInfo.email : ''}
                ${personalInfo.email && personalInfo.phone ? ' | ' : ''}
                ${personalInfo.phone ? personalInfo.phone : ''}
            </div>
        </div>
        
        <div class="content">
            ${formattedContent}
        </div>
    </div>
</body>
</html>`;
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

  // Clean up browser resources
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = PDFGenerator;