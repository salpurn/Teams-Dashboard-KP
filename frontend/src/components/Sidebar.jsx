import React from 'react';
import telkomLogo from '../assets/telkom_logo.png';
import telkomSymbol from '../assets/telkom_symbol.png';

export default function Sidebar({ loggedInUser, avatar, onLogout, activeScreen, setActiveScreen, isCollapsed, onToggleCollapse }) {
  const navItems = [
    { id: 'dashboard', name: 'Dasbor Ringkasan', iconPath: 'M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10 0h6c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zM14 4v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1z' },
    { id: 'projects', name: 'Daftar Proyek B2B', iconPath: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 11H5c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1z' }
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} style={{ width: isCollapsed ? '80px' : '260px', padding: isCollapsed ? '24px 12px' : '24px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
      <div>
        {!isCollapsed ? (
          <div className="logo-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', paddingBottom: '20px', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <img src={telkomLogo} alt="Telkom Indonesia Logo" style={{ width: '140px', height: 'auto', display: 'block', objectFit: 'contain', marginLeft: '-6px' }} />
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regional III R-LEGS</span>
            </div>
            <button 
              onClick={onToggleCollapse}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-text)',
                padding: '4px',
                borderRadius: '6px',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--telkom-red)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted-text)'}
              title="Minimize Sidebar"
            >
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', width: '100%' }}>
            <img 
              src={telkomSymbol} 
              alt="Telkom Symbol" 
              style={{ width: '32px', height: '32px', display: 'block', objectFit: 'contain', cursor: 'pointer' }} 
              onClick={onToggleCollapse} 
            />
            <button 
              onClick={onToggleCollapse}
              style={{
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              title="Expand Sidebar"
            >
              <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}>
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </button>
          </div>
        )}

        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-item ${activeScreen === item.id || (item.id === 'projects' && activeScreen === 'details') ? 'active' : ''}`}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveScreen(item.id);
                window.location.hash = `#${item.id}`;
              }}
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '10px' : '10px 14px',
                borderRadius: '8px'
              }}
              title={isCollapsed ? item.name : ''}
            >
              <svg viewBox="0 0 24 24">
                <path d={item.iconPath} />
              </svg>
              {!isCollapsed && <span>{item.name}</span>}
            </a>
          ))}
        </nav>
      </div>

      {loggedInUser && (
        <div 
          className="user-status-card" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            padding: isCollapsed ? '12px 6px' : '16px',
            alignItems: isCollapsed ? 'center' : 'stretch'
          }}
        >
          <div 
            className="user-profile" 
            style={{ 
              cursor: 'pointer', 
              transition: 'var(--transition-smooth)',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              padding: isCollapsed ? '4px 0' : '8px 12px',
              borderRadius: '8px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: isCollapsed ? '0' : '10px'
            }}
            onClick={() => {
              setActiveScreen('profile');
              window.location.hash = '#profile';
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 0.8}
            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
            title={isCollapsed ? `${loggedInUser.display_name} - ${loggedInUser.position}` : ''}
          >
            <img src={avatar} alt="Avatar" className="user-avatar" style={{ border: '2px solid var(--telkom-blue)' }} />
            {!isCollapsed && (
              <div className="user-info">
                <span className="user-name" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--dark-text)' }}>{loggedInUser.display_name}</span>
                <span className="user-role" style={{ fontSize: '0.65rem', color: 'var(--muted-text)' }}>{loggedInUser.position}</span>
              </div>
            )}
          </div>
          
          {isCollapsed ? (
            <button 
              onClick={onLogout}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid rgba(230, 28, 36, 0.15)',
                background: 'rgba(230, 28, 36, 0.04)',
                color: 'var(--telkom-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '8px 0 0 0',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--telkom-red)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(230, 28, 36, 0.04)';
                e.currentTarget.style.color = 'var(--telkom-red)';
              }}
              title="Keluar Sistem"
            >
              <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}>
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={onLogout} 
              className="btn-logout" 
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(230, 28, 36, 0.15)',
                background: 'rgba(230, 28, 36, 0.04)',
                color: 'var(--telkom-red)',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--telkom-red)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(230, 28, 36, 0.04)';
                e.currentTarget.style.color = 'var(--telkom-red)';
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: '12px', height: '12px', fill: 'currentColor' }}>
                <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
              <span>Keluar Sistem</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
