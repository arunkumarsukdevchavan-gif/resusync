const trainingData = require('./trainingData');

class LocalResumeAI {
  constructor() {
    // Enhanced skill keywords for better ATS optimization
    this.skillKeywords = {
      technical: [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'TypeScript',
        'HTML', 'CSS', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
        'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Redis', 'Firebase', 'AWS', 'Azure', 'Docker', 'Git'
      ],
      soft: [
        'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
        'Time Management', 'Adaptability', 'Creativity', 'Project Management', 'Collaboration'
      ]
    };

    this.isInitialized = false;
    this.trainingData = [];
  }

  // Initialize the AI model
  async initialize() {
    try {
      this.trainingData = trainingData;
      this.isInitialized = true;
      console.log('✅ Local AI model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI model:', error);
      throw error;
    }
  }

  // Enhanced personal information extraction
  async extractPersonalInformation(resumeText) {
    const personalInfo = {
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      linkedin: '',
      github: '',
      portfolio: '',
      hasExperience: false,
      hasCertifications: false,
      education: []
    };

    const cleanedText = resumeText.replace(/\s+/g, ' ').trim();
    const lines = resumeText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('🔍 Extracting personal info from resume...');
    
    // Check for actual work experience (not internships or projects)
    const experienceKeywords = ['work experience', 'professional experience', 'employment history', 'career history'];
    const internshipKeywords = ['internship', 'intern', 'training', 'project work', 'academic project'];
    
    let hasRealExperience = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (experienceKeywords.some(keyword => lowerLine.includes(keyword))) {
        // Check if it's followed by actual company experience, not just internships
        const nextLines = lines.slice(lines.indexOf(line), lines.indexOf(line) + 5);
        const hasCompanyExperience = nextLines.some(nextLine => 
          nextLine.match(/\b(pvt|ltd|llc|inc|corp|company|technologies|systems|solutions|software)\b/i) &&
          !nextLine.toLowerCase().includes('intern')
        );
        if (hasCompanyExperience) {
          hasRealExperience = true;
          break;
        }
      }
    }
    personalInfo.hasExperience = hasRealExperience;
    
    // Check for real certifications (not education degrees)
    const certificationKeywords = ['certification', 'certified', 'certificate', 'license'];
    const educationKeywords = ['bachelor', 'master', 'degree', 'btech', 'be', 'mtech', 'me', 'bca', 'mca', 'hsc', 'sslc', '12th', '10th'];
    
