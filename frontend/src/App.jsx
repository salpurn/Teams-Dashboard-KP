import React, { useState, useEffect, useMemo } from 'react';
import { USERS_ROLE } from './utils/mockData';
import Sidebar from './components/Sidebar';
import MetricCards from './components/MetricCards';
import ActiveTasks from './components/ActiveTasks';
import ProjectTable from './components/ProjectTable';
import ProjectDetail from './components/ProjectDetail';
import ProjectFormModal from './components/ProjectFormModal';
import FilePickerModals from './components/FilePickerModals';
import Toast from './components/Toast';
import Login from './components/Login';
import ProfilePage from './components/ProfilePage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const ROLE_EMAILS = {
  AM: 'budi.santoso@telkom.co.id',
  AM_SITI: 'siti.aminah@telkom.co.id',
  AM_YUNI: 'yuni.kartika@telkom.co.id',
  BUD: 'ahmad.yani@telkom.co.id',
  BUD_DEWI: 'dewi.lestari@telkom.co.id',
  SDA: 'rian.wijaya@telkom.co.id',
  SDA_ARIEF: 'arief.rahman@telkom.co.id',
  LEGAL: 'indra.hermawan@telkom.co.id',
  LEGAL_RIANA: 'riana.indah@telkom.co.id',
  MANAGER: 'heru.wibowo@telkom.co.id'
};

const getCustodianEmail = (name) => {
  if (!name) return 'support@telkom.co.id';
  const clean = name.toLowerCase();
  if (clean.includes('budi')) return 'budi.santoso@telkom.co.id';
  if (clean.includes('siti')) return 'siti.aminah@telkom.co.id';
  if (clean.includes('yuni')) return 'yuni.kartika@telkom.co.id';
  if (clean.includes('ahmad')) return 'ahmad.yani@telkom.co.id';
  if (clean.includes('dewi')) return 'dewi.lestari@telkom.co.id';
  if (clean.includes('rian')) return 'rian.wijaya@telkom.co.id';
  if (clean.includes('arief')) return 'arief.rahman@telkom.co.id';
  if (clean.includes('indra')) return 'indra.hermawan@telkom.co.id';
  if (clean.includes('riana')) return 'riana.indah@telkom.co.id';
  if (clean.includes('heru')) return 'heru.wibowo@telkom.co.id';
  return 'support@telkom.co.id';
};

