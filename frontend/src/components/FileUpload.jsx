import React, { useState, useRef } from 'react';

const FileUpload = ({ 
  file, 
  resumeText, 
  setResumeText, 
  handleFileChange, 
  handleDragOver, 
  handleDragEnter, 
  handleDrop 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleLocalDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    if (handleDragOver) handleDragOver(e);
  };

  const handleLocalDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleLocalDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (handleDrop) handleDrop(e);
  };

  const handleFileInputChange = (e) => {
    // Prevent double triggering with multiple checks
    if (!e.target || e.target !== fileInputRef.current) {
      console.log('Ignoring file change from wrong target');
      return;
    }
    
    // Prevent processing if files are the same as current
    if (e.target.files[0] === file) {
      console.log('Same file selected, ignoring');
      return;
    }
    
    console.log('FileUpload: Processing file change');
    if (handleFileChange) {
      handleFileChange(e);
    }
  };

  const removeFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Clear file by triggering change event with empty file
    const event = { target: { files: [] } };
    if (handleFileChange) handleFileChange(event);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(15px)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '25px'
    }}>
      {/* Main Upload Area */}
      <div>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          📂 Upload Your Resume
        </h4>
        
        <div
          style={{
            border: `3px dashed ${isDragOver ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: '15px',
            padding: '40px 20px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative'
          }}
          onDragOver={handleLocalDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleLocalDragLeave}
          onDrop={handleLocalDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {!file ? (
            <>
              <div style={{
                fontSize: '48px',
                marginBottom: '20px',
                opacity: isDragOver ? 1 : 0.7,
                transition: 'opacity 0.3s ease'
              }}>
                {isDragOver ? '⬇️' : '📎'}
              </div>
              <h3 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '10px'
              }}>
                {isDragOver ? 'Drop your resume here' : 'Choose your resume file'}
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                Drag & drop or click to browse
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                📋 Supports: PDF, DOC, DOCX, TXT
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ fontSize: '48px' }}>✅</div>
              <h3 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}>
                {file.name}
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                margin: 0
              }}>
                File ready for analysis
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                🗑️ Remove File
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              pointerEvents: file ? 'none' : 'auto' // Disable when file is selected
            }}
          />
        </div>
      </div>

      {/* OR Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '30px 0 20px 0'
      }}>
        <div style={{
          flex: 1,
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)'
        }}></div>
        <span style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          fontWeight: '500',
          padding: '0 15px'
        }}>
          OR
        </span>
        <div style={{
          flex: 1,
          height: '1px',
          background: 'rgba(255, 255, 255, 0.2)'
        }}></div>
      </div>

      {/* Text Input Area - Smaller Box */}
      <div>
        <h4 style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          ✏️ Paste Your Resume Content
        </h4>
        
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your complete resume content here..."
          style={{
            width: '100%',
            minHeight: '120px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '15px',
            color: 'white',
            fontSize: '14px',
            fontFamily: "'Inter', sans-serif",
            resize: 'vertical',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
            e.target.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        />
        
        {resumeText.length > 0 && (
          <div style={{
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px'
            }}>
              {resumeText.length} characters
            </span>
            <button
              onClick={() => setResumeText('')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '12px',
          margin: 0,
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          💡 <strong>Pro Tip:</strong> For best results, include contact info, work experience, education, and skills.
        </p>
      </div>
    </div>
  );
};

export default FileUpload;