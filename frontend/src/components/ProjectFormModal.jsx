import React, { useState } from 'react';
import { USERS_ROLE } from '../utils/mockData';

export default function ProjectFormModal({ isOpen, onClose, currentUserRole, onCreateProject }) {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectValue, setProjectValue] = useState('');

  const currentUser = USERS_ROLE[currentUserRole] || USERS_ROLE.AM;

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(projectValue) || 0;

    if (!projectName || !clientName || value <= 0) {
      alert('Harap lengkapi semua data formulir dengan benar.');
      return;
    }

    onCreateProject({
      name: projectName,
      client: clientName,
      value: value
    });

    // Reset form
    setProjectName('');
    setClientName('');
    setProjectValue('');
    onClose();
  };

  return (
    <div className="modal-overlay active" id="new-project-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Inisiasi Proyek Baru (Funnel F2)</h3>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="form-project-name">Judul Kerjasama Proyek B2B</label>
              <input
                type="text"
                id="form-project-name"
                className="form-control"
                placeholder="Contoh: Pengadaan CCTV IoT Pemkot Semarang"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="form-client-name">Nama Instansi / Perusahaan Klien</label>
              <input
                type="text"
                id="form-client-name"
                className="form-control"
                placeholder="Contoh: Dinas Perhubungan Kota Semarang"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="form-project-value">Estimasi Nilai Kontrak (Rupiah)</label>
              <input
                type="number"
                id="form-project-value"
                className="form-control"
                placeholder="Contoh: 1500000000"
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="form-am-name">Account Manager (AM) Penanggung Jawab</label>
              <input
                type="text"
                id="form-am-name"
                className="form-control"
                value={currentUser.name}
                readOnly
              />
            </div>
            <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
              * Setelah proyek baru dibuat, sistem otomatis menetapkan status awal berada pada tahap <b>Fase F2: Self Assessment</b> dengan antrean berkas <b>P1 (Justkeb Barang/Jasa)</b> di bawah wewenang AM.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan Proyek</button>
          </div>
        </form>
      </div>
    </div>
  );
}