const getRoleFromEmail = (email) => {
  if (!email) return 'AM';
  const clean = email.toLowerCase();
  if (clean === 'budi.santoso@telkom.co.id') return 'AM';
  if (clean === 'siti.aminah@telkom.co.id') return 'AM_SITI';
  if (clean === 'yuni.kartika@telkom.co.id') return 'AM_YUNI';
  if (clean === 'ahmad.yani@telkom.co.id') return 'BUD';
  if (clean === 'dewi.lestari@telkom.co.id') return 'BUD_DEWI';
  if (clean === 'rian.wijaya@telkom.co.id') return 'SDA';
  if (clean === 'arief.rahman@telkom.co.id') return 'SDA_ARIEF';
  if (clean === 'indra.hermawan@telkom.co.id') return 'LEGAL';
  if (clean === 'riana.indah@telkom.co.id') return 'LEGAL_RIANA';
  if (clean === 'heru.wibowo@telkom.co.id') return 'MANAGER';
  return 'AM';
};

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState('AM');
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modal States
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [filePickerType, setFilePickerType] = useState('teams'); // 'teams' | 'local'

  // Loading state for upload simulation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  // 1. Fetch Projects from Backend API
  const fetchProjects = async (showLoading = true) => {
    if (showLoading) setIsLoadingProjects(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tracker/projects`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setToastMessage('⚠️ Gagal terhubung ke backend FastAPI. Pastikan server BE menyala di port 8000.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const storedUser = localStorage.getItem("r_edt_logged_in_user");
    if (storedUser) {
      setLoggedInUser(JSON.parse(storedUser));
    }
    const storedRole = localStorage.getItem("r_legs_current_user_role");
    if (storedRole) {
      setCurrentUserRole(storedRole);
    }
  }, []);

  // 2. Hash-based Routing listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#dashboard';
      if (hash === '#dashboard') {
        setActiveScreen('dashboard');
        setActiveProjectId(null);
      } else if (hash === '#projects') {
        setActiveScreen('projects');
        setActiveProjectId(null);
      } else if (hash === '#profile') {
        setActiveScreen('profile');
        setActiveProjectId(null);
      } else if (hash.startsWith('#details/')) {
        const id = hash.replace('#details/', '');
        setActiveProjectId(id);
        setActiveScreen('details');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // trigger initial routing

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Auto collapse sidebar on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // trigger initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. Sync User Role to LocalStorage and trigger toasts
  const handleSetCurrentUserRole = (role) => {
    localStorage.setItem("r_legs_current_user_role", role);
    setCurrentUserRole(role);
    
    // Simulate push alert warning
    const user = USERS_ROLE[role];
    setTimeout(() => {
      const myTasksCount = projects.filter((p) => {
        const basoDoc = p.documents.find((d) => d.code === 'BASO');
        const isCompleted = basoDoc && basoDoc.status === 'Approved';
        if (isCompleted) return false;

        const activeDoc = p.documents.find((d) => d.code === p.currentStep);
        if (!activeDoc || activeDoc.status === 'Approved') return false;

        return p.custodian && p.custodian.name === user.name;
      }).length;

      if (myTasksCount > 0 && !role.startsWith('MANAGER')) {
        setToastMessage(`🔔 Pengingat: Anda memiliki ${myTasksCount} tugas aktif yang tertunda!`);
      } else if (role.startsWith('MANAGER')) {
        const overdueCount = projects.filter((p) => {
          const basoDoc = p.documents.find((d) => d.code === 'BASO');
          const isCompleted = basoDoc && basoDoc.status === 'Approved';
          if (isCompleted) return false;

          const lastUpd = new Date(p.lastUpdated);
          const elapsedHrs = (new Date() - lastUpd) / (1000 * 60 * 60);
          return elapsedHrs > p.slaLimitHours;
        }).length;

        if (overdueCount > 0) {
          setToastMessage(`⚠️ Perhatian Manager: ${overdueCount} proyek mengalami Overdue SLA!`);
        }
      }
    }, 400);
  };

  const handleLoginSuccess = (userData) => {
    const roleCode = getRoleFromEmail(userData.email);
    setCurrentUserRole(roleCode);
    setLoggedInUser(userData);
    localStorage.setItem("r_edt_logged_in_user", JSON.stringify(userData));
    localStorage.setItem("r_legs_current_user_role", roleCode);
    setToastMessage(`Selamat datang kembali, ${userData.display_name}!`);
  };

  const handleLogout = () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari sistem?")) return;
    setLoggedInUser(null);
    localStorage.removeItem("r_edt_logged_in_user");
    localStorage.removeItem("r_legs_current_user_role");
    window.location.hash = '#dashboard';
  };

  // Helper values
  const currentUser = USERS_ROLE[currentUserRole] || USERS_ROLE.AM;

  // 4. Create New Project (POST to backend API)
  const handleCreateProject = async ({ name, client, value }) => {
    const actorEmail = ROLE_EMAILS[currentUserRole] || ROLE_EMAILS.AM;

    const payload = {
      title: name,
      client_name: client,
      contract_value: value,
      account_manager_email: actorEmail,
      bud_officer_email: ROLE_EMAILS.BUD,
      sda_officer_email: ROLE_EMAILS.SDA,
      legal_officer_email: ROLE_EMAILS.LEGAL,
      notes: `Inisiasi proyek baru lewat dashboard antarmuka React.`
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tracker/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Gagal membuat proyek baru di backend');
      }

      const newProj = await response.json();
      setToastMessage(`Proyek ${newProj.id} berhasil dibuat!`);
      
      // Refresh projects from backend
      await fetchProjects(false);
      window.location.hash = '#projects';
    } catch (err) {
      console.error('Error creating project:', err);
      alert(`Gagal membuat proyek baru: ${err.message}`);
    }
  };

  // 5. Document Action: POST /tracker/projects/{code}/review
  const handleDocumentAction = async (projectCode, docCode, action) => {
    const actorEmail = ROLE_EMAILS[currentUserRole] || ROLE_EMAILS.AM;
    let decisionCode = 'approve';
    let responseText = 'oke, sudah review';

    if (action === 'Approve') {
      decisionCode = 'approve';
    } else if (action === 'Return') {
      decisionCode = 'return';
      const notePrompt = prompt("Masukkan catatan revisi dari platform utama untuk AM:", "Mohon sesuaikan kembali nominal anggaran biaya atau draf pasal perjanjian.");
      if (notePrompt === null) return; // cancel click
      responseText = notePrompt || "Draf dokumen membutuhkan perbaikan administratif.";
    } else if (action === 'Reject') {
      decisionCode = 'reject';
      if (!confirm("Apakah Anda yakin ingin menolak berkas ini dan membatalkan proyek ini secara permanen?")) {
        return;
      }
      responseText = "Proyek dibatalkan secara permanen.";
    }

    const payload = {
      decision: decisionCode,
      actor_email: actorEmail,
      response_text: responseText,
      notes: `Keputusan ${decisionCode} dari dashboard antarmuka React.`
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tracker/projects/${projectCode}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Gagal mengirimkan keputusan review');
      }

      await response.json();
      setToastMessage(`Aksi "${action}" berhasil diproses.`);
      await fetchProjects(false);
    } catch (err) {
      console.error('Error review decision:', err);
      alert(`Gagal memproses dokumen: ${err.message}`);
    }
  };

  // 6. Simulation Upload: Handles selected file from Teams or Local Pickers
  // Pada koneksi BE ril, status step sudah PENDING di awal, jadi kita hanya melakukan simulasi linking berkas saja
  const handleUploadFile = (filename, source) => {
    if (!activeProjectId) return;
    
    setIsUploading(true);
    setUploadProgressMsg(`Mengunggah "${filename}" dari ${source} ke R-EDT tracker...`);

    setTimeout(() => {
      setIsUploading(false);
      setToastMessage("Berkas draf berhasil dihubungkan!");
    }, 1800);
  };

  // 7. Calculate Dashboard Performance Chart & Critical Alerts
  const performanceChartData = useMemo(() => {
    const times = { BUD: 0, SDA: 0, Solman: 0, Legal: 0 };
    const counts = { BUD: 0, SDA: 0, Solman: 0, Legal: 0 };

    projects.forEach((p) => {
      p.history.forEach((h, index) => {
        if (index === 0) return;
        const prev = new Date(p.history[index - 1].timestamp);
        const curr = new Date(h.timestamp);
        const diffHours = (curr - prev) / (1000 * 60 * 60);

        let deptKey = null;
        if (h.role.includes('AM') || h.role.includes('Mitra')) {
          deptKey = 'Solman';
        } else if (h.role.includes('BUD')) {
          deptKey = 'BUD';
        } else if (h.role.includes('SDA')) {
          deptKey = 'SDA';
        } else if (h.role.includes('Legal')) {
          deptKey = 'Legal';
        }

        if (deptKey) {
          times[deptKey] += diffHours;
          counts[deptKey]++;
        }
      });
    });

    const avg = {
      Solman: counts.Solman ? Math.round(times.Solman / counts.Solman) : 14,
      BUD: counts.BUD ? Math.round(times.BUD / counts.BUD) : 22,
      SDA: counts.SDA ? Math.round(times.SDA / counts.SDA) : 18,
      Legal: counts.Legal ? Math.round(times.Legal / counts.Legal) : 34
    };

    const maxHours = Math.max(avg.Solman, avg.BUD, avg.SDA, avg.Legal, 40);

    return { avg, maxHours };
  }, [projects]);

  const criticalAlerts = useMemo(() => {
    const now = new Date();
    const alerts = [];

    projects.forEach((p) => {
      const basoDoc = p.documents.find((d) => d.code === 'BASO');
      const isCompleted = basoDoc && basoDoc.status === 'Approved';

      if (!isCompleted && p.currentStep !== 'P9') {
        const lastUpd = new Date(p.lastUpdated);
        const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);

        if (elapsedHrs >= 24) {
          alerts.push({
            project: p,
            hours: Math.floor(elapsedHrs),
            isRed: elapsedHrs > p.slaLimitHours
          });
        }
      }
    });

    alerts.sort((a, b) => b.hours - a.hours);
    return alerts;
  }, [projects]);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!loggedInUser) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Sidebar */}
      <Sidebar
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="page-title-area">
            <h2 id="header-page-title">
              {activeScreen === 'dashboard'
                ? 'Dasbor Ringkasan'
                : activeScreen === 'projects'
                ? 'Daftar Proyek B2B'
                : 'Detail Pelacakan Dokumen'}
            </h2>
          </div>
          <div className="header-actions">


            {currentUserRole.startsWith('AM') && (
              <button
                className="btn btn-primary btn-create-project"
                style={{ display: 'inline-flex', padding: '6px 16px', fontSize: '0.8rem', height: '32px' }}
                onClick={() => setIsProjectFormOpen(true)}
              >
                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor', marginRight: '4px' }}>
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Proyek Baru
              </button>
            )}
          </div>
        </header>

        {/* Screen Wrapper */}
        <div className="screen-wrapper">
          {isLoadingProjects ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', minHeight: '300px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--telkom-red)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
              <h4 style={{ fontWeight: 700, color: 'var(--dark-text)' }}>Memuat Data Proyek...</h4>
              <p style={{ color: 'var(--muted-text)', fontSize: '0.8rem' }}>Menghubungkan ke API server FastAPI...</p>
            </div>
          ) : (
            <>
              {/* SCREEN A: DASHBOARD SCREEN */}
              {activeScreen === 'dashboard' && (
                <section id="dashboard-screen" className="screen active">
                  {/* Metrik Cards */}
                  <MetricCards
                    projects={projects}
                    onCardClick={(filterVal) => {
                      window.location.hash = '#projects';
                    }}
                  />

                  {/* Active Tasks Reminder */}
                  <ActiveTasks
                    projects={projects}
                    currentUser={currentUser}
                    onSelectProject={(id) => {
                      window.location.hash = `#details/${id}`;
                    }}
                  />

                  {/* Peringatan & Grafik Kinerja */}
                  <div className="dashboard-layout">
                    {/* Kolom Kiri: Peringatan SLA Kritis */}
                    <div className="dashboard-left">
                      <div className="glass-card" style={{ flexGrow: 1 }}>
                        <div className="card-title-bar">
                          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'var(--status-red)' }}>
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                            Peringatan Antrean Kritis (SLA Merah / Kuning)
                          </h3>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>Urut keterlambatan terlama</span>
                        </div>
                        <div id="critical-alerts-list" className="alert-list">
                          {criticalAlerts.length === 0 ? (
                            <div className="text-center text-muted" style={{ padding: '40px 0' }}>
                              <svg className="doc-icon-svg" viewBox="0 0 24 24" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4, width: '32px', height: '32px' }}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                              </svg>
                              <span>Semua proses dokumen berjalan tepat waktu (SLA Hijau).</span>
                            </div>
                          ) : (
                            criticalAlerts.map((item) => {
                              const p = item.project;
                              const activeDoc = p.documents.find((d) => d.code === p.currentStep) || { name: p.currentStep };
                              const email = getCustodianEmail(p.custodian?.name);
                              const nudgeMsg = `Halo ${p.custodian?.name}, mohon tindak lanjut untuk berkas "${activeDoc.name}" pada proyek "${p.name}" (${p.client}) yang saat ini sedang tertahan. Terima kasih!`;
                              const teamsLink = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMsg)}`;
                              
                              return (
                                <div
                                  key={p.id}
                                  className="alert-item"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    window.location.hash = `#details/${p.id}`;
                                  }}
                                >
                                  <div className="alert-left">
                                    <span className={`alert-badge ${item.isRed ? 'red' : 'yellow'}`}></span>
                                    <div className="alert-info">
                                      <span className="alert-project-name">{p.name}</span>
                                      <span className="alert-desc">
                                        {p.client} &bull; Kustodian: {p.custodian?.name}
                                        <a
                                          href={teamsLink}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="teams-nudge-link"
                                          title="Nudge via Teams"
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: '4px' }}
                                        >
                                          <svg style={{ width: '12px', height: '12px', fill: '#464eb8' }} viewBox="0 0 24 24">
                                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                                          </svg>
                                        </a>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="alert-right">
                                    <span className={`alert-time ${item.isRed ? '' : 'yellow-text'}`}>{item.hours} jam tertahan</span>
                                    <span className={`badge-pill ${item.isRed ? 'red' : 'yellow'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                                      {item.isRed ? 'Lapor! Overdue' : 'Warning SLA'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Rata-rata Durasi SLA (Grafik Batang) */}
                    <div className="glass-card">
                      <div className="card-title-bar">
                        <h3>Grafik Kinerja Divisi</h3>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '-12px', marginBottom: '24px' }}>Rata-rata waktu proses dokumen (dalam satuan jam)</p>

                      <div className="chart-container">
                        <div className="bar-chart" style={{ height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '20px' }}>
                          {['Solman', 'BUD', 'SDA', 'Legal'].map((dept) => {
                            const val = performanceChartData.avg[dept];
                            const pct = Math.min((val / performanceChartData.maxHours) * 100, 100);
                            const colorMap = { Solman: '#8b5cf6', BUD: '#0064d2', SDA: '#10b981', Legal: '#f59e0b' };

                            return (
                              <div key={dept} className="bar-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, height: '100%', justifyContent: 'flex-end' }}>
                                <div
                                  className={`bar ${dept.toLowerCase()}`}
                                  style={{
                                    height: `${pct}%`,
                                    width: '100%',
                                    background: colorMap[dept],
                                    borderRadius: '4px 4px 0 0',
                                    position: 'relative',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    transition: 'height 0.3s ease'
                                  }}
                                >
                                  <span className="bar-val" style={{ position: 'absolute', top: '-18px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--dark-text)' }}>{val}j</span>
                                </div>
                                <span className="bar-label" style={{ fontSize: '0.65rem', marginTop: '8px', color: 'var(--muted-text)', fontWeight: 600 }}>{dept}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="chart-legend" style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><span className="legend-dot" style={{ background:'#8b5cf6', width: '8px', height: '8px', borderRadius: '50%' }}></span><span>Solman (AM)</span></div>
                          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><span className="legend-dot" style={{ background:'#0064d2', width: '8px', height: '8px', borderRadius: '50%' }}></span><span>BUD</span></div>
                          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><span className="legend-dot" style={{ background:'#10b981', width: '8px', height: '8px', borderRadius: '50%' }}></span><span>SDA</span></div>
                          <div className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}><span className="legend-dot" style={{ background:'#f59e0b', width: '8px', height: '8px', borderRadius: '50%' }}></span><span>Legal</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* SCREEN B: PROJECTS SCREEN (TABLE) */}
              {activeScreen === 'projects' && (
                <ProjectTable
                  projects={projects}
                  currentUserRole={currentUserRole}
                  onSelectProject={(id) => {
                    window.location.hash = `#details/${id}`;
                  }}
                />
              )}

              {/* SCREEN C: DETAILS SCREEN */}
              {activeScreen === 'details' && activeProject && (
                <>
                  {isUploading ? (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', minHeight: '300px' }}>
                      <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--telkom-red)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                      <h4 style={{ fontWeight: 700, color: 'var(--dark-text)' }}>Menghubungkan Berkas...</h4>
                      <p style={{ color: 'var(--muted-text)', fontSize: '0.8rem' }}>{uploadProgressMsg}</p>
                    </div>
                  ) : (
                    <ProjectDetail
                      project={activeProject}
                      currentUserRole={currentUserRole}
                      onBack={() => {
                        window.location.hash = '#projects';
                      }}
                      onDocumentAction={handleDocumentAction}
                      openFilePicker={(type) => {
                        setFilePickerType(type);
                        setIsFilePickerOpen(true);
                      }}
                    />
                  )}
                </>
              )}

              {/* SCREEN D: PROFILE SCREEN */}
              {activeScreen === 'profile' && (
                <ProfilePage
                  loggedInUser={loggedInUser}
                  onBack={() => {
                    window.location.hash = '#dashboard';
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* 3. Modals */}
      <ProjectFormModal
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        currentUserRole={currentUserRole}
        onCreateProject={handleCreateProject}
      />

      {activeProject && (
        <FilePickerModals
          isOpen={isFilePickerOpen}
          modalType={filePickerType}
          onClose={() => setIsFilePickerOpen(false)}
          activeProject={activeProject}
          activeDocCode={activeProject.currentStep}
          onFileSelected={handleUploadFile}
        />
      )}

      {/* 4. Toast Alerts */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
