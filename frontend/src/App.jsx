import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import Footer from './components/Footer';
import { LoadingSpinner, ButtonLoading } from './components/Loading';

export default function App() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [history, setHistory] = useState([]);
  
  // Google Authentication states
  const [user, setUser] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // UI states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMainApp, setShowMainApp] = useState(false);

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: '595202264177-s97i4i7bmi7csrnu6vd9gcuf0314qq7a.apps.googleusercontent.com',
        callback: handleGoogleSignIn
      });
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

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
        localStorage.setItem('token', data.token);
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

  // Load user history
  const loadHistory = async () => {
    if (!user) {
      alert('Please sign in to view your history');
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

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
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
    }
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', { name, email, jobDescription, file, resumeText });
    
    if (!jobDescription || (!file && !resumeText)) {
      alert('Please provide both a job description and resume (file or text)');
      return;
    }

    setLoading(true);
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setResult(data.data);
        setActiveTab('suggestions');
        console.log('Analysis successful:', data.data);
      } else {
        alert(data.message || 'Analysis failed');
        console.error('Analysis failed:', data.message);
      }
    } catch (error) {
      console.error('Error details:', error);
      if (error.message.includes('fetch')) {
        alert('âŒ Unable to connect to server. Please ensure the backend is running on port 5001.');
      } else if (error.message.includes('HTTP error')) {
        alert('âŒ Server error occurred. Please check the backend logs.');
      } else {
        alert('âŒ An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Download PDF function
  const downloadPDF = async (type) => {
    if (!result || !result.id) {
      alert('Please analyze a resume first before downloading PDF');
      return;
    }

    try {
      const filename = type === 'resume' ? `${name}_optimized_resume.pdf` : `${name}_cover_letter.pdf`;
      
      const response = await fetch(`http://localhost:5001/api/resume/download-pdf/${result.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          includePhoto: false
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(`Failed to download PDF: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  // Preview PDF function
  const previewPDF = async (type) => {
    if (!result || !result.id) {
      alert('Please analyze a resume first before previewing PDF');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/resume/download-pdf/${result.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: type,
          includePhoto: false
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Clean up the URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        const errorData = await response.json();
        alert(`Failed to preview PDF: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Error previewing PDF');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%)',
      backgroundSize: '300% 300%',
      animation: 'gradientShift 12s ease infinite',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
            background-size: 200% 200%;
            animation: gradientShift 3s ease infinite;
            border: none;
            color: white;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          }

          .neon-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
          }

          .neon-button:hover::before {
            left: 100%;
          }
          
          .neon-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
            animation-duration: 1.5s;
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
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
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
                  onClick={() => setShowLoginModal(true)}
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
        {/* Left Sidebar - 15% width for Professional ATS Analysis */}
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
            ðŸ“Š Professional ATS Analysis
          </h3>
          
          {result && result.professional_ats_analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Content Analysis */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
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
                  }}>C</span>
                  Content Analysis
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '10px',
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
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.content?.score || 75}% - Parse Rate & Impact
                </span>
              </div>

              {/* Section Analysis */}
              <div className="score-card" style={{
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.3s ease'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#2ecc71',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>S</span>
                  Section Analysis
                </h4>
                <div className="progress-bar" style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  height: '10px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div className="progress-fill" style={{
                    width: `${result.professional_ats_analysis.sections?.score || 80}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
                    borderRadius: '10px',
                    transition: 'width 1.2s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.sections?.score || 80}% - Essential Sections
                </span>
              </div>

              {/* ATS Essentials */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  ™ï¸ ATS Essentials
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.professional_ats_analysis.ats_essentials?.score || 85}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #fdcb6e, #e17055)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.ats_essentials?.score || 85}% - Format & Design
                </span>
              </div>

              {/* Tailoring Analysis */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '15px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <h4 style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    background: '#e74c3c',
                    borderRadius: '4px',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>T</span>
                  Tailoring Analysis
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.professional_ats_analysis.tailoring?.score || 65}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #fd79a8, #e84393)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.professional_ats_analysis.tailoring?.score || 65}% - Skills & Keywords
                </span>
              </div>

              {/* Total ATS Score Pie Chart */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                borderRadius: '16px',
                padding: '25px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                marginTop: '20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ðŸ“Š Overall ATS Score
                </h3>
                
                {/* Calculate total score */}
                {(() => {
                  const contentScore = result.professional_ats_analysis.content?.score || 75;
                  const sectionScore = result.professional_ats_analysis.sections?.score || 80;
                  const atsEssentialsScore = result.professional_ats_analysis.ats_essentials?.score || 85;
                  const tailoringScore = result.professional_ats_analysis.tailoring?.score || 65;
                  const totalScore = Math.round((contentScore + sectionScore + atsEssentialsScore + tailoringScore) / 4);
                  
                  return (
                    <>
                      {/* Pie Chart */}
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        margin: '0 auto 20px',
                        background: `conic-gradient(
                          #00b894 0deg ${totalScore * 3.6}deg,
                          rgba(255, 255, 255, 0.2) ${totalScore * 3.6}deg 360deg
                        )`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                      }}>
                        <div style={{
                          width: '90px',
                          height: '90px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column'
                        }}>
                          <span style={{ 
                            color: 'white', 
                            fontSize: '24px', 
                            fontWeight: '800',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                          }}>
                            {totalScore}%
                          </span>
                          <span style={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            fontSize: '10px', 
                            fontWeight: '600',
                            marginTop: '2px'
                          }}>
                            ATS
                          </span>
                        </div>
                      </div>
                      
                      {/* Score Status */}
                      <div style={{
                        background: totalScore >= 80 ? 'rgba(0, 184, 148, 0.2)' : 
                                   totalScore >= 60 ? 'rgba(253, 203, 110, 0.2)' : 
                                   'rgba(225, 112, 85, 0.2)',
                        border: `1px solid ${totalScore >= 80 ? '#00b894' : 
                                              totalScore >= 60 ? '#fdcb6e' : 
                                              '#e17055'}`,
                        borderRadius: '12px',
                        padding: '10px 15px',
                        marginTop: '10px'
                      }}>
                        <p style={{
                          color: totalScore >= 80 ? '#00b894' : 
                                 totalScore >= 60 ? '#fdcb6e' : 
                                 '#e17055',
                          fontSize: '13px',
                          margin: 0,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {totalScore >= 80 ? '‰ Excellent' : 
                           totalScore >= 60 ? '¡ Good' : 
                           'ðŸ”§ Needs Improvement'}
                        </p>
                      </div>
                      
                      {/* Score Breakdown */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        marginTop: '15px',
                        fontSize: '11px'
                      }}>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Content: {contentScore}%
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Sections: {sectionScore}%
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          ATS: {atsEssentialsScore}%
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Tailoring: {tailoringScore}%
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              marginTop: '40px'
            }}>
              Upload a resume to see Professional ATS Analysis
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
                {/* Floating background elements */}
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  left: '10%',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  animation: 'pulse 4s ease-in-out infinite',
                  zIndex: 0
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '60%',
                  right: '15%',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '50%',
                  animation: 'pulse 3s ease-in-out infinite 1s',
                  zIndex: 0
                }}></div>

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
                    ðŸ“œ Load My History
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
                    required
                    className="input-glow"
                    style={{
                      padding: '18px 25px',
                      borderRadius: '15px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-glow"
                    style={{
                      padding: '18px 25px',
                      borderRadius: '15px',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}
                  />
                </div>

                <textarea
                  placeholder="Paste the Job Description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  className="input-glow"
                  style={{
                    padding: '25px',
                    borderRadius: '15px',
                    fontSize: '16px',
                    fontWeight: '500',
                    minHeight: '120px',
                    resize: 'vertical'
                  }}
                />

                <div style={{
                  border: '2px dashed rgba(255, 255, 255, 0.4)',
                  borderRadius: '15px',
                  padding: '40px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.transform = 'translateY(0)';
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={handleDrop}
                onClick={(e) => {
                  console.log('Upload area clicked');
                  // Simple, direct approach
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.txt';
                  input.style.display = 'none';
                  input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (file) {
                      console.log('File selected:', file.name, file.type);
                      
                      // Validate file type
                      const allowedTypes = ['application/pdf', 'application/msword', 
                                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                                          'text/plain'];
                      const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
                      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
                      
                      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
                        setFile(file);
                        console.log('File accepted:', file.name);
                      } else {
                        alert('Please upload a PDF, DOC, DOCX, or TXT file');
                        console.log('File rejected:', file.type);
                      }
                    }
                    document.body.removeChild(input);
                  };
                  document.body.appendChild(input);
                  input.click();
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    width: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    <div style={{
                      fontSize: '4rem',
                      opacity: 0.8
                    }}>
                      ðŸ“„
                    </div>
                    <div>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: '0 0 10px 0'
                      }}>
                        {file ? file.name : 'Click to Upload Your Resume'}
                      </p>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '16px',
                        margin: '0 0 8px 0'
                      }}>
                        or drag and drop here
                      </p>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '14px',
                        margin: 0
                      }}>
                        PDF, DOC, DOCX, or TXT files supported
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show selected file name */}
                {file && (
                  <div style={{
                    textAlign: 'center',
                    padding: '15px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    marginBottom: '10px'
                  }}>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '14px',
                      margin: 0,
                      fontWeight: '500'
                    }}>
                      ✅ Selected: {file.name}
                    </p>
                  </div>
                )}

                <div style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px',
                  fontWeight: '500'
                }}>
                  OR
                </div>

                <textarea
                  placeholder="Or paste your resume text here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="input-glow"
                  style={{
                    padding: '25px',
                    borderRadius: '15px',
                    fontSize: '16px',
                    fontWeight: '500',
                    minHeight: '150px',
                    resize: 'vertical'
                  }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="neon-button"
                  style={{
                    padding: '20px 40px',
                    borderRadius: '15px',
                    fontSize: '18px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'ANALYZING...' : 'ANALYZE RESUME'}
                </button>
              </form>
            </div>
          ) : (
            // Results Display
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '30px'
            }}>
              {/* Results Header */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '30px',
                textAlign: 'center'
              }}>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '15px',
                  letterSpacing: '1px'
                }}>
                  Analysis Complete
                </h2>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px',
                  marginBottom: '20px'
                }}>
                  Your resume has been analyzed for <strong>{name}</strong>
                </p>
                <button
                  onClick={() => setResult(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ðŸ”„ New Analysis
                </button>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {[
                  { key: 'suggestions', label: 'Suggestions' },
                  { key: 'generated_resume', label: 'Optimized Resume' },
                  { key: 'cover_letter', label: 'Cover Letter' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                    style={{
                      padding: '12px 25px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '20px',
                padding: '30px',
                minHeight: '400px'
              }}>
                {activeTab === 'suggestions' && (
                  <div>
                    <h3 style={{
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      ðŸ’¡ Improvement Suggestions
                    </h3>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap'
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
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        ðŸ“ Optimized Resume
                      </h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => previewPDF('resume')}
                          className="neon-button"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ðŸ‘ï¸ Preview PDF
                        </button>
                        <button
                          onClick={() => downloadPDF('resume')}
                          className="neon-button"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ðŸ“¥ Download PDF
                        </button>
                      </div>
                    </div>
                    
                    {/* Professional Resume Preview */}
                    <div style={{
                      background: 'white',
                      color: '#000',
                      borderRadius: '12px',
                      padding: '40px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: '1.4',
                      maxHeight: '800px',
                      overflowY: 'auto',
                      border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {result.generated_resume ? (
                        (() => {
                          const resumeLines = result.generated_resume.split('\n');
                          let currentSection = '';
                          const sections = {};
                          let tempContent = [];
                          
                          // Parse resume sections
                          resumeLines.forEach(line => {
                            const trimmedLine = line.trim();
                            if (trimmedLine && ['OBJECTIVE', 'EDUCATION', 'SKILLS', 'INTERNSHIPS', 'PROJECTS', 'CERTIFICATIONS', 'EXPERIENCE'].includes(trimmedLine.toUpperCase())) {
                              if (currentSection && tempContent.length > 0) {
                                sections[currentSection] = tempContent;
                              }
                              currentSection = trimmedLine.toUpperCase();
                              tempContent = [];
                            } else if (currentSection && trimmedLine) {
                              tempContent.push(trimmedLine);
                            } else if (!currentSection && trimmedLine) {
                              // Header content (name, contact)
                              if (!sections.HEADER) sections.HEADER = [];
                              sections.HEADER.push(trimmedLine);
                            }
                          });
                          if (currentSection && tempContent.length > 0) {
                            sections[currentSection] = tempContent;
                          }
                          
                          return (
                            <div>
                              {/* Header Section */}
                              {sections.HEADER && (
                                <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
                                  <h1 style={{ 
                                    fontSize: '24px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                  }}>
                                    {sections.HEADER[0] || 'Professional Name'}
                                  </h1>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    color: '#555',
                                    fontWeight: '500'
                                  }}>
                                    {sections.HEADER.slice(1).join(' | ')}
                                  </div>
                                </div>
                              )}
                              
                              {/* Objective Section */}
                              {sections.OBJECTIVE && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    Objective
                                  </h2>
                                  <p style={{ 
                                    fontSize: '11px', 
                                    margin: '0',
                                    textAlign: 'justify',
                                    lineHeight: '1.5'
                                  }}>
                                    {sections.OBJECTIVE.join(' ')}
                                  </p>
                                </div>
                              )}
                              
                              {/* Education Section */}
                              {sections.EDUCATION && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    Education
                                  </h2>
                                  {sections.EDUCATION.map((edu, index) => (
                                    <div key={index} style={{ 
                                      fontSize: '11px', 
                                      margin: '4px 0',
                                      paddingLeft: '12px'
                                    }}>
                                      {edu.replace(/^[•\-\*]\s*/, '• ')}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Skills Section */}
                              {sections.SKILLS && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    Skills
                                  </h2>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px' }}>
                                    {sections.SKILLS.map((skill, index) => (
                                      <div key={index} style={{ 
                                        fontSize: '11px', 
                                        margin: '2px 0',
                                        paddingLeft: '12px'
                                      }}>
                                        {skill.replace(/^[•\-\*]\s*/, '• ')}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Experience/Internships Section */}
                              {(sections.INTERNSHIPS || sections.EXPERIENCE) && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    {sections.EXPERIENCE ? 'Experience' : 'Internships'}
                                  </h2>
                                  {(sections.EXPERIENCE || sections.INTERNSHIPS).map((exp, index) => (
                                    <div key={index} style={{ marginBottom: '12px' }}>
                                      {exp.includes('•') || exp.includes('-') ? (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          margin: '2px 0',
                                          paddingLeft: '16px'
                                        }}>
                                          {exp.replace(/^[•\-\*]\s*/, '• ')}
                                        </div>
                                      ) : (
                                        <div style={{ 
                                          fontSize: '12px', 
                                          fontWeight: '600',
                                          margin: '6px 0 2px 0'
                                        }}>
                                          {exp}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Projects Section */}
                              {sections.PROJECTS && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    Projects
                                  </h2>
                                  {sections.PROJECTS.map((project, index) => (
                                    <div key={index} style={{ marginBottom: '10px' }}>
                                      {project.includes('•') || project.includes('-') ? (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          margin: '2px 0',
                                          paddingLeft: '16px'
                                        }}>
                                          {project.replace(/^[•\-\*]\s*/, '• ')}
                                        </div>
                                      ) : (
                                        <div style={{ 
                                          fontSize: '12px', 
                                          fontWeight: '600',
                                          margin: '6px 0 2px 0'
                                        }}>
                                          {project}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Certifications Section */}
                              {sections.CERTIFICATIONS && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h2 style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    margin: '0 0 8px 0',
                                    textTransform: 'uppercase',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '3px'
                                  }}>
                                    Certifications
                                  </h2>
                                  {sections.CERTIFICATIONS.map((cert, index) => (
                                    <div key={index} style={{ 
                                      fontSize: '11px', 
                                      margin: '4px 0',
                                      paddingLeft: '12px'
                                    }}>
                                      {cert.replace(/^[•\-\*]\s*/, '• ')}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div style={{ 
                          textAlign: 'center', 
                          color: '#666', 
                          fontSize: '16px',
                          padding: '40px'
                        }}>
                          Resume preview will appear here after analysis...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'cover_letter' && (
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        âœ‰ï¸ Cover Letter
                      </h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => previewPDF('cover')}
                          className="neon-button"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ï¿½ï¸ Preview PDF
                        </button>
                        <button
                          onClick={() => downloadPDF('cover')}
                          className="neon-button"
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          ðŸ“¥ Download PDF
                        </button>
                      </div>
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {result.cover_letter}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Display */}
      {history.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '15px',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              margin: 0
            }}>
              ðŸ“š Your History
            </h3>
            <button
              onClick={() => setHistory([])}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              Ã—
            </button>
          </div>
          {history.map((item, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              setResult({
                suggestions: item.suggestions,
                generated_resume: item.generatedResume,
                cover_letter: item.coverLetter
              });
              setName(item.name);
              setEmail(item.email);
              setHistory([]);
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <p style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                margin: '0 0 5px 0'
              }}>
                {item.name}
              </p>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '12px',
                margin: 0
              }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Login Modal */}
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
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: '700',
                margin: 0
              }}>
                Sign In
              </h2>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                Ã—
              </button>
            </div>

            <div style={{
              marginBottom: '20px'
            }}>
              <h3 style={{
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '15px',
                fontSize: '18px',
                fontWeight: '500'
              }}>
                ðŸ” Access your saved analyses
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '25px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Sign in with Google to save your resume analyses and access them anytime
              </p>
            </div>

            <div 
              id="google-signin-button"
              style={{ 
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              {/* Custom Google Sign-In Button with Logo */}
              <div 
                style={{
                  background: 'white',
                  color: '#1f1f1f',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: '1px solid #dadce0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  fontFamily: 'Roboto, arial, sans-serif'
                }}
                onClick={() => {
                  if (window.google) {
                    window.google.accounts.id.prompt();
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {/* Google Logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </div>
            </div>

          <div style={{
            marginTop: '15px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            We'll never post anything without your permission
          </div>
        </div>
      </div>
    )}
  </div>
);
}







