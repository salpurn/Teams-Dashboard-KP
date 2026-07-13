import React, { useState, useMemo } from 'react';

export default function ProjectTable({ projects, loggedInUser, onSelectProject }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterMode, setActiveFilterMode] = useState('all'); // 'all' | 'my-tasks'
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');

  const now = new Date();

  // Hitung jumlah proyek "Tugas Saya"
  const myProjectsCount = useMemo(() => {
    return projects.filter((p) => {
      const basoDoc = p.documents.find((d) => d.code === 'BASO');
      const isCompleted = basoDoc && basoDoc.status === 'Approved';
      if (isCompleted) return false;

      const activeDoc = p.documents.find((d) => d.code === p.currentStep);
      const isDocPending = activeDoc && activeDoc.status !== 'Approved';

      return isDocPending && p.custodian && loggedInUser && p.custodian.email === loggedInUser.email;
    }).length;
  }, [projects, loggedInUser]);

  // Filter Proyek
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Filter Pencarian
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.am.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Filter Fase
      const matchPhase = phaseFilter === 'all' || p.currentPhase === phaseFilter;

      // 3. Filter SLA
      const basoDoc = p.documents.find((d) => d.code === 'BASO');
      const isCompleted = basoDoc && basoDoc.status === 'Approved';
      
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);

      let currentSlaStatus = 'green';
      if (!isCompleted) {
        if (elapsedHrs > p.slaLimitHours) currentSlaStatus = 'red';
        else if (elapsedHrs >= 24) currentSlaStatus = 'yellow';
      }

      const matchSla =
        slaFilter === 'all' ||
        (slaFilter === 'active' && !isCompleted) ||
        (slaFilter === 'green' && currentSlaStatus === 'green' && !isCompleted) ||
        (slaFilter === 'yellow' && currentSlaStatus === 'yellow' && !isCompleted) ||
        (slaFilter === 'red' && currentSlaStatus === 'red' && !isCompleted) ||
        (slaFilter === 'completed' && isCompleted);

      // 4. Filter Tugas Saya
      let matchMyTasks = true;
      if (activeFilterMode === 'my-tasks') {
        const activeDoc = p.documents.find((d) => d.code === p.currentStep);
        const isDocPending = activeDoc && activeDoc.status !== 'Approved';
        matchMyTasks = !isCompleted && isDocPending && p.custodian && loggedInUser && p.custodian.email === loggedInUser.email;
      }

      return matchSearch && matchPhase && matchSla && matchMyTasks;
    });
  }, [projects, searchQuery, phaseFilter, slaFilter, activeFilterMode, loggedInUser]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="glass-card">
      {/* Pencarian & Filter */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Cari proyek, nama klien, atau nama AM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Toggle Semua Proyek / Tugas Saya */}
        <div
          className="filter-toggle-group"
          style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.03)',
            padding: '4px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            flexShrink: 0,
            alignItems: 'center',
            height: '32px',
            boxSizing: 'border-box'
          }}
        >
          <button
            className={`btn-toggle-filter ${activeFilterMode === 'all' ? 'active' : ''}`}
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              height: '22px',
              border: 'none',
              borderRadius: '12px',
              background: activeFilterMode === 'all' ? '#ffffff' : 'transparent',
              color: activeFilterMode === 'all' ? 'var(--telkom-blue)' : 'var(--muted-text)',
              boxShadow: activeFilterMode === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              outline: 'none',
              lineHeight: 1
            }}
            onClick={() => setActiveFilterMode('all')}
          >
            Semua Proyek
          </button>
          <button
            className={`btn-toggle-filter ${activeFilterMode === 'my-tasks' ? 'active' : ''}`}
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              height: '22px',
              border: 'none',
              borderRadius: '12px',
              background: activeFilterMode === 'my-tasks' ? '#ffffff' : 'transparent',
              color: activeFilterMode === 'my-tasks' ? 'var(--telkom-red)' : 'var(--muted-text)',
              boxShadow: activeFilterMode === 'my-tasks' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              outline: 'none',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={() => setActiveFilterMode('my-tasks')}
          >
            Tugas Saya (<span id="my-projects-count">{myProjectsCount}</span>)
          </button>
        </div>

        <select className="filter-select" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
          <option value="all">Semua Funnel</option>
          <option value="F0">F0 (Lead)</option>
          <option value="F1">F1 (Opportunity)</option>
          <option value="F2">F2 (Self Assessment)</option>
          <option value="F3">F3 (Project Assessment)</option>
          <option value="F4">F4 (Negosiasi)</option>
          <option value="F5">F5 (Win & Kontrak)</option>
        </select>

        <select className="filter-select" value={slaFilter} onChange={(e) => setSlaFilter(e.target.value)}>
          <option value="all">Semua Status SLA</option>
          <option value="active">Aktif (Berjalan)</option>
          <option value="green">On Track (Hijau)</option>
          <option value="yellow">Delayed (Kuning)</option>
          <option value="red">Overdue (Merah)</option>
          <option value="completed">Selesai (Win)</option>
        </select>
      </div>

      {/* Tabel Data */}
      <div className="table-responsive">
        <table className="projects-table">
          <thead>
            <tr>
              <th>ID Proyek</th>
              <th>Judul Kerja Sama / Client</th>
              <th>Nilai Proyek</th>
              <th>Funnel Aktif</th>
              <th>Dokumen Aktif</th>
              <th>Urgensi SLA</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted" style={{ padding: '40px 0' }}>
                  Tidak ada proyek yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              filteredProjects.map((p) => {
                const basoDoc = p.documents.find((d) => d.code === 'BASO');
                const isCompleted = basoDoc && basoDoc.status === 'Approved';

                let slaBadge = null;
                const lastUpd = new Date(p.lastUpdated);
                const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);

                if (isCompleted) {
                  slaBadge = <span className="badge-pill green">Selesai (WIN)</span>;
                } else {
                  if (elapsedHrs > p.slaLimitHours) {
                    slaBadge = <span className="badge-pill red">Overdue ({Math.floor(elapsedHrs)}j)</span>;
                  } else if (elapsedHrs >= 24) {
                    slaBadge = <span className="badge-pill yellow">Delayed ({Math.floor(elapsedHrs)}j)</span>;
                  } else {
                    slaBadge = <span className="badge-pill green">On Track ({Math.floor(elapsedHrs)}j)</span>;
                  }
                }

                const activeDoc = p.documents.find((d) => d.code === p.currentStep) || { code: p.currentStep, name: p.currentStep };
                const email = p.custodian?.email;
                const nudgeMsg = `Halo ${p.custodian.name}, mohon tindak lanjut untuk berkas "${activeDoc.name}" pada proyek "${p.name}" (${p.client}) yang saat ini sedang tertahan. Terima kasih!`;
                const teamsLink = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMsg)}`;

                return (
                  <tr key={p.id}>
                    <td>
                      <span className="text-muted fw-bold">{p.id}</span>
                    </td>
                    <td>
                      <div className="proj-title-column">
                        <span className="proj-title-text" onClick={() => onSelectProject(p.id)}>
                          {p.name}
                        </span>
                        <span className="proj-client-text">{p.client}</span>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold">{formatCurrency(p.value)}</span>
                    </td>
                    <td>
                      <span
                        className="badge-pill green"
                        style={{
                          background: 'rgba(0, 100, 210, 0.1)',
                          borderColor: 'rgba(0, 100, 210, 0.2)',
                          color: '#60a5fa'
                        }}
                      >
                        Fase {p.currentPhase}
                      </span>
                    </td>
                    <td>
                      <div className="proj-title-column">
                        <span className="fw-bold" style={{ fontSize: '0.8rem' }}>
                          {activeDoc.name}
                        </span>
                        <span className="proj-client-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Kustodian: {p.custodian.name}
                          {!isCompleted && (
                            <a
                              href={teamsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="teams-nudge-link"
                              title="Nudge via Teams"
                              onClick={(e) => e.stopPropagation()}
                              style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                              <svg style={{ width: '12px', height: '12px', fill: '#464eb8' }} viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                              </svg>
                            </a>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>{slaBadge}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => onSelectProject(p.id)}>
                        Lacak
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
