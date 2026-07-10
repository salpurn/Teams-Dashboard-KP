import React, { useState, useEffect } from 'react';
import { STAGE_FLOW, USERS_ROLE } from '../utils/mockData';

export default function ProjectDetail({ project, currentUserRole, onBack, onDocumentAction, onUploadDocument, openFilePicker }) {
  const [selectedPhase, setSelectedPhase] = useState(project.currentPhase);
  const [selectedDocCode, setSelectedDocCode] = useState(project.currentStep);
  const [zoom, setZoom] = useState(100);
  const [slaLabel, setSlaLabel] = useState('');
  const [slaColorClass, setSlaColorClass] = useState('green-text');

  // Jika BASO disetujui, set default phase ke F5
  useEffect(() => {
    const basoDoc = project.documents.find((d) => d.code === 'BASO');
    const isCompleted = basoDoc && basoDoc.status === 'Approved';
    if (isCompleted) {
      setSelectedPhase('F5');
    } else {
      setSelectedPhase(project.currentPhase);
    }
    setSelectedDocCode(project.currentStep === 'P9' ? 'BASO' : project.currentStep);
  }, [project]);

  // SLA Timer Countdown
  useEffect(() => {
    const calculateSLA = () => {
      const basoDoc = project.documents.find((d) => d.code === 'BASO');
      const isCompleted = basoDoc && basoDoc.status === 'Approved';

      if (isCompleted) {
        setSlaLabel('SELESAI (WIN)');
        setSlaColorClass('green-text');
        return;
      }

      if (project.currentStep === 'P9') {
        setSlaLabel('DIBATALKAN (P9)');
        setSlaColorClass('red-text');
        return;
      }

      const now = new Date();
      const lastUpd = new Date(project.lastUpdated);
      const elapsedMs = now - lastUpd;
      const elapsedHrs = elapsedMs / (1000 * 60 * 60);

      if (elapsedHrs > project.slaLimitHours) {
        const overdueHrs = Math.floor(elapsedHrs);
        const overdueMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
        setSlaLabel(`MANDEK: ${overdueHrs}j ${overdueMins}m`);
        setSlaColorClass('red-text');
      } else {
        const remainingMs = (project.slaLimitHours * 60 * 60 * 1000) - elapsedMs;
        const remHrs = Math.floor(remainingMs / (1000 * 60 * 60));
        const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        setSlaLabel(`${remHrs}j ${remMins}m sisa`);

        if (elapsedHrs >= 24) {
          setSlaColorClass('yellow-text');
        } else {
          setSlaColorClass('green-text');
        }
      }
    };

    calculateSLA();
    const interval = setInterval(calculateSLA, 1000);
    return () => clearInterval(interval);
  }, [project]);

  const getCustodianEmail = (name) => {
    if (!name) return 'support@telkom.co.id';
    const cleanName = name
      .toLowerCase()
      .replace(/, s\.h\./g, '')
      .replace(/, m\.b\.a\./g, '')
      .replace(/\./g, '')
      .trim()
      .replace(/\s+/g, '.');
    return `${cleanName}@telkom.co.id`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const isFutureStep = (stepCode) => {
    if (project.currentStep === 'P9') return true;
    const order = ["P1", "P2", "P3", "P4", "SPH", "P5", "P6", "P7", "SKM", "PA", "SPPBJ", "KL", "BAST", "BASO"];
    const currIndex = order.indexOf(project.currentStep);
    const stepIndex = order.indexOf(stepCode);
    if (currIndex === -1) return false;
    return stepIndex > currIndex;
  };

  const selectedDoc = project.documents.find((d) => d.code === selectedDocCode) || { code: selectedDocCode, name: selectedDocCode, status: 'Empty' };

  // Hitung hak akses verifikasi/upload
  const isCurrentStep = project.currentStep === selectedDoc.code;
  const currentUser = USERS_ROLE[currentUserRole] || USERS_ROLE.AM;
  const isExactCustodian = currentUser && project.custodian && project.custodian.name === currentUser.name;

  let hasRightToApprove = false;
  if (isExactCustodian && isCurrentStep && project.currentStep !== 'P9') {
    if (currentUserRole.startsWith('MANAGER')) {
      hasRightToApprove = false;
    } else if (project.currentStep === 'P1' || project.currentStep === 'P6' || project.currentStep === 'BAST' || project.currentStep === 'BASO') {
      hasRightToApprove = currentUserRole.startsWith('AM');
    } else if (project.currentStep === 'PA') {
      hasRightToApprove = currentUserRole.startsWith('SDA');
    } else if (project.currentStep === 'KL') {
      hasRightToApprove = currentUserRole.startsWith('LEGAL');
    } else {
      hasRightToApprove = currentUserRole.startsWith('BUD');
    }

    if (selectedDoc.code === 'SPH' || selectedDoc.code === 'SKM') {
      hasRightToApprove = currentUserRole.startsWith('AM') || currentUserRole.startsWith('BUD');
    }
  }

  const isFuture = isFutureStep(selectedDoc.code);
  const activeStepDoc = project.documents.find((d) => d.code === project.currentStep) || { name: project.currentStep };

  // Status Labels Bahasa Indonesia
  const statusLabels = {
    Approved: 'Disetujui',
    Pending: 'Menunggu Persetujuan',
    Rejected: 'Ditolak',
    Revision: 'Butuh Revisi',
    Empty: 'Belum Diunggah'
  };

  // Nudge via Teams
  const email = getCustodianEmail(project.custodian?.name);
  const nudgeMsg = `Halo ${project.custodian?.name || ''}, mohon tindak lanjut untuk berkas "${activeStepDoc.name}" pada proyek "${project.name}" (${project.client}) yang saat ini sedang tertahan. Terima kasih!`;
  const teamsLink = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMsg)}`;
  const basoDoc = project.documents.find((d) => d.code === 'BASO');
  const isCompleted = basoDoc && basoDoc.status === 'Approved';

  // Lembar paraf koordinasi checkmarks
  const isP1Approved = project.documents.find((d) => d.code === 'P1')?.status === 'Approved';
  const isP2Approved = project.documents.find((d) => d.code === 'P2')?.status === 'Approved';
  const isPaApproved = project.documents.find((d) => d.code === 'PA')?.status === 'Approved';
  const isKlApproved = project.documents.find((d) => d.code === 'KL')?.status === 'Approved';

  // Dapatkan catatan revisi dari log history jika status KL butuh revisi
  let legalComment = '-';
  const klDoc = project.documents.find((d) => d.code === 'KL');
  if (klDoc && klDoc.status === 'Revision') {
    const latestRevisionLog = project.history.find((h) => h.action.includes('Revisi') || h.notes.includes('revisi') || h.action.includes('Return'));
    if (latestRevisionLog) {
      legalComment = latestRevisionLog.notes
        .replace(/Dokumen .* ditandai butuh revisi. Catatan dari platform utama: "/, '')
        .replace(/Revisi diminta untuk berkas .*. Catatan: "/, '')
        .replace(/"$/, '');
    } else {
      legalComment = 'Revisi anggaran & pasal draf';
    }
  } else if (klDoc && klDoc.status === 'Rejected') {
    legalComment = 'Draf ditolak (NO GO / P9)';
  }

  // Phase index for timeline progress
  const phaseOrder = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5'];
  const activePhaseIndex = phaseOrder.indexOf(project.currentPhase);
  const progressPercent = (activePhaseIndex / (phaseOrder.length - 1)) * 100;

  return (
    <section id="details-screen" className="screen active">
      <div className="mb-4">
        <button className="btn btn-secondary" onClick={onBack}>
          &larr; Kembali ke Daftar Proyek
        </button>
      </div>

      <div className="project-details-grid">
        {/* Kolom Utama: Linimasa Lacak Dokumen */}
        <div className="details-main-col">
          {/* Glass Card Meta Data Proyek */}
          <div className="glass-card">
            <div className="project-meta-header">
              <div className="proj-meta-left">
                <span className="proj-meta-id">{project.id}</span>
                <h3 className="proj-meta-title">{project.name}</h3>
                <div className="proj-meta-client">{project.client}</div>
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  AM: {project.am}
                </div>
              </div>
              <div className="proj-meta-right">
                <span className="proj-meta-label">Nilai Kontrak</span>
                <span className="proj-meta-value">{formatCurrency(project.value)}</span>
              </div>
            </div>
          </div>

          {/* JNE-Style Horizontal Timeline (F0 s.d F5) */}
          <div className="glass-card">
            <div className="card-title-bar">
              <h3>Alur Progres Penjualan (Sales Funnel)</h3>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Klik simpul angka untuk melihat sub-dokumen kontrak
              </span>
            </div>

            <div className="timeline-horizontal-container">
              <div className="timeline-horizontal">
                <div className="timeline-progress-bar" style={{ width: `${progressPercent}%` }}></div>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', position: 'relative' }}>
                  {STAGE_FLOW.map((stage, index) => {
                    const isPassed = index < activePhaseIndex;
                    const isActive = index === activePhaseIndex;
                    const isSel = stage.phase === selectedPhase;

                    return (
                      <div
                        key={stage.phase}
                        className={`timeline-node ${isPassed ? 'completed' : ''} ${isActive ? 'active' : ''} ${isSel ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedPhase(stage.phase);
                          // Default to first step code in phase if exists
                          if (stage.steps && stage.steps.length > 0) {
                            // find if active step is in this phase, otherwise default to first step
                            const hasActiveStep = stage.steps.includes(project.currentStep);
                            setSelectedDocCode(hasActiveStep ? project.currentStep : stage.steps[0]);
                          } else {
                            setSelectedDocCode('');
                          }
                        }}
                      >
                        <div className="node-circle">
                          <span className="node-num">{index + 1}</span>
                          <svg viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                        <span className="node-name">{stage.phase}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Checklist Berkas Digital pada Fase yang Terpilih */}
            <div className="sub-timeline-area">
              {(() => {
                const stageObj = STAGE_FLOW.find((s) => s.phase === selectedPhase);
                return (
                  <>
                    <div className="sub-timeline-title">{selectedPhase} - {stageObj?.desc}</div>
                    <div className="sub-timeline-list">
                      {!stageObj?.steps || stageObj.steps.length === 0 ? (
                        <div className="text-muted" style={{ gridColumn: '1 / -1', padding: '10px 0', fontSize: '0.8rem' }}>
                          Tidak ada berkas dokumen kontrak khusus yang wajib di-upload pada fase ini. Proses dikelola langsung oleh sistem eksternal MyTens / DigiReview.
                        </div>
                      ) : (
                        stageObj.steps.map((stepCode) => {
                          const docItem = project.documents.find((d) => d.code === stepCode);
                          if (!docItem) return null;
                          const isStepLocked = isFutureStep(stepCode);
                          const isActiveStep = selectedDocCode === stepCode;

                          let cardLabel = statusLabels[docItem.status] || docItem.status;
                          if (isStepLocked) cardLabel = 'Terkunci';

                          return (
                            <div
                              key={stepCode}
                              className={`sub-step-card ${isStepLocked ? 'locked' : docItem.status.toLowerCase()} ${isActiveStep ? 'active' : ''}`}
                              onClick={() => setSelectedDocCode(stepCode)}
                            >
                              <div className="sub-step-left">
                                <span className="sub-step-indicator"></span>
                                <div className="sub-step-info">
                                  <span className="sub-step-code">{docItem.code}</span>
                                  <span className="sub-step-name">{docItem.name}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {isStepLocked && (
                                  <svg style={{ width: '10px', height: '10px', fill: '#9ca3af' }} viewBox="0 0 24 24">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                                  </svg>
                                )}
                                {cardLabel}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Pratinjau Berkas & Tombol Aksi Persetujuan */}
          {selectedDocCode && (
            <div className="doc-workspace">
              <div className="glass-card doc-preview-card">
                <div className="doc-preview-header">
                  <div className="doc-preview-title">
                    <h4>{selectedDoc.name}</h4>
                    <p>
                      Status Berkas: {statusLabels[selectedDoc.status] || selectedDoc.status}
                      {selectedDoc.date && ` (${formatDate(selectedDoc.date)})`}
                    </p>
                  </div>
                </div>

                {/* PDF Viewer Simulation Area */}
                <div className="doc-preview-body" id="doc-preview-inner" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {isFuture ? (
                    <div className="pdf-empty-state" style={{ background: '#ffffff', padding: '60px 40px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: '80px', height: '80px', background: 'rgba(148, 163, 184, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: '#94a3b8' }}>
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                      </div>
                      <h5 style={{ color: 'var(--dark-text)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Tahapan Belum Mulai (Terkunci)</h5>
                      <p style={{ color: 'var(--muted-text)', fontSize: '0.8rem', maxWidth: '380px', lineHeight: 1.5, margin: '0 auto', textAlign: 'center' }}>
                        Dokumen ini masih terkunci. Anda baru dapat mengakses berkas ini setelah berkas aktif saat ini (<b>{activeStepDoc.name}</b>) disetujui di platform utama.
                      </p>
                    </div>
                  ) : selectedDoc.status === 'Empty' ? (
                    <>
                      {isCurrentStep && hasRightToApprove && (
                        <div className="active-custodian-alert" style={{ margin: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.4 }}>
                          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor', flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                          <span style={{ flexGrow: 1 }}><b>Belum Diunggah:</b> Anda belum mengunggah draf pertama berkas ini. Hubungkan berkas segera agar tracking SLA dimulai.</span>
                        </div>
                      )}
                      <div className="pdf-empty-state" style={{ background: '#ffffff', padding: '60px 40px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px dashed var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ width: '80px', height: '80px', background: 'rgba(100, 116, 139, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px dashed rgba(100, 116, 139, 0.2)' }}>
                          <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: '#64748b' }}>
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                        </div>
                        <h5 style={{ color: 'var(--dark-text)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>Belum Ada Berkas Draf</h5>
                        <p style={{ color: 'var(--muted-text)', fontSize: '0.8rem', maxWidth: '380px', lineHeight: 1.5, margin: '0 auto 12px', textAlign: 'center' }}>
                          Draf berkas untuk tahapan <b>{selectedDoc.name}</b> belum tersedia di sistem. Silakan pilih berkas dari Teams atau komputer lokal menggunakan tombol aksi di bawah untuk menghubungkan berkas dan memulai pelacakan durasi SLA.
                        </p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>SLA akan berjalan otomatis setelah berkas berhasil ditautkan.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {isCurrentStep && hasRightToApprove && selectedDoc.status === 'Pending' && (
                        <div className="active-custodian-alert" style={{ margin: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.4 }}>
                          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor', flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                          <span style={{ flexGrow: 1 }}><b>Menunggu Aksi:</b> Anda belum memverifikasi berkas ini. Harap periksa dokumen dan lakukan persetujuan atau penolakan.</span>
                        </div>
                      )}
                      {isCurrentStep && hasRightToApprove && selectedDoc.status === 'Revision' && (
                        <div className="active-custodian-alert" style={{ margin: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.4 }}>
                          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor', flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                          <span style={{ flexGrow: 1 }}><b>Butuh Revisi:</b> Anda belum merevisi berkas ini. Harap perbarui draf dokumen berdasarkan catatan revisi di bawah.</span>
                        </div>
                      )}

                      <div className="pdf-viewer-container" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div className="pdf-toolbar">
                          <div className="pdf-toolbar-left">
                            <svg className="pdf-file-icon" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: '#ef4444', marginRight: '6px' }}>
                              <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
                            </svg>
                            <span className="pdf-filename" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{`${project.id}_${selectedDoc.code}_${selectedDoc.name.replace(/[\s/()]/g, '_')}.pdf`.toLowerCase()}</span>
                          </div>
                          <div className="pdf-toolbar-center">
                            <button className="pdf-zoom-btn" onClick={() => setZoom(Math.max(70, zoom - 10))}>-</button>
                            <span className="pdf-zoom-val">{zoom}%</span>
                            <button className="pdf-zoom-btn" onClick={() => setZoom(Math.min(130, zoom + 10))}>+</button>
                            <div className="pdf-page-nav">
                              <span>Page 1 of 1</span>
                            </div>
                          </div>
                          <div className="pdf-toolbar-right">
                            <button className="pdf-tool-btn" title="Download PDF" onClick={() => alert(`Simulasi: Berkas ${project.id}_${selectedDoc.code}.pdf berhasil diunduh.`)}>
                              <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
                            </button>
                            <button className="pdf-tool-btn" title="Print" onClick={() => window.print()}>
                              <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                            </button>
                          </div>
                        </div>

                        <div className="pdf-canvas" style={{ flex: 1, overflowY: 'auto', background: '#e2e8f0', display: 'flex', justifyContent: 'center', padding: '16px' }}>
                          <div
                            className="pdf-page-sheet"
                            style={{
                              transform: `scale(${zoom / 100})`,
                              transformOrigin: 'top center',
                              transition: 'transform 0.1s ease',
                              background: '#ffffff',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              padding: '30px',
                              width: '450px',
                              minHeight: '550px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="pdf-doc-letterhead" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '10px', marginBottom: '16px' }}>
                              <div className="pdf-letterhead-left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="pdf-logo-text" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#e61c24' }}>Telkom Indonesia</span>
                                <span style={{ fontSize: '0.6rem', color: '#cbd5e1' }}>|</span>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>Regional IV R-LEGS</span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', display: 'block' }}>Divisi Large Enterprise</span>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8' }}>Government & Business Services</span>
                              </div>
                            </div>
                            <div className="pdf-doc-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>{selectedDoc.name}</h2>
                              <p style={{ fontSize: '0.55rem', color: '#64748b', margin: 0 }}>Nomor Validasi Elektronik: R-EDT/2026/0{project.id.replace(/\D/g, '')}/{selectedDoc.code}</p>
                            </div>

                            <table className="pdf-meta-table" style={{ width: '100%', fontSize: '0.68rem', marginBottom: '20px', borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '30%', padding: '4px 0', color: '#64748b' }}>ID Proyek</td>
                                  <td style={{ padding: '4px 0', fontFamily: 'monospace', fontWeight: 'bold', color: '#004b87' }}>{project.id}</td>
                                </tr>
                                <tr>
                                  <td style={{ color: '#64748b', padding: '4px 0' }}>Nama Kerja Sama</td>
                                  <td style={{ fontWeight: 600, color: '#004b87', padding: '4px 0' }}>{project.name}</td>
                                </tr>
                                <tr>
                                  <td style={{ color: '#64748b', padding: '4px 0' }}>Klien Korporat</td>
                                  <td style={{ padding: '4px 0' }}>{project.client}</td>
                                </tr>
                                <tr>
                                  <td style={{ color: '#64748b', padding: '4px 0' }}>Kode Berkas</td>
                                  <td style={{ padding: '4px 0' }}><span style={{ fontWeight: 700, color: '#e61c24' }}>{selectedDoc.code}</span> - {selectedDoc.name}</td>
                                </tr>
                                <tr>
                                  <td style={{ color: '#64748b', padding: '4px 0' }}>Tanggal Verifikasi</td>
                                  <td style={{ padding: '4px 0' }}>{selectedDoc.date ? formatDate(selectedDoc.date) : '-'}</td>
                                </tr>
                              </tbody>
                            </table>

                            <div className="pdf-doc-content" style={{ fontSize: '0.65rem', color: '#334155', lineHeight: 1.5, marginBottom: '20px' }}>
                              <p style={{ margin: '0 0 10px' }}>
                                Menimbang bahwa pihak penyedia layanan solusi digital, dalam hal ini diwakili oleh <b>PT Telekomunikasi Indonesia (Persero) Tbk Regional IV</b>, menyepakati perihal pengadaan berkas administratif untuk pelanggan segmen bisnis berskala besar / instansi pemerintah terkait proyek kerja sama di atas.
                              </p>
                              <p style={{ margin: '0 0 10px' }}>
                                Berkas <b>{selectedDoc.name}</b> ini diterbitkan secara resmi melalui sistem pemantauan terpadu <i>R-EDT (Regional Enterprise Document Tracking)</i> dan secara otomatis terintegrasi ke dalam *DigiReview* serta portal pengadaan internal *MyTens RPA*.
                              </p>
                              <p style={{ margin: '0' }}>
                                Seluruh data validitas dokumen telah diverifikasi secara elektronik oleh pihak-pihak berwenang sesuai dengan matriks delegasi wewenang yang berlaku di lingkungan kerja PT Telkom Indonesia (Persero) Tbk.
                              </p>
                            </div>

                            <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Lembar Pemeriksaan / Paraf Koordinasi
                              </div>
                              <table className="pdf-meta-table" style={{ width: '100%', fontSize: '0.58rem', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'left' }}>Jabatan</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'left' }}>Nama</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center' }}>Paraf</th>
                                    <th style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'left' }}>Catatan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: 'bold' }}>Account Manager</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px' }}>{project.am}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontFamily: 'cursive', fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 'bold' }}>{selectedDoc.status !== 'Empty' ? project.am.split(' ')[0] : ''}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', color: '#64748b' }}>{selectedDoc.status !== 'Empty' ? 'Dikerjakan' : 'Belum Ada'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: 'bold' }}>BUD Officer</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px' }}>Ahmad Yani</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontFamily: 'cursive', fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 'bold' }}>{isP2Approved ? 'Yani' : ''}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', color: '#64748b' }}>{isP2Approved ? 'Lolos Verifikasi' : 'Menunggu'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: 'bold' }}>SDA Officer</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px' }}>Rian Wijaya</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontFamily: 'cursive', fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 'bold' }}>{isPaApproved ? 'RianW' : ''}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', color: '#64748b' }}>{isPaApproved ? 'Lolos Verifikasi' : 'Menunggu'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', fontWeight: 'bold' }}>Legal Officer</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px' }}>Indra Hermawan, S.H.</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', textAlign: 'center', fontFamily: 'cursive', fontSize: '0.85rem', color: '#1d4ed8', fontWeight: 'bold' }}>{isKlApproved ? 'IndraH' : ''}</td>
                                    <td style={{ border: '1px solid #e2e8f0', padding: '4px', color: '#64748b', fontSize: '0.55rem', lineHeight: 1.1 }}>{legalComment}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Custodian Action buttons: Approve/Reject/Return */}
                  {isCurrentStep && selectedDoc.status === 'Pending' && hasRightToApprove && (
                    <div className="doc-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', padding: '16px', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-text)', fontStyle: 'italic', textAlign: 'right' }}>
                        *Pembaruan di bawah ini hanya untuk status tracking R-EDT.
                      </span>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
                        <button className="btn btn-danger" onClick={() => onDocumentAction(project.id, selectedDoc.code, 'Reject')}>Tandai Ditolak / Batal</button>
                        <button className="btn btn-warning" onClick={() => onDocumentAction(project.id, selectedDoc.code, 'Return')}>Tandai Perlu Revisi</button>
                        <button className="btn btn-success" onClick={() => onDocumentAction(project.id, selectedDoc.code, 'Approve')}>Tandai Disetujui (Lolos)</button>
                      </div>
                    </div>
                  )}

                  {/* Upload Container for Empty or Revision status */}
                  {isCurrentStep && (selectedDoc.status === 'Empty' || selectedDoc.status === 'Revision') && (
                    <div className="doc-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', padding: '16px', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
                      {hasRightToApprove ? (
                        <>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted-text)', fontStyle: 'italic', textAlign: 'right', width: '100%' }}>
                            *Dokumen draf direvisi di platform utama? Pilih berkas di Teams atau komputer lokal untuk menyinkronkan status pelacakan di R-EDT.
                          </span>
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '10px 20px' }} onClick={() => openFilePicker('local')}>Pilih Berkas Lokal</button>
                            <button className="btn btn-teams" style={{ fontSize: '0.8rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openFilePicker('teams')}>
                              <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px', fill: 'currentColor' }}>
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                              </svg>
                              Pilih dari MS Teams
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '12px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500 }}>
                          <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor', flexShrink: 0 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                          <span>
                            Menunggu pengunggahan {selectedDoc.status === 'Revision' ? 'revisi' : 'draf'} berkas oleh <b>{project.custodian?.name || 'Tidak Ada'} ({project.custodian?.role || ''})</b>.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Riwayat Audit Trail */}
              <div className="glass-card audit-trail-card">
                <div className="card-title-bar">
                  <h3>Riwayat Audit (Audit Trail)</h3>
                </div>
                <div className="timeline-vertical" id="vertical-audit-trail">
                  {project.history.map((h, index) => (
                    <div key={index} className={`timeline-v-item ${index === 0 ? 'latest' : ''}`}>
                      <span className="timeline-v-dot"></span>
                      <div className="timeline-v-content">
                        <div className="timeline-v-header">
                          <span className="timeline-v-user">
                            {h.user} <span style={{ fontWeight: 'normal', color: '#9ca3af', fontSize: '0.75rem' }}>({h.role})</span>
                          </span>
                          <span className="timeline-v-time">{formatDate(h.timestamp)}</span>
                        </div>
                        <span className="timeline-v-action">{h.action}</span>
                        <p className="timeline-v-notes">{h.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Detail Penanggung Jawab / Kustodian Saat ini */}
        <div className="details-right-col">
          <div className="glass-card custodian-card">
            <div className="custodian-title">Pemegang Dokumen Saat Ini</div>
            <img src={project.custodian?.avatar || ''} alt="Custodian Profile" className="custodian-avatar" />
            <div className="custodian-name">{project.custodian?.name || 'Tidak Ada'}</div>
            <div className="custodian-role">{project.custodian?.role || ''}</div>
            <div className="custodian-dept">{project.custodian?.dept || ''}</div>

            {/* Tombol Hubungi via Teams */}
            {!isCompleted && project.currentStep !== 'P9' && (
              <a
                className="btn btn-teams"
                style={{ width: '100%', marginTop: '16px', marginBottom: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                href={teamsLink}
                target="_blank"
                rel="noreferrer"
              >
                <svg className="teams-icon-svg" viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'currentColor' }}>
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                </svg>
                <span>Hubungi via Teams</span>
              </a>
            )}

            {/* Box Waktu SLA Mandek */}
            <div className="sla-timer-box">
              <span className="sla-timer-label">Durasi Tertahan (SLA)</span>
              <div className={`sla-timer-value ${slaColorClass}`}>{slaLabel}</div>
            </div>
          </div>

          {/* Deskripsi Informasi Petunjuk Penggunaan */}
          <div className="glass-card" style={{ fontSize: '0.8rem', lineHeight: '1.6', color: 'var(--muted-text)' }}>
            <h4 style={{ color: 'var(--telkom-blue)', marginBottom: '12px', fontSize: '0.95rem', fontWeight: 700 }}>Informasi Alur R-EDT</h4>
            <p style={{ marginBottom: '8px' }}>1. Ganti Peran di bilah header atas untuk menyetujui, menolak, atau mengembalikan berkas.</p>
            <p style={{ marginBottom: '8px' }}>2. Durasi tertahan dihitung berdasarkan aktivitas terakhir di meja kustodian.</p>
            <p>3. Status SLA: <b style={{ color: 'var(--status-green)' }}>Hijau</b> (&lt; 24 jam), <b style={{ color: 'var(--status-yellow)' }}>Kuning</b> (24-48 jam), dan <b style={{ color: 'var(--status-red)' }}>Merah</b> (&gt; 48 jam overdue).</p>
          </div>
        </div>
      </div>
    </section>
  );
}
