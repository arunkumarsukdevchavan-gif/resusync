import jsPDF from 'jspdf';

class ClientPDFGenerator {
  constructor() {
    this.doc = null;
    this.currentY = 20;
    this.pageHeight = 280;
    this.leftMargin = 20;
    this.rightMargin = 190;
    this.lineHeight = 6;
  }

  // Initialize new PDF document
  initializeDoc() {
    this.doc = new jsPDF('p', 'mm', 'a4');
    this.currentY = 20;
  }

  // Add text with proper formatting
  addText(text, fontSize = 10, fontStyle = 'normal', leftMargin = null) {
    if (!this.doc) this.initializeDoc();
    
    const margin = leftMargin || this.leftMargin;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    
    // Handle long text by splitting into lines
    const lines = this.doc.splitTextToSize(text, this.rightMargin - margin);
    
    // Check if we need a new page
    if (this.currentY + (lines.length * this.lineHeight) > this.pageHeight) {
      this.doc.addPage();
      this.currentY = 20;
    }
    
    lines.forEach((line, index) => {
      this.doc.text(line, margin, this.currentY);
      this.currentY += this.lineHeight;
    });
  }

  // Add section header
  addSectionHeader(title) {
    this.currentY += 4; // Extra spacing before section
    this.addText(title.toUpperCase(), 12, 'bold');
    this.currentY += 2; // Extra spacing after section header
  }

  // Add bullet point
  addBulletPoint(text, indent = 25) {
    this.addText('• ' + text, 10, 'normal', indent);
  }

  // Clean resume text and remove unwanted formatting
  cleanResumeText(text) {
    if (!text) return '';
    
    // Remove double asterisks
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // Parse and format resume content
  parseResumeContent(resumeText) {
    if (!resumeText) return;
    
    const lines = resumeText.split('\n').filter(line => line.trim());
    let currentSection = '';
    let isFirstLine = true;
    
    for (let line of lines) {
      line = this.cleanResumeText(line);
      if (!line) continue;
      
      // First line is usually the name
      if (isFirstLine) {
        this.addText(line, 16, 'bold');
        this.currentY += 4;
        isFirstLine = false;
        continue;
      }
      
      // Check if this is contact info (contains | or @)
      if (line.includes('|') || line.includes('@')) {
        this.addText(line, 10, 'normal');
        this.currentY += 4;
        continue;
      }
      
      // Check if this is a section header
      const upperLine = line.toUpperCase();
      if (upperLine.includes('OBJECTIVE') || upperLine.includes('EDUCATION') || 
          upperLine.includes('SKILLS') || upperLine.includes('EXPERIENCE') || 
          upperLine.includes('PROJECTS') || upperLine.includes('ACHIEVEMENTS') ||
          upperLine.includes('INTERNSHIP') || upperLine.includes('CERTIFICATIONS')) {
        this.addSectionHeader(line);
        currentSection = upperLine;
        continue;
      }
      
      // Format content based on section
      if (line.startsWith('•') || line.startsWith('-')) {
        // Remove the bullet and add our own
        const bulletText = line.substring(1).trim();
        this.addBulletPoint(bulletText);
      } else if (currentSection.includes('OBJECTIVE')) {
        this.addText(line, 10, 'normal');
      } else if (currentSection.includes('EDUCATION') || 
                 currentSection.includes('SKILLS') ||
                 currentSection.includes('ACHIEVEMENTS')) {
        this.addBulletPoint(line);
      } else if (currentSection.includes('EXPERIENCE') || 
                 currentSection.includes('PROJECTS') ||
                 currentSection.includes('INTERNSHIP')) {
        // Job/project titles are usually longer lines without bullets
        if (line.length > 30 && !line.startsWith('•')) {
          this.addText(line, 11, 'bold');
        } else {
          this.addBulletPoint(line);
        }
      } else {
        // Default formatting
        this.addText(line, 10, 'normal');
      }
    }
  }

  // Generate and download PDF
  generateResumePDF(resumeText, fileName = 'resume.pdf') {
    try {
      this.initializeDoc();
      this.parseResumeContent(resumeText);
      
      // Save the PDF
      this.doc.save(fileName);
      console.log('✅ PDF generated successfully:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      return false;
    }
  }

  // Generate cover letter PDF
  generateCoverLetterPDF(coverLetterText, fileName = 'cover_letter.pdf') {
    try {
      this.initializeDoc();
      
      // Cover letter is usually simpler - just add the text with proper formatting
      const lines = coverLetterText.split('\n').filter(line => line.trim());
      
      for (let line of lines) {
        line = this.cleanResumeText(line);
        if (!line) continue;
        
        // First few lines might be contact info or date
        if (line.includes('@') || line.includes('|') || /\d{1,2}\/\d{1,2}\/\d{4}/.test(line)) {
          this.addText(line, 10, 'normal');
          this.currentY += 2;
        } else if (line.includes('Dear') || line.includes('Sincerely') || line.includes('Best regards')) {
          this.currentY += 4;
          this.addText(line, 11, 'normal');
          this.currentY += 4;
        } else {
          this.addText(line, 10, 'normal');
          this.currentY += 2;
        }
      }
      
      // Save the PDF
      this.doc.save(fileName);
      console.log('✅ Cover letter PDF generated successfully:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Error generating cover letter PDF:', error);
      return false;
    }
  }
}

export default ClientPDFGenerator;