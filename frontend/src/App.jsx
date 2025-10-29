import React, { useState, useEffect } from 'react';
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
    setShowMainApp(false);
    console.log('User signed out');
  };

  // Handle sign in button click
  const handleSignIn = () => {
    setShowLoginModal(true);
  };

  // Handle Get Started button click
  const handleGetStarted = () => {
    setShowMainApp(true);
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
      } else {
        alert('Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Error loading history');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file && !resumeText.trim()) {
      alert('Please upload a resume file or enter resume text');
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
      }
      if (resumeText.trim()) {
        formData.append('resumeText', resumeText);
      }

      const response = await fetch('http://localhost:5001/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
      } else {
        alert('Analysis failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = async (type) => {
    try {
      const content = type === 'resume' ? result.generated_resume : result.cover_letter;
      const filename = type === 'resume' ? `${name}_Resume.pdf` : `${name}_CoverLetter.pdf`;
      
      const response = await fetch('http://localhost:5001/api/resume/download-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename,
          type
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
        alert('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        user={user} 
        onSignOut={handleSignOut} 
        onSignIn={handleSignIn}
      />

      {/* Main Content */}
      {!showMainApp && !result ? (
        // Landing Page
        <LandingPage onGetStarted={handleGetStarted} />
      ) : (
        // Main Application
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="min-h-96 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : !result ? (
            // Input Form
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Analyze Your Resume
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Upload your resume and job description to get AI-powered optimization suggestions
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Description *
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="Paste the job description here..."
                    />
                  </div>

                  {/* File Upload */}
                  <FileUpload 
                    file={file}
                    setFile={setFile}
                    resumeText={resumeText}
                    setResumeText={setResumeText}
                  />

                  {/* Submit Button */}
                  <div className="text-center">
                    <ButtonLoading
                      loading={loading}
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
                    >
                      Analyze Resume with AI
                    </ButtonLoading>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            // Results Display
            <div className="space-y-8">
              {/* Results Header */}
              <div className="text-center bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Analysis Complete! 🎉
                </h2>
                <p className="text-gray-600 text-lg mb-6">
                  Here are your personalized resume optimization results
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ← New Analysis
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-8">
                    {[
                      { key: 'suggestions', label: '💡 Suggestions' },
                      { key: 'generated_resume', label: '📝 Optimized Resume' },
                      { key: 'cover_letter', label: '✉️ Cover Letter' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'suggestions' && (
                    <div className="prose max-w-none">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        💡 Improvement Suggestions
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {result.suggestions}
                      </div>
                    </div>
                  )}

                  {activeTab === 'generated_resume' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          📝 Optimized Resume
                        </h3>
                        <button
                          onClick={() => downloadPDF('resume')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-6 bg-gray-50">
                        {result.generated_resume}
                      </div>
                    </div>
                  )}

                  {activeTab === 'cover_letter' && (
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          ✉️ Cover Letter
                        </h3>
                        <button
                          onClick={() => downloadPDF('cover')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-6 bg-gray-50">
                        {result.cover_letter}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-4">
                Sign in to save your analyses and access them anytime
              </p>
              
              <button
                onClick={() => {
                  if (window.google) {
                    window.google.accounts.id.prompt();
                  }
                }}
                disabled={isSigningIn}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              We'll never post anything without your permission
            </p>
          </div>
        </div>
      )}
    </div>
  );
}