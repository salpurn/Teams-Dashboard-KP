import React from 'react';

export default function ActiveTasks({ projects, currentUser, myAvatar, onSelectProject }) {
  const tasksByCustodian = {};
  const now = new Date();

  projects.forEach((p) => {
    // Proyek dianggap selesai jika berada di F5 dan dokumen BASO disetujui (Approved)
    const basoDoc = p.documents.find((d) => d.code === 'BASO');
    const isCompleted = basoDoc && basoDoc.status === 'Approved';
    if (isCompleted) return;

    // Cari dokumen aktif saat ini
    const activeDoc = p.documents.find((d) => d.code === p.currentStep);
    if (!activeDoc) return;

    // Hanya masukkan jika status dokumen memerlukan tindakan (bukan Approved)
    if (activeDoc.status === 'Approved') return;

    const custodian = p.custodian;
    if (!custodian || !custodian.name) return;

    if (!tasksByCustodian[custodian.name]) {
      // Kustodian yang sama dengan user login: pakai foto profil lokal, bukan avatar inisial dari backend
      const isCurrentUser = currentUser && custodian.email === currentUser.email;
      tasksByCustodian[custodian.name] = {
        name: custodian.name,
        role: custodian.role,
        avatar: (isCurrentUser && myAvatar) || custodian.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        email: custodian.email,
        tasks: []
      };
    }

    // Hitung SLA jam
    const lastUpd = new Date(p.lastUpdated);
    const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
    let slaClass = 'green';
    if (elapsedHrs > p.slaLimitHours) slaClass = 'red';
    else if (elapsedHrs >= 24) slaClass = 'yellow';

    let actionText = '';
    if (activeDoc.status === 'Empty') {
      actionText = `Belum mengunggah draf pertama berkas ${activeDoc.code} (${activeDoc.name})`;
    } else if (activeDoc.status === 'Revision') {
      actionText = `Belum merevisi berkas ${activeDoc.code} (${activeDoc.name})`;
    } else if (activeDoc.status === 'Pending') {
      actionText = `Belum memverifikasi berkas ${activeDoc.code} (${activeDoc.name})`;
    } else {
      actionText = `Tindakan tertunda pada berkas ${activeDoc.code}`;
    }

    tasksByCustodian[custodian.name].tasks.push({
      project: p,
      doc: activeDoc,
      actionText: actionText,
      elapsedHrs: Math.max(0, Math.floor(elapsedHrs)),
      slaClass: slaClass
    });
  });

  const custodiansWithTasks = Object.values(tasksByCustodian);

  // Cari tugas milik user aktif
  const myTasksData = custodiansWithTasks.find((c) => currentUser && c.email === currentUser.email);
  const teamTasksData = custodiansWithTasks.filter((c) => !currentUser || c.email !== currentUser.email);

  // Urutkan rekan tim agar overdue/red teratas, disusul jam tertahan terlama
  teamTasksData.sort((a, b) => {
    const aHasRed = a.tasks.some((t) => t.slaClass === 'red');
    const bHasRed = b.tasks.some((t) => t.slaClass === 'red');
    if (aHasRed && !bHasRed) return -1;
    if (!aHasRed && bHasRed) return 1;

    const aMaxHrs = Math.max(...a.tasks.map((t) => t.elapsedHrs));
    const bMaxHrs = Math.max(...b.tasks.map((t) => t.elapsedHrs));
    return bMaxHrs - aMaxHrs;
  });

  const renderCustodianCard = (c, isMe) => {
    const taskCount = c.tasks.length;
    const cardStyle = {
      background: '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease',
      border: isMe ? '2px solid var(--telkom-red)' : '1px solid var(--border-color)',
      boxShadow: isMe ? '0 8px 30px rgba(230, 28, 36, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)',
      opacity: isMe ? '1' : '0.85',
      cursor: 'default'
    };

    return (
      <div
        key={c.name}
        className={`custodian-task-card ${isMe ? 'active-user-card' : ''}`}
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isMe ? 'translateY(-3px)' : 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isMe ? '0 12px 25px rgba(230, 28, 36, 0.15)' : '0 8px 20px rgba(0,0,0,0.05)';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isMe ? '0 8px 30px rgba(230, 28, 36, 0.08)' : '0 4px 12px rgba(0,0,0,0.02)';
          e.currentTarget.style.opacity = isMe ? '1' : '0.85';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img src={c.avatar} alt={c.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark-text)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.name}>{c.name}</h4>
              <span style={{ fontSize: '0.65rem', color: 'var(--muted-text)', fontWeight: 500, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.role}>{c.role}</span>
            </div>
          </div>
          {isMe ? (
            <span style={{ fontSize: '0.6rem', fontWeight: 800, background: 'var(--telkom-red)', color: 'white', padding: '2px 8px', borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap', boxShadow: '0 0 6px var(--status-red-glow)', animation: 'pulse-glow-light 2.8s infinite' }}>TUGAS ANDA</span>
          ) : (
            <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '10px', flexShrink: 0, whiteSpace: 'nowrap' }}>{taskCount} Tugas</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          {c.tasks.map((t) => {
            let badgeColor = '';
            let badgeText = 'On Track';
            if (t.slaClass === 'red') {
              badgeColor = 'var(--status-red)';
              badgeText = 'Overdue';
            } else if (t.slaClass === 'yellow') {
              badgeColor = 'var(--status-yellow)';
              badgeText = 'Mendekati SLA';
            } else {
              badgeColor = 'var(--status-green)';
              badgeText = 'On Track';
            }

            return (
              <div
                key={t.project.id}
                className="task-reminder-item"
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  borderLeft: `3.5px solid ${badgeColor}`,
                  borderRight: '1px solid rgba(0,0,0,0.02)',
                  borderTop: '1px solid rgba(0,0,0,0.02)',
                  borderBottom: '1px solid rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => onSelectProject(t.project.id)}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.02)';
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--telkom-blue)', lineHeight: 1.2, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }} title={t.project.name}>{t.project.name}</span>
                  <span style={{ fontSize: '0.55rem', padding: '1px 4px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', color: 'var(--muted-text)', fontWeight: 600, flexShrink: 0 }}>{t.project.id}</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--dark-text)', lineHeight: 1.4, marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: t.actionText }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--muted-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{t.project.client}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: badgeColor, background: `${badgeColor}0d`, padding: '1px 4px', borderRadius: '3px' }}>{badgeText}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: badgeColor }}>{t.elapsedHrs}j</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ marginBottom: '24px' }}>
      <div className="card-title-bar" style={{ marginBottom: '16px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--telkom-blue)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          Reminder Tugas Aktif Kustodian
        </h3>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>Daftar dokumen tertunda yang memerlukan tindakan segera berdasarkan peran</span>
      </div>

      <div id="active-tasks-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 1. Area Tugas Anda */}
        <div id="my-tasks-section">
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--telkom-red)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--telkom-red)', boxShadow: '0 0 6px var(--status-red-glow)', animation: 'pulse-glow-light 1.5s infinite' }}></span>
            Tugas Aktif Anda (Segera Selesaikan)
          </div>
          <div id="my-tasks-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '8px' }}>
            {myTasksData && myTasksData.tasks.length > 0 ? (
              renderCustodianCard(myTasksData, true)
            ) : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', background: '#f0fdf4', border: '1.5px dashed #bbf7d0', borderRadius: '12px', color: '#15803d', width: '100%' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  background: '#dcfce7',
                  borderRadius: '50%',
                  color: '#15803d',
                  flexShrink: 0
                }}>
                  <svg viewBox="0 0 24 24" style={{ width: '18px', height: '18px', fill: 'currentColor' }}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Bebas Tugas Aktif!</h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#166534' }}>Anda tidak memiliki dokumen tertunda yang perlu diunggah atau disetujui saat ini.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Area Tugas Rekan Tim */}
        <div id="team-tasks-section">
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--telkom-blue)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--telkom-blue)' }}></span>
            Antrean Tugas Rekan Tim Lainnya
          </div>
          <div id="team-tasks-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {teamTasksData.length > 0 ? (
              teamTasksData.map((c) => renderCustodianCard(c, false))
            ) : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--muted-text)', fontSize: '0.75rem', width: '100%' }}>
                <span>Tidak ada antrean tugas pada rekan tim lainnya.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