    let hasRealCertifications = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (certificationKeywords.some(keyword => lowerLine.includes(keyword))) {
        // Check if it's not just education degrees
        if (!educationKeywords.some(eduKeyword => lowerLine.includes(eduKeyword))) {
          hasRealCertifications = true;
          break;
        }
      }
    }
    personalInfo.hasCertifications = hasRealCertifications;
    
    // Extract education (including HSC, SSLC)
    const educationPatterns = [
      /\b(bachelor|btech|be|b\.tech|b\.e)\s+.*?(?:in|of)\s+([^,\n]+)/gi,
      /\b(master|mtech|me|m\.tech|m\.e|mca|m\.ca)\s+.*?(?:in|of)\s+([^,\n]+)/gi,
      /\b(hsc|12th|higher secondary|senior secondary)\s*[:\-]?\s*([^,\n]*)/gi,
      /\b(sslc|10th|secondary|matriculation)\s*[:\-]?\s*([^,\n]*)/gi,
      /\b(diploma)\s+.*?(?:in|of)\s+([^,\n]+)/gi
    ];
    
    for (const pattern of educationPatterns) {
      const matches = [...cleanedText.matchAll(pattern)];
      for (const match of matches) {
        const degree = match[1];
        const field = match[2] ? match[2].trim() : '';
        personalInfo.education.push(`${degree}${field ? ' in ' + field : ''}`);
      }
    }

    // Enhanced name extraction - look for proper names in first few lines
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].trim();
      
      // Skip common header words
      if (line.match(/^(resume|curriculum vitae|cv|profile|summary|objective|contact|email|phone|mobile|address|experience|education|skills|projects|certifications|internship|achievements)/i)) {
        continue;
      }
      
      // Skip lines with contact info
      if (line.includes('@') || 
          line.includes('http') || 
          line.includes('www.') ||
          line.match(/^\+?[\d\s\-\(\)]{8,}$/) ||
          line.match(/^\d{4}[-\s]\d{4}$/) ||
          line.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/)) {
        continue;
      }
      
      // Look for proper names (2-4 words, capitalized)
      if (line && 
          line.length >= 3 && 
          line.length <= 50 &&
          line.split(/\s+/).length >= 2 && 
          line.split(/\s+/).length <= 4 &&
          /^[A-Za-z\s\.\-']+$/.test(line)) {
        
        const words = line.split(/\s+/);
        const isProperName = words.every(word => 
          word.length > 1 && 
          word[0] === word[0].toUpperCase() &&
          !['The', 'And', 'Of', 'In', 'At', 'To', 'For', 'With', 'Resume', 'CV'].includes(word)
        );
        
        if (isProperName && !personalInfo.name) {
          personalInfo.name = line;
          console.log('✅ Extracted name:', line);
          break;
        }
      }
    }

    // Enhanced email extraction
    const emailMatch = cleanedText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      personalInfo.email = emailMatch[1];
      console.log('✅ Extracted email:', emailMatch[1]);
    }

    // Enhanced phone extraction
    const phonePatterns = [
      /(\+91[\s\-]?)?(\d{5}[\s\-]?\d{5})/g,
      /(\+91[\s\-]?)?(\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g,
      /(\d{10})/g
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = cleanedText.match(pattern);
      if (phoneMatch && !personalInfo.contact) {
        personalInfo.contact = phoneMatch[0];
        personalInfo.phone = phoneMatch[0];
        console.log('✅ Extracted phone:', phoneMatch[0]);
        break;
      }
    }

    return personalInfo;
  }

  // Detect job role from job description
  async detectJobRole(jobDescription) {
    const jobRoles = {
      'software engineer': ['software engineer', 'software developer', 'developer', 'programmer'],
      'data scientist': ['data scientist', 'data analyst', 'machine learning', 'ai engineer'],
      'web developer': ['web developer', 'frontend', 'backend', 'full stack'],
      'project manager': ['project manager', 'program manager', 'scrum master'],
      'designer': ['ui designer', 'ux designer', 'graphic designer', 'product designer']
    };

    const lowerDesc = jobDescription.toLowerCase();
    
    for (const [role, keywords] of Object.entries(jobRoles)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return role;
      }
    }
    
    return 'general';
  }

  // Enhanced intelligent suggestion system that analyzes resume comprehensively
  async analyzeSuggestions(originalResume, jobDescription, jobRole) {
    console.log('🔍 Starting comprehensive resume analysis for intelligent suggestions...');
    
    const resumeAnalysis = await this.performDeepResumeAnalysis(originalResume, jobDescription);
    const suggestions = [];
    
    // 1. CONTENT ANALYSIS SUGGESTIONS
    if (resumeAnalysis.content.missingQuantifiableAchievements) {
      suggestions.push({
        category: 'Content Quality',
        priority: 'HIGH',
        title: 'Add Quantifiable Achievements',
        issue: 'Your resume lacks measurable results and impact metrics',
        suggestion: 'Add specific numbers, percentages, or metrics to showcase your achievements. For example: "Increased system performance by 30%" or "Managed team of 5 developers"',
        impact: 'Quantified achievements are 40% more likely to get recruiter attention',
        keywords: ['metrics', 'numbers', 'percentages', 'results']
      });
    }
    
    if (resumeAnalysis.content.weakActionVerbs) {
      suggestions.push({
        category: 'Professional Language',
        priority: 'MEDIUM',
        title: 'Strengthen Action Verbs',
        issue: 'Using weak or passive language in descriptions',
        suggestion: 'Replace weak verbs with strong action words. Use: "Developed, Implemented, Optimized, Led, Architected, Delivered" instead of "Worked on, Helped with, Involved in"',
        impact: 'Strong action verbs make your resume 25% more impactful',
        keywords: ['action verbs', 'active voice', 'professional language']
      });
    }
    
    if (resumeAnalysis.content.vagueDescriptions) {
      suggestions.push({
        category: 'Clarity & Detail',
        priority: 'HIGH',
        title: 'Add Specific Technical Details',
        issue: 'Project and experience descriptions are too vague',
        suggestion: 'Include specific technologies, frameworks, and methodologies used. Instead of "Built a web application", write "Developed a React.js e-commerce application with Node.js backend and MongoDB database"',
        impact: 'Specific technical details improve ATS keyword matching by 45%',
        keywords: ['technical details', 'technologies', 'frameworks']
      });
    }
    
    // 2. STRUCTURE ANALYSIS SUGGESTIONS
    if (resumeAnalysis.structure.missingSections.length > 0) {
      suggestions.push({
        category: 'Resume Structure',
        priority: 'HIGH',
        title: 'Add Missing Essential Sections',
        issue: `Missing important sections: ${resumeAnalysis.structure.missingSections.join(', ')}`,
        suggestion: 'A complete resume should include: Contact Info, Professional Summary/Objective, Experience/Internships, Education, Skills, and Projects. Consider adding certifications if relevant.',
        impact: 'Complete resume structure increases ATS parsing success by 60%',
        keywords: ['resume sections', 'structure', 'organization']
      });
    }
    
    if (resumeAnalysis.structure.poorOrganization) {
      suggestions.push({
        category: 'Organization',
        priority: 'MEDIUM',
        title: 'Improve Resume Organization',
        issue: 'Resume sections are not logically ordered or clearly defined',
        suggestion: 'Follow this order: Contact → Summary → Experience → Education → Skills → Projects → Certifications. Use clear section headers and consistent formatting.',
        impact: 'Better organization improves readability and ATS parsing',
        keywords: ['organization', 'section order', 'formatting']
      });
    }
    
    // 3. ATS OPTIMIZATION SUGGESTIONS
    if (resumeAnalysis.ats.keywordGap > 30) {
      suggestions.push({
        category: 'ATS Optimization',
        priority: 'CRITICAL',
        title: 'Critical Keyword Gap Detected',
        issue: `Only ${100 - resumeAnalysis.ats.keywordGap}% keyword match with job description`,
        suggestion: `Incorporate these missing keywords naturally: ${resumeAnalysis.ats.missingKeywords.slice(0, 8).join(', ')}. Add them to your skills section and project descriptions.`,
        impact: 'Improving keyword match above 70% increases ATS success rate by 300%',
        keywords: resumeAnalysis.ats.missingKeywords.slice(0, 10)
      });
    }
    
    if (resumeAnalysis.ats.skillsMismatch.length > 0) {
      suggestions.push({
        category: 'Skills Alignment',
        priority: 'HIGH',
        title: 'Skills Mismatch with Job Requirements',
        issue: `Missing key skills expected for this role: ${resumeAnalysis.ats.skillsMismatch.slice(0, 5).join(', ')}`,
        suggestion: 'If you have experience with these skills, add them prominently. If not, consider learning them or highlighting transferable skills.',
        impact: 'Matching required skills increases interview chances by 80%',
        keywords: resumeAnalysis.ats.skillsMismatch
      });
    }
    
    // 4. ROLE-SPECIFIC SUGGESTIONS
    const roleSpecificSuggestions = await this.generateRoleSpecificSuggestions(resumeAnalysis, jobRole, jobDescription);
    suggestions.push(...roleSpecificSuggestions);
    
    // 5. FORMATTING SUGGESTIONS
    if (resumeAnalysis.formatting.issues.length > 0) {
      suggestions.push({
        category: 'Formatting',
        priority: 'MEDIUM',
        title: 'Fix Formatting Issues',
        issue: `Formatting problems: ${resumeAnalysis.formatting.issues.join(', ')}`,
        suggestion: 'Use consistent bullet points, uniform fonts, proper spacing, and clear section headers. Avoid special characters that ATS cannot parse.',
        impact: 'Clean formatting improves ATS parsing accuracy by 25%',
        keywords: ['formatting', 'clean design', 'ATS-friendly']
      });
    }
    
    // 6. CAREER LEVEL SUGGESTIONS
    if (resumeAnalysis.careerLevel === 'entry-level') {
      suggestions.push({
        category: 'Entry-Level Focus',
        priority: 'MEDIUM',
        title: 'Highlight Educational Projects & Skills',
        issue: 'Limited professional experience detected',
        suggestion: 'Emphasize academic projects, internships, certifications, and relevant coursework. Include personal/open-source projects that demonstrate your skills.',
        impact: 'Strong project portfolio can compensate for limited experience',
        keywords: ['projects', 'skills', 'education', 'certifications']
      });
    }
    
    console.log(`✅ Generated ${suggestions.length} intelligent suggestions based on resume analysis`);
    return { suggestions, analysis: resumeAnalysis };
  }
  
  // Perform deep analysis of resume content
  async performDeepResumeAnalysis(resumeText, jobDescription) {
    const analysis = {
      content: {},
      structure: {},
      ats: {},
      formatting: {},
      careerLevel: 'unknown'
    };
    
    const resumeLower = resumeText.toLowerCase();
    const jobDescLower = jobDescription.toLowerCase();
    
    // Content Analysis
    analysis.content.missingQuantifiableAchievements = !this.hasQuantifiableAchievements(resumeText);
    analysis.content.weakActionVerbs = this.hasWeakActionVerbs(resumeText);
    analysis.content.vagueDescriptions = this.hasVagueDescriptions(resumeText);
    
    // Structure Analysis
    analysis.structure.missingSections = this.findMissingSections(resumeText);
    analysis.structure.poorOrganization = this.hasPoorOrganization(resumeText);
    
    // ATS Analysis
    const atsAnalysis = this.performATSAnalysis(resumeText, jobDescription);
    analysis.ats = atsAnalysis;
    
    // Formatting Analysis
    analysis.formatting.issues = this.findFormattingIssues(resumeText);
    
    // Career Level Detection
    analysis.careerLevel = this.detectCareerLevel(resumeText);
    
    return analysis;
  }
  
  // Check for quantifiable achievements
  hasQuantifiableAchievements(resumeText) {
    const quantifierPatterns = [
      /\d+\s*%/g, // percentages
      /\$\d+/g, // monetary values
      /\d+\s*(years?|months?|weeks?)/g, // time periods
      /\d+\s*(people|users|customers|projects?|teams?)/g, // quantities
      /(increased|decreased|improved|reduced|grew|saved|generated).*?\d+/gi // achievement verbs with numbers
    ];
    
    let quantifierCount = 0;
    quantifierPatterns.forEach(pattern => {
      const matches = resumeText.match(pattern);
      quantifierCount += matches ? matches.length : 0;
    });
    
    return quantifierCount >= 2; // Need at least 2 quantifiable achievements
  }
  
  // Check for weak action verbs
  hasWeakActionVerbs(resumeText) {
    const weakVerbs = ['worked on', 'helped with', 'involved in', 'participated in', 'assisted', 'was responsible for'];
    const strongVerbs = ['developed', 'implemented', 'optimized', 'led', 'architected', 'delivered', 'created', 'built'];
    
    const weakVerbCount = weakVerbs.reduce((count, verb) => {
      return count + (resumeText.toLowerCase().match(new RegExp(verb, 'g')) || []).length;
    }, 0);
    
    const strongVerbCount = strongVerbs.reduce((count, verb) => {
      return count + (resumeText.toLowerCase().match(new RegExp(verb, 'g')) || []).length;
    }, 0);
    
    return weakVerbCount > strongVerbCount;
  }
  
  // Check for vague descriptions
  hasVagueDescriptions(resumeText) {
    const vagueTerms = ['various', 'several', 'many', 'some', 'different', 'basic', 'simple', 'worked on'];
    const specificTerms = ['react', 'node.js', 'python', 'javascript', 'mongodb', 'aws', 'docker', 'git'];
    
    const vagueCount = vagueTerms.reduce((count, term) => {
      return count + (resumeText.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
    }, 0);
    
    const specificCount = specificTerms.reduce((count, term) => {
      return count + (resumeText.toLowerCase().match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
    }, 0);
    
    return vagueCount > specificCount * 0.5;
  }
  
  // Find missing essential sections
  findMissingSections(resumeText) {
    const essentialSections = {
      'contact': ['email', 'phone', '@'],
      'experience': ['experience', 'work', 'employment', 'internship'],
      'education': ['education', 'degree', 'university', 'college'],
      'skills': ['skills', 'technologies', 'technical', 'programming'],
      'projects': ['projects', 'portfolio', 'github']
    };
    
    const missingSections = [];
    const resumeLower = resumeText.toLowerCase();
    
    Object.keys(essentialSections).forEach(section => {
      const keywords = essentialSections[section];
      const hasSection = keywords.some(keyword => resumeLower.includes(keyword));
      if (!hasSection) {
        missingSections.push(section);
      }
    });
    
    return missingSections;
  }
  
  // Check for poor organization
  hasPoorOrganization(resumeText) {
    const lines = resumeText.split('\n').filter(line => line.trim().length > 0);
    const sectionHeaders = lines.filter(line => 
      /^[A-Z\s]{2,}$/.test(line.trim()) || 
      line.trim().endsWith(':') ||
      /^(experience|education|skills|projects|objective|summary)/i.test(line.trim())
    );
    
    return sectionHeaders.length < 3; // Less than 3 clear section headers indicates poor organization
  }
  
  // Perform ATS analysis
  performATSAnalysis(resumeText, jobDescription) {
    const resumeLower = resumeText.toLowerCase();
    const jobDescLower = jobDescription.toLowerCase();
    
    // Extract job keywords
    const jobWords = jobDescLower.match(/\b\w{3,}\b/g) || [];
    const uniqueJobWords = [...new Set(jobWords)].filter(word => 
      !['the', 'and', 'for', 'you', 'will', 'are', 'with', 'have', 'can', 'our', 'this', 'that', 'job', 'role', 'position'].includes(word)
    );
    
    const matchedKeywords = uniqueJobWords.filter(word => resumeLower.includes(word));
    const keywordGap = Math.round(((uniqueJobWords.length - matchedKeywords.length) / uniqueJobWords.length) * 100);
    const missingKeywords = uniqueJobWords.filter(word => !resumeLower.includes(word));
    
    // Skills analysis
    const requiredSkills = this.extractRequiredSkills(jobDescription);
    const resumeSkills = this.extractResumeSkills(resumeText);
    const skillsMismatch = requiredSkills.filter(skill => 
      !resumeSkills.some(resumeSkill => resumeSkill.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return {
      keywordGap,
      missingKeywords: missingKeywords.slice(0, 15),
      skillsMismatch: skillsMismatch.slice(0, 10),
      matchedKeywords: matchedKeywords.length,
      totalJobKeywords: uniqueJobWords.length
    };
  }
  
  // Extract required skills from job description
  extractRequiredSkills(jobDescription) {
    const skillPatterns = [
      /\b(javascript|js|react|node\.?js|python|java|sql|html|css|mongodb|mysql|postgresql|aws|azure|docker|kubernetes|git|github)\b/gi,
      /\b(angular|vue|express|django|flask|spring|hibernate|tensorflow|pytorch|pandas|numpy)\b/gi,
      /\b(agile|scrum|devops|ci\/cd|jenkins|linux|windows|mac|rest|api|microservices)\b/gi
    ];
    
    const skills = [];
    skillPatterns.forEach(pattern => {
      const matches = jobDescription.match(pattern) || [];
      skills.push(...matches.map(skill => skill.toLowerCase()));
    });
    
    return [...new Set(skills)];
  }
  
  // Extract skills from resume
  extractResumeSkills(resumeText) {
    const skillsSection = this.extractSkillsSection(resumeText);
    const skillWords = skillsSection.toLowerCase().split(/[,\s\n\|\-•]+/).filter(word => word.length > 2);
    return skillWords;
  }
  
  // Extract skills section from resume
  extractSkillsSection(resumeText) {
    const lines = resumeText.split('\n');
    let skillsStart = -1;
    let skillsEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (/^(skills|technical skills|technologies|programming)/i.test(lines[i].trim())) {
        skillsStart = i;
        break;
      }
    }
    
    if (skillsStart !== -1) {
      for (let i = skillsStart + 1; i < lines.length; i++) {
        if (/^(experience|education|projects|certifications|objective)/i.test(lines[i].trim())) {
          skillsEnd = i;
          break;
        }
      }
      skillsEnd = skillsEnd === -1 ? lines.length : skillsEnd;
      return lines.slice(skillsStart, skillsEnd).join('\n');
    }
    
    return resumeText; // Return full text if no skills section found
  }
  
  // Find formatting issues
  findFormattingIssues(resumeText) {
    const issues = [];
    
    // Check for inconsistent bullet points
    const bulletPatterns = [/^[•\-\*]/, /^\d+\./, /^→/, /^◦/];
    const bulletCounts = bulletPatterns.map(pattern => 
      (resumeText.match(new RegExp(pattern.source, 'gm')) || []).length
    );
    if (bulletCounts.filter(count => count > 0).length > 2) {
      issues.push('inconsistent bullet points');
    }
    
    // Check for missing contact info
    if (!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText)) {
      issues.push('missing email address');
    }
    
    if (!/[\+]?[1-9]?[\d\s\-\(\)]{8,15}/.test(resumeText)) {
      issues.push('missing phone number');
    }
    
    // Check for excessive line breaks
    if (/\n\n\n+/.test(resumeText)) {
      issues.push('excessive spacing');
    }
    
    return issues;
  }
  
  // Detect career level
  detectCareerLevel(resumeText) {
    const resumeLower = resumeText.toLowerCase();
    
    // Check for experience indicators
    const seniorIndicators = ['senior', 'lead', 'principal', 'manager', 'director', 'years experience'];
    const midIndicators = ['experience', '2-5 years', '3-7 years', 'professional'];
    const juniorIndicators = ['intern', 'fresher', 'graduate', 'entry level', 'recent graduate'];
    
    if (seniorIndicators.some(indicator => resumeLower.includes(indicator))) {
      return 'senior-level';
    } else if (midIndicators.some(indicator => resumeLower.includes(indicator))) {
      return 'mid-level';
    } else if (juniorIndicators.some(indicator => resumeLower.includes(indicator))) {
      return 'entry-level';
    }
    
    // Check based on content complexity
    const projectCount = (resumeLower.match(/project/g) || []).length;
    const internshipCount = (resumeLower.match(/intern/g) || []).length;
    
    if (projectCount > 3 && internshipCount === 0) {
      return 'mid-level';
    } else if (internshipCount > 0 || projectCount <= 2) {
      return 'entry-level';
    }
    
    return 'entry-level';
  }
  
  // Generate role-specific suggestions
  async generateRoleSpecificSuggestions(analysis, jobRole, jobDescription) {
    const suggestions = [];
    
    switch (jobRole) {
      case 'software engineer':
      case 'software developer':
        suggestions.push({
          category: 'Technical Focus',
          priority: 'HIGH',
          title: 'Highlight Software Development Skills',
          issue: 'Need stronger emphasis on programming and development experience',
          suggestion: 'Emphasize your coding projects, programming languages, frameworks, and software architecture experience. Include GitHub links and mention development methodologies like Agile/Scrum.',
          impact: 'Technical emphasis increases relevance for software roles by 70%',
          keywords: ['programming', 'development', 'coding', 'software architecture']
        });
        break;
        
      case 'data scientist':
      case 'data analyst':
        suggestions.push({
          category: 'Data Focus',
          priority: 'HIGH',
          title: 'Strengthen Data Science Portfolio',
          issue: 'Insufficient emphasis on data analysis and machine learning',
          suggestion: 'Highlight your experience with data analysis tools (Python, R, SQL), machine learning libraries (TensorFlow, scikit-learn), and data visualization. Include specific data projects with measurable outcomes.',
          impact: 'Data-focused content increases match for analytics roles by 85%',
          keywords: ['data analysis', 'machine learning', 'python', 'sql', 'visualization']
        });
        break;
        
      case 'web developer':
        suggestions.push({
          category: 'Web Development',
          priority: 'HIGH',
          title: 'Showcase Web Development Expertise',
          issue: 'Missing web-specific technologies and frameworks',
          suggestion: 'Emphasize frontend/backend technologies (React, Vue, Node.js, Express), responsive design, and web performance optimization. Include live project links and mention modern development practices.',
          impact: 'Web-focused skills increase relevance for web developer roles by 80%',
          keywords: ['web development', 'frontend', 'backend', 'responsive design']
        });
        break;
    }
    
    return suggestions;
  }

  // Generate optimized resume
  async generateOptimizedResume(originalResume, jobDescription, personalInfo) {
    console.log('📝 Generating optimized resume with exact template...');
    
    const sections = [];
    const resumeData = await this.extractResumeData(originalResume);
    const jobRole = await this.detectJobRole(jobDescription);
    
    // 1. NAME - from uploaded PDF exactly
    if (personalInfo.name) {
      sections.push(`${personalInfo.name.toUpperCase()}`);
      sections.push('');
    }
    
    // 2. EMAIL & PHONE - from uploaded PDF exactly
    const contactInfo = [];
    if (personalInfo.email) contactInfo.push(`Email: ${personalInfo.email}`);
    if (personalInfo.contact || personalInfo.phone) {
      const phone = personalInfo.contact || personalInfo.phone;
      contactInfo.push(`Phone: ${phone}`);
    }
    if (contactInfo.length > 0) {
      sections.push(contactInfo.join(' | '));
      sections.push('');
    }
    
    // 3. OBJECTIVE - using model related to job role and tech details from PDF
    sections.push('OBJECTIVE');
    const objective = await this.generateObjective(jobRole, jobDescription, resumeData);
    sections.push(objective);
    sections.push('');
    
    // 4. EDUCATION - from uploaded PDF exactly in order (SSLC -> HSC -> Degree)
    if (resumeData.education && resumeData.education.length > 0) {
      sections.push('EDUCATION');
      const formattedEducation = this.formatEducationWithScores(resumeData.education);
      formattedEducation.forEach(edu => {
        sections.push(`• ${edu}`);
      });
      sections.push('');
    }
    
    // 5. SKILLS - using model related to job role with ATS suggestions
    sections.push('SKILLS');
    const skills = await this.generateOptimizedSkills(jobRole, jobDescription, resumeData);
    skills.forEach(skill => {
      sections.push(`• ${skill}`);
    });
    sections.push('');
    
    // 6. INTERNSHIPS - from uploaded PDF exactly, ATS-friendly rephrased
    if (resumeData.internships && resumeData.internships.length > 0) {
      sections.push('INTERNSHIPS');
      const optimizedInternships = await this.optimizeInternships(resumeData.internships, jobRole);
      optimizedInternships.forEach(internship => {
        // Format as 2-line structure: Title/Company/Duration, then bullet points
        const lines = internship.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // First line: title, company, duration
          sections.push(lines[0].replace(/^[•\-\*]\s*/, ''));
          // Subsequent lines as bullet points
          for (let i = 1; i < lines.length; i++) {
            sections.push(`• ${lines[i].replace(/^[•\-\*]\s*/, '')}`);
          }
        }
      });
      sections.push('');
    }
    
    // 7. PROJECTS - from uploaded PDF exactly, ATS-friendly rephrased with suggestions
    if (resumeData.projects && resumeData.projects.length > 0) {
      sections.push('PROJECTS');
      const optimizedProjects = await this.optimizeProjects(resumeData.projects, jobRole, jobDescription);
      optimizedProjects.forEach(project => {
        // Format as 2-line structure: Title/Tech/Date, then bullet points
        const lines = project.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          // First line: project title, tech stack, date
          sections.push(lines[0].replace(/^[•\-\*]\s*/, ''));
          // Subsequent lines as bullet points
          for (let i = 1; i < lines.length; i++) {
            sections.push(`• ${lines[i].replace(/^[•\-\*]\s*/, '')}`);
          }
        }
      });
      sections.push('');
    }
    
    // 8. ACHIEVEMENTS AND CERTIFICATES - if there in uploaded resume PDF
    if (resumeData.achievements && resumeData.achievements.length > 0) {
      sections.push('ACHIEVEMENTS & CERTIFICATIONS');
      resumeData.achievements.forEach(achievement => {
        // Clean and format achievement
        let cleanAchievement = achievement.replace(/^[•\-\*\s]+/, '').trim();
        if (cleanAchievement && cleanAchievement.length > 10) {
          sections.push(`• ${cleanAchievement}`);
        }
      });
      sections.push('');
    }
    
    return sections.join('\n').trim();
  }
  
  // Extract all resume data from original text
  async extractResumeData(resumeText) {
    const data = {
      education: [],
      skills: [],
      internships: [],
      projects: [],
      achievements: [],
      experience: []
    };
    
    const lines = resumeText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Identify sections
      if (lowerLine.includes('education') && lowerLine.length < 50) {
        currentSection = 'education';
        continue;
      } else if ((lowerLine.includes('skill') || lowerLine.includes('technical')) && lowerLine.length < 50) {
        currentSection = 'skills';
        continue;
      } else if (lowerLine.includes('internship') && lowerLine.length < 50) {
        currentSection = 'internships';
        continue;
      } else if (lowerLine.includes('project') && lowerLine.length < 50) {
        currentSection = 'projects';
        continue;
      } else if ((lowerLine.includes('achievement') || lowerLine.includes('certificate') || lowerLine.includes('award')) && lowerLine.length < 50) {
        currentSection = 'achievements';
        continue;
      } else if ((lowerLine.includes('experience') || lowerLine.includes('work')) && lowerLine.length < 50) {
        currentSection = 'experience';
        continue;
      }
      
      // Extract content based on current section
      if (currentSection && line.length > 5 && !this.isSectionHeader(line)) {
        // Clean the line
        let cleanLine = line.replace(/^[•\-\*\s]+/, '').trim();
        if (cleanLine && !data[currentSection].includes(cleanLine)) {
          data[currentSection].push(cleanLine);
        }
      }
    }
    
    // Extract education using patterns if not found in sections
    if (data.education.length === 0) {
      data.education = this.extractEducationPatterns(resumeText);
    }
    
    // Remove duplicates from all sections
    Object.keys(data).forEach(key => {
      data[key] = [...new Set(data[key])];
    });
    
    return data;
  }
  
  // Check if line is a section header
  isSectionHeader(line) {
    const headers = ['education', 'skills', 'projects', 'internship', 'achievement', 'experience', 'work', 'certificate'];
    return headers.some(header => line.toLowerCase().includes(header) && line.length < 30);
  }
  
  // Extract education using patterns
  extractEducationPatterns(resumeText) {
    const education = [];
    
    // Enhanced patterns to capture education with scores
    const lines = resumeText.split('\n');
    const educationLines = [];
    let inEducationSection = false;
    
    // First, find the education section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^(EDUCATION|Educational|Academic)/i.test(line)) {
        inEducationSection = true;
        continue;
      }
      if (inEducationSection && /^(SKILLS|EXPERIENCE|PROJECTS|INTERNSHIPS)/i.test(line)) {
        break;
      }
      if (inEducationSection && line) {
        educationLines.push(line);
      }
    }
    
    // Process education lines
    const educationData = [];
    
    // Extract SSLC/10th
    const sslcMatch = resumeText.match(/\b(SSLC|10th|Secondary School Leaving Certificate)[^,\n]*([^,\n]*?)(\d{4}[-–]\d{4}|\d{4})/gi);
    if (sslcMatch) {
      const scoreMatch = resumeText.match(/(?:SSLC|10th|Secondary)[^%]*?(\d+(?:\.\d+)?%)/gi);
      let sslcText = sslcMatch[0].replace(/^\s*[•\-\*]\s*/, '');
      if (scoreMatch) {
        const score = scoreMatch[0].match(/(\d+(?:\.\d+)?%)/)[1];
        educationData.push({
          type: 'SSLC',
          text: `Secondary School Leaving Certificate (SSLC) | ${sslcText.split(',')[1] || 'School'} | ${sslcText.match(/\d{4}[-–]\d{4}|\d{4}/) || ''}`,
          score: `Percentage: ${score}`,
          priority: 1
        });
      }
    }
    
    // Extract HSC/12th
    const hscMatch = resumeText.match(/\b(HSC|12th|Higher Secondary)[^,\n]*([^,\n]*?)(\d{4}[-–]\d{4}|\d{4})/gi);
    if (hscMatch) {
      const scoreMatch = resumeText.match(/(?:HSC|12th|Higher Secondary)[^%]*?(\d+(?:\.\d+)?%)/gi);
      let hscText = hscMatch[0].replace(/^\s*[•\-\*]\s*/, '');
      if (scoreMatch) {
        const score = scoreMatch[0].match(/(\d+(?:\.\d+)?%)/)[1];
        educationData.push({
          type: 'HSC',
          text: `Higher Secondary Certificate (HSC) | ${hscText.split(',')[1] || 'School'} | ${hscText.match(/\d{4}[-–]\d{4}|\d{4}/) || ''}`,
          score: `Percentage: ${score}`,
          priority: 2
        });
      }
    }
    
    // Extract Bachelor's degree
    const bachelorMatch = resumeText.match(/\b(B\.Tech|Bachelor|BE|B\.E|BCA)[^,\n]*([^,\n]*?)(\d{4}[-–]\d{4}|\d{4})/gi);
    if (bachelorMatch) {
      const scoreMatch = resumeText.match(/(?:B\.Tech|Bachelor|BE|B\.E)[^0-9]*?(\d+(?:\.\d+)?)\s*(?:CGPA|GPA)/gi);
      let bachelorText = bachelorMatch[0].replace(/^\s*[•\-\*]\s*/, '');
      if (scoreMatch) {
        const score = scoreMatch[0].match(/(\d+(?:\.\d+)?)/)[1];
        educationData.push({
          type: 'Bachelor',
          text: `${bachelorText.split('–')[0] || bachelorText.split(',')[0]} | ${bachelorText.split(',')[1] || 'College'} | ${bachelorText.match(/\d{4}[-–]\d{4}|\d{4}/) || ''}`,
          score: `CGPA: ${score} / 10`,
          priority: 3
        });
      }
    }
    
    // Sort by priority and format
    educationData.sort((a, b) => a.priority - b.priority);
    
    educationData.forEach(edu => {
      education.push(edu.text);
      education.push(edu.score);
    });
    
    return education;
  }
  
  // Sort education by level (SSLC -> HSC -> Degree -> Master)
  sortEducationByLevel(education) {
    const priorities = {
      'sslc': 1, '10th': 1, 'secondary': 1, 'matriculation': 1,
      'hsc': 2, '12th': 2, 'higher secondary': 2, 'senior secondary': 2,
      'diploma': 3,
      'bachelor': 4, 'b.tech': 4, 'be': 4, 'b.e': 4, 'bca': 4, 'b.ca': 4,
      'master': 5, 'm.tech': 5, 'me': 5, 'm.e': 5, 'mca': 5, 'm.ca': 5, 'mba': 5
    };
    
    return education.sort((a, b) => {
      const priorityA = this.getEducationPriority(a, priorities);
      const priorityB = this.getEducationPriority(b, priorities);
      return priorityA - priorityB;
    });
  }
  
  // Get education priority for sorting
  getEducationPriority(education, priorities) {
    const lowerEdu = education.toLowerCase();
    for (const [key, priority] of Object.entries(priorities)) {
      if (lowerEdu.includes(key)) {
        return priority;
      }
    }
    return 999; // Unknown education type goes last
  }

  // Format education with proper structure and scores
  formatEducationWithScores(education) {
    const sortedEducation = this.sortEducationByLevel(education);
    const formattedEducation = [];
    
    sortedEducation.forEach(edu => {
      // Extract percentage or CGPA from the education line
      const scoreMatch = edu.match(/(\d+(?:\.\d+)?(?:%|CGPA|GPA))/i);
      
      if (scoreMatch) {
        const score = scoreMatch[1];
        const eduWithoutScore = edu.replace(scoreMatch[0], '').replace(/[()]/g, '').trim();
        
        // Check education type
        if (/(sslc|10th|secondary|matriculation)/i.test(eduWithoutScore)) {
          formattedEducation.push(`Secondary School Leaving Certificate (SSLC) | ${eduWithoutScore.replace(/(sslc|10th|secondary|matriculation)/gi, '').trim()}`);
          formattedEducation.push(`Percentage: ${score}`);
        } else if (/(hsc|12th|higher secondary|senior secondary)/i.test(eduWithoutScore)) {
          formattedEducation.push(`Higher Secondary Certificate (HSC) | ${eduWithoutScore.replace(/(hsc|12th|higher secondary|senior secondary)/gi, '').trim()}`);
          formattedEducation.push(`Percentage: ${score}`);
        } else if (/(b\.tech|bachelor|be|b\.e|bca)/i.test(eduWithoutScore)) {
          formattedEducation.push(`${eduWithoutScore}`);
          formattedEducation.push(`CGPA: ${score}`);
        } else {
          formattedEducation.push(`${eduWithoutScore}`);
          formattedEducation.push(`Score: ${score}`);
        }
      } else {
        // No score found, format anyway
        if (/(sslc|10th|secondary|matriculation)/i.test(edu)) {
          formattedEducation.push(`Secondary School Leaving Certificate (SSLC) | ${edu.replace(/(sslc|10th|secondary|matriculation)/gi, '').trim()}`);
        } else if (/(hsc|12th|higher secondary|senior secondary)/i.test(edu)) {
          formattedEducation.push(`Higher Secondary Certificate (HSC) | ${edu.replace(/(hsc|12th|higher secondary|senior secondary)/gi, '').trim()}`);
        } else {
          formattedEducation.push(edu);
        }
      }
    });
    
    return formattedEducation;
  }

  // Generate objective based on job role and resume data
  async generateObjective(jobRole, jobDescription, resumeData) {
    // Extract key technologies from skills
    const keyTech = [];
    resumeData.skills.forEach(skillLine => {
      const skills = skillLine.split(/[,•\-:]+/).map(s => s.trim()).filter(s => s.length > 1);
      skills.forEach(skill => {
        if (['python', 'javascript', 'react', 'node.js', 'mongodb', 'java', 'html', 'css'].includes(skill.toLowerCase())) {
          keyTech.push(skill);
        }
      });
    });
    
    const uniqueTech = [...new Set(keyTech)].slice(0, 3).join(', ') || 'modern technologies';
    const hasProjects = resumeData.projects.length > 0;
    const hasInternships = resumeData.internships.length > 0;
    
    let objective = `Motivated and detail-oriented ${jobRole} `;
    
    if (hasInternships) {
      objective += `with practical internship experience in ${uniqueTech}. `;
    } else if (hasProjects) {
      objective += `with strong project experience in ${uniqueTech}. `;
    } else {
      objective += `with solid academic foundation in ${uniqueTech}. `;
    }
    
    objective += `Seeking to leverage technical expertise and problem-solving skills to contribute effectively in a dynamic ${jobRole} role. `;
    objective += `Passionate about creating innovative solutions and staying updated with latest industry trends.`;
    
    return objective;
  }
  
  // Generate optimized skills based on job requirements
  async generateOptimizedSkills(jobRole, jobDescription, resumeData) {
    const extractedSkills = resumeData.skills;
    const jobKeywords = this.extractTechnicalKeywords(jobDescription);
    
    // Categorize skills
    const skillCategories = {
      'Programming Languages': [],
      'Web Technologies': [],
      'Databases': [],
      'Tools & Frameworks': [],
      'Soft Skills': []
    };
    
    // Process extracted skills
    const allSkills = new Set();
    extractedSkills.forEach(skillLine => {
      // Split by common separators and clean
      const skills = skillLine.split(/[,•\-:]+/).map(s => s.trim()).filter(s => s.length > 1);
      skills.forEach(skill => {
        if (skill && !skill.toLowerCase().includes('programming') && !skill.toLowerCase().includes('technologies')) {
          allSkills.add(skill);
        }
      });
    });
    
    // Categorize unique skills
    Array.from(allSkills).forEach(skill => {
      this.categorizeSkill(skill, skillCategories);
    });
    
    // Add job-relevant skills if missing
    this.addJobRelevantSkills(jobKeywords, skillCategories, jobRole);
    
    // Format skills for output
    const formattedSkills = [];
    Object.entries(skillCategories).forEach(([category, skills]) => {
      if (skills.length > 0) {
        // Remove duplicates and limit to 6 skills per category
        const uniqueSkills = [...new Set(skills)].slice(0, 6);
        formattedSkills.push(`${category}: ${uniqueSkills.join(', ')}`);
      }
    });
    
    return formattedSkills;
  }
  
  // Categorize individual skill
  categorizeSkill(skill, categories) {
    const lowerSkill = skill.toLowerCase();
    
    if (['javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'swift', 'kotlin', 'typescript'].some(lang => lowerSkill.includes(lang))) {
      categories['Programming Languages'].push(skill);
    } else if (['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring'].some(web => lowerSkill.includes(web))) {
      categories['Web Technologies'].push(skill);
    } else if (['mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'oracle', 'firebase'].some(db => lowerSkill.includes(db))) {
      categories['Databases'].push(skill);
    } else if (['git', 'docker', 'aws', 'azure', 'jenkins', 'linux', 'windows', 'vs code', 'eclipse'].some(tool => lowerSkill.includes(tool))) {
      categories['Tools & Frameworks'].push(skill);
    } else if (['communication', 'leadership', 'teamwork', 'problem solving', 'time management'].some(soft => lowerSkill.includes(soft))) {
      categories['Soft Skills'].push(skill);
    } else {
      // Default to programming languages if uncertain
      categories['Programming Languages'].push(skill);
    }
  }
  
  // Add job-relevant skills
  addJobRelevantSkills(jobKeywords, categories, jobRole) {
    const relevantSkills = this.getJobRelevantSkills(jobRole);
    
    // Add missing job-relevant skills
    relevantSkills.forEach(skill => {
      const hasSkill = Object.values(categories).some(categorySkills => 
        categorySkills.some(existing => existing.toLowerCase().includes(skill.toLowerCase()))
      );
      
      if (!hasSkill) {
        this.categorizeSkill(skill, categories);
      }
    });
  }
  
  // Get job-relevant skills based on role
  getJobRelevantSkills(jobRole) {
    const skillMaps = {
      'software engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'MongoDB'],
      'web developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'],
      'data scientist': ['Python', 'R', 'Machine Learning', 'SQL', 'Pandas', 'NumPy'],
      'mobile developer': ['React Native', 'Flutter', 'Java', 'Swift', 'Kotlin'],
      'default': ['JavaScript', 'Python', 'Git', 'Problem Solving']
    };
    
    return skillMaps[jobRole.toLowerCase()] || skillMaps['default'];
  }
  
  // Extract technical keywords from job description
  extractTechnicalKeywords(jobDescription) {
    const keywords = [];
    const techKeywords = this.skillKeywords.technical;
    
    techKeywords.forEach(keyword => {
      if (jobDescription.toLowerCase().includes(keyword.toLowerCase())) {
        keywords.push(keyword);
      }
    });
    
    return keywords;
  }
  
  // Optimize projects for ATS
  async optimizeProjects(projects, jobRole, jobDescription) {
    const techKeywords = this.extractTechnicalKeywords(jobDescription);
    
    return projects.map(project => {
      const lines = project.split('\n').filter(line => line.trim());
      if (lines.length === 0) return project;
      
      // Extract title and tech info from first line
      let titleLine = lines[0].replace(/^[•\-\*\s]+/, '').trim();
      
      // Format: "Project Title | Tech Stack | Date"
      // Look for patterns and enhance if needed
      if (!titleLine.includes('|') && lines.length > 1) {
        // Try to find tech/date info in other lines
        const techPattern = /(streamlit|react|python|java|ml|ai|node|express|mongodb)/i;
        const datePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i;
        
        let techInfo = lines.find(line => techPattern.test(line));
        let dateInfo = lines.find(line => datePattern.test(line));
        
        if (techInfo || dateInfo) {
          if (techInfo) titleLine += ` | ${techInfo.replace(/^[•\-\*\s]+/, '').trim()}`;
          if (dateInfo) titleLine += ` | ${dateInfo.replace(/^[•\-\*\s]+/, '').trim()}`;
        }
      }
      
      // Get description points (skip first line and tech/date lines)
      const descriptionLines = lines.slice(1).filter(line => {
        const clean = line.replace(/^[•\-\*\s]+/, '').trim();
        const techPattern = /(streamlit|react|python|java|ml|ai|node|express|mongodb)/i;
        const datePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i;
        return clean.length > 20 && !techPattern.test(clean) && !datePattern.test(clean);
      });
      
      // Format the result
      let result = titleLine + '\n';
      if (descriptionLines.length > 0) {
        descriptionLines.forEach(desc => {
          let optimized = desc.replace(/^[•\-\*\s]+/, '').trim();
          if (!this.startsWithActionVerb(optimized)) {
            optimized = `Developed ${optimized}`;
          }
          
          // Add relevant technology if missing
          if (techKeywords.length > 0 && !this.containsAnyKeyword(optimized, techKeywords)) {
            const randomKeyword = techKeywords[Math.floor(Math.random() * techKeywords.length)];
            optimized += ` using ${randomKeyword}`;
          }
          
          result += optimized + '\n';
        });
      }
      
      return result.trim();
    });
  }
  
  // Optimize internships for ATS
  async optimizeInternships(internships, jobRole) {
    return internships.map(internship => {
      const lines = internship.split('\n').filter(line => line.trim());
      if (lines.length === 0) return internship;
      
      // Extract title, company, duration info from first line
      let titleLine = lines[0].replace(/^[•\-\*\s]+/, '').trim();
      
      // Format: "Position, Company | Duration"
      // Look for patterns like "Data Science Intern, Arjun Tech Solutions | July 2024 – August 2024"
      if (!titleLine.includes('|') && lines.length > 1) {
        // Try to construct title line from multiple pieces
        const datePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i;
        let companyAndDate = lines.find(line => datePattern.test(line));
        if (companyAndDate) {
          titleLine += ` | ${companyAndDate.replace(/^[•\-\*\s]+/, '').trim()}`;
        }
      }
      
      // Get description points (skip first line and date lines)
      const descriptionLines = lines.slice(1).filter(line => {
        const clean = line.replace(/^[•\-\*\s]+/, '').trim();
        const datePattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/i;
        return clean.length > 20 && !datePattern.test(clean); // Longer lines are descriptions
      });
      
      // Format the result
      let result = titleLine + '\n';
      if (descriptionLines.length > 0) {
        descriptionLines.forEach(desc => {
          let optimized = desc.replace(/^[•\-\*\s]+/, '').trim();
          if (!this.startsWithActionVerb(optimized)) {
            optimized = `Contributed to ${optimized}`;
          }
          result += optimized + '\n';
        });
      }
      
      return result.trim();
    });
  }
  
  // Check if text contains any of the keywords
  containsAnyKeyword(text, keywords) {
    return keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }
  
  // Check if text starts with action verb
  startsWithActionVerb(text) {
    const actionVerbs = ['developed', 'created', 'built', 'designed', 'implemented', 'contributed', 'worked', 'collaborated', 'led', 'managed'];
    return actionVerbs.some(verb => text.toLowerCase().startsWith(verb));
  }
  
  // Make text ATS-friendly
  makeATSFriendly(text, jobRole) {
    // Add metrics if missing
    if (!text.match(/\d+/)) {
      text += ' with focus on performance optimization';
    }
    
    // Add job-relevant keywords
    const roleKeywords = this.getJobRelevantSkills(jobRole);
    roleKeywords.forEach(keyword => {
      if (!text.toLowerCase().includes(keyword.toLowerCase()) && Math.random() > 0.7) {
        text += ` utilizing ${keyword}`;
      }
    });
    
    return text;
  }
  
  // Enhance with technical keywords
  enhanceWithTechKeywords(text, keywords) {
    if (keywords.length > 0 && !keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      text += ` using ${randomKeyword}`;
    }
    
    return text;
  }

  // Generate cover letter
  async generateCoverLetter(resumeText, jobDescription, personalInfo) {
    const jobTitle = this.extractJobTitle(jobDescription) || 'the position';
    const companyName = this.extractCompanyName(jobDescription) || '[Company Name]';
    const name = personalInfo?.name || '[Your Name]';
    
    const coverLetter = `
Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}. With my technical background and passion for innovation, I am excited about the opportunity to contribute to your team.

As a dedicated professional with experience in software development and modern technologies, I bring:

• Strong technical skills in JavaScript, React, Node.js, and database management
• Experience with project development and problem-solving
• Excellent communication and teamwork abilities
• Enthusiasm for learning new technologies and best practices

I am particularly drawn to ${companyName} because of your commitment to innovation and excellence. I would welcome the opportunity to discuss how my skills and passion can contribute to your team's success.

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely,
${name}

Contact: ${personalInfo?.email || ''} | ${personalInfo?.contact || ''}
    `.trim();

    return coverLetter;
  }

  // Extract job title from job description
  extractJobTitle(jobDescription) {
    const lines = jobDescription.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && firstLine.length < 100) {
      return firstLine;
    }
    
    const titlePatterns = [
      /position:\s*([^\n]+)/i,
      /role:\s*([^\n]+)/i,
      /job title:\s*([^\n]+)/i,
      /we are looking for a\s*([^\n]+)/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Software Engineer';
  }

  // Extract company name from job description
  extractCompanyName(jobDescription) {
    const companyPatterns = [
      /company:\s*([^\n]+)/i,
      /at\s+([A-Z][a-zA-Z\s]+(?:Inc|LLC|Corp|Ltd|Company))/,
      /([A-Z][a-zA-Z\s]+(?:Technologies|Systems|Solutions|Software))/
    ];
    
    for (const pattern of companyPatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Your Target Company';
  }
}

module.exports = LocalResumeAI;