const trainingData = require('./trainingData');

class LocalResumeAI {
  constructor() {
    // Enhanced skill keywords for better ATS optimization
    this.skillKeywords = {
      technical: [
        'JavaScript', 'Python', 'Java', 'C', 'CPlusPlus', 'CSharp', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin', 'TypeScript',
        'HTML', 'CSS', 'React', 'Angular', 'Vue', 'NodeJS', 'Express', 'Django', 'Flask', 'Spring',
        'MongoDB', 'MySQL', 'PostgreSQL', 'SQLite', 'Redis', 'Firebase', 'AWS', 'Azure', 'Docker', 'Git',
        'TensorFlow', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'PowerBI',
        'Machine Learning', 'Data Science', 'AI', 'NLP', 'Deep Learning', 'Neural Networks',
        'Streamlit', 'LangChain', 'OpenAI', 'MERN', 'Full Stack', 'APIs', 'Microservices'
      ],
      soft: [
        'Communication', 'Leadership', 'Teamwork', 'Problem Solving', 'Critical Thinking',
        'Time Management', 'Adaptability', 'Creativity', 'Project Management', 'Collaboration',
        'Team Collaboration', 'Effective Communication', 'Analytical Thinking'
      ]
    };

    // Enhanced resume section patterns for accurate parsing - works with real resume formats
    this.sectionPatterns = {
      objective: /\b(?:Objective|Summary|Profile|About)\s*\n((?:(?!\b(?:Education|Experience|Skills|Projects|Internship|Achievements|Work|Employment|Career|Training)\b).*\n?)*)/is,
      education: /\b(?:Education|Academic|Qualification)\s*\n((?:(?!\b(?:Objective|Experience|Skills|Projects|Internship|Achievements|Work|Employment|Career|Training|Summary|Profile|About)\b).*\n?)*)/is,
      experience: /\b(?:Experience|Employment|Work|Career)\s*\n((?:(?!\b(?:Objective|Education|Skills|Projects|Internship|Achievements|Training|Summary|Profile|About)\b).*\n?)*)/is,
      internship: /\b(?:Internship|Intern|Training)\s*\n((?:(?!\b(?:Objective|Education|Experience|Skills|Projects|Achievements|Work|Employment|Career|Summary|Profile|About)\b).*\n?)*)/is,
      projects: /\b(?:Projects?|Portfolio|Work)\s*\n((?:(?!\b(?:Objective|Education|Experience|Skills|Internship|Achievements|Employment|Career|Training|Summary|Profile|About)\b).*\n?)*)/is,
      skills: /\b(?:Skills?|Technical|Competencies|Expertise)\s*\n((?:(?!\b(?:Objective|Education|Experience|Projects|Internship|Achievements|Work|Employment|Career|Training|Summary|Profile|About)\b).*\n?)*)/is,
      achievements: /\b(?:Achievements?|Accomplishments?|Awards?|Honors?|Certifications?)\s*\n((?:(?!\b(?:Objective|Education|Experience|Skills|Projects|Internship|Work|Employment|Career|Training|Summary|Profile|About)\b).*\n?)*)/is
    };

    // Education level patterns
    this.educationPatterns = {
      degree: /(?:b\.?tech|bachelor|master|m\.?tech|phd|diploma|b\.?sc|m\.?sc|b\.?com|m\.?com|bba|mba|b\.?e|m\.?e)/i,
      school: /(?:sslc|hsc|secondary|higher secondary|10th|12th|matriculation)/i,
      institution: /(?:college|university|school|institute|academy)/i,
      percentage: /(?:percentage|%|cgpa|gpa)\s*:?\s*([0-9]+\.?[0-9]*)/i,
      year: /(?:20\d{2}|19\d{2})(?:\s*[-–]\s*(?:20\d{2}|present|ongoing))?/g
    };

    this.isInitialized = false;
    this.trainingData = [];
  }

