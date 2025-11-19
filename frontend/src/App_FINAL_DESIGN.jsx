import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import Footer from './components/Footer';
import { LoadingSpinner, ButtonLoading } from './components/Loading';
import ClientPDFGenerator from './components/ClientPDFGenerator.js';

export default function App() {
  // ALL HOOKS DECLARED AT THE TOP - NO CONDITIONAL HOOKS
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [history, setHistory] = useState([]);
  
  // PDF Preview state
  const [pdfPreview, setPdfPreview] = useState(null);
  
  // Cover Letter PDF state  
  const [coverPdfPreview, setCoverPdfPreview] = useState(null);
  
  // Google Authentication states
  const [user, setUser] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  
  // Simple timeout cleanup with useRef
  const timeoutRef = useRef(null);
  

  
  // UI states
  const [showLoginModal, setShowLoginModal] = useState(false); // For manual sign-in (app pages)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false); // For automatic welcome (landing page)
  const [showMainApp, setShowMainApp] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [continueWithoutSignIn, setContinueWithoutSignIn] = useState(false);

  // Check if user is already logged in on page load and show welcome modal on first visit to landing page only
  useEffect(() => {
    const token = localStorage.getItem('token');
    const hasVisitedBefore = localStorage.getItem('hasVisited');
    
    console.log('useEffect triggered:', { token: !!token, hasVisitedBefore, showLandingPage });
    
    if (token) {
      // User is already logged in, don't show any modals
      setShowWelcomeModal(false);
      setShowLoginModal(false);
    } else if (!hasVisitedBefore && showLandingPage) {
      // First time visitor on landing page ONLY, show welcome modal
      console.log('Showing welcome modal for first-time visitor');
      setShowWelcomeModal(true);
    } else {
      // Not first visit or not on landing page, don't show welcome modal
      setShowWelcomeModal(false);
    }
  }, [showLandingPage]);

  // Close welcome modal when navigating away from landing page
  useEffect(() => {
    if (!showLandingPage) {
      setShowWelcomeModal(false);
    }
  }, [showLandingPage]);

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '595202264177-s97i4i7bmi7csrnu6vd9gcuf0314qq7a.apps.googleusercontent.com',
          callback: handleGoogleSignIn
        });
        
        // Render Google Sign-in button when modal opens
        const renderGoogleButton = () => {
          const buttonDiv = document.getElementById('google-signin-button');
          if (buttonDiv && showLoginModal) {
            window.google.accounts.id.renderButton(buttonDiv, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 300
            });
          }
        };
        
        // Use setTimeout to ensure button renders after modal is shown
        if (showLoginModal) {
          setTimeout(renderGoogleButton, 100);
        }
      }
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page === 'app') {
        setShowLandingPage(false);
        setShowMainApp(true);
      } else {
        // Back to landing page
        setShowLandingPage(true);
        setShowMainApp(false);
        setResult(null); // Clear any previous results
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial history state for landing page
    if (showLandingPage) {
      window.history.replaceState({ page: 'landing' }, 'ResuSync - AI Resume Builder', '/');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Auto-generate PDF preview when generated_resume tab is accessed
  useEffect(() => {
    if (activeTab === 'generated_resume' && result && result.generated_resume && !pdfPreview && !loading && !isSubmitting) {
      // Add a small delay to ensure all data is fully loaded
      const timer = setTimeout(() => {
        generatePDFPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, result, pdfPreview, loading, isSubmitting]);

  // Auto-generate cover letter PDF preview when cover_letter tab is accessed
  useEffect(() => {
    if (activeTab === 'cover_letter' && result && result.cover_letter && !coverPdfPreview && !loading && !isSubmitting) {
      // Add a small delay to ensure all data is fully loaded
      const timer = setTimeout(() => {
        generateCoverPDFPreview();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, result, coverPdfPreview, loading, isSubmitting]);

  // Render Google Sign-in button when modal opens
  useEffect(() => {
    if (showLoginModal && window.google?.accounts?.id) {
      const timer = setTimeout(() => {
        const buttonDiv = document.getElementById('google-signin-button');
        if (buttonDiv) {
          // Clear any existing content
          buttonDiv.innerHTML = '';
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 300
          });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [showLoginModal]);

  // Handle Google Sign-In response
  const handleGoogleSignIn = async (response) => {
    try {
      setIsSigningIn(true);
      
      const res = await fetch('http://localhost:5001/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: response.credential 
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setShowLoginModal(false);
        setShowWelcomeModal(false);
        localStorage.setItem('token', data.token);
        localStorage.setItem('hasVisited', 'true');
        console.log('Google sign-in successful:', data.user);
      } else {
        console.error('Google sign-in failed:', data.message);
        alert('Sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle sign out
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('token');
    setHistory([]);
    console.log('User signed out');
  };

  // Handle Build Resume button click
  const handleBuildResume = () => {
    setShowLandingPage(false);
    setShowMainApp(true);
    setShowWelcomeModal(false); // Close welcome modal when navigating to app
    // Add to browser history
    window.history.pushState({ page: 'app' }, 'ResuSync - Resume Builder', '/app');
  };

  // Handle Back to Landing button click
  const handleBackToLanding = () => {
    setShowLandingPage(true);
    setShowMainApp(false);
    setResult(null); // Clear any previous results
  };

  // Load user history
  const loadHistory = async () => {
    if (!user) {
      alert('Please sign in to view Your History');
      setShowLoginModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/resume/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
        console.log('History loaded:', data.history);
      } else {
        console.error('Failed to load history:', data.message);
        alert('Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Error loading history');
    }
  };

  // Handle file upload with debouncing to prevent double triggers
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log('handleFileChange called:', {
      filesLength: e.target.files.length,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
      fileSize: selectedFile?.size,
      timestamp: new Date().toISOString()
    });
    
    // Debounce file changes to prevent double processing
    const timeout = setTimeout(() => {
      if (selectedFile) {
        console.log('File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
        
        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                            'text/plain'];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
        const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
        
        if (allowedTypes.includes(selectedFile.type) || allowedExtensions.includes(fileExtension)) {
          setFile(selectedFile);
          console.log('File accepted:', selectedFile.name);
        } else {
          alert('Please upload a PDF, DOC, DOCX, or TXT file');
          e.target.value = ''; // Reset the input
          console.log('File rejected:', selectedFile.type);
        }
      } else if (e.target.files.length === 0) {
        // File was cleared/removed
        setFile(null);
        console.log('File cleared');
      }
    }, 150); // 150ms debounce
    
    setCleanupTimeout(timeout);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      console.log('File dropped:', droppedFile.name, droppedFile.type, droppedFile.size);
      
      const allowedTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                          'text/plain'];
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = '.' + droppedFile.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(droppedFile.type) || allowedExtensions.includes(fileExtension)) {
        setFile(droppedFile);
        console.log('Dropped file accepted:', droppedFile.name);
      } else {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        console.log('Dropped file rejected:', droppedFile.type);
      }
    }
  };

  // Handle form submission with enhanced duplicate prevention
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentTime = Date.now();
    
    // Prevent double submission with multiple checks
    if (loading || isSubmitting) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }
    
    // Prevent rapid successive submissions (within 2 seconds)
    if (lastSubmission && (currentTime - lastSubmission) < 2000) {
      console.log('Too soon since last submission, ignoring');
      return;
    }
    
    console.log('Form submitted with data:', { name, email, jobDescription, file, resumeText });
    
    if (!jobDescription || (!file && !resumeText)) {
      alert('Please provide both a job description and resume (file or text)');
      return;
    }

    // Set submission flags
    setLoading(true);
    setIsSubmitting(true);
    setLastSubmission(currentTime);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('jobDescription', jobDescription);
      
      if (file) {
        formData.append('resume', file);
        console.log('File attached:', file.name);
      }
      if (resumeText) {
        formData.append('resumeText', resumeText);
        console.log('Resume text attached:', resumeText.length, 'characters');
      }

      // Add user ID if authenticated
      if (user) {
        formData.append('userId', user.id);
        console.log('User ID attached:', user.id);
      }

      console.log('Sending request to backend...');
      const response = await fetch('http://localhost:5001/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setResult(data.data);
        setPdfPreview(null); // Clear previous PDF preview
        setCoverPdfPreview(null); // Clear previous cover letter PDF preview
        setActiveTab('suggestions');
        console.log('Analysis successful:', data.data);
      } else {
        alert(data.message || 'Analysis failed');
        console.error('Analysis failed:', data.message);
      }
    } catch (error) {
      console.error('Error details:', error);
      if (error.message.includes('fetch')) {
        alert('❌ Unable to connect to server. Please ensure the backend is running on port 5001.');
      } else if (error.message.includes('HTTP error')) {
        alert('❌ Server error occurred. Please check the backend logs.');
      } else {
        alert('❌ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

    // Start a fresh analysis (clear form + results)
    const handleNewAnalysis = () => {
      setResult(null);
      setPdfPreview(null);
      setCoverPdfPreview(null);
      setFile(null);
      setResumeText('');
      setName('');
      setEmail('');
      setJobDescription('');
      setActiveTab('suggestions');
      // Scroll to top where the form is visible
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log('New analysis initialized - form cleared');
    };

  // Generate PDF Preview with retry logic
  const generatePDFPreview = async (retryCount = 0) => {
    if (!result || !result.generated_resume) {
      console.log('No resume data available for preview');
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading || isSubmitting) {
      console.log('PDF generation already in progress, skipping');
      return;
    }

    setLoading(true);
    try {
      console.log('Generating PDF preview, attempt:', retryCount + 1);
      
      const response = await fetch('http://localhost:5001/api/resume/preview-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: result.generated_resume,
          name: name || result.personal_info?.name || 'User',
          email: email || result.personal_info?.email || 'user@example.com'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPdfPreview(data.data.pdfPreview);
        console.log('PDF preview generated successfully');
      } else {
        throw new Error(data.message || 'Failed to generate PDF preview');
      }
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      
      // Retry logic - retry up to 2 times with increasing delay
      if (retryCount < 2) {
        console.log(`Retrying PDF generation in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          generatePDFPreview(retryCount + 1);
        }, (retryCount + 1) * 1000);
      } else {
        console.error('All PDF generation attempts failed');
        // Don't show alert on auto-generation failure, just log it
        if (retryCount === 0) {
          alert('❌ Failed to generate PDF preview. Please ensure the backend is running.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate Cover Letter PDF Preview with retry logic
  const generateCoverPDFPreview = async (retryCount = 0) => {
    if (!result || !result.cover_letter) {
      console.log('No cover letter data available for preview');
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading || isSubmitting) {
      console.log('Cover letter PDF generation already in progress, skipping');
      return;
    }

    setLoading(true);
    try {
      console.log('Generating cover letter PDF preview, attempt:', retryCount + 1);
      
      // Use the original resume text or the generated resume as fallback
      const resumeTextForCover = result.original_text || result.generated_resume || '';
      
      const response = await fetch('http://localhost:5001/api/resume/preview-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: resumeTextForCover,
          name: name || result.personal_info?.name || 'User',
          email: email || result.personal_info?.email || 'user@example.com',
          jobDescription: jobDescription || 'Software Engineer position'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCoverPdfPreview(data.data.pdfPreview);
        console.log('Cover letter PDF preview generated successfully');
      } else {
        throw new Error(data.message || 'Failed to generate cover letter PDF preview');
      }
    } catch (error) {
      console.error('Error generating cover letter PDF preview:', error);
      
      // Retry logic - retry up to 2 times with increasing delay
      if (retryCount < 2) {
        console.log(`Retrying cover letter PDF generation in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          generateCoverPDFPreview(retryCount + 1);
        }, (retryCount + 1) * 1000);
      } else {
        console.error('All cover letter PDF generation attempts failed');
        // Don't show alert on auto-generation failure, just log it
        if (retryCount === 0) {
          alert('❌ Failed to generate cover letter PDF preview. Please ensure the backend is running.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Download Cover Letter PDF using client-side generation
  const downloadCoverPDF = async () => {
    if (!result || !result.cover_letter) {
      alert('No cover letter data available for download');
      return;
    }

    setLoading(true);
    try {
      const pdfGenerator = new ClientPDFGenerator();
      const fileName = `${(name || 'User').replace(/\s+/g, '_')}_Cover_Letter.pdf`;
      
      const success = pdfGenerator.generateCoverLetterPDF(result.cover_letter, fileName);
      
      if (success) {
        console.log('✅ Cover letter PDF downloaded successfully');
      } else {
        throw new Error('Cover letter PDF generation failed');
      }
    } catch (error) {
      console.error('Error downloading cover letter PDF:', error);
      alert('❌ Failed to download cover letter PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF using client-side generation
  const downloadPDF = async () => {
    if (!result || !result.generated_resume) {
      alert('No resume data available for download');
      return;
    }

    setLoading(true);
    try {
      const pdfGenerator = new ClientPDFGenerator();
      const fileName = `${(name || 'Resume').replace(/\s+/g, '_')}_Optimized.pdf`;
      
      const success = pdfGenerator.generateResumePDF(result.generated_resume, fileName);
      
      if (success) {
        console.log('✅ PDF downloaded successfully');
      } else {
        throw new Error('PDF generation failed');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('❌ Failed to download PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show landing page first
  if (showLandingPage) {
    return (
      <>
        <LandingPage onBuildResume={handleBuildResume} />
        {/* Welcome Modal for landing page - automatic on first visit */}
        {showWelcomeModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
              }}>
                <h2 style={{
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Welcome to ResuSync! 🚀
                </h2>
                <button
                  onClick={() => {
                    console.log('Close button (X) clicked');
                    setShowWelcomeModal(false);
                    setContinueWithoutSignIn(true);
                    // Mark as visited when user chooses to continue without sign in
                    localStorage.setItem('hasVisited', 'true');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '5px'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{
                marginBottom: '30px'
              }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '25px',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}>
                  Choose how you'd like to use ResuSync:
                </p>
              </div>

              {/* Option 1: Sign In */}
              <button 
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Google Sign In button clicked');
                  if (window.google && window.google.accounts && window.google.accounts.id) {
                    console.log('Google API available, prompting for sign in');
                    window.google.accounts.id.prompt();
                  } else {
                    console.log('Google API not available yet');
                    alert('Google Sign-In is loading. Please try again in a moment.');
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                🔑 Sign in with Google
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '400'
                }}>
                  Keep your resume history and progress
                </p>
              </button>

              {/* Option 2: Continue Without Sign In */}
              <button 
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Continue Without Signing In button clicked');
                  setShowWelcomeModal(false);
                  setContinueWithoutSignIn(true);
                  localStorage.setItem('hasVisited', 'true');
                  console.log('Welcome modal closed, hasVisited flag set');
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                ⚡ Continue Without Signing In
                <p style={{
                  margin: '8px 0 0 0',
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '400'
                }}>
                  Start using ResuSync immediately (work won't be saved)
                </p>
              </button>

              <div style={{
                marginTop: '20px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center'
              }}>
                You can always sign in later to save your work
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #9333EA 50%, #7C3AED 75%, #6D28D9 100%)
      `,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      animation: 'professionalShift 30s ease-in-out infinite',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(1px 1px at 50px 80px, rgba(255, 255, 255, 0.1), transparent),
          radial-gradient(1px 1px at 120px 40px, rgba(255, 255, 255, 0.08), transparent),
          radial-gradient(1px 1px at 200px 120px, rgba(255, 255, 255, 0.12), transparent),
          radial-gradient(1px 1px at 280px 60px, rgba(255, 255, 255, 0.06), transparent),
          radial-gradient(1px 1px at 350px 100px, rgba(255, 255, 255, 0.1), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 200px',
        animation: 'subtleFloat 60s linear infinite',
        pointerEvents: 'none',
        opacity: 0.3
      }}></div>

      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          @keyframes professionalShift {
            0% { background-position: center; }
            25% { background-position: 10% 10%; }
            50% { background-position: 20% 20%; }
            75% { background-position: 10% 10%; }
            100% { background-position: center; }
          }
          
          @keyframes subtleFloat {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-200px); }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .glass-morphism {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
            border-radius: 20px;
            animation: fadeInUp 0.6s ease;
          }
          
          .header-glass {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          
          .neon-button {
            background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #9333EA 50%, #7C3AED 75%, #8B5CF6 100%);
            background-size: 200% 200%;
            animation: professionalPulse 4s ease-in-out infinite;
            border: 1px solid rgba(139, 92, 246, 0.3);
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.4s ease;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 
              0 4px 15px rgba(139, 92, 246, 0.2),
              inset 0 1px 0 rgba(196, 181, 253, 0.2);
          }

          .neon-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.6s ease;
          }

          .neon-button:hover::before {
            left: 100%;
          }
          
          .neon-button:hover {
            transform: translateY(-2px);
            box-shadow: 
              0 8px 25px rgba(139, 92, 246, 0.3),
              0 0 20px rgba(139, 92, 246, 0.2),
              inset 0 1px 0 rgba(196, 181, 253, 0.3);
            border-color: rgba(139, 92, 246, 0.5);
          }
          
          @keyframes professionalPulse {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          
          .sidebar-glass {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.15);
            animation: slideIn 0.8s ease;
          }
          
          .main-content-glass {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(15px);
            animation: fadeInUp 0.6s ease;
          }
          
          .input-glow {
            background: rgba(255, 255, 255, 0.12);
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(15px);
            color: white;
            transition: all 0.3s ease;
            border-radius: 15px;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
          }
          
          .input-glow:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.18);
          }
          
          .input-glow::placeholder {
            color: rgba(255, 255, 255, 0.7);
            font-weight: 400;
          }
          
          .tab-button {
            background: rgba(255, 255, 255, 0.12);
            border: 2px solid rgba(255, 255, 255, 0.25);
            color: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(15px);
            transition: all 0.3s ease;
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
          }

          .tab-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
            transform: translateX(-100%);
            transition: transform 0.6s;
          }

          .tab-button:hover::before {
            transform: translateX(100%);
          }
          
          .tab-button.active {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            animation: pulse 2s infinite;
          }
          
          .tab-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.15);
            background: rgba(255, 255, 255, 0.18);
            color: white;
          }

          .progress-bar {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            position: relative;
          }

          .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 1.2s ease;
            position: relative;
            overflow: hidden;
          }

          .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(45deg, 
              transparent 30%, 
              rgba(255,255,255,0.3) 50%, 
              transparent 70%);
            animation: shimmer 2s infinite;
          }

          .score-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(25px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 20px;
            transition: all 0.3s ease;
            animation: fadeInUp 0.8s ease;
          }

          .score-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            background: rgba(255, 255, 255, 0.2);
          }

          .floating-icon {
            animation: pulse 3s ease-in-out infinite;
          }

          .loading-spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header Navigation - QuillBot Style */}
      <header className="header-glass" style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '12px 0'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              RS
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              margin: 0,
              letterSpacing: '1px'
            }}>
              ResuSync
            </h1>
          </div>

          {/* Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  {user.profilePicture && (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}
                    />
                  )}
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    console.log('Sign In button clicked, showLoginModal:', showLoginModal, 'showLandingPage:', showLandingPage);
                    setShowLoginModal(true);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Sign In
                </button>
                <button className="neon-button" style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  Subscribe
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout - QuillBot Style */}
      <div style={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)'
      }}>
        {/* Left Sidebar - 15% width for Professional ATS & Compatibility Analysis */}
        <div className="sidebar-glass" style={{
          width: '15%',
          minWidth: '200px',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <h3 style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📊 Professional ATS & Compatibility Analysis
          </h3>
          
          {result && result.professional_ats_analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Overall ATS Score - Pie Chart */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                textAlign: 'center'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '15px'
                }}>
                  🎯 Overall ATS Score
                </h4>
                <div style={{
                  position: 'relative',
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 15px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    #4CAF50 0deg ${(result.professional_ats_analysis.overallATSScore || 65) * 3.6}deg,
                    rgba(255, 255, 255, 0.2) ${(result.professional_ats_analysis.overallATSScore || 65) * 3.6}deg 360deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '85px',
                    height: '85px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <span style={{
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: '700'
                    }}>
                      {result.professional_ats_analysis.overallATSScore || 65}%
                    </span>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '10px',
                      fontWeight: '500'
                    }}>
                      ATS READY
                    </span>
                  </div>
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px'
                }}>
                  {(result.professional_ats_analysis.overallATSScore || 65) >= 80 ? '🌟 Excellent' : 
                   (result.professional_ats_analysis.overallATSScore || 65) >= 70 ? '✨ Good' : 
                   (result.professional_ats_analysis.overallATSScore || 65) >= 60 ? '⚡ Fair' : '🔧 Needs Work'}
                </div>
              </div>

              {/* 1. Content Quality Analysis */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#3498db',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>📝</span>
                  Content Quality
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div className="progress-fill" style={{
                    width: `${result.professional_ats_analysis.content?.score || 75}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                    borderRadius: '10px',
                    transition: 'width 1.2s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.content?.score || 75}% - Structure & Achievement Quality
                </span>
              </div>

              {/* 2. Section Completeness */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#e17055',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>📋</span>
                  Section Completeness
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div className="progress-fill" style={{
                    width: `${result.professional_ats_analysis.sections?.score || 80}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)',
                    borderRadius: '10px',
                    transition: 'width 1.2s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.sections?.score || 80}% - Essential Sections Coverage
                </span>
              </div>

              {/* 3. ATS Essentials */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#00b894',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>🎯</span>
                  ATS Essentials
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div className="progress-fill" style={{
                    width: `${result.professional_ats_analysis.atsEssentials?.score || 70}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #55efc4 0%, #00b894 100%)',
                    borderRadius: '10px',
                    transition: 'width 1.2s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.atsEssentials?.score || 70}% - ATS Parsing Readiness
                </span>
              </div>

              {/* 4. Job Tailoring */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#fdcb6e',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>🔧</span>
                  Job Tailoring
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div className="progress-fill" style={{
                    width: `${result.professional_ats_analysis.tailoring?.score || 65}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)',
                    borderRadius: '10px',
                    transition: 'width 1.2s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.tailoring?.score || 65}% - Role-Specific Alignment
                </span>
              </div>

              {/* Key Insights */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '15px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginTop: '10px'
              }}>
                <h5 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  💡 Key Insights
                </h5>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {result.professional_ats_analysis.overallATSScore >= 80 ? 
                    'Your resume is ATS-optimized and job-ready! 🎉' :
                    result.professional_ats_analysis.overallATSScore >= 70 ?
                    'Good foundation. Focus on job-specific keywords. 📝' :
                    'Needs improvement in structure and keyword optimization. 🔧'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              padding: '20px'
            }}>
              📈 Analysis will appear here after you submit your resume
            </div>
          )}
        </div>

        {/* Main Content Area - 85% width */}
        <div className="main-content-glass" style={{
          flex: 1,
          padding: '30px',
          overflowY: 'auto'
        }}>
          {!result ? (
            // Input Form
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                textAlign: 'center',
                marginBottom: '40px'
              }}>
                <h1 style={{
                  fontSize: '3.5rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 30%, #e9ecef 70%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '20px',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  letterSpacing: '3px',
                  position: 'relative',
                  zIndex: 1,
                  animation: 'fadeInUp 1s ease'
                }}>
                  ResuSync
                </h1>
                
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '25px',
                  padding: '8px 20px',
                  marginBottom: '25px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  animation: 'fadeInUp 1s ease 0.3s both'
                }}>
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    AI-Powered • Professional • Instant
                  </span>
                </div>
                
                <p style={{
                  fontSize: '1.5rem',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: '400',
                  letterSpacing: '0.5px',
                  marginBottom: '35px',
                  lineHeight: '1.6',
                  maxWidth: '600px',
                  margin: '0 auto 35px auto',
                  position: 'relative',
                  zIndex: 1,
                  animation: 'fadeInUp 1s ease 0.6s both'
                }}>
                  Transform Your Career with Enterprise-Grade Resume Analysis & Optimization
                </p>
                
                {user && (
                  <button
                    onClick={loadHistory}
                    className="neon-button"
                    style={{
                      padding: '15px 35px',
                      borderRadius: '25px',
                      fontSize: '16px',
                      marginBottom: '20px'
                    }}
                  >
                    📚 Load My History
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '25px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px'
                }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-glow"
                    style={{
                      padding: '18px 25px',
                      fontSize: '16px'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-glow"
                    style={{
                      padding: '18px 25px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <textarea
                  placeholder="📋 Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input-glow"
                  style={{
                    minHeight: '120px',
                    padding: '20px 25px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />

                <FileUpload
                  file={file}
                  resumeText={resumeText}
                  setResumeText={setResumeText}
                  handleFileChange={handleFileChange}
                  handleDragOver={handleDragOver}
                  handleDragEnter={handleDragEnter}
                  handleDrop={handleDrop}
                />

                <button
                  type="submit"
                  disabled={loading || isSubmitting}
                  className="neon-button"
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    marginTop: '10px',
                    opacity: (loading || isSubmitting) ? 0.7 : 1,
                    cursor: (loading || isSubmitting) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {(loading || isSubmitting) ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                      {isSubmitting ? 'Processing...' : 'Analyzing Resume...'}
                    </span>
                  ) : (
                    '🚀 Analyze & Optimize Resume'
                  )}
                </button>
              </form>
            </div>
          ) : (
            // Results Display
            <div style={{
              maxWidth: '1000px',
              margin: '0 auto'
            }}>
              {/* New Analysis button to reset form and run another resume */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  onClick={handleNewAnalysis}
                  style={{
                    background: 'linear-gradient(90deg,#6b46c1,#b794f4)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ➕ New Analysis
                </button>
              </div>
              {/* Tab Navigation */}
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '40px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[
                  { key: 'suggestions', label: '💡 Suggestions', icon: '📋' },
                  { key: 'generated_resume', label: '📄 Optimized Resume', icon: '✨' },
                  { key: 'cover_letter', label: '📬 Cover Letter', icon: '💼' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                    style={{
                      padding: '15px 30px',
                      fontSize: '16px',
                      fontWeight: '600',
                      minWidth: '200px'
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '40px',
                minHeight: '500px',
                color: 'white',
                lineHeight: '1.8',
                fontSize: '16px'
              }}>
                {activeTab === 'suggestions' && (
                  <div>
                    <h3 style={{ 
                      color: 'white', 
                      marginBottom: '30px', 
                      fontSize: '28px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      💡 Resume Improvement Suggestions
                    </h3>
                    <div style={{ 
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '25px',
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {result.suggestions}
                    </div>
                  </div>
                )}
                {activeTab === 'generated_resume' && (
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '30px'
                    }}>
                      <h3 style={{ 
                        color: 'white', 
                        margin: '0',
                        fontSize: '28px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        ✨ Optimized Resume
                      </h3>
                      <button
                        onClick={downloadPDF}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '12px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        {loading ? '🔄' : '⬇️'} Download PDF
                      </button>
                    </div>

                    {/* PDF Visual Preview or Loading State */}
                    {!pdfPreview && (loading || isSubmitting) ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        border: '2px dashed rgba(255, 255, 255, 0.3)',
                        padding: '60px 40px',
                        textAlign: 'center',
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                      }}>
                        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
                        <h3 style={{ color: 'white', margin: '0', fontSize: '18px' }}>
                          🔄 Generating PDF Preview...
                        </h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0', fontSize: '14px' }}>
                          Please wait while we create your optimized resume preview
                        </p>
                      </div>
                    ) : pdfPreview ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '40px',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#333',
                        height: '600px',
                        overflow: 'auto',
                        whiteSpace: 'pre-line',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}>
                        {/* Render the resume content directly */}
                        <div style={{
                          maxWidth: '100%',
                          margin: '0 auto',
                          backgroundColor: 'white',
                          padding: '30px',
                          borderRadius: '8px'
                        }}>
                          {result.generated_resume.split('\n').map((line, index) => {
                            // Style different sections
                            if (line.trim() === '') {
                              return <br key={index} />;
                            } else if (line.match(/^[A-Z\s]+$/) && line.length > 3) {
                              // Section headers (all caps)
                              return (
                                <h2 key={index} style={{
                                  fontSize: '16px',
                                  fontWeight: 'bold',
                                  marginTop: index === 0 ? '0' : '25px',
                                  marginBottom: '10px',
                                  color: '#2d3748',
                                  borderBottom: '1px solid #e2e8f0',
                                  paddingBottom: '5px'
                                }}>
                                  {line}
                                </h2>
                              );
                            } else if (line.includes('—') && line.includes('@')) {
                              // Contact line
                              return (
                                <p key={index} style={{
                                  fontSize: '12px',
                                  color: '#666',
                                  marginBottom: '15px',
                                  textAlign: 'center'
                                }}>
                                  {line}
                                </p>
                              );
                            } else if (line.startsWith('•')) {
                              // Bullet points
                              return (
                                <p key={index} style={{
                                  marginLeft: '20px',
                                  marginBottom: '8px',
                                  color: '#4a5568'
                                }}>
                                  {line}
                                </p>
                              );
                            } else if (line.match(/^[A-Z][a-zA-Z\s]+\|/)) {
                              // Internship/Project titles with |
                              return (
                                <p key={index} style={{
                                  fontWeight: 'bold',
                                  marginTop: '15px',
                                  marginBottom: '5px',
                                  color: '#2d3748'
                                }}>
                                  {line}
                                </p>
                              );
                            } else {
                              // Regular text
                              return (
                                <p key={index} style={{
                                  marginBottom: '8px',
                                  color: '#4a5568'
                                }}>
                                  {line}
                                </p>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Loading or Text fallback */
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '25px',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {loading ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '300px',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            <div style={{
                              fontSize: '48px',
                              marginBottom: '20px',
                              animation: 'spin 2s linear infinite'
                            }}>🔄</div>
                            <div style={{ fontSize: '18px', fontWeight: '600' }}>
                              Generating PDF Preview...
                            </div>
                            <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                              Creating your professionally formatted resume
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{
                              position: 'absolute',
                              top: '15px',
                              right: '15px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.7)'
                            }}>
                              📝 Text Version - PDF preview loading...
                            </div>
                            <div style={{ marginTop: '40px', whiteSpace: 'pre-wrap' }}>
                              {result.generated_resume}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'cover_letter' && (
                  <div>
                    <h3 style={{ 
                      color: 'white', 
                      marginBottom: '30px', 
                      fontSize: '28px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      💼 Professional Cover Letter
                    </h3>

                    {/* Download Button */}
                    <div style={{ marginBottom: '20px' }}>
                      <button
                        onClick={downloadCoverPDF}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #8B5A96, #5A6B8B)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 15px rgba(139, 90, 150, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {loading ? '🔄' : '⬇️'} Download Cover Letter PDF
                      </button>
                    </div>

                    {/* Cover Letter Visual Preview or Loading State */}
                    {!coverPdfPreview && (loading || isSubmitting) ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        border: '2px dashed rgba(255, 255, 255, 0.3)',
                        padding: '60px 40px',
                        textAlign: 'center',
                        height: '400px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px'
                      }}>
                        <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
                        <h3 style={{ color: 'white', margin: '0', fontSize: '18px' }}>
                          🔄 Generating Cover Letter Preview...
                        </h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0', fontSize: '14px' }}>
                          Please wait while we create your tailored cover letter
                        </p>
                      </div>
                    ) : coverPdfPreview ? (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '40px',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.8',
                        color: '#333',
                        height: '600px',
                        overflow: 'auto',
                        whiteSpace: 'pre-line',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}>
                        {/* Render the cover letter content directly */}
                        <div style={{
                          maxWidth: '100%',
                          margin: '0 auto',
                          backgroundColor: 'white',
                          padding: '30px',
                          borderRadius: '8px'
                        }}>
                          {result.cover_letter.split('\n').map((line, index) => {
                            // Style different parts
                            if (line.trim() === '') {
                              return <br key={index} />;
                            } else if (line.includes('Dear Hiring Manager')) {
                              // Greeting
                              return (
                                <p key={index} style={{
                                  fontWeight: 'bold',
                                  marginBottom: '20px',
                                  color: '#2d3748'
                                }}>
                                  {line}
                                </p>
                              );
                            } else if (line.includes('Yours sincerely') || line.includes('Sincerely')) {
                              // Signature section
                              return (
                                <p key={index} style={{
                                  marginTop: '30px',
                                  marginBottom: '10px',
                                  color: '#2d3748'
                                }}>
                                  {line}
                                </p>
                              );
                            } else if (line.includes('@') || line.includes('+91')) {
                              // Contact info
                              return (
                                <p key={index} style={{
                                  fontSize: '12px',
                                  color: '#666',
                                  marginBottom: '5px'
                                }}>
                                  {line}
                                </p>
                              );
                            } else {
                              // Regular paragraphs
                              return (
                                <p key={index} style={{
                                  marginBottom: '15px',
                                  color: '#4a5568',
                                  textAlign: 'justify'
                                }}>
                                  {line}
                                </p>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Loading or Text fallback */
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '25px',
                        borderRadius: '15px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        minHeight: '400px',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        {loading ? (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'white',
                            fontSize: '18px'
                          }}>
                            <div style={{
                              width: '50px',
                              height: '50px',
                              border: '3px solid rgba(255,255,255,0.3)',
                              borderTop: '3px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite',
                              marginBottom: '20px'
                            }}></div>
                            <p>Generating Cover Letter PDF Preview...</p>
                          </div>
                        ) : (
                          <div style={{
                            color: 'white',
                            lineHeight: '1.8'
                          }}>
                            <h4 style={{
                              color: '#8B5A96',
                              marginBottom: '15px',
                              fontSize: '20px'
                            }}>
                              📝 Text Version - Cover Letter PDF preview loading...
                            </h4>
                            <div style={{ 
                              whiteSpace: 'pre-wrap',
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '20px',
                              borderRadius: '10px',
                              fontSize: '14px'
                            }}>
                              {result.cover_letter}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Sign In Modal */}
      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '20px'
            }}>
              Sign In to ResuSync
            </h2>
            
            {/* Google Sign-In Button */}
            <div 
              id="google-signin-button"
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            ></div>
            
            {/* Fallback manual button */}
            <button
              onClick={() => {
                console.log('Manual Google Sign In button clicked');
                if (window.google && window.google.accounts && window.google.accounts.id) {
                  console.log('Google API available, prompting for sign in');
                  window.google.accounts.id.prompt();
                } else {
                  console.log('Google API not available');
                  alert('Google Sign-In is loading. Please try again in a moment.');
                }
              }}
              disabled={isSigningIn}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                cursor: isSigningIn ? 'not-allowed' : 'pointer',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {isSigningIn ? '🔄 Signing In...' : '🔑 Sign in with Google'}
            </button>

            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '10px 20px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}