// Mock Data Awal untuk R-LEGS Enterprise Document Tracking Dashboard (R-EDT)
// Berisi data simulasi proyek B2B Telkom Indonesia, dengan SLA dan log audit yang realistis.

export const INITIAL_PROJECTS = [
  {
    id: "PRJ-2026-001",
    name: "Pengembangan Infrastructure Smart City & CCTV IoT",
    client: "Pemerintah Kota Semarang",
    am: "Budi Santoso",
    value: 3250000000,
    startDate: "2026-06-01T09:00:00Z",
    currentPhase: "F5",
    currentStep: "KL", // Kontrak Layanan
    lastUpdated: new Date(Date.now() - 52 * 60 * 60 * 1000).toISOString(), // 52 jam yang lalu (Overdue / Merah)
    slaLimitHours: 48,
    custodian: {
      name: "Indra Hermawan, S.H.",
      role: "Legal Officer",
      dept: "Legal Regional IV Telkom",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-01T14:30:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-03T11:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-04T09:15:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T15:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Solusindo", date: "2026-06-06T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-07T13:45:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-08T16:20:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T11:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Solusindo", date: "2026-06-10T09:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-11T14:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T10:30:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Pending", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-12T11:00:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-01T09:30:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek smart city Kota Semarang." },
      { timestamp: "2026-06-01T14:30:00Z", user: "Budi Santoso", role: "Account Manager", action: "Submit Document", notes: "Mengunggah Dokumen Justkeb P1 yang telah ditandatangani digital." },
      { timestamp: "2026-06-03T11:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve Document", notes: "Dokumen P2, P3, P4 disetujui via DigiReview." },
      { timestamp: "2026-06-06T10:00:00Z", user: "Mitra Solusindo", role: "Mitra Eksternal", action: "Submit SPH", notes: "Surat Penawaran Harga diunggah oleh perwakilan mitra." },
      { timestamp: "2026-06-08T16:20:00Z", user: "Budi Santoso", role: "Account Manager", action: "Nego Complete", notes: "Dokumen P6 (Klarifikasi & Nego) diselesaikan dengan mitra." },
      { timestamp: "2026-06-11T14:00:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Project Assessment GO", notes: "Assessment kelayakan disetujui, rekomendasi GO. Notifikasi submit proposal dikunci." },
      { timestamp: "2026-06-12T10:30:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve SPPBJ", notes: "SPPBJ diterbitkan dan diteruskan ke bagian Legal untuk pembuatan Kontrak Layanan (KL)." },
      { timestamp: "2026-06-12T11:00:00Z", user: "Indra Hermawan, S.H.", role: "Legal Officer", action: "Receive Document", notes: "Dokumen KL diterima untuk diperiksa legalitasnya." }
    ]
  },
  {
    id: "PRJ-2026-002",
    name: "Konektivitas Fiber Optik & Managed Service WAN",
    client: "PT Bank Pembangunan Daerah Jawa Tengah",
    am: "Siti Aminah",
    value: 1850000000,
    startDate: "2026-06-05T08:30:00Z",
    currentPhase: "F3",
    currentStep: "PA", // Project Assessment (SDA)
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 jam yang lalu (On Track / Hijau)
    slaLimitHours: 48,
    custodian: {
      name: "Rian Wijaya",
      role: "SDA Officer",
      dept: "Service Delivery Assurance Regional IV",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-05T10:30:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T09:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T14:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T10:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "PT Telkom Akses", date: "2026-06-11T16:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T09:30:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-12T15:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-13T10:00:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "PT Telkom Akses", date: "2026-06-13T14:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Pending", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-14T09:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-05T08:30:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek link FO Bank Jateng." },
      { timestamp: "2026-06-05T10:30:00Z", user: "Siti Aminah", role: "Account Manager", action: "Submit Document", notes: "Unggah P1 Justkeb ditandatangani." },
      { timestamp: "2026-06-08T09:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P2-P4", notes: "Verifikasi administrasi calon mitra selesai." },
      { timestamp: "2026-06-12T15:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Submit P6", notes: "Negosiasi harga disepakati dengan mitra." },
      { timestamp: "2026-06-14T09:00:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Receive for Assessment", notes: "Memulai review kelayakan proyek untuk menentukan gerbang kendali GO/NO GO." }
    ]
  },
  {
    id: "PRJ-2026-003",
    name: "Migrasi Sistem Cloud & EHR Rumah Sakit",
    client: "RSUD DR. Kariadi Semarang",
    am: "Budi Santoso",
    value: 5200000000,
    startDate: "2026-05-20T08:00:00Z",
    currentPhase: "F2",
    currentStep: "P6", // Klarifikasi & Nego
    lastUpdated: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 jam yang lalu (Warning / Kuning)
    slaLimitHours: 48,
    custodian: {
      name: "Budi Santoso",
      role: "Account Manager",
      dept: "Account Management R-LEGS",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-05-20T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-25T11:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-28T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-02T14:30:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "PT Sigma Cipta Caraka", date: "2026-06-05T11:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T10:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-05-20T08:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Pendaftaran proyek integrasi EHR Cloud RSUD Kariadi." },
      { timestamp: "2026-05-20T10:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Submit P1", notes: "Unggah draf P1 Justkeb." },
      { timestamp: "2026-05-25T11:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P2", notes: "Evaluasi calon pelaksana mitra disetujui." },
      { timestamp: "2026-06-05T11:00:00Z", user: "PT Sigma Cipta Caraka", role: "Mitra Eksternal", action: "Submit SPH", notes: "Dokumen penawaran harga diterima." },
      { timestamp: "2026-06-10T10:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P5", notes: "Evaluasi kewajaran harga disepakati, silakan AM melakukan klarifikasi teknis & nego." },
      { timestamp: "2026-06-13T09:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Start Negotiation", notes: "Memulai proses klarifikasi komersial dan teknis dengan perwakilan Telkom Sigma." }
    ]
  },
  {
    id: "PRJ-2026-004",
    name: "Sistem Manajemen Keamanan Siber Terintegrasi",
    client: "Dinas Komunikasi & Informatika Prov Jateng",
    am: "Rian Wijaya",
    value: 1200000000,
    startDate: "2026-06-08T10:00:00Z",
    currentPhase: "F5",
    currentStep: "BASO", // Berita Acara Siap Operasi (Selesai / Win)
    lastUpdated: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 menit yang lalu (On Track / Hijau)
    slaLimitHours: 48,
    custodian: {
      name: "Rian Wijaya",
      role: "Account Manager",
      dept: "Account Management R-LEGS",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Rian Wijaya (AM)", date: "2026-06-08T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T14:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Cyber Security", date: "2026-06-10T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Rian Wijaya (AM)", date: "2026-06-11T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-11T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Cyber Security", date: "2026-06-11T16:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-12T09:30:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T13:00:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Approved", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-13T11:00:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Approved", updatedBy: "Rian Wijaya (AM)", date: "2026-06-14T10:00:00Z" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Approved", updatedBy: "Rian Wijaya (AM)", date: "2026-06-14T16:00:00Z" }
    ],
    history: [
      { timestamp: "2026-06-08T10:00:00Z", user: "Rian Wijaya", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek Cyber Security Diskominfo." },
      { timestamp: "2026-06-12T09:30:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Approve PA", notes: "Project assessment GO." },
      { timestamp: "2026-06-13T11:00:00Z", user: "Indra Hermawan, S.H.", role: "Legal Officer", action: "Approve KL", notes: "Kontrak Layanan ditandatangani secara digital oleh legal." },
      { timestamp: "2026-06-14T10:00:00Z", user: "Rian Wijaya", role: "Account Manager", action: "Submit BAST", notes: "Serah terima barang selesai." },
      { timestamp: "2026-06-14T16:00:00Z", user: "Rian Wijaya", role: "Account Manager", action: "Submit BASO", notes: "Instalasi siap dioperasikan penuh. Proyek berstatus selesai (WIN)." }
    ]
  },
  {
    id: "PRJ-2026-005",
    name: "Digitalisasi Pembayaran Pasar Tradisional (QRIS & EDC)",
    client: "Pemerintah Kota Surakarta",
    am: "Siti Aminah",
    value: 1500000000,
    startDate: "2026-06-10T08:00:00Z",
    currentPhase: "F2",
    currentStep: "P6", // Klarifikasi & Nego
    lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 jam yang lalu (On Track / Hijau)
    slaLimitHours: 48,
    custodian: {
      name: "Siti Aminah",
      role: "Account Manager",
      dept: "Account Management B2B R-LEGS",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-10T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T14:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-11T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-11T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Pasar Solo", date: "2026-06-12T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-10T08:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek digitalisasi QRIS pasar Gede Solo." },
      { timestamp: "2026-06-12T15:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P5", notes: "Hasil evaluasi harga disepakati dan lolos kriteria. Menunggu AM unggah berita acara klarifikasi P6." }
    ]
  },
  {
    id: "PRJ-2026-006",
    name: "Penyediaan Bandwidth Internet Dedicated & Wi-Fi MS",
    client: "Universitas Diponegoro (UNDIP) Semarang",
    am: "Budi Santoso",
    value: 4800000000,
    startDate: "2026-06-02T10:00:00Z",
    currentPhase: "F2",
    currentStep: "P2", // Evaluasi Bakal Calon Mitra
    lastUpdated: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 jam yang lalu (Overdue / Merah)
    slaLimitHours: 48,
    custodian: {
      name: "Ahmad Yani",
      role: "Business Unit Delivery (BUD) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-02T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Pending", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-03T10:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-02T10:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek penambahan kapasitas bandwidth UNDIP." },
      { timestamp: "2026-06-02T11:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Submit P1", notes: "Unggah P1 Justkeb disetujui." },
      { timestamp: "2026-06-03T10:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Receive P2", notes: "Menerima berkas P2 untuk mulai dievaluasi." }
    ]
  },
  {
    id: "PRJ-2026-007",
    name: "Modernisasi Jaringan FO & SD-WAN Office Connection",
    client: "PT Semen Gresik (Persero) Tbk",
    am: "Budi Santoso",
    value: 7500000000,
    startDate: "2026-05-15T09:00:00Z",
    currentPhase: "F3",
    currentStep: "PA", // Project Assessment
    lastUpdated: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 jam yang lalu (Warning / Kuning)
    slaLimitHours: 48,
    custodian: {
      name: "Arief Rahman",
      role: "Service Delivery Assurance (SDA) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-05-15T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-20T10:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-22T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-25T14:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Solusi FO", date: "2026-05-28T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-01T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-05T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T10:00:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Solusi FO", date: "2026-06-10T11:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Pending", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-12T09:30:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-05-15T09:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek modernisasi FO Semen Gresik." },
      { timestamp: "2026-06-10T11:00:00Z", user: "Mitra Solusi FO", role: "Mitra Eksternal", action: "Submit SKM", notes: "Surat kesanggupan bermitra disubmit oleh pihak vendor." },
      { timestamp: "2026-06-12T09:30:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Receive PA", notes: "Review kelayakan investasi oleh SDA untuk merilis izin GO/NO GO." }
    ]
  },
  {
    id: "PRJ-2026-008",
    name: "Pengembangan Command Center & CCTV Analytics Lalu Lintas",
    client: "Pemerintah Kabupaten Sleman",
    am: "Siti Aminah",
    value: 2900000000,
    startDate: "2026-06-04T09:00:00Z",
    currentPhase: "F5",
    currentStep: "KL", // Kontrak Layanan
    lastUpdated: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50 jam yang lalu (Overdue / Merah)
    slaLimitHours: 48,
    custodian: {
      name: "Riana Indah, S.H.",
      role: "Legal Officer",
      dept: "Legal & Compliance Regional IV",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-04T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-04T14:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Smart Sleman", date: "2026-06-08T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-09T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Smart Sleman", date: "2026-06-10T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-11T11:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T13:00:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Pending", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-12T14:00:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-04T09:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek command center Sleman." },
      { timestamp: "2026-06-12T13:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve SPPBJ", notes: "Penerbitan surat penunjukan pelaksana." },
      { timestamp: "2026-06-12T14:00:00Z", user: "Indra Hermawan, S.H.", role: "Legal Officer", action: "Receive KL", notes: "Berkas masuk antrean Legal untuk penyusunan kontrak resmi." }
    ]
  },
  {
    id: "PRJ-2026-009",
    name: "Penyediaan Managed IT Service & Cloud Server",
    client: "PT KAI Daop IV Semarang",
    am: "Budi Santoso",
    value: 2400000000,
    startDate: "2026-06-08T09:00:00Z",
    currentPhase: "F2",
    currentStep: "P6",
    lastUpdated: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Yuni Kartika",
      role: "Account Manager",
      dept: "Account Management B2B R-LEGS",
      avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-08T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T09:30:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T14:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T10:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra KAI Tech", date: "2026-06-12T11:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T16:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-08T09:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek cloud server KAI." },
      { timestamp: "2026-06-12T16:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P5", notes: "Evaluasi harga selesai, menunggu AM melakukan negosiasi." }
    ]
  },
  {
    id: "PRJ-2026-010",
    name: "Implementasi IoT Smart Water Metering",
    client: "PDAM Tirta Moedal Semarang",
    am: "Siti Aminah",
    value: 3800000000,
    startDate: "2026-05-18T08:00:00Z",
    currentPhase: "F5",
    currentStep: "KL",
    lastUpdated: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Indra Hermawan, S.H.",
      role: "Legal Officer",
      dept: "Legal & Compliance Regional IV",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-05-18T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-22T09:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-22T14:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-26T10:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Smart Meter", date: "2026-06-01T11:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-03T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-05T10:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-06T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Smart Meter", date: "2026-06-08T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-09T11:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T14:00:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Pending", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-11T09:00:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-05-18T08:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek smart water PDAM." },
      { timestamp: "2026-06-11T09:00:00Z", user: "Indra Hermawan, S.H.", role: "Legal Officer", action: "Receive KL", notes: "Draft KL masuk antrean review legal." }
    ]
  },
  {
    id: "PRJ-2026-011",
    name: "Pengadaan Router Backbone & Switch Enterprise",
    client: "Dinas Pendidikan & Kebudayaan Jateng",
    am: "Budi Santoso",
    value: 1150000000,
    startDate: "2026-06-12T10:00:00Z",
    currentPhase: "F2",
    currentStep: "P2",
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Dewi Lestari",
      role: "Business Unit Delivery (BUD) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-12T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Pending", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T14:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-12T10:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek perangkat jaringan Disdikbud." },
      { timestamp: "2026-06-12T14:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Receive P2", notes: "Dokumen calon mitra masuk untuk ditinjau kelayakannya." }
    ]
  },
  {
    id: "PRJ-2026-012",
    name: "Layanan Cyber Security Operations Center (CSOC) Managed",
    client: "PT Bank Jateng Cabang Utama",
    am: "Siti Aminah",
    value: 6700000000,
    startDate: "2026-05-28T09:00:00Z",
    currentPhase: "F3",
    currentStep: "PA",
    lastUpdated: new Date(Date.now() - 42 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Rian Wijaya",
      role: "Service Delivery Assurance (SDA) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-05-28T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-30T11:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-01T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-03T14:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Cyber Security", date: "2026-06-06T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-09T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Cyber Security", date: "2026-06-10T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Pending", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-11T13:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-05-28T09:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek security bank jateng." },
      { timestamp: "2026-06-11T13:00:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Receive PA", notes: "Review dokumen teknis untuk assessment kelayakan GO." }
    ]
  },
  {
    id: "PRJ-2026-013",
    name: "Pengadaan Access Point & Wi-Fi Kampus Terpadu",
    client: "Universitas Negeri Semarang (UNNES)",
    am: "Budi Santoso",
    value: 1950000000,
    startDate: "2026-06-05T08:00:00Z",
    currentPhase: "F5",
    currentStep: "KL",
    lastUpdated: new Date(Date.now() - 35 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Riana Indah, S.H.",
      role: "Legal Officer",
      dept: "Legal & Compliance Regional IV",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-05T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T15:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-06T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-06T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Wi-Fi Kampus", date: "2026-06-08T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-09T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Wi-Fi Kampus", date: "2026-06-10T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-11T11:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T13:00:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Pending", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-12T15:30:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-05T08:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek infrastruktur Wi-Fi UNNES." },
      { timestamp: "2026-06-12T15:30:00Z", user: "Indra Hermawan, S.H.", role: "Legal Officer", action: "Receive KL", notes: "Berkas Kontrak Layanan mulai diproses." }
    ]
  },
  {
    id: "PRJ-2026-014",
    name: "Migrasi Core Network & Software-Defined Network",
    client: "PT Pelabuhan Indonesia III Tanjung Emas",
    am: "Siti Aminah",
    value: 8200000000,
    startDate: "2026-06-11T09:00:00Z",
    currentPhase: "F2",
    currentStep: "P2",
    lastUpdated: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Ahmad Yani",
      role: "Business Unit Delivery (BUD) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-11T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Pending", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T09:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-11T09:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek modernisasi core network Pelindo Tanjung Emas." },
      { timestamp: "2026-06-12T09:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Receive P2", notes: "Penerimaan berkas P2." }
    ]
  },
  {
    id: "PRJ-2026-015",
    name: "Layanan Managed Cloud & Disaster Recovery Center",
    client: "PT Jamkrida Jateng",
    am: "Budi Santoso",
    value: 1450000000,
    startDate: "2026-06-10T10:00:00Z",
    currentPhase: "F2",
    currentStep: "P6",
    lastUpdated: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Budi Santoso",
      role: "Account Manager",
      dept: "Account Management B2B R-LEGS",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-10T11:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T15:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-11T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-11T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Data Safe", date: "2026-06-12T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-12T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-10T10:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek DRC Jamkrida Jateng." },
      { timestamp: "2026-06-12T15:00:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Approve P5", notes: "P5 disetujui, siap untuk dinegosiasikan." }
    ]
  },
  {
    id: "PRJ-2026-016",
    name: "Sistem Smart Parking & Digital Revenue Tracking",
    client: "Pemerintah Kota Pekalongan",
    am: "Siti Aminah",
    value: 2100000000,
    startDate: "2026-05-12T08:30:00Z",
    currentPhase: "F5",
    currentStep: "BASO",
    lastUpdated: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Yuni Kartika",
      role: "Account Manager",
      dept: "Account Management B2B R-LEGS",
      avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-05-12T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-14T09:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-14T14:30:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-18T10:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Smart Park Pekalongan", date: "2026-05-22T11:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-25T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-05-28T10:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-05-28T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Smart Park Pekalongan", date: "2026-05-30T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Approved", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-02T11:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-04T13:00:00Z" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Approved", updatedBy: "Indra Hermawan (Legal)", date: "2026-06-08T10:00:00Z" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-09T14:00:00Z" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-10T11:00:00Z" }
    ],
    history: [
      { timestamp: "2026-05-12T08:30:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek smart parking Pekalongan." },
      { timestamp: "2026-06-10T11:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Submit BASO", notes: "Operasional live, proyek rampung." }
    ]
  },
  {
    id: "PRJ-2026-017",
    name: "Penyediaan Bandwidth Wholesale & Transit Internet",
    client: "PT Java Internet Provider",
    am: "Budi Santoso",
    value: 9500000000,
    startDate: "2026-06-03T09:00:00Z",
    currentPhase: "F3",
    currentStep: "PA",
    lastUpdated: new Date(Date.now() - 55 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Arief Rahman",
      role: "Service Delivery Assurance (SDA) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-03T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-04T11:00:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T09:00:00Z" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-05T13:00:00Z" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Approved", updatedBy: "Mitra Java Transit", date: "2026-06-08T10:00:00Z" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-09T15:00:00Z" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Approved", updatedBy: "Budi Santoso (AM)", date: "2026-06-10T11:00:00Z" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Approved", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-10T14:30:00Z" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Approved", updatedBy: "Mitra Java Transit", date: "2026-06-11T10:00:00Z" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Pending", updatedBy: "Rian Wijaya (SDA)", date: "2026-06-11T15:00:00Z" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-03T09:00:00Z", user: "Budi Santoso", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek transit internet Java Provider." },
      { timestamp: "2026-06-11T15:00:00Z", user: "Rian Wijaya", role: "SDA Officer", action: "Receive PA", notes: "Memulai review kelayakan teknis dan mitigasi risiko bandwidth." }
    ]
  },
  {
    id: "PRJ-2026-018",
    name: "Penyediaan CCTV Surveillance Area Publik & AI Analytics",
    client: "Dinas Perhubungan Kota Tegal",
    am: "Siti Aminah",
    value: 3400000000,
    startDate: "2026-06-07T08:00:00Z",
    currentPhase: "F2",
    currentStep: "P2",
    lastUpdated: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    slaLimitHours: 48,
    custodian: {
      name: "Dewi Lestari",
      role: "Business Unit Delivery (BUD) Officer",
      dept: "SDA & BUD Division Regional IV",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80"
    },
    documents: [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Approved", updatedBy: "Siti Aminah (AM)", date: "2026-06-07T10:00:00Z" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Pending", updatedBy: "Ahmad Yani (BUD)", date: "2026-06-08T09:30:00Z" },
      { code: "P3", name: "Permintaan Harga (P3)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P4", name: "Rapat Penjelasan (P4)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPH", name: "Surat Penawaran Harga (SPH)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P5", name: "Evaluasi Harga (P5)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P6", name: "Klarifikasi & Nego (P6)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P7", name: "Surat Penetapan Calon Mitra (P7)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SKM", name: "Surat Kesanggupan Mitra (SKM)", status: "Empty", updatedBy: "-", date: "" },
      { code: "PA", name: "Project Assessment (GO/NO GO)", status: "Empty", updatedBy: "-", date: "" },
      { code: "SPPBJ", name: "SPPBJ / SP3MK", status: "Empty", updatedBy: "-", date: "" },
      { code: "KL", name: "Kontrak Layanan (KL)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BAST", name: "Berita Acara Serah Terima (BAST)", status: "Empty", updatedBy: "-", date: "" },
      { code: "BASO", name: "Berita Acara Siap Operasi (BASO)", status: "Empty", updatedBy: "-", date: "" }
    ],
    history: [
      { timestamp: "2026-06-07T08:00:00Z", user: "Siti Aminah", role: "Account Manager", action: "Create Project", notes: "Inisiasi proyek CCTV Dishub Kota Tegal." },
      { timestamp: "2026-06-08T09:30:00Z", user: "Ahmad Yani", role: "BUD Officer", action: "Receive P2", notes: "Berkas mitra masuk antrean evaluasi administrasi." }
    ]
  }
];

