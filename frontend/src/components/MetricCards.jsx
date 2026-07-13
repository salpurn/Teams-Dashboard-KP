import React from 'react';

export default function MetricCards({ projects, onCardClick }) {
  let total = projects.length;
  let activeCount = 0;
  let completedCount = 0;
  let overdueCount = 0;

  const now = new Date();

  projects.forEach((p) => {
    const basoDoc = p.documents.find((d) => d.code === 'BASO');
    const isCompleted = basoDoc && basoDoc.status === 'Approved';

    if (isCompleted) {
      completedCount++;
    } else {
      activeCount++;
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
      if (elapsedHrs > p.slaLimitHours) {
        overdueCount++;
      }
    }
  });

  return (
    <div className="metrics-grid">
      <div className="glass-card metric-card total" onClick={() => onCardClick('all')}>
        <div className="metric-header">
          <span>Total Proyek B2B</span>
          <svg className="metric-icon" viewBox="0 0 24 24">
            <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
          </svg>
        </div>
        <div className="metric-value">{total}</div>
        <div className="metric-footer">Terdaftar dalam regional</div>
      </div>

      <div className="glass-card metric-card active-p" onClick={() => onCardClick('active')}>
        <div className="metric-header">
          <span>Proyek Aktif (Berjalan)</span>
          <svg className="metric-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <div className="metric-value">{activeCount}</div>
        <div className="metric-footer">Dokumen sedang berproses</div>
      </div>

      <div className="glass-card metric-card completed" onClick={() => onCardClick('completed')}>
        <div className="metric-header">
          <span>Rampung (WIN)</span>
          <svg className="metric-icon" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
        <div className="metric-value">{completedCount}</div>
        <div className="metric-footer">SLA sukses di-ACC</div>
      </div>

      <div className="glass-card metric-card overdue" onClick={() => onCardClick('red')}>
        <div className="metric-header">
          <span>Overdue (&gt;48 Jam)</span>
          <svg className="metric-icon" viewBox="0 0 24 24">
            <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div className="metric-value">{overdueCount}</div>
        <div className="metric-footer">Butuh eskalasi manajer</div>
      </div>
    </div>
  );
}
