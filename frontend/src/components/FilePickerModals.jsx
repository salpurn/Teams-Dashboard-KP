import React, { useState, useEffect } from 'react';

export default function FilePickerModals({ isOpen, modalType, onClose, activeProject, activeDocCode, onFileSelected }) {
  const [dbFiles, setDbFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamsChannel, setTeamsChannel] = useState("AM B2B Regional IV");
  const [localFolder, setLocalFolder] = useState("Downloads");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Reset selection when modal opens
  useEffect(() => {
    setSelectedFile(null);
    setSearchQuery("");
  }, [isOpen, modalType]);

  // Fetch available files from backend API database
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('http://localhost:8000/api/v1/tracker/available-files')
        .then(res => {
          if (!res.ok) throw new Error("Gagal mengambil data berkas");
          return res.json();
        })
        .then(data => {
          setDbFiles(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching files from database:", err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = () => {
    if (!selectedFile) return;
    const sourceLabel = modalType === 'teams' ? "Microsoft Teams (SharePoint)" : "File Explorer Lokal (C:)";
    onFileSelected(selectedFile.name, sourceLabel);
    onClose();
  };

  const renderFileIcon = (fileType) => {
    if (fileType === 'pdf') {
      return (
        <svg className="teams-file-icon-doc" style={{ fill: '#ef4444' }} viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-.5zm5 0c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-3z" />
        </svg>
      );
    } else if (fileType === 'xlsx') {
      return (
        <svg className="teams-file-icon-doc" style={{ fill: '#10b981' }} viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12H10v-2h2v2zm0-4H10V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z" />
        </svg>
      );
    }
    return (
      <svg className="teams-file-icon-doc" style={{ fill: '#3b82f6' }} viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
      </svg>
    );
  };

  if (modalType === 'teams') {
    // Group teams source files
    const teamsFiles = dbFiles.filter(f => f.source === 'teams');
    const channels = Array.from(new Set(teamsFiles.map(f => f.category)));

    // Generate dynamic suggested files based on active context
    let files = [];
    if (teamsChannel === "AM B2B Regional IV") {
      files.push({ name: `${activeDocCode}_Revised_${activeProject.id.replace(/-/g, "_")}_v2.pdf`, size: "2.4 MB", date: "Hari ini, 09:30", type: "pdf" });
    } else if (teamsChannel === "Legal & Compliance" && activeDocCode === "KL") {
      files.push({ name: `${activeDocCode}_Draft_Kontrak_Review_Legal.docx`, size: "1.9 MB", date: "Hari ini, 10:15", type: "docx" });
    } else if (teamsChannel === "SDA Assurance Team" && activeDocCode === "PA") {
      files.push({ name: `${activeDocCode}_Assessment_GO_Final.pdf`, size: "3.2 MB", date: "Hari ini, 11:00", type: "pdf" });
    }

    // Get files for selected channel
    const channelFiles = teamsFiles.filter(f => f.category === teamsChannel).map(f => ({
      name: f.name,
      size: f.size,
      date: f.date,
      type: f.file_type
    }));
    files = [...files, ...channelFiles];

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return (
      <div className="modal-overlay active" id="teams-picker-modal">
        <div className="modal-content" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '450px' }}>
          <div className="modal-header">
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#464eb8' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
              </svg>
              Pilih Berkas dari Microsoft Teams
            </h3>
            <button className="close-modal" onClick={onClose}>&times;</button>
          </div>

          <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, background: '#ffffff' }}>
            {/* Teams / Channels Sidebar */}
            <div style={{ width: '180px', borderRight: '1px solid var(--border-color)', background: '#f8fafc', padding: '12px', overflowY: 'auto' }}>
              <span className="role-select-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.6rem' }}>Teams & Saluran</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {channels.map(channel => (
                  <div
                    key={channel}
                    className={`teams-channel-item ${teamsChannel === channel ? 'active' : ''}`}
                    onClick={() => {
                      setTeamsChannel(channel);
                      setSelectedFile(null);
                    }}
                  >
                    {channel}
                  </div>
                ))}
              </div>
            </div>

            {/* File Explorer List */}
            <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="search-input-wrapper" style={{ marginBottom: '8px', borderRadius: '6px' }}>
                <svg className="search-icon" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari berkas di salurannya..."
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.75rem', background: 'transparent' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--telkom-red)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>Memuat berkas dari database...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.75rem', color: 'var(--muted-text)' }}>Tidak ada berkas yang sesuai.</div>
                ) : (
                  filteredFiles.map(file => (
                    <div
                      key={file.name}
                      className={`teams-file-row ${selectedFile && selectedFile.name === file.name ? 'selected' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="teams-file-left">
                        {renderFileIcon(file.type)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <span className="teams-file-name" title={file.name}>{file.name}</span>
                          <span className="teams-file-meta">{file.size} &bull; Diubah: {file.date}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Teams Cloud</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: '#f8fafc', padding: '12px 20px' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 14px' }} onClick={onClose}>Batal</button>
            <button
              type="button"
              className="btn btn-teams"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
              onClick={handleSelect}
              disabled={!selectedFile || isLoading}
            >
              Tautkan Berkas
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    // Group local files from database
    const localFiles = dbFiles.filter(f => f.source === 'local');
    const folders = Array.from(new Set(localFiles.map(f => f.category)));

    const files = localFiles.filter(f => f.category === localFolder).map(f => ({
      name: f.name,
      size: f.size,
      date: f.date,
      type: f.file_type
    }));

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    return (
      <div className="modal-overlay active" id="local-picker-modal">
        <div className="modal-content" style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', height: '450px' }}>
          <div className="modal-header">
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--telkom-blue)' }}>
              <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'currentColor' }}>
                <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 11H5c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h14c1.1 0 2 .45 2 1v8c0 .55-.45 1-1 1z" />
              </svg>
              Pilih Berkas dari Komputer Lokal
            </h3>
            <button className="close-modal" onClick={onClose}>&times;</button>
          </div>

          <div style={{ display: 'flex', flexGrow: 1, minHeight: 0, background: '#ffffff' }}>
            {/* Folders Sidebar */}
            <div style={{ width: '180px', borderRight: '1px solid var(--border-color)', background: '#f8fafc', padding: '12px', overflowY: 'auto' }}>
              <span className="role-select-label" style={{ display: 'block', marginBottom: '8px', fontSize: '0.6rem', color: 'var(--muted-text)', textTransform: 'uppercase' }}>Folder Lokal</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {folders.map(folder => (
                  <div
                    key={folder}
                    className={`local-folder-item ${localFolder === folder ? 'active' : ''}`}
                    onClick={() => {
                      setLocalFolder(folder);
                      setSelectedFile(null);
                    }}
                  >
                    {folder}
                  </div>
                ))}
              </div>
            </div>

            {/* File Explorer List */}
            <div style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="search-input-wrapper" style={{ marginBottom: '8px', borderRadius: '6px' }}>
                <svg className="search-icon" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari berkas di folder ini..."
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.75rem', background: 'transparent' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '8px' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--telkom-red)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>Memuat berkas dari database...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.75rem', color: 'var(--muted-text)' }}>Tidak ada berkas yang sesuai.</div>
                ) : (
                  filteredFiles.map(file => (
                    <div
                      key={file.name}
                      className={`teams-file-row ${selectedFile && selectedFile.name === file.name ? 'selected' : ''}`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="teams-file-left">
                        {renderFileIcon(file.type)}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                          <span className="teams-file-name" title={file.name}>{file.name}</span>
                          <span className="teams-file-meta">{file.size} &bull; Diubah: {file.date}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>Penyimpanan Lokal</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', background: '#f8fafc', padding: '12px 20px' }}>
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 14px' }} onClick={onClose}>Batal</button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '6px 14px', background: 'var(--telkom-blue)', borderColor: 'var(--telkom-blue)' }}
              onClick={handleSelect}
              disabled={!selectedFile || isLoading}
            >
              Unggah Berkas
            </button>
          </div>
        </div>
      </div>
    );
  }
}
