import React, { useState, useEffect } from 'react';

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
      setFile(selectedFile);
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
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
      const fileExtension = '.' + droppedFile.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        setFile(droppedFile);
      } else {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
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
        alert('❌ Unable to connect to server. Please ensure the backend is running on port 5001.');
      } else if (error.message.includes('HTTP error')) {
        alert('❌ Server error occurred. Please check the backend logs.');
      } else {
        alert('❌ An unexpected error occurred. Please try again.');
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          
          .glass-morphism {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
          }
          
          .header-glass {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .neon-button {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
            background-size: 300% 300%;
            border: none;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 8px;
          }
          
          .neon-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          
          .sidebar-glass {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(15px);
            border-right: 1px solid rgba(255, 255, 255, 0.15);
          }
          
          .main-content-glass {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
          }
          
          .input-glow {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            color: white;
            transition: all 0.3s ease;
          }
          
          .input-glow:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
          }
          
          .input-glow::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .tab-button {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            cursor: pointer;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .tab-button.active {
            background: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.5);
            color: white;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
          }
          
          .tab-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
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
              fontSize: '20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
              ✨
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
        {/* Left Sidebar - 15% width for resume analysis */}
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
            📊 Analysis Results
          </h3>
          
          {result && result.analysis ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* ATS Score */}
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
                  🎯 ATS Score
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.analysis.atsScore || 75}%`,
                    height: '100%',
                    background: result.analysis.atsScore > 80 ? 'linear-gradient(90deg, #00b894, #00cec9)' : 
                              result.analysis.atsScore > 60 ? 'linear-gradient(90deg, #fdcb6e, #e17055)' :
                              'linear-gradient(90deg, #e17055, #d63031)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.analysis.atsScore || 75}% - Needs improvement
                </span>
              </div>

              {/* Keywords Match */}
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
                  🔑 Keywords Match
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.analysis.keywordMatch || 60}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #74b9ff, #0984e3)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.analysis.keywordMatch || 60}% - Add more tech skills
                </span>
              </div>

              {/* Content Quality */}
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
                  📝 Content Quality
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.analysis.contentQuality || 70}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #55a3ff, #003d82)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.analysis.contentQuality || 70}% - Improve descriptions
                </span>
              </div>

              {/* Format & Structure */}
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
                  🎨 Format & Structure
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.analysis.format || 85}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00b894, #00cec9)',
                    borderRadius: '8px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {result.analysis.format || 85}% - Well structured
                </span>
              </div>

              {/* Impact Score */}
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
                  💥 Impact Score
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  overflow: 'hidden',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: `${result.analysis.impact || 55}%`,
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
                  {result.analysis.impact || 55}% - Add metrics & numbers
                </span>
              </div>

              {/* Overall Score */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                textAlign: 'center',
                marginTop: '10px'
              }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  margin: '0 0 5px 0'
                }}>
                  {Math.round(((result.analysis.atsScore || 75) + (result.analysis.keywordMatch || 60) + (result.analysis.contentQuality || 70) + (result.analysis.format || 85) + (result.analysis.impact || 55)) / 5)}%
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '12px',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  Overall Score
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              marginTop: '40px'
            }}>
              Upload a resume to see analysis results
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
                  fontSize: '3rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '20px',
                  textShadow: '0 0 30px rgba(255,255,255,0.5)',
                  letterSpacing: '2px'
                }}>
                  ✨ ResuSync
                </h1>
                
                <p style={{
                  fontSize: '1.4rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '300',
                  letterSpacing: '1px',
                  marginBottom: '30px'
                }}>
                  Transform Your Career with AI-Powered Resume Optimization
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
                    📜 Load My History
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
                onClick={() => document.getElementById('file-input').click()}>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      zIndex: 2
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    width: '100%',
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      fontSize: '4rem',
                      opacity: 0.8
                    }}>
                      📄
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
                  {loading ? '🔄 Analyzing...' : '✨ Analyze Resume'}
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
                  🎯 Analysis Complete!
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
                  🔄 New Analysis
                </button>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px'
              }}>
                {[
                  { key: 'suggestions', label: '💡 Suggestions' },
                  { key: 'generated_resume', label: '📝 Optimized Resume' },
                  { key: 'cover_letter', label: '✉️ Cover Letter' }
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
                      💡 Improvement Suggestions
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
                        📝 Optimized Resume
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
                          👁️ Preview PDF
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
                          📥 Download PDF
                        </button>
                      </div>
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '16px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {result.generated_resume}
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
                        ✉️ Cover Letter
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
                          �️ Preview PDF
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
                          📥 Download PDF
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
              📚 Your History
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
              ×
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
                ×
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
                🔐 Access your saved analyses
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