  // Helper function to escape special regex characters
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    // Enhanced phone extraction with multiple patterns
    const phonePatterns = [
      /(\+91[\s\-]?\d{10})/g,           // +91 with 10 digits
      /(\+91[\s\-]?\d{5}[\s\-]?\d{5})/g, // +91 with space/dash between
      /(\d{10})/g,                      // Simple 10 digit number
      /(\d{3}[\s\-]?\d{3}[\s\-]?\d{4})/g, // Standard format with separators
      /(\d{5}[\s\-]?\d{5})/g            // 5-5 format
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = cleanedText.match(pattern);
      if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 10) {
        personalInfo.contact = phoneMatch[0];
        personalInfo.phone = phoneMatch[0];
        console.log('✅ Extracted phone:', phoneMatch[0]);
        break;
      }
    }

    // Enhanced LinkedIn extraction
    const linkedinPatterns = [
      /linkedin\.com\/in\/([a-zA-Z0-9\-\_]+)/i,
      /linkedin\.com\/in\/([a-zA-Z0-9\-\_\%]+)/i,
      /in\/([a-zA-Z0-9\-\_]+)/i
    ];
    
    for (const pattern of linkedinPatterns) {
      const linkedinMatch = cleanedText.match(pattern);
      if (linkedinMatch) {
        if (linkedinMatch[0].includes('linkedin.com')) {
          personalInfo.linkedin = linkedinMatch[0];
        } else {
          personalInfo.linkedin = `linkedin.com/in/${linkedinMatch[1]}`;
        }
        console.log('✅ Extracted LinkedIn:', personalInfo.linkedin);
        break;
      }
    }

    // GitHub extraction
    const githubMatch = cleanedText.match(/github\.com\/([a-zA-Z0-9\-\_]+)/i);
    if (githubMatch) {
      personalInfo.github = githubMatch[0];
      console.log('✅ Extracted GitHub:', githubMatch[0]);
    }

    // Portfolio/Website extraction
    const portfolioPatterns = [
      /https?:\/\/[a-zA-Z0-9\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=]+/g,
      /www\.[a-zA-Z0-9\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=]+/g
    ];
    
    for (const pattern of portfolioPatterns) {
      const portfolioMatch = cleanedText.match(pattern);
      if (portfolioMatch && !portfolioMatch[0].includes('linkedin') && !portfolioMatch[0].includes('github')) {
        personalInfo.portfolio = portfolioMatch[0];
        console.log('✅ Extracted Portfolio:', portfolioMatch[0]);
        break;
      }
    }

    return personalInfo;
  }

  // Enhanced Resume Section Parser - Accurately identifies and structures resume sections
  async parseResumeStructure(resumeText) {
    console.log('📋 Parsing resume structure with enhanced accuracy...');
    
    const parsedSections = {
      personalInfo: {},
      objective: '',
      education: [],
      experience: [],
      internships: [],
      projects: [],
      skills: {
        technical: [],
        soft: [],
        languages: []
      },
      achievements: [],
      rawSections: {}
    };

    // Clean and normalize text but preserve line breaks for section parsing
    const cleanText = resumeText
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Extract personal information first
    parsedSections.personalInfo = await this.extractPersonalInformation(resumeText);

    // Parse each section using enhanced patterns
    let sectionsFound = 0;
    for (const [sectionName, pattern] of Object.entries(this.sectionPatterns)) {
      const match = cleanText.match(pattern);
      if (match && match[1] && match[1].trim().length > 0) {
        parsedSections.rawSections[sectionName] = match[1].trim();
        sectionsFound++;
        console.log(`✅ Found ${sectionName} section (${match[1].trim().length} chars)`);
      } else {
        console.log(`❌ Section ${sectionName} not found or empty`);
      }
    }

    // If few sections found, try fallback parsing
    if (sectionsFound < 3) {
      console.log('🔄 Using fallback parsing method...');
      const fallbackSections = this.fallbackSectionParsing(cleanText);
      Object.assign(parsedSections.rawSections, fallbackSections);
    }

    // Parse Education Section with enhanced accuracy
    if (parsedSections.rawSections.education) {
      parsedSections.education = this.parseEducationSection(parsedSections.rawSections.education);
    }

    // Parse Experience/Internship Sections
    if (parsedSections.rawSections.experience) {
      parsedSections.experience = this.parseExperienceSection(parsedSections.rawSections.experience);
    }
    
    if (parsedSections.rawSections.internship) {
      parsedSections.internships = this.parseExperienceSection(parsedSections.rawSections.internship);
    }

    // Parse Projects Section
    if (parsedSections.rawSections.projects) {
      parsedSections.projects = this.parseProjectsSection(parsedSections.rawSections.projects);
    }

    // Parse Skills Section with categorization
    if (parsedSections.rawSections.skills) {
      parsedSections.skills = this.parseSkillsSection(parsedSections.rawSections.skills);
    }

    // Parse Achievements Section
    if (parsedSections.rawSections.achievements) {
      parsedSections.achievements = this.parseAchievementsSection(parsedSections.rawSections.achievements);
    }

    // Extract objective/summary
    if (parsedSections.rawSections.objective) {
      parsedSections.objective = parsedSections.rawSections.objective;
    }

    console.log('✅ Resume structure parsed successfully');
    return parsedSections;
  }

  // Fallback section parsing when main patterns fail
  fallbackSectionParsing(resumeText) {
    console.log('🔄 Attempting fallback section parsing...');
    const fallbackSections = {};
    
    // Split by common section headers
    const sections = resumeText.split(/\n(?=(?:Objective|Education|Experience|Skills|Projects|Internship|Achievements|Work|Employment|Career|Training|Summary|Profile|About)\b)/i);
    
    for (const section of sections) {
      const lines = section.split('\n');
      const header = lines[0].trim().toLowerCase();
      const content = lines.slice(1).join('\n').trim();
      
      if (content.length > 0) {
        if (header.includes('objective') || header.includes('summary') || header.includes('profile') || header.includes('about')) {
          fallbackSections.objective = content;
          console.log('📝 Fallback found: Objective');
        } else if (header.includes('education') || header.includes('academic') || header.includes('qualification')) {
          fallbackSections.education = content;
          console.log('🎓 Fallback found: Education');
        } else if (header.includes('experience') || header.includes('employment') || header.includes('work')) {
          fallbackSections.experience = content;
          console.log('💼 Fallback found: Experience');
        } else if (header.includes('internship') || header.includes('intern') || header.includes('training')) {
          fallbackSections.internship = content;
          console.log('🎯 Fallback found: Internship');
        } else if (header.includes('project')) {
          fallbackSections.projects = content;
          console.log('🚀 Fallback found: Projects');
        } else if (header.includes('skill') || header.includes('technical') || header.includes('competenc')) {
          fallbackSections.skills = content;
          console.log('⚡ Fallback found: Skills');
        } else if (header.includes('achievement') || header.includes('award') || header.includes('honor') || header.includes('certification')) {
          fallbackSections.achievements = content;
          console.log('🏆 Fallback found: Achievements');
        }
      }
    }
    
    return fallbackSections;
  }

  // Parse Education Section with detailed information extraction
  parseEducationSection(educationText) {
    const educationEntries = [];
    const lines = educationText.split(/\n|;/).filter(line => line.trim());
    
    let currentEntry = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this is a new education entry (contains degree or school pattern)
      if (this.educationPatterns.degree.test(trimmedLine) || this.educationPatterns.school.test(trimmedLine)) {
        // Save previous entry if exists
        if (currentEntry) {
          educationEntries.push(currentEntry);
        }
        
        // Start new entry
        currentEntry = {
          degree: '',
          institution: '',
          location: '',
          year: '',
          grade: '',
          details: []
        };

        // Extract degree/qualification
        const degreeMatch = trimmedLine.match(/(.*?)(?:,|\s*-\s*|\s{2,})/);
        if (degreeMatch) {
          currentEntry.degree = degreeMatch[1].trim();
        }

        // Extract institution
        const institutionMatch = trimmedLine.match(/(?:,\s*|-)(.+?)(?:,|\s*-\s*|\d{4}|$)/);
        if (institutionMatch) {
          currentEntry.institution = institutionMatch[1].trim();
        }

        // Extract year
        const yearMatch = trimmedLine.match(this.educationPatterns.year);
        if (yearMatch) {
          currentEntry.year = yearMatch[0];
        }
      }

      // Extract percentage/CGPA
      const gradeMatch = trimmedLine.match(this.educationPatterns.percentage);
      if (gradeMatch && currentEntry) {
        currentEntry.grade = gradeMatch[0];
      }

      // Add additional details
      if (currentEntry && trimmedLine.includes(':') && !gradeMatch) {
        currentEntry.details.push(trimmedLine);
      }
    }

    // Add the last entry
    if (currentEntry) {
      educationEntries.push(currentEntry);
    }

    return educationEntries;
  }

  // Parse Experience/Internship Section
  parseExperienceSection(experienceText) {
    const experiences = [];
    const lines = experienceText.split('\n').filter(line => line.trim());
    
    let currentExp = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this is a new experience entry (contains job title pattern)
      if (trimmedLine.match(/^[A-Z].*?(?:,|\s*\||\s{2,})/)) {
        // Save previous experience
        if (currentExp) {
          experiences.push(currentExp);
        }
        
        // Start new experience
        currentExp = {
          title: '',
          company: '',
          location: '',
          duration: '',
          responsibilities: []
        };

        // Parse title and company from the line
        const parts = trimmedLine.split(/,|\|/);
        if (parts.length >= 2) {
          currentExp.title = parts[0].trim();
          currentExp.company = parts[1].trim();
          
          // Extract duration
          const durationMatch = trimmedLine.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}.*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|\d{4}\s*[-–]\s*\d{4}/);
          if (durationMatch) {
            currentExp.duration = durationMatch[0];
          }
        }
      }
      
      // Add responsibility/achievement points
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        if (currentExp) {
          currentExp.responsibilities.push(trimmedLine.replace(/^[•\-*]\s*/, ''));
        }
      }
    }

    // Add the last experience
    if (currentExp) {
      experiences.push(currentExp);
    }

    return experiences;
  }

  // Parse Projects Section
  parseProjectsSection(projectsText) {
    const projects = [];
    const lines = projectsText.split('\n').filter(line => line.trim());
    
    let currentProject = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this is a new project entry
      if (trimmedLine.match(/^[A-Z].*?\|.*?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})/)) {
        // Save previous project
        if (currentProject) {
          projects.push(currentProject);
        }
        
        // Start new project
        const parts = trimmedLine.split('|');
        currentProject = {
          title: parts[0] ? parts[0].trim() : '',
          technologies: parts[1] ? parts[1].trim() : '',
          duration: parts[2] ? parts[2].trim() : '',
          description: [],
          achievements: []
        };
      }
      
      // Add project details
      else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        if (currentProject) {
          const detail = trimmedLine.replace(/^[•\-*]\s*/, '');
          currentProject.description.push(detail);
        }
      }
    }

    // Add the last project
    if (currentProject) {
      projects.push(currentProject);
    }

    return projects;
  }

  // Parse Skills Section with enhanced categorization
  parseSkillsSection(skillsText) {
    const skills = {
      technical: [],
      soft: [],
      languages: []
    };

    // Handle the specific format from your resume: "Languages:Java, C, Python"
    const lines = skillsText.split(/\n/).filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check for category patterns with colon
      if (trimmedLine.includes(':')) {
        const [category, skillsStr] = trimmedLine.split(':', 2);
        const categoryLower = category.toLowerCase();
        const skillsList = skillsStr.split(/,/).map(s => s.trim()).filter(s => s);
        
        if (categoryLower.includes('language') || categoryLower.includes('programming')) {
          skills.languages.push(...skillsList);
        } else if (categoryLower.includes('soft') || categoryLower.includes('communication') || categoryLower.includes('leadership')) {
          skills.soft.push(...skillsList);
        } else if (categoryLower.includes('web') || categoryLower.includes('data') || categoryLower.includes('ai') || categoryLower.includes('technical')) {
          skills.technical.push(...skillsList);
        } else {
          // Default to technical if unsure
          skills.technical.push(...skillsList);
        }
      } else {
        // Handle lines without clear categories
        const skillsList = trimmedLine.split(/,/).map(s => s.trim()).filter(s => s);
        
        // Try to categorize based on skill content
        for (const skill of skillsList) {
          const skillLower = skill.toLowerCase();
          if (['java', 'python', 'c', 'javascript', 'html', 'css'].includes(skillLower)) {
            skills.languages.push(skill);
          } else if (['communication', 'leadership', 'teamwork', 'collaboration', 'thinking', 'adaptability'].some(soft => skillLower.includes(soft))) {
            skills.soft.push(skill);
          } else {
            skills.technical.push(skill);
          }
        }
      }
    }

    return skills;
  }

  // Parse Achievements Section
  parseAchievementsSection(achievementsText) {
    const achievements = [];
    const lines = achievementsText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*'))) {
        achievements.push(trimmedLine.replace(/^[•\-*]\s*/, ''));
      } else if (trimmedLine && !trimmedLine.toLowerCase().includes('achievement')) {
        achievements.push(trimmedLine);
      }
    }

    return achievements;
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
    const keywordGap = resumeAnalysis.ats.keywordGap || (100 - resumeAnalysis.ats.overallScore);
    if (keywordGap > 30) {
      suggestions.push({
        category: 'ATS Optimization',
        priority: 'CRITICAL',
        title: 'Critical Keyword Gap Detected',
        issue: `Only ${Math.round(100 - keywordGap)}% keyword match with job description`,
        suggestion: `Incorporate these missing keywords naturally: ${(resumeAnalysis.ats.missingKeywords || []).slice(0, 8).join(', ')}. Add them to your skills section and project descriptions.`,
        impact: 'Improving keyword match above 70% increases ATS success rate by 300%',
        keywords: (resumeAnalysis.ats.missingKeywords || []).slice(0, 10)
      });
    }
    
    if ((resumeAnalysis.ats.skillsMismatch || []).length > 0) {
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
    if ((resumeAnalysis.formatting?.issues || []).length > 0) {
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
  
  // Perform deep analysis of resume content with enhanced parsing
  async performDeepResumeAnalysis(resumeText, jobDescription) {
    console.log('🔍 Performing enhanced deep resume analysis...');
    
    // First, parse the resume structure accurately
    const parsedResume = await this.parseResumeStructure(resumeText);
    
    const analysis = {
      content: {},
      structure: {},
      ats: {},
      formatting: {},
      careerLevel: 'unknown',
      parsedSections: parsedResume
    };
    
    const resumeLower = resumeText.toLowerCase();
    const jobDescLower = jobDescription.toLowerCase();
    
    // Enhanced Content Analysis using parsed sections
    analysis.content.missingQuantifiableAchievements = !this.hasQuantifiableAchievements(resumeText);
    analysis.content.weakActionVerbs = this.hasWeakActionVerbs(resumeText);
    analysis.content.vagueDescriptions = this.hasVagueDescriptions(resumeText);
    analysis.content.sectionQuality = this.analyzeSectionQuality(parsedResume);
    
    // Enhanced Structure Analysis
    analysis.structure.missingSections = this.findMissingSections(resumeText);
    analysis.structure.poorOrganization = this.hasPoorOrganization(resumeText);
    analysis.structure.sectionCompleteness = this.evaluateSectionCompleteness(parsedResume);
    
    // Enhanced ATS Analysis with parsed skills
    const atsAnalysis = this.performEnhancedATSAnalysis(parsedResume, jobDescription);
    analysis.ats = atsAnalysis;
    
    // Formatting Analysis
    analysis.formatting.issues = this.findFormattingIssues(resumeText);
    
    // Career Level Detection using parsed experience
    analysis.careerLevel = this.detectCareerLevelFromParsed(parsedResume);
    
    console.log('✅ Enhanced deep analysis completed');
    return analysis;
  }

  // Analyze quality of each parsed section
  analyzeSectionQuality(parsedResume) {
    const sectionQuality = {};
    
    // Objective quality
    if (parsedResume.objective) {
      sectionQuality.objective = {
        length: parsedResume.objective.length,
        isGeneric: this.isGenericObjective(parsedResume.objective),
        hasKeywords: this.containsRelevantKeywords(parsedResume.objective)
      };
    }
    
    // Education quality
    sectionQuality.education = {
      count: parsedResume.education.length,
      hasGrades: parsedResume.education.some(edu => edu.grade),
      hasRecentEducation: this.hasRecentEducation(parsedResume.education)
    };
    
    // Experience/Internship quality
    sectionQuality.experience = {
      totalExperience: parsedResume.experience.length + parsedResume.internships.length,
      hasQuantifiedResults: this.hasQuantifiedExperienceResults(parsedResume.experience, parsedResume.internships),
      hasRelevantExperience: this.hasRelevantExperience(parsedResume.experience, parsedResume.internships)
    };
    
    // Projects quality
    sectionQuality.projects = {
      count: parsedResume.projects.length,
      hasTechnologies: parsedResume.projects.some(proj => proj.technologies),
      hasDetailedDescriptions: this.hasDetailedProjectDescriptions(parsedResume.projects)
    };
    
    // Skills quality
    sectionQuality.skills = {
      technicalCount: parsedResume.skills.technical.length,
      softCount: parsedResume.skills.soft.length,
      languageCount: parsedResume.skills.languages.length,
      isWellCategorized: this.isSkillsWellCategorized(parsedResume.skills)
    };
    
    return sectionQuality;
  }

  // Enhanced ATS Analysis using parsed skills
  performEnhancedATSAnalysis(parsedResume, jobDescription) {
    const atsAnalysis = {
      skillsMatch: 0,
      missingKeywords: [],
      matchedKeywords: [],
      skillsMismatch: [],
      technicalSkillsMatch: 0,
      softSkillsMatch: 0,
      overallScore: 0,
      keywordGap: 0
    };
    
    const jobLower = jobDescription.toLowerCase();
    
    // Analyze technical skills match
    let technicalMatches = 0;
    const technicalTotal = this.skillKeywords.technical.length;
    
    for (const skill of this.skillKeywords.technical) {
      if (jobLower.includes(skill.toLowerCase())) {
        if (parsedResume.skills.technical.some(resumeSkill => 
            resumeSkill.toLowerCase().includes(skill.toLowerCase()))) {
          technicalMatches++;
          atsAnalysis.matchedKeywords.push(skill);
        } else {
          atsAnalysis.missingKeywords.push(skill);
        }
      }
    }
    
    // Analyze soft skills match
    let softMatches = 0;
    const softTotal = this.skillKeywords.soft.length;
    
    for (const skill of this.skillKeywords.soft) {
      if (jobLower.includes(skill.toLowerCase())) {
        if (parsedResume.skills.soft.some(resumeSkill => 
            resumeSkill.toLowerCase().includes(skill.toLowerCase()))) {
          softMatches++;
          atsAnalysis.matchedKeywords.push(skill);
        } else {
          atsAnalysis.missingKeywords.push(skill);
        }
      }
    }
    
    atsAnalysis.technicalSkillsMatch = (technicalMatches / Math.max(technicalTotal, 1)) * 100;
    atsAnalysis.softSkillsMatch = (softMatches / Math.max(softTotal, 1)) * 100;
    atsAnalysis.skillsMatch = (technicalMatches + softMatches) / Math.max(technicalTotal + softTotal, 1) * 100;
    atsAnalysis.overallScore = (atsAnalysis.technicalSkillsMatch * 0.7) + (atsAnalysis.softSkillsMatch * 0.3);
    
    // Calculate keyword gap (how much is missing)
    atsAnalysis.keywordGap = Math.max(0, 100 - atsAnalysis.overallScore);
    
    // Set skillsMismatch to missingKeywords for backward compatibility
    atsAnalysis.skillsMismatch = [...atsAnalysis.missingKeywords];
    
    return atsAnalysis;
  }

  // Detect career level from parsed resume
  detectCareerLevelFromParsed(parsedResume) {
    const totalExperience = parsedResume.experience.length + parsedResume.internships.length;
    const projectCount = parsedResume.projects.length;
    const hasAdvancedSkills = parsedResume.skills.technical.some(skill => 
      ['TensorFlow', 'Machine Learning', 'AI', 'Deep Learning', 'Data Science'].includes(skill));
    
    if (totalExperience === 0 && projectCount >= 3) {
      return 'student/fresher';
    } else if (totalExperience <= 2 && projectCount >= 2) {
      return 'junior';
    } else if (totalExperience <= 5 || hasAdvancedSkills) {
      return 'mid-level';
    } else {
      return 'senior';
    }
  }
  
  // Helper functions for enhanced analysis
  isGenericObjective(objective) {
    const genericPhrases = ['seeking a position', 'looking for opportunity', 'hardworking', 'team player'];
    return genericPhrases.some(phrase => objective.toLowerCase().includes(phrase));
  }

  containsRelevantKeywords(text) {
    const relevantKeywords = [...this.skillKeywords.technical, ...this.skillKeywords.soft];
    return relevantKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
  }

  hasRecentEducation(education) {
    const currentYear = new Date().getFullYear();
    return education.some(edu => {
      const yearMatch = edu.year.match(/(\d{4})/g);
      if (yearMatch) {
        const latestYear = Math.max(...yearMatch.map(Number));
        return (currentYear - latestYear) <= 2;
      }
      return false;
    });
  }

  hasQuantifiedExperienceResults(experiences, internships) {
    const allExperiences = [...experiences, ...internships];
    return allExperiences.some(exp => 
      exp.responsibilities.some(resp => 
        /\d+\s*%|\$\d+|\d+\s*(users|customers|projects?|team|people)/i.test(resp)
      )
    );
  }

  hasRelevantExperience(experiences, internships) {
    const allExperiences = [...experiences, ...internships];
    return allExperiences.some(exp => 
      this.skillKeywords.technical.some(skill => 
        exp.title.toLowerCase().includes(skill.toLowerCase()) ||
        exp.responsibilities.some(resp => resp.toLowerCase().includes(skill.toLowerCase()))
      )
    );
  }

  hasDetailedProjectDescriptions(projects) {
    return projects.some(proj => 
      proj.description.length >= 2 && 
      proj.description.some(desc => desc.length > 50)
    );
  }

  isSkillsWellCategorized(skills) {
    return skills.technical.length > 0 && skills.soft.length > 0;
  }

  evaluateSectionCompleteness(parsedResume) {
    const completeness = {
      personalInfo: !!parsedResume.personalInfo.name && !!parsedResume.personalInfo.email,
      objective: !!parsedResume.objective && parsedResume.objective.length > 20,
      education: parsedResume.education.length > 0,
      experience: (parsedResume.experience.length + parsedResume.internships.length) > 0,
      projects: parsedResume.projects.length > 0,
      skills: parsedResume.skills.technical.length > 0,
      achievements: parsedResume.achievements.length > 0
    };
    
    const completedSections = Object.values(completeness).filter(Boolean).length;
    const totalSections = Object.keys(completeness).length;
    
    return {
      score: (completedSections / totalSections) * 100,
      missing: Object.keys(completeness).filter(key => !completeness[key]),
      details: completeness
    };
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

  // Generate optimized resume with enhanced parsing and professional layout
  async generateOptimizedResume(originalResume, jobDescription, personalInfo) {
    console.log('📝 Generating optimized resume with enhanced parsing...');
    console.log('Input originalResume length:', originalResume?.length || 0);
    console.log('Personal info received:', personalInfo);
    
    // Use enhanced parsing system
    const parsedResume = await this.parseResumeStructure(originalResume);
    const jobRole = await this.detectJobRole(jobDescription);
    
    console.log('Enhanced parsed resume data:', {
      education: parsedResume.education?.length || 0,
      skills: parsedResume.skills?.technical?.length || 0,
      experience: parsedResume.experience?.length || 0,
      projects: parsedResume.projects?.length || 0,
      internships: parsedResume.internships?.length || 0,
      achievements: parsedResume.achievements?.length || 0
    });
    
    const sections = [];
    
    // 1. CENTERED NAME (use parsed or provided name)
    const finalName = personalInfo.name || parsedResume.personalInfo.name || 'NAME';
    sections.push(`${finalName.toUpperCase()}`);
    sections.push('');
    
    // 2. CONTACT LINE - email | phone | linkedin (one line)
    const contactInfo = [];
    const finalEmail = personalInfo.email || parsedResume.personalInfo.email;
    const finalPhone = personalInfo.contact || personalInfo.phone || parsedResume.personalInfo.phone;
    const finalLinkedIn = personalInfo.linkedin || parsedResume.personalInfo.linkedin;
    
    if (finalEmail) contactInfo.push(finalEmail);
    if (finalPhone) contactInfo.push(finalPhone);
    if (finalLinkedIn) contactInfo.push(finalLinkedIn);
    
    if (contactInfo.length > 0) {
      sections.push(contactInfo.join(' | '));
      sections.push('');
    }
    
    // 3. OBJECTIVE (enhanced with parsed data)
    sections.push('Objective');
    const objective = await this.generateEnhancedObjective(jobRole, jobDescription, parsedResume);
    sections.push(objective);
    sections.push('');
    
    // 4. EDUCATION (properly formatted from parsed data)
    if (parsedResume.education && parsedResume.education.length > 0) {
      sections.push('Education');
      const formattedEducation = this.formatParsedEducation(parsedResume.education);
      formattedEducation.forEach(edu => sections.push(edu));
      sections.push('');
    } else if (parsedResume.rawSections.education) {
      // Fallback: use raw education text if structured parsing failed
      sections.push('Education');
      const rawEducation = this.formatRawEducationText(parsedResume.rawSections.education);
      rawEducation.forEach(edu => sections.push(edu));
      sections.push('');
    }
    
    // 5. SKILLS (properly categorized from parsed data)
    if (parsedResume.skills.technical.length > 0 || parsedResume.skills.soft.length > 0) {
      sections.push('Skills');
      const formattedSkills = this.formatParsedSkills(parsedResume.skills, jobDescription);
      formattedSkills.forEach(skill => sections.push(skill));
      sections.push('');
    } else if (parsedResume.rawSections.skills) {
      // Fallback: use raw skills text if structured parsing failed
      sections.push('Skills');
      const skillLines = parsedResume.rawSections.skills.split('\n').filter(line => line.trim());
      skillLines.forEach(skill => sections.push(skill));
      sections.push('');
    }
    
    // 6. EXPERIENCE (if available)
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      sections.push('Experience');
      const formattedExperience = this.formatParsedExperience(parsedResume.experience, 'experience');
      formattedExperience.forEach(exp => sections.push(exp));
    }
    
    // 7. INTERNSHIPS (always show if available)
    if (parsedResume.internships && parsedResume.internships.length > 0) {
      sections.push('Internship');
      const formattedInternships = this.formatParsedExperience(parsedResume.internships, 'internship');
      formattedInternships.forEach(intern => sections.push(intern));
    }
    
    // 8. PROJECTS (properly formatted from parsed data)
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      sections.push('Projects');
      const formattedProjects = this.formatParsedProjects(parsedResume.projects);
      formattedProjects.forEach(project => sections.push(project));
    } else if (parsedResume.rawSections.projects) {
      // Fallback: use raw projects text if structured parsing failed
      sections.push('Projects');
      const projectLines = parsedResume.rawSections.projects.split('\n').filter(line => line.trim());
      projectLines.forEach(project => sections.push(project));
      sections.push('');
    }
    
    // 9. ACHIEVEMENTS (if available)
    if (parsedResume.achievements && parsedResume.achievements.length > 0) {
      sections.push('Achievements');
      parsedResume.achievements.forEach(achievement => {
        sections.push(`• ${achievement}`);
      });
      sections.push('');
    } else if (parsedResume.rawSections.achievements) {
      // Fallback: use raw achievements text if structured parsing failed
      sections.push('Achievements');
      const achievementLines = parsedResume.rawSections.achievements.split('\n').filter(line => line.trim());
      achievementLines.forEach(achievement => {
        sections.push(achievement.startsWith('•') ? achievement : `• ${achievement}`);
      });
      sections.push('');
    }
    
    // FALLBACK: If no content was extracted, use original resume
    if (sections.length <= 5) { // Only basic info (name, contact, objective, skills header)
      console.log('⚠️ Warning: Limited content extracted, using original resume as fallback');
      
      // Add the original resume content with basic formatting
      sections.push('');
      sections.push('Resume Content');
      sections.push('');
      
      const originalLines = originalResume.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      originalLines.forEach(line => {
        if (line.length > 3 && !line.match(/^(name|email|phone|contact|linkedin|github):/i)) {
          sections.push(line);
        }
      });
    }
    
    let finalResume = sections.join('\n');
    
    // Clean up any remaining asterisks and formatting issues
    finalResume = this.cleanResumeFormatting(finalResume);
    
    // Final validation and cleanup
    finalResume = this.validateAndCleanFinalResume(finalResume, personalInfo);
    
    console.log('Generated resume preview:', finalResume.substring(0, 500) + '...');
    console.log('Final resume length:', finalResume.length);
    
    return finalResume;
  }

  // Clean resume formatting - remove unwanted asterisks and fix formatting
  cleanResumeFormatting(resumeText) {
    let cleaned = resumeText;
    
    // Remove double and multiple asterisks
    cleaned = cleaned.replace(/\*{2,}/g, '');
    
    // Remove single asterisks that are not bullet points
    cleaned = cleaned.replace(/\*(?!\s)/g, '');
    cleaned = cleaned.replace(/(?<!\s)\*/g, '');
    
    // Clean up lines - remove asterisks at start/end of lines
    const lines = cleaned.split('\n').map(line => {
      let cleanLine = line.trim();
      // Remove asterisks at the beginning or end of lines (but keep bullet points)
      if (!cleanLine.startsWith('• ') && !cleanLine.startsWith('- ')) {
        cleanLine = cleanLine.replace(/^\*+/, '').replace(/\*+$/, '').trim();
      }
      return cleanLine;
    });
    
    // Remove empty lines and join
    cleaned = lines.filter(line => line.trim().length > 0).join('\n');
    
    // Add proper spacing between sections
    cleaned = cleaned.replace(/\n([A-Z][a-zA-Z\s]+)\n/g, '\n\n$1\n');
    
    return cleaned;
  }

  // Final validation and cleanup of the resume
  validateAndCleanFinalResume(resumeText, personalInfo) {
    let lines = resumeText.split('\n');
    const cleanedLines = [];
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Skip empty lines in the middle of content (keep one line breaks between sections)
      if (!line) continue;
      
      // Remove any remaining asterisks except bullet points
      if (!line.startsWith('• ')) {
        line = line.replace(/\*/g, '');
      }
      
      // Detect section headers and ensure proper casing
      if (['objective', 'education', 'skills', 'experience', 'internship', 'projects', 'achievements'].includes(line.toLowerCase())) {
        // Add spacing before section headers (except first section)
        if (cleanedLines.length > 0) {
          cleanedLines.push('');
        }
        currentSection = line.toLowerCase();
        cleanedLines.push(line.charAt(0).toUpperCase() + line.slice(1));
        continue;
      }
      
      // Clean up content lines
      if (line.length > 0) {
        // Remove education items that ended up in wrong sections
        if (currentSection === 'achievements' || currentSection === 'projects') {
          const educationPatterns = /\b(b\.tech|bachelor|degree|university|college|sslc|hsc|10th|12th|cgpa|percentage)\b/i;
          if (educationPatterns.test(line)) {
            continue; // Skip education items in wrong sections
          }
        }
        
        cleanedLines.push(line);
      }
    }
    
    return cleanedLines.join('\n');
  }

  // Enhanced objective generation using parsed data
  async generateEnhancedObjective(jobRole, jobDescription, parsedResume) {
    const keySkills = parsedResume.skills.technical.slice(0, 3).join(', ');
    const careerLevel = this.detectCareerLevelFromParsed(parsedResume);
    const hasExperience = parsedResume.experience.length > 0 || parsedResume.internships.length > 0;
    const projectCount = parsedResume.projects.length;
    
    let objective = '';
    
    if (careerLevel === 'student/fresher') {
      objective = `Passionate ${jobRole || 'professional'} with expertise in ${keySkills}. `;
      if (hasExperience) {
        objective += `Proven experience through internships and ${projectCount}+ hands-on projects. `;
      } else {
        objective += `Strong foundation built through ${projectCount}+ practical projects and academic excellence. `;
      }
      objective += `Focused on creating data-driven solutions and delivering measurable results.`;
    } else if (careerLevel === 'junior') {
      objective = `Motivated ${jobRole || 'professional'} with experience in ${keySkills}. `;
      objective += `Track record of successful project delivery and continuous learning. `;
      objective += `Seeking to leverage technical skills and experience to drive innovation and growth.`;
    } else {
      objective = `Experienced ${jobRole || 'professional'} specializing in ${keySkills}. `;
      objective += `Proven ability to lead projects and deliver high-impact solutions. `;
      objective += `Looking to contribute strategic technical expertise to challenging projects.`;
    }
    
    return objective;
  }

  // Format parsed education with proper structure - handles raw text too
  formatParsedEducation(educationArray) {
    const formatted = [];
    
    // If educationArray is empty but we have raw education text, parse it directly
    if (educationArray.length === 0) {
      console.log('⚠️ Education array empty, checking for raw education text');
      return formatted;
    }
    
    educationArray.forEach(edu => {
      let eduLine = '';
      
      // Format: Degree, Institution, Year
      if (edu.degree) {
        eduLine = edu.degree;
        if (edu.institution) {
          eduLine += `, ${edu.institution}`;
        }
        if (edu.year) {
          eduLine += `, ${edu.year}`;
        }
        
        // Add grade if available
        if (edu.grade) {
          eduLine += ` - ${edu.grade}`;
        }
        
        formatted.push(eduLine);
      } else if (typeof edu === 'string') {
        // Handle case where education is still raw text
        formatted.push(edu);
      }
    });
    
    // Sort by year (most recent first)
    formatted.sort((a, b) => {
      const yearA = a.match(/(\d{4})/g);
      const yearB = b.match(/(\d{4})/g);
      if (yearA && yearB) {
        return Math.max(...yearB.map(Number)) - Math.max(...yearA.map(Number));
      }
      return 0;
    });
    
    return formatted;
  }

  // Simple fallback formatter for raw education text
  formatRawEducationText(rawText) {
    const lines = rawText.split('\n').filter(line => line.trim());
    const formatted = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.toLowerCase().startsWith('education') && trimmedLine.length > 10) {
        formatted.push(trimmedLine);
      }
    }
    
    return formatted;
  }

  // Format parsed skills with proper categorization
  formatParsedSkills(skillsObject, jobDescription) {
    const formatted = [];
    
    // Technical Skills
    if (skillsObject.technical.length > 0) {
      const relevantTechnical = this.filterRelevantSkills(skillsObject.technical, jobDescription);
      formatted.push(`Technical: ${relevantTechnical.join(', ')}`);
    }
    
    // Programming Languages
    if (skillsObject.languages.length > 0) {
      formatted.push(`Languages: ${skillsObject.languages.join(', ')}`);
    }
    
    // Soft Skills
    if (skillsObject.soft.length > 0) {
      formatted.push(`Soft Skills: ${skillsObject.soft.join(', ')}`);
    }
    
    return formatted;
  }

  // Format parsed experience with proper structure
  formatParsedExperience(experienceArray, type = 'experience') {
    const formatted = [];
    
    experienceArray.forEach(exp => {
      // Job Title, Company, Duration
      let expHeader = '';
      if (exp.title) {
        expHeader = exp.title;
        if (exp.company) {
          expHeader += `, ${exp.company}`;
        }
        if (exp.duration) {
          expHeader += `, ${exp.duration}`;
        }
      }
      
      if (expHeader) {
        formatted.push(expHeader);
        
        // Add responsibilities as bullet points
        exp.responsibilities.forEach(resp => {
          formatted.push(`• ${resp}`);
        });
        
        formatted.push(''); // Add spacing between experiences
      }
    });
    
    return formatted;
  }

  // Format parsed projects with proper structure
  formatParsedProjects(projectsArray) {
    const formatted = [];
    
    projectsArray.forEach(proj => {
      // Project Title | Technologies | Duration
      let projHeader = '';
      if (proj.title) {
        projHeader = proj.title;
        if (proj.technologies) {
          projHeader += ` | ${proj.technologies}`;
        }
        if (proj.duration) {
          projHeader += ` | ${proj.duration}`;
        }
      }
      
      if (projHeader) {
        formatted.push(projHeader);
        
        // Add project descriptions as bullet points
        proj.description.forEach(desc => {
          formatted.push(`• ${desc}`);
        });
        
        formatted.push(''); // Add spacing between projects
      }
    });
    
    return formatted;
  }

  // Filter relevant skills based on job description
  filterRelevantSkills(skills, jobDescription) {
    const jobLower = jobDescription.toLowerCase();
    const relevantSkills = [];
    const otherSkills = [];
    
    skills.forEach(skill => {
      if (jobLower.includes(skill.toLowerCase())) {
        relevantSkills.push(skill);
      } else {
        otherSkills.push(skill);
      }
    });
    
    // Return relevant skills first, then others (limited to reasonable number)
    return [...relevantSkills, ...otherSkills.slice(0, Math.max(0, 8 - relevantSkills.length))];
  }

  // Generate compact objective (3 lines max)
  async generateCompactObjective(jobRole, jobDescription, resumeData) {
    const keyTech = this.extractKeyTechnologies(resumeData.skills);
    const hasProjects = resumeData.projects && resumeData.projects.length > 0;
    const hasInternships = resumeData.internships && resumeData.internships.length > 0;
    
    let objective = `Motivated ${jobRole || 'professional'} with expertise in ${keyTech}. `;
    if (hasInternships) {
      objective += `Proven experience through internships and hands-on projects. `;
    } else if (hasProjects) {
      objective += `Strong foundation built through practical projects and academic excellence. `;
    }
    objective += `Seeking to leverage technical skills to contribute effectively in a dynamic role.`;
    
    return objective;
  }

  // Format compact education (degree percentage format)
  formatCompactEducation(education) {
    const formatted = [];
    education.forEach(edu => {
      const lines = edu.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // First line with degree, then percentage if available
        let eduLine = lines[0].replace(/^[•\-\*]\s*/, '').trim();
        
        // Look for percentage in subsequent lines
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].includes('%') || lines[i].toLowerCase().includes('percentage') || lines[i].toLowerCase().includes('cgpa')) {
            eduLine += ` - ${lines[i].trim()}`;
            break;
          }
        }
        formatted.push(eduLine);
      }
    });
    return formatted;
  }

  // Generate compact skills (job role related)
  async generateCompactSkills(jobRole, jobDescription, resumeData) {
    const allSkills = [];
    resumeData.skills.forEach(skillLine => {
      const skills = skillLine.split(/[,•\-:]+/).map(s => s.trim()).filter(s => s.length > 1);
      allSkills.push(...skills);
    });
    
    // Categorize skills compactly
    const technical = allSkills.filter(skill => 
      ['python', 'javascript', 'java', 'react', 'node', 'html', 'css', 'sql', 'mongodb', 'tensorflow', 'scikit', 'pandas', 'numpy', 'c++', 'c#'].some(tech => 
        skill.toLowerCase().includes(tech)
      )
    );
    
    const tools = allSkills.filter(skill => 
      ['git', 'docker', 'aws', 'azure', 'jenkins', 'vs code', 'jupyter', 'tableau', 'power bi', 'postman'].some(tool => 
        skill.toLowerCase().includes(tool)
      )
    );
    
    const formatted = [];
    if (technical.length > 0) {
      formatted.push(`Technical: ${technical.slice(0, 8).join(', ')}`);
    }
    if (tools.length > 0) {
      formatted.push(`Tools & Frameworks: ${tools.slice(0, 6).join(', ')}`);
    }
    
    return formatted;
  }

  // Format compact experience (company name in bold, 2 bullet points)
  formatCompactExperience(experience) {
    const formatted = [];
    experience.forEach(exp => {
      const lines = exp.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Extract company and title from first line
        const firstLine = lines[0].replace(/^[•\-\*]\s*/, '').trim();
        formatted.push(`**${firstLine}**`);
        
        // Add up to 2 bullet points
        let bulletCount = 0;
        for (let i = 1; i < lines.length && bulletCount < 2; i++) {
          const line = lines[i].replace(/^[•\-\*]\s*/, '').trim();
          if (line && line.length > 10) {
            formatted.push(`• ${line}`);
            bulletCount++;
          }
        }
      }
    });
    return formatted;
  }

  // Format compact internships (same format as experience)
  formatCompactInternships(internships) {
    const formatted = [];
    internships.forEach(intern => {
      const lines = intern.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/^[•\-\*]\s*/, '').trim();
        formatted.push(`**${firstLine}**`);
        
        let bulletCount = 0;
        for (let i = 1; i < lines.length && bulletCount < 2; i++) {
          const line = lines[i].replace(/^[•\-\*]\s*/, '').trim();
          if (line && line.length > 10) {
            formatted.push(`• ${line}`);
            bulletCount++;
          }
        }
      }
    });
    return formatted;
  }

  // Format compact projects (clean title format, proper bullet points)
  formatCompactProjects(projects) {
    const formatted = [];
    projects.forEach(project => {
      const lines = project.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Extract project title - clean format without asterisks
        const firstLine = lines[0].replace(/^[•\-\*\s]+/, '').trim();
        // Remove common prefixes and clean up
        let cleanTitle = firstLine.replace(/^(project|title):\s*/i, '').trim();
        
        // Remove any existing asterisks or markdown formatting
        cleanTitle = cleanTitle.replace(/\*+/g, '').trim();
        
        // Format: Project Name | Technology | Date (if available)
        formatted.push(cleanTitle);
        
        let bulletCount = 0;
        for (let i = 1; i < lines.length && bulletCount < 2; i++) {
          let line = lines[i].replace(/^[•\-\*\s]+/, '').trim();
          // Clean any asterisks from content
          line = line.replace(/\*+/g, '').trim();
          
          if (line && line.length > 15) {
            formatted.push(`• ${line}`);
            bulletCount++;
          }
        }
      }
    });
    return formatted;
  }

  // Format compact achievements (filter out education items)
  formatCompactAchievements(achievements) {
    const formatted = [];
    achievements.forEach(achievement => {
      let cleanAchievement = achievement.replace(/^[•\-\*\s]+/, '').trim();
      
      // Remove asterisks from achievement text
      cleanAchievement = cleanAchievement.replace(/\*+/g, '').trim();
      
      // Skip if it looks like education (contains degree names, school keywords, etc.)
      const educationKeywords = ['b.tech', 'bachelor', 'degree', 'university', 'college', 'school', 
                                'sslc', 'hsc', '10th', '12th', 'cgpa', 'percentage', 'marks'];
      const isEducation = educationKeywords.some(keyword => 
        cleanAchievement.toLowerCase().includes(keyword)
      );
      
      if (!isEducation && cleanAchievement && cleanAchievement.length > 10) {
        formatted.push(`• ${cleanAchievement}`);
      }
    });
    return formatted.slice(0, 4); // Limit to 4 achievements for space
  }

  // Extract key technologies from skills
  extractKeyTechnologies(skills) {
    const allSkills = [];
    skills.forEach(skillLine => {
      const skillsArray = skillLine.split(/[,•\-:]+/).map(s => s.trim()).filter(s => s.length > 1);
      allSkills.push(...skillsArray);
    });
    
    const keyTech = allSkills.filter(skill => 
      ['python', 'javascript', 'java', 'react', 'node', 'ai', 'machine learning', 'data science', 'tensorflow'].some(tech => 
        skill.toLowerCase().includes(tech)
      )
    );
    
    return keyTech.slice(0, 3).join(', ') || 'modern technologies';
  }

  // Extract all resume data from original text
  async extractResumeData(resumeText) {
    console.log('🔍 Extracting resume data from text...');
    
    const data = {
      education: [],
      skills: [],
      internships: [],
      projects: [],
      achievements: [],
      experience: []
    };
    
    if (!resumeText || resumeText.trim().length === 0) {
      console.log('⚠️ Empty resume text provided');
      return data;
    }
    
    const lines = resumeText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    let currentSection = '';
    let sectionContent = [];
    
    console.log('Processing', lines.length, 'lines of resume text');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();
      
      // Detect section headers (more flexible patterns)
      let newSection = '';
      
      if (this.isEducationSection(lowerLine)) {
        newSection = 'education';
      } else if (this.isSkillsSection(lowerLine)) {
        newSection = 'skills';
      } else if (this.isInternshipSection(lowerLine)) {
        newSection = 'internships';
      } else if (this.isProjectSection(lowerLine)) {
        newSection = 'projects';
      } else if (this.isAchievementSection(lowerLine)) {
        newSection = 'achievements';
      } else if (this.isExperienceSection(lowerLine)) {
        newSection = 'experience';
      }
      
      // If we found a new section
      if (newSection && newSection !== currentSection) {
        // Save previous section content
        if (currentSection && sectionContent.length > 0) {
          data[currentSection] = data[currentSection].concat(sectionContent);
        }
        
        currentSection = newSection;
        sectionContent = [];
        console.log('Found section:', currentSection);
        continue;
      }
      
      // Add content to current section
      if (currentSection && line.length > 5 && !this.isSectionHeader(line)) {
        let cleanLine = line.replace(/^[•\-\*\s]+/, '').trim();
        if (cleanLine && cleanLine.length > 3) {
          sectionContent.push(cleanLine);
        }
      }
    }
    
    // Don't forget the last section
    if (currentSection && sectionContent.length > 0) {
      data[currentSection] = data[currentSection].concat(sectionContent);
    }
    
    // Extract education using patterns if not found in sections
    if (data.education.length === 0) {
      data.education = this.extractEducationPatterns(resumeText);
    }
    
    // Extract skills using patterns if not found
    if (data.skills.length === 0) {
      data.skills = this.extractSkillsPatterns(resumeText);
    }
    
    // Remove duplicates from all sections
    Object.keys(data).forEach(key => {
      data[key] = [...new Set(data[key])];
    });
    
    console.log('Extracted data summary:', {
      education: data.education.length,
      skills: data.skills.length,
      experience: data.experience.length,
      projects: data.projects.length,
      internships: data.internships.length,
      achievements: data.achievements.length
    });
    
    return data;
  }
  
  // Helper methods for section detection
  isEducationSection(line) {
    return line.includes('education') || line.includes('academic') || line.includes('qualification') || 
           line.includes('degree') || line.includes('university') || line.includes('college');
  }
  
  isSkillsSection(line) {
    return line.includes('skill') || line.includes('technical') || line.includes('expertise') || 
           line.includes('competenc') || line.includes('proficienc');
  }
  
  isInternshipSection(line) {
    return line.includes('intern') || line.includes('training') || line.includes('placement');
  }
  
  isProjectSection(line) {
    return line.includes('project') || line.includes('academic project') || line.includes('capstone');
  }
  
  isAchievementSection(line) {
    // Only consider as achievements if it's clearly not education
    if (line.includes('education') || line.includes('degree') || line.includes('university') || 
        line.includes('college') || line.includes('school') || line.includes('academic qualification')) {
      return false;
    }
    return line.includes('achievement') || line.includes('certificate') || line.includes('award') || 
           line.includes('honor') || line.includes('certification') || line.includes('accomplishment');
  }
  
  isExperienceSection(line) {
    return line.includes('experience') || line.includes('work') || line.includes('employment') || 
           line.includes('professional') || line.includes('career');
  }
  
  // Check if line is a section header
  isSectionHeader(line) {
    const headers = ['education', 'skills', 'projects', 'internship', 'achievement', 'experience', 'work', 'certificate'];
    return headers.some(header => line.toLowerCase().includes(header) && line.length < 30);
  }
  
  // Extract skills using pattern matching
  extractSkillsPatterns(resumeText) {
    const skills = [];
    const lines = resumeText.split('\n');
    
    // Look for technical skills
    for (const keyword of this.skillKeywords.technical) {
      if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
        skills.push(keyword);
      }
    }
    
    // Look for lines that might contain skills
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('javascript') || lowerLine.includes('python') || 
          lowerLine.includes('java') || lowerLine.includes('html') || 
          lowerLine.includes('css') || lowerLine.includes('react')) {
        const words = line.split(/[,\s]+/).map(w => w.trim()).filter(w => w.length > 1);
        skills.push(...words);
      }
    }
    
    return [...new Set(skills)].slice(0, 10); // Remove duplicates and limit
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
        
        // Check education type and format with score on next line
        if (/(sslc|10th|secondary|matriculation)/i.test(eduWithoutScore)) {
          const schoolInfo = eduWithoutScore.replace(/(sslc|10th|secondary|matriculation)/gi, '').trim();
          formattedEducation.push(`Secondary School Leaving Certificate (SSLC), ${schoolInfo}\nPercentage: ${score}`);
        } else if (/(hsc|12th|higher secondary|senior secondary)/i.test(eduWithoutScore)) {
          const schoolInfo = eduWithoutScore.replace(/(hsc|12th|higher secondary|senior secondary)/gi, '').trim();
          formattedEducation.push(`Higher Secondary Certificate (HSC), ${schoolInfo}\nPercentage: ${score}`);
        } else if (/(b\.tech|bachelor|be|b\.e|bca)/i.test(eduWithoutScore)) {
          formattedEducation.push(`${eduWithoutScore}\nCGPA: ${score}`);
        } else {
          formattedEducation.push(`${eduWithoutScore}\nScore: ${score}`);
        }
      } else {
        // No score found, format anyway
        if (/(sslc|10th|secondary|matriculation)/i.test(edu)) {
          const schoolInfo = edu.replace(/(sslc|10th|secondary|matriculation)/gi, '').trim();
          formattedEducation.push(`Secondary School Leaving Certificate (SSLC), ${schoolInfo}`);
        } else if (/(hsc|12th|higher secondary|senior secondary)/i.test(edu)) {
          const schoolInfo = edu.replace(/(hsc|12th|higher secondary|senior secondary)/gi, '').trim();
          formattedEducation.push(`Higher Secondary Certificate (HSC), ${schoolInfo}`);
        } else {
          formattedEducation.push(edu);
        }
      }
    });
    
    return formattedEducation;
  }
  
  // Helper method to extract internship title and period
  extractInternshipTitleAndPeriod(text) {
    // Try to find patterns like "Title at Company (Period)" or "Title | Period" or "Title - Period"
    const patterns = [
      /^(.+?)\s*\|\s*(.+)$/, // Title | Period
      /^(.+?)\s*-\s*(.+)$/, // Title - Period
      /^(.+?)\s*\((.+?)\)$/, // Title (Period)
      /^(.+?)\s+(.+?(?:20\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).*)$/i // Title followed by date
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          title: match[1].trim(),
          period: match[2].trim()
        };
      }
    }
    
    // Fallback: if no pattern matches, return the whole text as title
    return {
      title: text.trim(),
      period: ''
    };
  }
  
  // Helper method to extract project title and period
  extractProjectTitleAndPeriod(text) {
    // Similar patterns for projects
    const patterns = [
      /^(.+?)\s*\|\s*(.+)$/, // Title | Period
      /^(.+?)\s*-\s*(.+)$/, // Title - Period
      /^(.+?)\s*\((.+?)\)$/, // Title (Period)
      /^(.+?)\s+(.+?(?:20\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).*)$/i // Title followed by date
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          title: match[1].trim(),
          period: match[2].trim()
        };
      }
    }
    
    // Fallback: if no pattern matches, return the whole text as title
    return {
      title: text.trim(),
      period: ''
    };
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

  // Generate cover letter based on exact template
  async generateCoverLetter(resumeText, jobDescription, personalInfo) {
    const jobTitle = this.extractJobTitle(jobDescription) || 'Software Engineer';
    const companyName = this.extractCompanyName(jobDescription) || 'your organization';
    const name = personalInfo?.name || 'Arun Kumar Sukdev Chavan';
    
    // Extract key skills and projects from resume for personalization
    const resumeData = await this.extractResumeData(resumeText);
    const keySkills = this.extractKeySkillsForCover(resumeData.skills);
    const mainProject = this.extractMainProject(resumeData.projects);
    
    const coverLetter = `${name}

Dear Hiring Manager,

When I first came across your organisation's mission and values, it immediately resonated with me. It's not just an inspiring statement, it's a vision that combines technology, innovation, and opportunity at a global scale. As someone who has spent the past few years building AI-powered tools and full-stack applications, I'm deeply motivated by the idea of contributing to a platform that empowers businesses to grow faster and dream bigger.

As a B.Tech student in Artificial Intelligence and Data Science, I've explored how intelligent systems and reliable engineering can come together to create scalable, meaningful products. From developing ${mainProject || 'ResuSync, an AI-powered resume optimizer using the MERN stack and NLP'}, to designing predictive models using ${keySkills || 'Python, TensorFlow, and machine learning techniques'}, I've learned how to balance creativity with precision. I'm currently working on projects that strengthen my backend development and problem-solving skills—values that align perfectly with your organisation's culture of technical rigor and innovation.

What excites me most about your organisation is its focus on end-to-end ownership, continuous learning, and collaboration. I'm not just looking for a job; I'm looking for an environment where innovation meets discipline, where I can grow as an engineer while helping build systems that power real-world impact.

With a strong foundation in data-driven development, full-stack engineering, and a genuine curiosity for learning how complex systems work, I'm confident in my ability to contribute meaningfully to your organisation's mission. I'm eager to learn from world-class mentors, take ownership of challenging projects, and add value from day one.

Thank you for considering my application. I would be excited to bring my problem-solving mindset, curiosity, and energy to your organisation and help push the boundaries of what's possible in the digital economy.

Yours sincerely,
Future ${jobTitle} at your organisation
${personalInfo?.email || 'arunkumarsukdevchavan@gmail.com'}
${personalInfo?.contact || personalInfo?.phone || '+91 6379118592'}
Chennai, India
${name.split(' ')[0] || 'Arun'} kumar
    `.trim();

    return coverLetter;
  }

  // Extract key skills for cover letter
  extractKeySkillsForCover(skills) {
    const allSkills = [];
    skills.forEach(skillLine => {
      const lineSkills = skillLine.split(/[,•\-:]+/).map(s => s.trim()).filter(s => s.length > 1);
      allSkills.push(...lineSkills);
    });
    
    // Prioritize technical skills
    const prioritySkills = ['Python', 'JavaScript', 'React', 'Node.js', 'TensorFlow', 'MongoDB', 'Machine Learning', 'AI', 'Data Science'];
    const foundSkills = prioritySkills.filter(skill => 
      allSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
    );
    
    return foundSkills.slice(0, 3).join(', ') || 'Python, TensorFlow, and machine learning techniques';
  }

  // Extract main project for cover letter
  extractMainProject(projects) {
    if (projects.length === 0) return null;
    
    // Find the most recent or impressive project
    for (const project of projects) {
      if (project.toLowerCase().includes('ai') || 
          project.toLowerCase().includes('machine learning') || 
          project.toLowerCase().includes('full stack') ||
          project.toLowerCase().includes('resumsync')) {
        return project.split('\n')[0]; // Get first line (title)
      }
    }
    
    return projects[0].split('\n')[0]; // Fallback to first project title
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

  // Professional ATS Analysis with 4 criteria and overall score
  async generateATSAnalysis(resumeData, jobDescription) {
    try {
      // Load dataset for analysis
      const fs = require('fs');
      const path = require('path');
      const csvPath = path.join(__dirname, 'dataset.csv');
      let datasetContent = '';
      
      try {
        datasetContent = fs.readFileSync(csvPath, 'utf8');
      } catch (error) {
        console.log('Dataset not found, using default analysis');
      }

      const resumeText = resumeData.originalText || '';
      
      // 1. Content Quality Analysis (0-100)
      const contentAnalysis = this.analyzeContentQuality(resumeText, jobDescription, datasetContent);
      
      // 2. Keyword Matching Analysis (0-100)
      const keywordAnalysis = this.analyzeKeywordMatching(resumeText, jobDescription, datasetContent);
      
      // 3. Format & Structure Analysis (0-100)
      const formatAnalysis = this.analyzeFormatStructure(resumeData);
      
      // 4. Skills Alignment Analysis (0-100)
      const skillsAnalysis = this.analyzeSkillsAlignment(resumeText, jobDescription, datasetContent);
      
      // Calculate overall ATS score (weighted average)
      const overallScore = Math.round(
        (contentAnalysis.score * 0.25) + 
        (keywordAnalysis.score * 0.30) + 
        (formatAnalysis.score * 0.20) + 
        (skillsAnalysis.score * 0.25)
      );

      return {
        overall_score: overallScore,
        content_quality: contentAnalysis,
        keyword_matching: keywordAnalysis,
        format_structure: formatAnalysis,
        skills_alignment: skillsAnalysis,
        recommendations: this.generateATSRecommendations(contentAnalysis, keywordAnalysis, formatAnalysis, skillsAnalysis)
      };
    } catch (error) {
      console.error('Error generating ATS analysis:', error);
      return this.getDefaultATSAnalysis();
    }
  }

  // Analyze content quality based on dataset patterns
  analyzeContentQuality(resumeText, jobDescription, datasetContent) {
    let score = 60; // Base score
    const feedback = [];
    
    // Check resume length (optimal: 300-1500 words)
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount >= 300 && wordCount <= 1500) {
      score += 15;
      feedback.push('✓ Optimal resume length');
    } else if (wordCount < 300) {
      feedback.push('⚠ Resume too short, add more details');
    } else {
      feedback.push('⚠ Resume too long, consider trimming');
    }

    // Check for key sections
    const sections = ['education', 'experience', 'skills', 'project'];
    let sectionsFound = 0;
    sections.forEach(section => {
      if (new RegExp(section, 'i').test(resumeText)) {
        sectionsFound++;
      }
    });
    score += (sectionsFound / sections.length) * 15;
    
    if (sectionsFound >= 3) {
      feedback.push('✓ Contains essential sections');
    } else {
      feedback.push('⚠ Missing key resume sections');
    }

    // Check for action verbs and quantifiable achievements
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'optimized', 'improved'];
    const foundVerbs = actionVerbs.filter(verb => new RegExp(verb, 'i').test(resumeText));
    if (foundVerbs.length >= 3) {
      score += 10;
      feedback.push('✓ Uses strong action verbs');
    } else {
      feedback.push('⚠ Add more action verbs');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback: feedback.slice(0, 3),
      status: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
    };
  }

  // Analyze keyword matching with job description
  analyzeKeywordMatching(resumeText, jobDescription, datasetContent) {
    let score = 50; // Base score
    const feedback = [];
    
    // Extract keywords from job description
    const jobKeywords = this.extractJobKeywords(jobDescription, datasetContent);
    const resumeLower = resumeText.toLowerCase();
    
    let matchedKeywords = 0;
    const totalKeywords = jobKeywords.length;
    
    jobKeywords.forEach(keyword => {
      if (resumeLower.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    });

    const matchRate = totalKeywords > 0 ? (matchedKeywords / totalKeywords) * 100 : 50;
    score = Math.round(matchRate * 0.4 + score * 0.6);

    if (matchRate >= 70) {
      feedback.push('✓ Excellent keyword alignment');
    } else if (matchRate >= 50) {
      feedback.push('✓ Good keyword presence');
    } else {
      feedback.push('⚠ Low keyword matching');
    }

    // Check for industry-specific terms
    const industryTerms = this.getIndustryTermsFromDataset(datasetContent);
    const foundTerms = industryTerms.filter(term => resumeLower.includes(term.toLowerCase()));
    
    if (foundTerms.length >= 5) {
      score += 15;
      feedback.push('✓ Strong industry terminology');
    } else {
      feedback.push('⚠ Add more industry terms');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback: feedback.slice(0, 3),
      matched_keywords: matchedKeywords,
      total_keywords: totalKeywords,
      status: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
    };
  }

  // Analyze format and structure
  analyzeFormatStructure(resumeData) {
    let score = 70; // Base score
    const feedback = [];
    
    // Check for contact information
    if (resumeData.email || /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeData.originalText)) {
      score += 10;
      feedback.push('✓ Contact information present');
    } else {
      feedback.push('⚠ Missing contact information');
    }

    // Check for education section
    if (resumeData.education && resumeData.education.length > 0) {
      score += 10;
      feedback.push('✓ Education section structured');
    } else {
      feedback.push('⚠ Education section needs formatting');
    }

    // Check for consistent formatting (bullet points, dates)
    const bulletPattern = /[•\-\*]/g;
    const datePattern = /\d{4}/g;
    const bullets = (resumeData.originalText.match(bulletPattern) || []).length;
    const dates = (resumeData.originalText.match(datePattern) || []).length;
    
    if (bullets >= 5 && dates >= 2) {
      score += 10;
      feedback.push('✓ Well-structured format');
    } else {
      feedback.push('⚠ Improve formatting consistency');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback: feedback.slice(0, 3),
      status: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
    };
  }

  // Analyze skills alignment
  analyzeSkillsAlignment(resumeText, jobDescription, datasetContent) {
    let score = 55; // Base score
    const feedback = [];
    
    // Extract required skills from job description and dataset
    const requiredSkills = this.extractRequiredSkills(jobDescription, datasetContent);
    const resumeSkills = this.extractResumeSkills(resumeText);
    
    let alignedSkills = 0;
    requiredSkills.forEach(skill => {
      if (resumeSkills.some(rSkill => rSkill.toLowerCase().includes(skill.toLowerCase()))) {
        alignedSkills++;
      }
    });

    const alignmentRate = requiredSkills.length > 0 ? (alignedSkills / requiredSkills.length) * 100 : 50;
    score = Math.round(alignmentRate * 0.5 + score * 0.5);

    if (alignmentRate >= 70) {
      feedback.push('✓ Strong skills alignment');
    } else if (alignmentRate >= 50) {
      feedback.push('✓ Moderate skills match');
    } else {
      feedback.push('⚠ Skills gap identified');
    }

    // Check for soft skills
    const softSkillsFound = this.skillKeywords.soft.filter(skill => 
      new RegExp(skill, 'i').test(resumeText)
    ).length;
    
    if (softSkillsFound >= 3) {
      score += 15;
      feedback.push('✓ Good soft skills coverage');
    } else {
      feedback.push('⚠ Add more soft skills');
    }

    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback: feedback.slice(0, 3),
      aligned_skills: alignedSkills,
      total_required: requiredSkills.length,
      status: score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
    };
  }

  // Helper methods for ATS analysis
  extractJobKeywords(jobDescription, datasetContent) {
    const keywords = [];
    const text = jobDescription.toLowerCase();
    
    // Extract from technical skills in dataset
    if (datasetContent) {
      const lines = datasetContent.split('\n');
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length > 2) {
          const techSkills = parts[2] || '';
          techSkills.split(',').forEach(skill => {
            const cleanSkill = skill.trim().replace(/"/g, '');
            if (cleanSkill && text.includes(cleanSkill.toLowerCase())) {
              keywords.push(cleanSkill);
            }
          });
        }
      });
    }

    // Add common keywords
    const commonKeywords = ['experience', 'development', 'management', 'analysis', 'design', 'implementation'];
    commonKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return [...new Set(keywords)].slice(0, 15);
  }

  getIndustryTermsFromDataset(datasetContent) {
    const terms = [];
    if (datasetContent) {
      const lines = datasetContent.split('\n');
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length > 4) {
          const atsKeywords = parts[4] || '';
          atsKeywords.split(',').forEach(term => {
            const cleanTerm = term.trim().replace(/"/g, '');
            if (cleanTerm) terms.push(cleanTerm);
          });
        }
      });
    }
    return [...new Set(terms)].slice(0, 20);
  }

  extractRequiredSkills(jobDescription, datasetContent) {
    const skills = [];
    
    // From dataset
    if (datasetContent) {
      const lines = datasetContent.split('\n');
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length > 2) {
          const techSkills = parts[2] || '';
          techSkills.split(',').forEach(skill => {
            const cleanSkill = skill.trim().replace(/"/g, '');
            if (cleanSkill) skills.push(cleanSkill);
          });
        }
      });
    }

    // From job description
    this.skillKeywords.technical.forEach(skill => {
      if (new RegExp(skill, 'i').test(jobDescription)) {
        skills.push(skill);
      }
    });

    return [...new Set(skills)].slice(0, 10);
  }

  extractResumeSkills(resumeText) {
    const skills = [];
    this.skillKeywords.technical.concat(this.skillKeywords.soft).forEach(skill => {
      if (new RegExp(skill, 'i').test(resumeText)) {
        skills.push(skill);
      }
    });
    return skills;
  }

  generateATSRecommendations(content, keywords, format, skills) {
    const recommendations = [];
    
    if (content.score < 75) {
      recommendations.push('Improve content quality with more specific achievements and quantifiable results');
    }
    if (keywords.score < 75) {
      recommendations.push('Include more job-relevant keywords and industry terminology');
    }
    if (format.score < 75) {
      recommendations.push('Enhance resume formatting with consistent structure and clear sections');
    }
    if (skills.score < 75) {
      recommendations.push('Add more relevant technical and soft skills matching the job requirements');
    }

    return recommendations.slice(0, 3);
  }

  getDefaultATSAnalysis() {
    return {
      overall_score: 65,
      content_quality: { score: 70, feedback: ['Resume analysis in progress'], status: 'Good' },
      keyword_matching: { score: 60, feedback: ['Keyword analysis pending'], status: 'Good' },
      format_structure: { score: 75, feedback: ['Format looks good'], status: 'Good' },
      skills_alignment: { score: 55, feedback: ['Skills analysis pending'], status: 'Needs Improvement' },
      recommendations: ['Upload a complete resume for detailed analysis']
    };
  }
}

module.exports = LocalResumeAI;