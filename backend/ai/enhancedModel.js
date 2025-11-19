const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class EnhancedResumeAI {
  constructor() {
    this.jobRoles = new Map();
    this.domains = new Map();
    this.isInitialized = false;
    this.skillMatcher = new Map();
    this.careerLevelMapping = {
      'junior': ['entry', 'junior', 'beginner', '0-2 years', 'fresh'],
      'mid-level': ['mid', 'intermediate', '2-5 years', '3-7 years', 'experienced'],
      'senior': ['senior', 'lead', '5+ years', '7+ years', 'expert'],
      'leadership': ['manager', 'director', 'head', 'vp', 'cto', 'cio', 'chief']
    };
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Enhanced Resume AI with dataset...');
      await this.loadDataset();
      this.buildSkillMatcher();
      this.isInitialized = true;
      console.log('✅ Enhanced AI model initialized successfully');
      console.log(`📊 Loaded ${this.jobRoles.size} job roles across ${this.domains.size} domains`);
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced AI model:', error);
      throw error;
    }
  }

  async loadDataset() {
    const datasetPath = path.join(__dirname, 'dataset.csv');
    
    if (!fs.existsSync(datasetPath)) {
      throw new Error('Dataset file not found. Please ensure dataset.csv exists in the ai directory.');
    }

    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(datasetPath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
          
          // Organize data by domain and job role
          const domain = data.Domain;
          const jobRole = data['Job Role'];
          const technicalSkills = data['Technical Skills'].split(',').map(s => s.trim());
          const softSkills = data['Soft Skills'].split(',').map(s => s.trim());
          const atsKeywords = data['ATS Keywords'].split(',').map(s => s.trim());
          const tools = data['Common Tools'].split(',').map(s => s.trim());
          const careerLevel = data['Career Level'];

          // Store by domain
          if (!this.domains.has(domain)) {
            this.domains.set(domain, {
              roles: new Set(),
              commonSkills: new Set(),
              commonTools: new Set(),
              description: domain
            });
          }

          const domainData = this.domains.get(domain);
          domainData.roles.add(jobRole);
          technicalSkills.forEach(skill => domainData.commonSkills.add(skill));
          tools.forEach(tool => domainData.commonTools.add(tool));

          // Store detailed job role information
          this.jobRoles.set(jobRole.toLowerCase(), {
            domain,
            originalRole: jobRole,
            technicalSkills,
            softSkills,
            atsKeywords,
            tools,
            careerLevel,
            projectIdea: data['Project Ideas']
          });
        })
        .on('end', () => {
          console.log(`📚 Dataset loaded: ${results.length} job roles processed`);
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  buildSkillMatcher() {
    // Create a comprehensive skill matching system
    for (const [role, data] of this.jobRoles) {
      data.technicalSkills.forEach(skill => {
        const normalizedSkill = skill.toLowerCase().trim();
        if (!this.skillMatcher.has(normalizedSkill)) {
          this.skillMatcher.set(normalizedSkill, new Set());
        }
        this.skillMatcher.get(normalizedSkill).add(role);
      });
    }
  }

  // Detect job role from job description
  detectJobRole(jobDescription) {
    const jobDescLower = jobDescription.toLowerCase();
    const roleMatches = new Map();

    // Direct role matching
    for (const [role, data] of this.jobRoles) {
      const roleName = data.originalRole.toLowerCase();
      if (jobDescLower.includes(roleName)) {
        roleMatches.set(role, { score: 100, data });
        continue;
      }

      // Skill-based matching
      let skillMatchScore = 0;
      let totalSkills = data.technicalSkills.length + data.atsKeywords.length;

      data.technicalSkills.forEach(skill => {
        if (jobDescLower.includes(skill.toLowerCase())) {
          skillMatchScore += 3; // Technical skills weighted higher
        }
      });

      data.atsKeywords.forEach(keyword => {
        if (jobDescLower.includes(keyword.toLowerCase())) {
          skillMatchScore += 2;
        }
      });

      data.softSkills.forEach(skill => {
        if (jobDescLower.includes(skill.toLowerCase())) {
          skillMatchScore += 1;
        }
      });

      const matchPercentage = (skillMatchScore / (totalSkills * 3)) * 100;
      if (matchPercentage > 20) { // Threshold for relevance
        roleMatches.set(role, { score: matchPercentage, data });
      }
    }

    // Return best match
    let bestMatch = null;
    let highestScore = 0;

    for (const [role, match] of roleMatches) {
      if (match.score > highestScore) {
        highestScore = match.score;
        bestMatch = { role, ...match.data, matchScore: match.score };
      }
    }

    return bestMatch;
  }

  // Extract skills from resume text
  extractSkillsFromResume(resumeText) {
    const resumeLower = resumeText.toLowerCase();
    const foundSkills = {
      technical: new Set(),
      soft: new Set(),
      tools: new Set(),
      missing: new Set()
    };

    // Find all skills mentioned in resume
    for (const [role, data] of this.jobRoles) {
      data.technicalSkills.forEach(skill => {
        if (resumeLower.includes(skill.toLowerCase())) {
          foundSkills.technical.add(skill);
        }
      });

      data.softSkills.forEach(skill => {
        if (resumeLower.includes(skill.toLowerCase())) {
          foundSkills.soft.add(skill);
        }
      });

      data.tools.forEach(tool => {
        if (resumeLower.includes(tool.toLowerCase())) {
          foundSkills.tools.add(tool);
        }
      });
    }

    return {
      technical: Array.from(foundSkills.technical),
      soft: Array.from(foundSkills.soft),
      tools: Array.from(foundSkills.tools)
    };
  }

  // Generate intelligent suggestions based on job role match
  async generateSuggestions(resumeText, jobDescription) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const detectedRole = this.detectJobRole(jobDescription);
    if (!detectedRole) {
      return this.generateGenericSuggestions(resumeText, jobDescription);
    }

    const userSkills = this.extractSkillsFromResume(resumeText);
    const suggestions = [];

    // Role-specific suggestions
    suggestions.push(`🎯 ROLE MATCH: ${detectedRole.originalRole} (${detectedRole.matchScore.toFixed(1)}% match)`);
    suggestions.push(`📂 DOMAIN: ${detectedRole.domain}`);
    suggestions.push(`📈 LEVEL: ${detectedRole.careerLevel}`);
    suggestions.push('');

    // Technical skills analysis
    const missingTechnicalSkills = detectedRole.technicalSkills.filter(
      skill => !userSkills.technical.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (missingTechnicalSkills.length > 0) {
      suggestions.push('💻 MISSING TECHNICAL SKILLS:');
      missingTechnicalSkills.slice(0, 5).forEach(skill => {
        suggestions.push(`   • ${skill} - Consider adding projects or experience with this technology`);
      });
      suggestions.push('');
    }

    // Tools analysis
    const missingTools = detectedRole.tools.filter(
      tool => !userSkills.tools.some(userTool => 
        userTool.toLowerCase().includes(tool.toLowerCase())
      )
    );

    if (missingTools.length > 0) {
      suggestions.push('🛠️ RECOMMENDED TOOLS TO MENTION:');
      missingTools.slice(0, 4).forEach(tool => {
        suggestions.push(`   • ${tool}`);
      });
      suggestions.push('');
    }

    // ATS Keywords
    const resumeLower = resumeText.toLowerCase();
    const missingKeywords = detectedRole.atsKeywords.filter(
      keyword => !resumeLower.includes(keyword.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      suggestions.push('🔍 ATS OPTIMIZATION - ADD THESE KEYWORDS:');
      missingKeywords.slice(0, 6).forEach(keyword => {
        suggestions.push(`   • ${keyword}`);
      });
      suggestions.push('');
    }

    // Project suggestion
    if (detectedRole.projectIdea) {
      suggestions.push('💡 PROJECT SUGGESTION:');
      suggestions.push(`   ${detectedRole.projectIdea}`);
      suggestions.push('');
    }

    // Soft skills check
    const missingSoftSkills = detectedRole.softSkills.filter(
      skill => !userSkills.soft.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (missingSoftSkills.length > 0) {
      suggestions.push('🤝 SOFT SKILLS TO HIGHLIGHT:');
      missingSoftSkills.slice(0, 4).forEach(skill => {
        suggestions.push(`   • ${skill} - Include examples demonstrating this skill`);
      });
    }

    return suggestions.join('\n');
  }

  // Generate optimized resume based on role match
  async generateOptimizedResume(resumeText, jobDescription, userName, userEmail) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const detectedRole = this.detectJobRole(jobDescription);
    if (!detectedRole) {
      return this.generateGenericResume(resumeText, userName, userEmail);
    }

    const userSkills = this.extractSkillsFromResume(resumeText);
    
    let optimizedResume = `${userName}\n`;
    optimizedResume += `${userEmail}\n`;
    optimizedResume += `${detectedRole.originalRole}\n\n`;

    // Professional summary optimized for the role
    optimizedResume += `PROFESSIONAL SUMMARY\n`;
    optimizedResume += `Experienced ${detectedRole.originalRole} specializing in ${detectedRole.domain}. `;
    optimizedResume += `Proven expertise in ${userSkills.technical.slice(0, 4).join(', ')}`;
    if (userSkills.technical.length > 4) {
      optimizedResume += ` and ${userSkills.technical.length - 4} other technologies`;
    }
    optimizedResume += `. Strong background in ${detectedRole.atsKeywords.slice(0, 3).join(', ')}.`;
    optimizedResume += `\n\n`;

    // Core technical skills section
    optimizedResume += `CORE TECHNICAL SKILLS\n`;
    const combinedSkills = [...new Set([...userSkills.technical, ...detectedRole.technicalSkills.slice(0, 3)])];
    optimizedResume += `• Programming & Technologies: ${combinedSkills.slice(0, 8).join(', ')}\n`;
    
    const combinedTools = [...new Set([...userSkills.tools, ...detectedRole.tools.slice(0, 3)])];
    optimizedResume += `• Tools & Platforms: ${combinedTools.slice(0, 6).join(', ')}\n`;
    
    optimizedResume += `• Specializations: ${detectedRole.atsKeywords.slice(0, 5).join(', ')}\n\n`;

    // Extract and enhance experience section
    const experienceSection = this.extractExperienceFromResume(resumeText);
    if (experienceSection) {
      optimizedResume += `PROFESSIONAL EXPERIENCE\n`;
      optimizedResume += this.enhanceExperienceForRole(experienceSection, detectedRole);
      optimizedResume += `\n\n`;
    }

    // Key achievements
    optimizedResume += `KEY ACHIEVEMENTS\n`;
    optimizedResume += `• Successfully delivered ${detectedRole.domain} solutions improving system performance\n`;
    optimizedResume += `• Collaborated with cross-functional teams using ${detectedRole.atsKeywords[0]} methodologies\n`;
    optimizedResume += `• Implemented best practices in ${userSkills.technical.slice(0, 2).join(' and ')}\n\n`;

    // Suggested project based on role
    if (detectedRole.projectIdea) {
      optimizedResume += `RELEVANT PROJECT EXPERIENCE\n`;
      optimizedResume += `${detectedRole.projectIdea}\n`;
      optimizedResume += `Technologies: ${detectedRole.technicalSkills.slice(0, 5).join(', ')}\n\n`;
    }

    return optimizedResume;
  }

  extractExperienceFromResume(resumeText) {
    const experienceKeywords = ['experience', 'work history', 'employment', 'professional experience', 'career history'];
    const lines = resumeText.split('\n');
    
    let experienceStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (experienceKeywords.some(keyword => line.includes(keyword))) {
        experienceStartIndex = i;
        break;
      }
    }

    if (experienceStartIndex === -1) return null;

    // Extract next 5-10 lines as experience
    const experienceLines = lines.slice(experienceStartIndex, experienceStartIndex + 10);
    return experienceLines.join('\n');
  }

  enhanceExperienceForRole(experienceText, roleData) {
    let enhanced = experienceText;
    
    // Add role-specific keywords naturally
    const keywordsToAdd = roleData.atsKeywords.slice(0, 3);
    keywordsToAdd.forEach(keyword => {
      if (!enhanced.toLowerCase().includes(keyword.toLowerCase())) {
        enhanced += `\n• Applied ${keyword} principles to drive project success`;
      }
    });

    return enhanced;
  }

  generateGenericSuggestions(resumeText, jobDescription) {
    return `GENERAL RESUME SUGGESTIONS:
    
• Add quantifiable achievements with specific metrics
• Include relevant technical skills mentioned in job description  
• Highlight leadership and teamwork experiences
• Ensure ATS optimization with industry keywords
• Structure content with clear sections and bullet points`;
  }

  generateGenericResume(resumeText, userName, userEmail) {
    return `${userName}
${userEmail}
Professional

PROFESSIONAL SUMMARY
Experienced professional with strong background in technology and problem-solving.

TECHNICAL SKILLS
• Proficient in multiple programming languages and frameworks
• Experience with project management and team collaboration
• Strong analytical and communication skills

${resumeText}`;
  }

  // Generate cover letter based on role match
  async generateCoverLetter(resumeText, jobDescription, userName, userEmail) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const detectedRole = this.detectJobRole(jobDescription);
    const userSkills = this.extractSkillsFromResume(resumeText);

    let coverLetter = `${userName}\n${userEmail}\n\n`;
    
    if (detectedRole) {
      coverLetter += `Subject: Application for ${detectedRole.originalRole} Position\n\n`;
      coverLetter += `Dear Hiring Manager,\n\n`;
      
      coverLetter += `I am writing to express my strong interest in the ${detectedRole.originalRole} position. `;
      coverLetter += `With my background in ${detectedRole.domain} and expertise in ${userSkills.technical.slice(0, 3).join(', ')}, `;
      coverLetter += `I am confident I would be a valuable addition to your team.\n\n`;
      
      coverLetter += `My experience encompasses:\n`;
      coverLetter += `• ${detectedRole.atsKeywords.slice(0, 3).join(', ')} expertise\n`;
      coverLetter += `• Proficiency in ${userSkills.technical.slice(0, 4).join(', ')}\n`;
      coverLetter += `• Strong foundation in ${detectedRole.softSkills.slice(0, 3).join(', ')}\n\n`;
      
      if (detectedRole.projectIdea) {
        coverLetter += `I am particularly excited about the opportunity to contribute to projects like: ${detectedRole.projectIdea}\n\n`;
      }
      
      coverLetter += `I look forward to discussing how my skills in ${detectedRole.domain} can contribute to your team's success.\n\n`;
    } else {
      coverLetter += `Subject: Application for Software Development Position\n\n`;
      coverLetter += `Dear Hiring Manager,\n\n`;
      coverLetter += `I am interested in joining your team and believe my technical skills and experience would be valuable.\n\n`;
    }
    
    coverLetter += `Sincerely,\n${userName}`;
    
    return coverLetter;
  }

  // Main analysis method that combines all functionalities with Professional ATS Analysis
  async analyzeResume(resumeText, jobDescription, userInfo) {
    try {
      // 1. Generate suggestions using enhanced AI
      const suggestions = await this.generateSuggestions(resumeText, jobDescription);
      
      // 2. Generate optimized resume
      const generated_resume = await this.generateOptimizedResume(resumeText, jobDescription, userInfo.name, userInfo.email);
      
      // 3. Generate cover letter
      const cover_letter = await this.generateCoverLetter(resumeText, jobDescription, userInfo.name, userInfo.email);
      
      // 4. Generate Professional ATS Analysis with 4 criteria
      const professional_ats_analysis = await this.generateProfessionalATSAnalysis(resumeText, jobDescription);
      
      return {
        suggestions,
        generated_resume,
        cover_letter,
        professional_ats_analysis,
        resume_analysis: {
          job_role: this.detectJobRole(jobDescription),
          career_level: this.detectCareerLevel(resumeText, jobDescription),
          domain: this.detectDomain(jobDescription)
        }
      };
    } catch (error) {
      console.error('Error in analyzeResume:', error);
      throw error;
    }
  }

  // Professional ATS Analysis with 4 criteria based on dataset
  async generateProfessionalATSAnalysis(resumeText, jobDescription) {
    try {
      const detectedJobRole = this.detectJobRole(jobDescription);
      const detectedDomain = this.detectDomain(jobDescription);
      
      // Get relevant data from dataset for this job role/domain
      const relevantData = this.getRelevantDataForRole(detectedJobRole, detectedDomain);
      
      // 1. Content Quality Analysis (25% weight)
      const contentAnalysis = this.analyzeContentQuality(resumeText, relevantData);
      
      // 2. Section Completeness Analysis (20% weight)
      const sectionsAnalysis = this.analyzeSectionCompleteness(resumeText);
      
      // 3. ATS Essentials Analysis (30% weight)
      const atsEssentialsAnalysis = this.analyzeATSEssentials(resumeText, jobDescription, relevantData);
      
      // 4. Job Tailoring Analysis (25% weight)
      const tailoringAnalysis = this.analyzeJobTailoring(resumeText, jobDescription, relevantData);
      
      // Calculate weighted overall score
      const overallATSScore = Math.round(
        (contentAnalysis.score * 0.25) + 
        (sectionsAnalysis.score * 0.20) + 
        (atsEssentialsAnalysis.score * 0.30) + 
        (tailoringAnalysis.score * 0.25)
      );

      return {
        overallATSScore,
        content: contentAnalysis,
        sections: sectionsAnalysis,
        atsEssentials: atsEssentialsAnalysis,
        tailoring: tailoringAnalysis,
        insights: this.generateATSInsights(overallATSScore, contentAnalysis, sectionsAnalysis, atsEssentialsAnalysis, tailoringAnalysis),
        jobRole: detectedJobRole,
        domain: detectedDomain
      };
    } catch (error) {
      console.error('Error generating Professional ATS Analysis:', error);
      return this.getDefaultATSAnalysis();
    }
  }

  // 1. Content Quality Analysis
  analyzeContentQuality(resumeText, relevantData) {
    let score = 60; // Base score
    const details = {};
    
    // Check for quantifiable achievements
    const quantifiers = ['%', 'increased', 'decreased', 'improved', 'reduced', 'achieved', 'generated', 'saved'];
    const quantifiableCount = quantifiers.filter(q => new RegExp(q, 'i').test(resumeText)).length;
    details.quantification = quantifiableCount >= 3;
    
    if (details.quantification) {
      score += 20;
    }
    
    // Check for action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed', 'optimized', 'collaborated'];
    const actionVerbCount = actionVerbs.filter(verb => new RegExp(verb, 'i').test(resumeText)).length;
    details.actionVerbs = actionVerbCount >= 4;
    
    if (details.actionVerbs) {
      score += 15;
    }
    
    // Check resume length (optimal 300-1200 words)
    const wordCount = resumeText.split(/\s+/).length;
    details.wordCount = wordCount;
    details.optimalLength = wordCount >= 300 && wordCount <= 1200;
    
    if (details.optimalLength) {
      score += 5;
    }
    
    return {
      score: Math.min(score, 100),
      details,
      status: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Improvement'
    };
  }

  // 2. Section Completeness Analysis
  analyzeSectionCompleteness(resumeText) {
    let score = 50; // Base score
    const sections = {
      contact: false,
      summary: false,
      experience: false,
      education: false,
      skills: false,
      projects: false
    };
    
    // Check for contact information
    if (/email|@|phone|\+?\d{10}|linkedin/i.test(resumeText)) {
      sections.contact = true;
      score += 10;
    }
    
    // Check for summary/objective
    if (/summary|objective|profile|about/i.test(resumeText)) {
      sections.summary = true;
      score += 8;
    }
    
    // Check for experience
    if (/experience|work|employment|position|role/i.test(resumeText)) {
      sections.experience = true;
      score += 12;
    }
    
    // Check for education
    if (/education|degree|university|college|school/i.test(resumeText)) {
      sections.education = true;
      score += 10;
    }
    
    // Check for skills
    if (/skills|technical|technologies|tools|languages/i.test(resumeText)) {
      sections.skills = true;
      score += 10;
    }
    
    // Check for projects
    if (/projects|portfolio|github|developed|built/i.test(resumeText)) {
      sections.projects = true;
      score += 5;
    }
    
    const completedSections = Object.values(sections).filter(Boolean).length;
    
    return {
      score: Math.min(score, 100),
      sections,
      completedSections,
      totalSections: Object.keys(sections).length,
      status: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Improvement'
    };
  }

  // 3. ATS Essentials Analysis
  analyzeATSEssentials(resumeText, jobDescription, relevantData) {
    let score = 55; // Base score
    const details = {};
    
    // Check for proper formatting (no special characters in excess)
    const specialCharCount = (resumeText.match(/[^\w\s\.\,\-\(\)]/g) || []).length;
    details.cleanFormatting = specialCharCount < 50;
    
    if (details.cleanFormatting) {
      score += 15;
    }
    
    // Check for consistent date formatting
    const datePatterns = [/\d{4}-\d{4}/, /\d{4}\s*-\s*\d{4}/, /\w+\s+\d{4}/];
    const dateMatches = datePatterns.some(pattern => pattern.test(resumeText));
    details.dateFormatting = dateMatches;
    
    if (details.dateFormatting) {
      score += 10;
    }
    
    // Check for standard section headers
    const standardHeaders = ['experience', 'education', 'skills', 'summary'];
    const headerCount = standardHeaders.filter(header => 
      new RegExp(header, 'i').test(resumeText)
    ).length;
    details.standardHeaders = headerCount >= 3;
    
    if (details.standardHeaders) {
      score += 15;
    }
    
    // Check for bullet points
    const bulletPoints = (resumeText.match(/[•\-\*]/g) || []).length;
    details.bulletPoints = bulletPoints >= 5;
    
    if (details.bulletPoints) {
      score += 5;
    }
    
    return {
      score: Math.min(score, 100),
      details,
      status: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Improvement'
    };
  }

  // 4. Job Tailoring Analysis
  analyzeJobTailoring(resumeText, jobDescription, relevantData) {
    let score = 45; // Base score
    const details = { hardSkills: {}, softSkills: {} };
    
    // Extract keywords from job description
    const jobKeywords = this.extractKeywordsFromJobDescription(jobDescription);
    const resumeLower = resumeText.toLowerCase();
    
    // Hard skills matching
    const hardSkillsRequired = relevantData?.technicalSkills || [];
    let hardSkillsFound = 0;
    
    hardSkillsRequired.forEach(skill => {
      if (resumeLower.includes(skill.toLowerCase())) {
        hardSkillsFound++;
      }
    });
    
    details.hardSkills.matchRate = hardSkillsRequired.length > 0 ? 
      Math.round((hardSkillsFound / hardSkillsRequired.length) * 100) : 50;
    details.hardSkills.score = Math.min(details.hardSkills.matchRate, 100);
    
    score += Math.min(details.hardSkills.matchRate * 0.3, 30);
    
    // Soft skills analysis
    const softSkillsRequired = relevantData?.softSkills || [];
    let softSkillsFound = 0;
    
    softSkillsRequired.forEach(skill => {
      if (resumeLower.includes(skill.toLowerCase())) {
        softSkillsFound++;
      }
    });
    
    details.softSkills.matchRate = softSkillsRequired.length > 0 ? 
      Math.round((softSkillsFound / softSkillsRequired.length) * 100) : 50;
    details.softSkills.score = Math.min(details.softSkills.matchRate, 100);
    
    score += Math.min(details.softSkills.matchRate * 0.15, 15);
    
    // Industry terminology
    const industryTerms = relevantData?.atsKeywords || [];
    let industryTermsFound = 0;
    
    industryTerms.forEach(term => {
      if (resumeLower.includes(term.toLowerCase())) {
        industryTermsFound++;
      }
    });
    
    details.industryAlignment = industryTerms.length > 0 ? 
      Math.round((industryTermsFound / industryTerms.length) * 100) : 50;
    
    score += Math.min(details.industryAlignment * 0.1, 10);
    
    return {
      score: Math.min(score, 100),
      details,
      status: score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs Improvement'
    };
  }

  // Helper methods for ATS analysis
  getRelevantDataForRole(jobRole, domain) {
    const domainData = this.domains.get(domain?.toLowerCase());
    if (domainData && domainData[jobRole?.toLowerCase()]) {
      const roleData = domainData[jobRole.toLowerCase()];
      return {
        technicalSkills: roleData['Technical Skills']?.split(',').map(s => s.trim()) || [],
        softSkills: roleData['Soft Skills']?.split(',').map(s => s.trim()) || [],
        atsKeywords: roleData['ATS Keywords']?.split(',').map(s => s.trim()) || [],
        tools: roleData['Common Tools']?.split(',').map(s => s.trim()) || []
      };
    }
    return null;
  }

  extractKeywordsFromJobDescription(jobDescription) {
    const text = jobDescription.toLowerCase();
    const keywords = [];
    
    // Extract common job-related keywords
    const patterns = [
      /\b(experience|years?)\b/g,
      /\b(skills?|technologies?|tools?)\b/g,
      /\b(degree|education|qualification)\b/g,
      /\b(manage|lead|develop|implement|design)\b/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    });
    
    return [...new Set(keywords)];
  }

  generateATSInsights(overallScore, content, sections, atsEssentials, tailoring) {
    const insights = [];
    
    if (overallScore >= 85) {
      insights.push('🌟 Excellent ATS optimization! Your resume is highly likely to pass ATS screening.');
    } else if (overallScore >= 75) {
      insights.push('✨ Good ATS compatibility with room for minor improvements.');
    } else if (overallScore >= 65) {
      insights.push('⚡ Fair ATS readiness. Focus on keyword optimization and formatting.');
    } else {
      insights.push('🔧 Significant improvements needed for ATS compatibility.');
    }
    
    // Specific recommendations
    if (content.score < 70) {
      insights.push('📝 Add more quantifiable achievements and action verbs.');
    }
    if (sections.score < 70) {
      insights.push('📋 Include all essential resume sections for completeness.');
    }
    if (atsEssentials.score < 70) {
      insights.push('🎯 Improve formatting consistency and use standard section headers.');
    }
    if (tailoring.score < 70) {
      insights.push('🔧 Better align your skills and experience with job requirements.');
    }
    
    return insights.slice(0, 4); // Return top 4 insights
  }

  detectJobRole(jobDescription) {
    const text = jobDescription.toLowerCase();
    
    // Check against dataset job roles
    for (const [domain, roles] of this.domains.entries()) {
      for (const role of Object.keys(roles)) {
        if (text.includes(role.toLowerCase())) {
          return role;
        }
      }
    }
    
    // Fallback to common roles
    const commonRoles = [
      'software developer', 'data scientist', 'product manager', 'designer',
      'frontend developer', 'backend developer', 'full stack developer'
    ];
    
    for (const role of commonRoles) {
      if (text.includes(role)) {
        return role;
      }
    }
    
    return 'Software Developer'; // Default
  }

  detectDomain(jobDescription) {
    const text = jobDescription.toLowerCase();
    
    for (const domain of this.domains.keys()) {
      if (text.includes(domain)) {
        return domain;
      }
    }
    
    return 'Software Development'; // Default
  }

  detectCareerLevel(resumeText, jobDescription) {
    const combinedText = (resumeText + ' ' + jobDescription).toLowerCase();
    
    for (const [level, keywords] of Object.entries(this.careerLevelMapping)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          return level;
        }
      }
    }
    
    return 'mid-level'; // Default
  }

  getDefaultATSAnalysis() {
    return {
      overallATSScore: 65,
      content: { score: 70, status: 'Good', details: {} },
      sections: { score: 75, status: 'Good', sections: {}, completedSections: 4 },
      atsEssentials: { score: 60, status: 'Needs Improvement', details: {} },
      tailoring: { score: 55, status: 'Needs Improvement', details: { hardSkills: { score: 60 }, softSkills: { score: 50 } } },
      insights: ['Resume analysis in progress', 'Upload complete resume for detailed insights'],
      jobRole: 'Software Developer',
      domain: 'Software Development'
    };
  }
}

module.exports = EnhancedResumeAI;