import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import FileUpload from './components/FileUpload';
import Footer from './components/Footer';
import { LoadingSpinner, ButtonLoading } from './components/Loading';
import ClientPDFGenerator from './components/ClientPDFGenerator.js';

export default function App() {
  // ALL STATE DECLARATIONS AT THE TOP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [history, setHistory] = useState([]);
  const [showMainApp, setShowMainApp] = useState(false);
  const [user, setUser] = useState(null);
  
  // REF DECLARATIONS
  const fileInputRef = useRef(null);
  const pdfGeneratorRef = useRef(null);

  // Initialize PDF generator
  useEffect(() => {
    if (!pdfGeneratorRef.current) {
      pdfGeneratorRef.current = new ClientPDFGenerator();
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle resume submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !jobDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!resumeText.trim() && !file) {
      alert('Please provide resume text or upload a resume file');
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim());
      formData.append('jobDescription', jobDescription.trim());
      
      if (file) {
        formData.append('resume', file);
      }
      
      if (resumeText.trim()) {
        formData.append('resumeText', resumeText.trim());
      }

      const response = await fetch('http://localhost:5001/api/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setActiveTab('suggestions');
      } else {
        alert('Error: ' + (data.message || 'Failed to analyze resume'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Download PDF functions
  const downloadPDF = () => {
    if (!result?.generated_resume) {
      alert('No resume data available for PDF generation');
      return;
    }

    try {
      pdfGeneratorRef.current.generateResumePDF(
        result.generated_resume, 
        `${name.replace(/\s+/g, '_')}_Resume.pdf`
      );
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };

  const downloadCoverPDF = () => {
    if (!result?.cover_letter) {
      alert('No cover letter data available for PDF generation');
      return;
    }

    try {
      pdfGeneratorRef.current.generateCoverLetterPDF(
        result.cover_letter, 
        `${name.replace(/\s+/g, '_')}_Cover_Letter.pdf`
      );
    } catch (error) {
      console.error('Cover letter PDF generation error:', error);
      alert('Error generating cover letter PDF: ' + error.message);
    }
  };

  // Load history
  const loadHistory = async () => {
    if (!email.trim()) {
      alert('Please enter your email to load history');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/resume/history?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
      } else {
        alert('No history found for this email');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Error loading history');
    }
  };

  // Load previous analysis
  const loadPreviousAnalysis = (analysis) => {
    setName(analysis.name || '');
    setJobDescription(analysis.jobDescription || '');
    setResumeText(analysis.originalText || '');
    setResult({
      suggestions: analysis.suggestions,
      generated_resume: analysis.generatedResume,
      cover_letter: analysis.coverLetter
    });
    setActiveTab('suggestions');
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setJobDescription('');
    setResumeText('');
    setFile(null);
    setResult(null);
    setActiveTab('suggestions');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!showMainApp) {
    return (
      <LandingPage 
        onBuildResume={() => setShowMainApp(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              AI Resume Builder
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste the job description you're applying for..."
                  required
                />
              </div>

              <FileUpload
                file={file}
                onFileSelect={handleFileUpload}
                resumeText={resumeText}
                onResumeTextChange={setResumeText}
                fileInputRef={fileInputRef}
              />

              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Resume'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={loadHistory}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                >
                  Load History
                </button>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-wrap gap-2 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`px-4 py-2 rounded-t-lg font-medium ${
                    activeTab === 'suggestions'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  AI Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('generated_resume')}
                  className={`px-4 py-2 rounded-t-lg font-medium ${
                    activeTab === 'generated_resume'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Optimized Resume
                </button>
                <button
                  onClick={() => setActiveTab('cover_letter')}
                  className={`px-4 py-2 rounded-t-lg font-medium ${
                    activeTab === 'cover_letter'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cover Letter
                </button>
              </div>

              {activeTab === 'suggestions' && result.suggestions && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">AI Suggestions</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-gray-700">{result.suggestions}</pre>
                  </div>
                </div>
              )}

              {activeTab === 'generated_resume' && result.generated_resume && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">Optimized Resume</h3>
                    <button
                      onClick={downloadPDF}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Download PDF
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-gray-700">{result.generated_resume}</pre>
                  </div>
                </div>
              )}

              {activeTab === 'cover_letter' && result.cover_letter && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800">Cover Letter</h3>
                    <button
                      onClick={downloadCoverPDF}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Download PDF
                    </button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-gray-700">{result.cover_letter}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Previous Analyses</h3>
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => loadPreviousAnalysis(item)}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800">
                      Load Analysis
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}