export const STAGE_FLOW = [
  { phase: "F0", name: "Lead", desc: "Pendataan Awal Peluang Bisnis", steps: [] },
  { phase: "F1", name: "Opportunity", desc: "Penyaringan & Kualifikasi Proyek", steps: [] },
  {
    phase: "F2", 
    name: "Self Assessment & Solman", 
    desc: "Penyusunan Rencana Kebutuhan & Integrasi DigiReview",
    steps: ["P1", "P2", "P3", "P4", "SPH", "P5", "P6", "P7", "SKM"]
  },
  { 
    phase: "F3", 
    name: "Project Assessment", 
    desc: "Penilaian Kelayakan Teknis & Finansial oleh SDA (GO/NO GO)",
    steps: ["PA"]
  },
  { 
    phase: "F4", 
    name: "Negosiasi", 
    desc: "Kesepakatan Komersial & Lingkup Kerja (SOW)",
    steps: ["SPPBJ"]
  },
  { 
    phase: "F5", 
    name: "Win & Eksekusi", 
    desc: "Penandatanganan Kontrak Legal & Serah Terima Proyek",
    steps: ["KL", "BAST", "BASO"]
  }
];

export const USERS_ROLE = {
  AM: {
    username: "AM-Budi",
    name: "Budi Santoso",
    role: "Account Manager",
    dept: "Account Management B2B R-LEGS",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80"
  },
  AM_SITI: {
    username: "AM-Siti",
    name: "Siti Aminah",
    role: "Account Manager",
    dept: "Account Management B2B R-LEGS",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
  },
  AM_YUNI: {
    username: "AM-Yuni",
    name: "Yuni Kartika",
    role: "Account Manager",
    dept: "Account Management B2B R-LEGS",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&h=150&q=80"
  },
  BUD: {
    username: "BUD-Ahmad",
    name: "Ahmad Yani",
    role: "Business Unit Delivery (BUD) Officer",
    dept: "SDA & BUD Division Regional IV",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80"
  },
  BUD_DEWI: {
    username: "BUD-Dewi",
    name: "Dewi Lestari",
    role: "Business Unit Delivery (BUD) Officer",
    dept: "SDA & BUD Division Regional IV",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80"
  },
  SDA: {
    username: "SDA-Rian",
    name: "Rian Wijaya",
    role: "Service Delivery Assurance (SDA) Officer",
    dept: "SDA & BUD Division Regional IV",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80"
  },
  SDA_ARIEF: {
    username: "SDA-Arief",
    name: "Arief Rahman",
    role: "Service Delivery Assurance (SDA) Officer",
    dept: "SDA & BUD Division Regional IV",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80"
  },
  LEGAL: {
    username: "LEGAL-Indra",
    name: "Indra Hermawan, S.H.",
    role: "Legal Officer",
    dept: "Legal & Compliance Regional IV",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
  },
  LEGAL_RIANA: {
    username: "LEGAL-Riana",
    name: "Riana Indah, S.H.",
    role: "Legal Officer",
    dept: "Legal & Compliance Regional IV",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80"
  },
  MANAGER: {
    username: "MGR-Heru",
    name: "Heru Wibowo, M.B.A.",
    role: "Regional Head of R-LEGS",
    dept: "Executive Board Regional IV Telkom",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80"
  }
};
