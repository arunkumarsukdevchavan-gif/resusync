import React from 'react';

const LandingPage = ({ onBuildResume }) => {
  const scrollToContact = () => {
    document.getElementById('contact-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #9333EA 50%, #7C3AED 75%, #6D28D9 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 5%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(45deg, #FFFFFF, #F8FAFC)',
            borderRadius: '8px',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: '#7C3AED',
            fontWeight: '700',
          }}>
            R
          </div>
          ResuSync
        </div>

        {/* Navigation */}
        <nav style={{
          display: 'flex',
          gap: '40px',
          alignItems: 'center',
        }}>
          <button
            onClick={scrollToContact}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'opacity 0.3s ease',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Contact Us
          </button>
          <button
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '80px 5%',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '60px',
      }}>
        {/* Left Content */}
        <div style={{
          flex: '1',
          maxWidth: '600px',
        }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            color: 'white',
            lineHeight: '1.2',
            marginBottom: '24px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E8FF 25%, #E9D5FF 50%, #DDD6FE 75%, #FFFFFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'brightness(1.2)',
            }}>
              Sync your resume. Sync your success.
            </span>
          </h1>
          
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '32px',
            lineHeight: '1.5',
          }}>
            Make your resume stand out to recruiters
          </p>

          {/* CTA Button */}
          <button
            onClick={onBuildResume}
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 25%, #F1F5F9 50%, #E2E8F0 75%, #FFFFFF 100%)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#7C3AED',
              padding: '18px 36px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'none',
              letterSpacing: 'normal',
              boxShadow: '0 8px 25px rgba(255, 255, 255, 0.2)',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(255, 255, 255, 0.3)';
              e.target.style.background = 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(255, 255, 255, 0.2)';
              e.target.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 25%, #F1F5F9 50%, #E2E8F0 75%, #FFFFFF 100%)';
            }}
          >
            Build Your Resume
          </button>
        </div>

        {/* Right Content - Resume Preview */}
        <div style={{
          flex: '1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div style={{
            width: '400px',
            height: '500px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            padding: '30px',
            transform: 'rotateY(-5deg) rotateX(5deg)',
            transformStyle: 'preserve-3d',
            position: 'relative',
          }}>
            {/* Resume Content Preview */}
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              borderRadius: '8px',
              padding: '20px',
              fontSize: '12px',
              color: '#333',
              overflow: 'hidden',
            }}>
              <div style={{
                borderBottom: '2px solid #A855F7',
                paddingBottom: '10px',
                marginBottom: '15px',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  margin: '0 0 5px 0',
                  color: '#333',
                }}>
                  Jamie Smith
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  margin: '0',
                }}>
                  Senior Product Manager
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px',
                gap: '20px',
                height: 'calc(100% - 60px)',
              }}>
                <div>
                  <section style={{ marginBottom: '15px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Experience
                    </h4>
                    <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#666' }}>
                      <strong>Senior Product Manager</strong><br />
                      Google • 2021-Present<br />
                      Led cross-functional teams...
                    </div>
                  </section>

                  <section style={{ marginBottom: '15px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Education
                    </h4>
                    <div style={{ fontSize: '10px', lineHeight: '1.4', color: '#666' }}>
                      <strong>B.S. Business and Entrepreneurship</strong><br />
                      Stanford University
                    </div>
                  </section>

                  <section>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#333',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Skills
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      fontSize: '8px',
                    }}>
                      {['Leadership', 'Strategy', 'Analytics', 'Agile'].map(skill => (
                        <span key={skill} style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '8px',
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                <div>
                  <section style={{ marginBottom: '15px' }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#333',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Achievements
                    </h4>
                    <ul style={{
                      fontSize: '8px',
                      lineHeight: '1.3',
                      color: '#666',
                      paddingLeft: '12px',
                      margin: '0',
                    }}>
                      <li>Increased user engagement by 45%</li>
                      <li>Led team of 12 developers</li>
                      <li>Launched 3 major features</li>
                    </ul>
                  </section>

                  <section>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600',
                      textAlign: 'center',
                      margin: '0 auto',
                    }}>
                      MY TIME
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Section */}
      <footer id="contact-section" style={{
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        padding: '60px 5%',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '40px',
          }}>
            Get in Touch
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '16px',
              }}>
                📧 Email Support
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                margin: '0',
              }}>
                support@resusync.com
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '16px',
              }}>
                📞 Phone Support
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                margin: '0',
              }}>
                +91 6379118592
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '30px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '16px',
              }}>
                🕒 Business Hours
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px',
                margin: '0',
              }}>
                Mon-Sat: 9AM-6PM EST
              </p>
            </div>
          </div>

          <div style={{
            paddingTop: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              margin: '0',
            }}>
              © 2025 ResuSync. All rights reserved. | Building better resumes, one click at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;