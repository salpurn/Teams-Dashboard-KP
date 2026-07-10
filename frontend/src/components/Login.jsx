import React, { useState } from 'react';
import loginIllustration from '../assets/login_illustration.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Email atau kata sandi salah.');
      }

      const userData = await response.json();
      onLoginSuccess(userData);
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 10% 20%, rgba(230, 28, 36, 0.03) 0%, rgba(0, 75, 135, 0.02) 90%), #fafafa',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      fontFamily: 'var(--font-body)',
      overflowY: 'auto',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1000px',
        width: '100%',
        minHeight: '580px',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        border: '1px solid #f0f0f0'
      }}>
        {/* Left Side: Illustration */}
        <div style={{
          flex: 1.1,
          background: 'linear-gradient(135deg, rgba(230,28,36,0.02) 0%, rgba(0,75,135,0.02) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          borderRight: '1px solid #f5f5f5',
          position: 'relative'
        }} className="login-left-panel">
          <div style={{
            width: '100%',
            maxWidth: '450px',
            textAlign: 'center'
          }}>
            <img 
              src={loginIllustration} 
              alt="Security Illustration" 
              style={{
                width: '100%',
                maxHeight: '340px',
                objectFit: 'contain',
                marginBottom: '20px',
                animation: 'floatAnimation 6s ease-in-out infinite'
              }}
            />
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--dark-text)',
              marginBottom: '8px',
              fontFamily: 'var(--font-heading)'
            }}>
              Pemantauan Dokumen Terpadu
            </h3>
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--muted-text)',
              lineHeight: 1.5,
              maxWidth: '360px',
              margin: '0 auto'
            }}>
              Kelola dan lacak siklus dokumen kemitraan secara transparan dengan integrasi Microsoft Teams.
            </p>
          </div>

          {/* Inline floating animation */}
          <style>{`
            @keyframes floatAnimation {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
            @media (max-width: 820px) {
              .login-left-panel { display: none !important; }
            }
          `}</style>
        </div>

        {/* Right Side: Form Card */}
        <div style={{
          flex: 1,
          padding: '50px 45px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              color: '#0f172a',
              fontWeight: 800,
              fontSize: '1.8rem',
              fontFamily: 'var(--font-heading)',
              marginBottom: '8px'
            }}>
              Login
            </h2>
            <p style={{
              color: 'var(--muted-text)',
              fontSize: '0.82rem',
              lineHeight: '1.5',
              fontWeight: 500
            }}>
              Welcome to TR3-LEGS Tracker
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor', flexShrink: 0 }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address*"
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#ffffff'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--telkom-red)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(230, 28, 36, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>

            {/* Password Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password*"
                style={{
                  padding: '12px 46px 12px 16px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  background: '#ffffff',
                  width: '100%'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--telkom-red)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(230, 28, 36, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
              {/* Show/Hide eye icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.74-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 2.2 0 4.26-.6 6.04-1.63l.46.46L20.73 20 22 18.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: 'var(--telkom-red)',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(230, 28, 36, 0.2)'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
              onMouseOut={(e) => e.currentTarget.style.opacity = 1}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
