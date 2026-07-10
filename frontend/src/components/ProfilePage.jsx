import React, { useState, useEffect } from 'react';

export default function ProfilePage({ loggedInUser, onBack }) {
  const [avatar, setAvatar] = useState('');

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(loggedInUser.display_name)}&background=e61c24&color=fff&bold=true&size=128`;

  // Load avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem(`r_edt_user_avatar_${loggedInUser.email}`);
    if (savedAvatar) {
      setAvatar(savedAvatar);
    } else {
      setAvatar(defaultAvatar);
    }
  }, [loggedInUser.email, defaultAvatar]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem(`r_edt_user_avatar_${loggedInUser.email}`, base64String);
        setAvatar(base64String);

        // Force a custom event to notify Sidebar (and any other profile picture consumers) to refresh the avatar!
        window.dispatchEvent(new Event('avatar-changed'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetAvatar = () => {
    localStorage.removeItem(`r_edt_user_avatar_${loggedInUser.email}`);
    setAvatar(defaultAvatar);
    window.dispatchEvent(new Event('avatar-changed'));
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '20px auto', padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--muted-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--telkom-red)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted-text)'}
        >
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--telkom-blue)', fontFamily: 'var(--font-heading)' }}>
          Profil Pengguna
        </h3>
      </div>

      {/* Profile Picture Area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <img
            src={avatar}
            alt="User Avatar"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}
          />
          {/* File input overlay trigger */}
          <label
            htmlFor="profile-upload"
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'var(--telkom-red)',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(230, 28, 36, 0.3)',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Ganti Foto Profil"
          >
            <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
              <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z" />
            </svg>
          </label>
          <input
            type="file"
            id="profile-upload"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <label
            htmlFor="profile-upload"
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: 'var(--dark-text)',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            Unggah Foto
          </label>
          {avatar !== defaultAvatar && (
            <button
              onClick={handleResetAvatar}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#fff',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
              onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
            >
              Hapus Foto
            </button>
          )}
        </div>
      </div>

      {/* Information list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nama Lengkap</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-text)' }}>{loggedInUser.display_name}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Jabatan / Peran</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-text)' }}>{loggedInUser.position}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Korporat</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-text)' }}>{loggedInUser.email}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit Kerja / Departemen</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--dark-text)' }}>{loggedInUser.unit || loggedInUser.department || 'Large Enterprise & Government Service'}</span>
        </div>
      </div>
    </div>
  );
}
