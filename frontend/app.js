// Logika Utama - R-LEGS Enterprise Document Tracking Dashboard (R-EDT)

document.addEventListener("DOMContentLoaded", () => {
  // 1. Inisialisasi Data
  initDatabase();
  
  // 2. Event Listeners
  setupNavigation();
  setupRoleSwitcher();
  setupFilters();
  setupMetricCards();
  setupProjectForm();
  setupNotificationCenter();
  
  // 3. Jalankan Perutean Awal (Hash-Based Routing)
  handleRouting();
  
  // 4. Jalankan Interval untuk Memperbarui SLA / Waktu Secara Real-Time
  setInterval(updateAllSLATimers, 10000); // Perbarui setiap 10 detik
});

// --- STATE MANAJEMEN ---
let projects = [];
let activeProjectId = null;
let activeSubStepCode = null;
let activeProjectFilterMode = "all"; // 'all' atau 'my-tasks'

function initDatabase() {
  // Load data proyek dengan pemeriksaan versi database untuk mereset data lama jika ada pembaruan draf Empty
  const dbVersion = "v6_spaced_active_tasks_more_custodians";
  const storedVersion = localStorage.getItem("r_legs_db_version");
  const storedProjects = localStorage.getItem("r_legs_projects");
  
  if (!storedProjects || storedVersion !== dbVersion) {
    localStorage.setItem("r_legs_projects", JSON.stringify(INITIAL_PROJECTS));
    localStorage.setItem("r_legs_db_version", dbVersion);
    projects = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
  } else {
    projects = JSON.parse(storedProjects);
  }

  // Load peran pengguna aktif
  const storedUser = localStorage.getItem("r_legs_current_user_role");
  if (!storedUser) {
    localStorage.setItem("r_legs_current_user_role", "AM"); // default Account Manager
    setCurrentUser("AM");
  } else {
    setCurrentUser(storedUser);
  }
}

function saveDatabase() {
  localStorage.setItem("r_legs_projects", JSON.stringify(projects));
  updateMyProjectsCount();
}

function getCustodianEmail(name) {
  if (!name) return "support@telkom.co.id";
  const cleanName = name.toLowerCase()
    .replace(/, s\.h\./g, "")
    .replace(/, m\.b\.a\./g, "")
    .replace(/\./g, "")
    .trim()
    .replace(/\s+/g, ".");
  return `${cleanName}@telkom.co.id`;
}

function getProjectTeamMember(projectId, rolePrefix) {
  const parts = projectId.split("-");
  const idNum = parts.length > 2 ? parseInt(parts[2]) : 1;
  
  if (rolePrefix === "AM") {
    const p = projects.find(proj => proj.id === projectId);
    if (p && p.am) {
      const amUser = Object.values(USERS_ROLE).find(u => u.name === p.am);
      if (amUser) return amUser;
    }
    if (idNum % 3 === 0) return USERS_ROLE.AM_YUNI;
    if (idNum % 3 === 2) return USERS_ROLE.AM_SITI;
    return USERS_ROLE.AM;
  }
  
  if (rolePrefix === "BUD") {
    return idNum % 2 === 1 ? USERS_ROLE.BUD : USERS_ROLE.BUD_DEWI;
  }
  
  if (rolePrefix === "SDA") {
    return idNum % 2 === 1 ? USERS_ROLE.SDA : USERS_ROLE.SDA_ARIEF;
  }
  
  if (rolePrefix === "LEGAL") {
    return idNum % 2 === 1 ? USERS_ROLE.LEGAL : USERS_ROLE.LEGAL_RIANA;
  }
  
  return USERS_ROLE.MANAGER;
}

function getCurrentUserRole() {
  return localStorage.getItem("r_legs_current_user_role") || "AM";
}

function getCurrentUserData() {
  const role = getCurrentUserRole();
  return USERS_ROLE[role];
}

function isFutureStep(p, stepCode) {
  if (p.currentStep === "P9") return true; // Everything is locked if cancelled
  const order = ["P1", "P2", "P3", "P4", "SPH", "P5", "P6", "P7", "SKM", "PA", "SPPBJ", "KL", "BAST", "BASO"];
  const currIndex = order.indexOf(p.currentStep);
  const stepIndex = order.indexOf(stepCode);
  if (currIndex === -1) return false;
  return stepIndex > currIndex;
}

function setCurrentUser(role) {
  localStorage.setItem("r_legs_current_user_role", role);
  const user = USERS_ROLE[role];
  
  // Perbarui UI Profil di bilah sisi
  document.getElementById("user-profile-avatar").src = user.avatar;
  document.getElementById("user-profile-name").textContent = user.name;
  document.getElementById("user-profile-role").textContent = user.role;
  document.getElementById("role-selector-select").value = role;
  
  // Reset filter "Tugas Saya" saat ganti user agar tidak membingungkan
  resetProjectFilterMode();

  // Ubah ketersediaan aksi berdasarkan peran
  adjustActionPermissions();
  
  // Hitung ulang badge & center notifikasi
  updateMyProjectsCount();
  
  // Render ulang tabel & dasbor jika sedang dibuka
  renderDashboard();
  renderProjectsTable();
  if (activeProjectId) {
    renderProjectDetails(activeProjectId);
  }

  // Tampilkan Toast Pemicu Kesadaran (Simulated Push Notification)
  setTimeout(() => {
    const myTasksCount = projects.filter(p => {
      const basoDoc = p.documents.find(d => d.code === "BASO");
      const isCompleted = basoDoc && basoDoc.status === "Approved";
      if (isCompleted) return false;
      
      const activeDoc = p.documents.find(d => d.code === p.currentStep);
      if (!activeDoc || activeDoc.status === "Approved") return false;
      
      return p.custodian && p.custodian.name === user.name;
    }).length;
    
    if (myTasksCount > 0 && !role.startsWith("MANAGER")) {
      showToast(`🔔 Pengingat: Anda memiliki ${myTasksCount} tugas aktif yang tertunda!`);
    } else if (role.startsWith("MANAGER")) {
      const overdueCount = projects.filter(p => {
        const basoDoc = p.documents.find(d => d.code === "BASO");
        const isCompleted = basoDoc && basoDoc.status === "Approved";
        if (isCompleted) return false;
        
        const lastUpd = new Date(p.lastUpdated);
        const elapsedHrs = (new Date() - lastUpd) / (1000 * 60 * 60);
        return elapsedHrs > p.slaLimitHours;
      }).length;
      if (overdueCount > 0) {
        showToast(`⚠️ Perhatian Manager: ${overdueCount} proyek mengalami Overdue SLA!`);
      }
    }
  }, 300);
}

function adjustActionPermissions() {
  const role = getCurrentUserRole();
  const createButtons = document.querySelectorAll(".btn-create-project");
  
  // Hanya AM yang bisa membuat proyek baru
  createButtons.forEach(btn => {
    if (role.startsWith("AM")) {
      btn.style.display = "inline-flex";
    } else {
      btn.style.display = "none";
    }
  });
}

// --- SISTEM PERUTEAN HASH (HASH-BASED ROUTING) ---
function setupNavigation() {
  // Hubungkan event hashchange bawaan browser
  window.addEventListener("hashchange", handleRouting);
  
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetScreen = item.getAttribute("data-screen");
      if (targetScreen) {
        window.location.hash = `#${targetScreen}`;
      }
    });
  });
}

function handleRouting() {
  const hash = window.location.hash || "#dashboard";
  
  if (hash === "#dashboard") {
    switchScreen("dashboard");
    updateSidebarActiveState("dashboard");
  } else if (hash === "#projects") {
    switchScreen("projects");
    updateSidebarActiveState("projects");
  } else if (hash.startsWith("#details/")) {
    const projId = hash.replace("#details/", "");
    activeProjectId = projId;
    switchScreen("details");
    updateSidebarActiveState("projects"); // Detail proyek tetap mengaktifkan menu B2B Proyek di sidebar
    renderProjectDetails(projId);
  } else {
    window.location.hash = "#dashboard";
  }
}

function updateSidebarActiveState(screenId) {
  const navItems = document.querySelectorAll(".sidebar .nav-item");
  navItems.forEach(item => {
    item.classList.remove("active");
    if (item.getAttribute("data-screen") === screenId) {
      item.classList.add("active");
    }
  });
}

function switchScreen(screenId) {
  const screens = document.querySelectorAll(".screen");
  screens.forEach(screen => {
    screen.classList.remove("active");
    if (screen.id === `${screenId}-screen`) {
      screen.classList.add("active");
    }
  });

  // Perbarui Judul Header secara dinamis
  const titleEl = document.getElementById("header-page-title");
  if (titleEl) {
    if (screenId === "dashboard") titleEl.textContent = "Dasbor Pemantauan";
    else if (screenId === "projects") titleEl.textContent = "Daftar Proyek B2B";
    else if (screenId === "details") titleEl.textContent = "Detail Pelacakan Dokumen";
  }

  // Jalankan render spesifik layar
  if (screenId === "dashboard") {
    renderDashboard();
    activeProjectId = null;
  } else if (screenId === "projects") {
    renderProjectsTable();
    activeProjectId = null;
  }
}

// --- SENSOR PERAN (ROLE SWITCHER) ---
function setupRoleSwitcher() {
  const select = document.getElementById("role-selector-select");
  select.addEventListener("change", (e) => {
    setCurrentUser(e.target.value);
  });
}

// --- LOGIKA UTAMA DASHBOARD ---
function renderDashboard() {
  // Hitung metrik
  let total = projects.length;
  let activeCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let warningCount = 0;
  
  const now = new Date();
  
  projects.forEach(p => {
    // Proyek dianggap selesai jika berada di F5 dan dokumen BASO disetujui (Approved)
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    
    if (isCompleted) {
      completedCount++;
    } else {
      activeCount++;
      // Hitung SLA jika aktif
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
      
      if (elapsedHrs > p.slaLimitHours) {
        overdueCount++;
      } else if (elapsedHrs >= 24) {
        warningCount++;
      }
    }
  });

  // Tulis metrik ke UI
  document.getElementById("metric-total").textContent = total;
  document.getElementById("metric-active").textContent = activeCount;
  document.getElementById("metric-completed").textContent = completedCount;
  document.getElementById("metric-overdue").textContent = overdueCount;
  
  // Render daftar peringatan kritis
  renderCriticalAlerts();
  
  // Render grafik performa
  renderPerformanceChart();
  
  // Render reminder tugas aktif
  renderActiveTasksReminder();
}

function renderCriticalAlerts() {
  const alertList = document.getElementById("critical-alerts-list");
  alertList.innerHTML = "";
  
  const now = new Date();
  const warningProjects = [];
  
  projects.forEach(p => {
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    
    if (!isCompleted) {
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
      
      if (elapsedHrs >= 24) {
        warningProjects.push({
          project: p,
          hours: Math.floor(elapsedHrs),
          isRed: elapsedHrs > p.slaLimitHours
        });
      }
    }
  });

  // Urutkan berdasarkan keterlambatan terlama
  warningProjects.sort((a, b) => b.hours - a.hours);
  
  if (warningProjects.length === 0) {
    alertList.innerHTML = `
      <div class="text-center text-muted" style="padding: 40px 0;">
        <svg class="doc-icon-svg" viewBox="0 0 24 24" style="margin: 0 auto 12px; display: block; opacity: 0.4;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <span>Semua proses dokumen berjalan tepat waktu (SLA Hijau).</span>
      </div>
    `;
    return;
  }
  
  warningProjects.forEach(item => {
    const p = item.project;
    const alertItem = document.createElement("div");
    alertItem.className = "alert-item";
    alertItem.style.cursor = "pointer";
    alertItem.addEventListener("click", () => {
      window.location.hash = "#details/" + p.id;
    });
    
    const badgeColorClass = item.isRed ? "red" : "yellow";
    const timeColorClass = item.isRed ? "" : "yellow-text";
    const statusLabel = item.isRed ? "Lapor! Overdue" : "Warning SLA";
    
    const email = getCustodianEmail(p.custodian.name);
    const activeDoc = p.documents.find(d => d.code === p.currentStep) || { name: p.currentStep };
    const nudgeMsg = `Halo ${p.custodian.name}, mohon tindak lanjut untuk berkas "${activeDoc.name}" pada proyek "${p.name}" (${p.client}) yang saat ini sedang tertahan. Terima kasih!`;
    const teamsLink = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMsg)}`;

    alertItem.innerHTML = `
      <div class="alert-left">
        <span class="alert-badge ${badgeColorClass}"></span>
        <div class="alert-info">
          <span class="alert-project-name">${p.name}</span>
          <span class="alert-desc">
            ${p.client} &bull; Kustodian: ${p.custodian.name} 
            <a href="${teamsLink}" target="_blank" class="teams-nudge-link" title="Nudge via Teams" onclick="event.stopPropagation()" style="display: inline-flex; align-items: center; vertical-align: middle; margin-left: 4px;">
              <svg style="width: 12px; height: 12px; fill: #464eb8;" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </a>
          </span>
        </div>
      </div>
      <div class="alert-right">
        <span class="alert-time ${timeColorClass}">${item.hours} jam tertahan</span>
        <span class="badge-pill ${badgeColorClass}" style="font-size: 0.6rem; padding: 2px 6px;">${statusLabel}</span>
      </div>
    `;
    
    alertList.appendChild(alertItem);
  });
}

function renderPerformanceChart() {
  // Hitung performa simulasi rata-rata waktu pemrosesan dokumen (dalam jam) per divisi
  // Diambil dari data riwayat proyek untuk membuatnya terlihat realistis
  const times = { BUD: 0, SDA: 0, Solman: 0, Legal: 0 };
  const counts = { BUD: 0, SDA: 0, Solman: 0, Legal: 0 };
  
  projects.forEach(p => {
    // Skenario simulasi kalkulasi sederhana berdasarkan historis aksi
    p.history.forEach((h, index) => {
      if (index === 0) return;
      const prev = new Date(p.history[index - 1].timestamp);
      const curr = new Date(h.timestamp);
      const diffHours = (curr - prev) / (1000 * 60 * 60);
      
      let deptKey = null;
      if (h.role.includes("AM") || h.role.includes("Mitra")) {
        deptKey = "Solman"; // Solman / AM input
      } else if (h.role.includes("BUD")) {
        deptKey = "BUD";
      } else if (h.role.includes("SDA")) {
        deptKey = "SDA";
      } else if (h.role.includes("Legal")) {
        deptKey = "Legal";
      }
      
      if (deptKey) {
        times[deptKey] += diffHours;
        counts[deptKey]++;
      }
    });
  });

  // Rata-rata jam (jika counts == 0, beri default mock untuk visual)
  const avg = {
    Solman: counts.Solman ? Math.round(times.Solman / counts.Solman) : 14,
    BUD: counts.BUD ? Math.round(times.BUD / counts.BUD) : 22,
    SDA: counts.SDA ? Math.round(times.SDA / counts.SDA) : 18,
    Legal: counts.Legal ? Math.round(times.Legal / counts.Legal) : 34
  };

  // Nilai maksimum untuk skala persentase tinggi grafik
  const maxHours = Math.max(avg.Solman, avg.BUD, avg.SDA, avg.Legal, 40);
  
  // Perbarui tinggi batang grafik di UI
  updateBarHeight("bar-solman", avg.Solman, maxHours);
  updateBarHeight("bar-bud", avg.BUD, maxHours);
  updateBarHeight("bar-sda", avg.SDA, maxHours);
  updateBarHeight("bar-legal", avg.Legal, maxHours);
}

function updateBarHeight(barId, value, maxVal) {
  const el = document.getElementById(barId);
  if (el) {
    const percent = Math.min((value / maxVal) * 100, 100);
    el.style.height = `${percent}%`;
    const valEl = el.querySelector(".bar-val");
    if (valEl) valEl.textContent = `${value}j`;
  }
}

// --- LOGIKA DAFTAR PROYEK & FILTER ---
function setupFilters() {
  const searchInput = document.getElementById("search-projects");
  const filterPhase = document.getElementById("filter-phase");
  const filterSla = document.getElementById("filter-sla");
  
  const triggerFilter = () => renderProjectsTable();
  
  if (searchInput) searchInput.addEventListener("input", triggerFilter);
  if (filterPhase) filterPhase.addEventListener("change", triggerFilter);
  if (filterSla) filterSla.addEventListener("change", triggerFilter);

  // Setup tombol toggle filter Semua Proyek / Tugas Saya
  const btnAll = document.getElementById("btn-filter-all-projects");
  const btnMy = document.getElementById("btn-filter-my-projects");
  
  if (btnAll && btnMy) {
    const updateToggleUI = () => {
      if (activeProjectFilterMode === "all") {
        btnAll.style.background = "#ffffff";
        btnAll.style.color = "var(--telkom-blue)";
        btnAll.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
        btnAll.classList.add("active");
        
        btnMy.style.background = "transparent";
        btnMy.style.color = "var(--muted-text)";
        btnMy.style.boxShadow = "none";
        btnMy.classList.remove("active");
      } else {
        btnMy.style.background = "#ffffff";
        btnMy.style.color = "var(--telkom-red)";
        btnMy.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
        btnMy.classList.add("active");
        
        btnAll.style.background = "transparent";
        btnAll.style.color = "var(--muted-text)";
        btnAll.style.boxShadow = "none";
        btnAll.classList.remove("active");
      }
    };
    
    // Set UI awal
    updateToggleUI();
    
    btnAll.onclick = () => {
      activeProjectFilterMode = "all";
      updateToggleUI();
      renderProjectsTable();
    };
    
    btnMy.onclick = () => {
      activeProjectFilterMode = "my-tasks";
      updateToggleUI();
      renderProjectsTable();
    };
  }
}

function setupMetricCards() {
  const cardTotal = document.querySelector(".metric-card.total");
  const cardActive = document.querySelector(".metric-card.active-p");
  const cardCompleted = document.querySelector(".metric-card.completed");
  const cardOverdue = document.querySelector(".metric-card.overdue");
  
  const filterSla = document.getElementById("filter-sla");
  const filterPhase = document.getElementById("filter-phase");
  const searchProjects = document.getElementById("search-projects");
  
  const navigateAndFilter = (slaValue) => {
    // Reset filter yang lain agar tidak bertubrukan
    if (filterPhase) filterPhase.value = "all";
    if (searchProjects) searchProjects.value = "";
    
    // Set filter SLA yang diinginkan
    if (filterSla) {
      filterSla.value = slaValue;
    }
    
    // Pindah screen ke daftar proyek
    window.location.hash = "#projects";
  };

  if (cardTotal) {
    cardTotal.addEventListener("click", () => navigateAndFilter("all"));
  }
  if (cardActive) {
    cardActive.addEventListener("click", () => navigateAndFilter("active"));
  }
  if (cardCompleted) {
    cardCompleted.addEventListener("click", () => navigateAndFilter("completed"));
  }
  if (cardOverdue) {
    cardOverdue.addEventListener("click", () => navigateAndFilter("red"));
  }
}

function renderProjectsTable() {
  const tableBody = document.getElementById("projects-table-body");
  if (!tableBody) return;
  
  tableBody.innerHTML = "";
  
  const query = document.getElementById("search-projects").value.toLowerCase();
  const phaseFilter = document.getElementById("filter-phase").value;
  const slaFilter = document.getElementById("filter-sla").value;
  const now = new Date();
  const currentUser = getCurrentUserData();
  
  const filtered = projects.filter(p => {
    // Filter pencarian teks
    const matchSearch = p.name.toLowerCase().includes(query) || 
                        p.client.toLowerCase().includes(query) ||
                        p.am.toLowerCase().includes(query) ||
                        p.id.toLowerCase().includes(query);
                        
    // Filter tahapan funnel
    const matchPhase = phaseFilter === "all" || p.currentPhase === phaseFilter;
    
    // Filter status SLA
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    
    const lastUpd = new Date(p.lastUpdated);
    const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
    
    let currentSlaStatus = "green";
    if (!isCompleted) {
      if (elapsedHrs > p.slaLimitHours) currentSlaStatus = "red";
      else if (elapsedHrs >= 24) currentSlaStatus = "yellow";
    }
    
    const matchSla = slaFilter === "all" || 
                     (slaFilter === "active" && !isCompleted) ||
                     (slaFilter === "green" && currentSlaStatus === "green" && !isCompleted) ||
                     (slaFilter === "yellow" && currentSlaStatus === "yellow" && !isCompleted) ||
                     (slaFilter === "red" && currentSlaStatus === "red" && !isCompleted) ||
                     (slaFilter === "completed" && isCompleted);
                     
    // Filter Tugas Saya (khusus proyek yang tertahan di meja user aktif)
    let matchMyTasks = true;
    if (activeProjectFilterMode === "my-tasks") {
      const activeDoc = p.documents.find(d => d.code === p.currentStep);
      const isDocPending = activeDoc && activeDoc.status !== "Approved";
      matchMyTasks = !isCompleted && isDocPending && p.custodian && p.custodian.name === currentUser.name;
    }
                     
    return matchSearch && matchPhase && matchSla && matchMyTasks;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted" style="padding: 40px 0;">
          Tidak ada proyek yang sesuai dengan kriteria filter.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement("tr");
    
    // Format mata uang Rupiah
    const formattedValue = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(p.value);
    
    // Format SLA
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    
    let slaBadge = "";
    if (isCompleted) {
      slaBadge = `<span class="badge-pill green">Selesai (WIN)</span>`;
    } else {
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
      
      if (elapsedHrs > p.slaLimitHours) {
        slaBadge = `<span class="badge-pill red">Overdue (${Math.floor(elapsedHrs)}j)</span>`;
      } else if (elapsedHrs >= 24) {
        slaBadge = `<span class="badge-pill yellow">Delayed (${Math.floor(elapsedHrs)}j)</span>`;
      } else {
        slaBadge = `<span class="badge-pill green">On Track (${Math.floor(elapsedHrs)}j)</span>`;
      }
    }

    // Nama Dokumen Aktif saat ini
    const activeDoc = p.documents.find(d => d.code === p.currentStep) || { name: p.currentStep };
    
    const email = getCustodianEmail(p.custodian.name);
    const nudgeMsg = `Halo ${p.custodian.name}, mohon tindak lanjut untuk berkas "${activeDoc.name}" pada proyek "${p.name}" (${p.client}) yang saat ini sedang tertahan. Terima kasih!`;
    const teamsLink = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMsg)}`;
    
    // Tampilkan link Teams nudge hanya jika proyek belum selesai (WIN)
    const teamsNudgeHtml = isCompleted ? "" : `
      <a href="${teamsLink}" target="_blank" class="teams-nudge-link" title="Nudge via Teams" onclick="event.stopPropagation()" style="display: inline-flex; align-items: center; vertical-align: middle; margin-left: 4px;">
        <svg style="width: 12px; height: 12px; fill: #464eb8;" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
        </svg>
      </a>
    `;

    tr.innerHTML = `
      <td><span class="text-muted fw-bold">${p.id}</span></td>
      <td>
        <div class="proj-title-column">
          <span class="proj-title-text" onclick="window.location.hash = '#details/${p.id}'">${p.name}</span>
          <span class="proj-client-text">${p.client}</span>
        </div>
      </td>
      <td><span class="fw-bold">${formattedValue}</span></td>
      <td>
        <span class="badge-pill green" style="background: rgba(0, 100, 210, 0.1); border-color: rgba(0, 100, 210, 0.2); color: #60a5fa;">
          Fase ${p.currentPhase}
        </span>
      </td>
      <td>
        <div class="proj-title-column">
          <span class="fw-bold" style="font-size: 0.8rem;">${activeDoc.name}</span>
          <span class="proj-client-text">Kustodian: ${p.custodian.name} ${teamsNudgeHtml}</span>
        </div>
      </td>
      <td>${slaBadge}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="window.location.hash = '#details/${p.id}'">
          Lacak
        </button>
      </td>
    `;
    
    tableBody.appendChild(tr);
  });
}

// --- LOGIKA DETAIL PELACAKAN DOKUMEN ---
function openProjectDetails(id) {
  activeProjectId = id;
  switchScreen("details");
  
  // Set navigasi active
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(nav => {
    nav.classList.remove("active");
    if (nav.getAttribute("data-screen") === "projects") {
      nav.classList.add("active");
    }
  });
  
  renderProjectDetails(id);
}

function renderProjectDetails(id) {
  const p = projects.find(proj => proj.id === id);
  if (!p) return;
  
  // Meta Header info
  document.getElementById("detail-project-id").textContent = p.id;
  document.getElementById("detail-project-name").textContent = p.name;
  document.getElementById("detail-client-name").textContent = p.client;
  document.getElementById("detail-am-name").textContent = `AM: ${p.am}`;
  
  const formattedValue = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(p.value);
  document.getElementById("detail-project-value").textContent = formattedValue;
  
  // Kustodian info
  document.getElementById("custodian-img").src = p.custodian.avatar;
  document.getElementById("custodian-name").textContent = p.custodian.name;
  document.getElementById("custodian-role").textContent = p.custodian.role;
  document.getElementById("custodian-dept").textContent = p.custodian.dept;
  
  // Set Teams link
  const email = getCustodianEmail(p.custodian.name);
  const activeDoc = p.documents.find(d => d.code === p.currentStep) || { name: p.currentStep };
  const nudgeMessage = `Halo ${p.custodian.name}, mohon tindak lanjut untuk berkas "${activeDoc.name}" pada proyek "${p.name}" (${p.client}) yang saat ini sedang tertahan. Terima kasih!`;
  const teamsBtn = document.getElementById("btn-teams-chat");
  if (teamsBtn) {
    // Sembunyikan tombol Teams jika proyek sudah selesai (WIN)
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    
    if (isCompleted) {
      teamsBtn.style.display = "none";
    } else {
      teamsBtn.style.display = "flex";
      teamsBtn.href = `https://teams.microsoft.com/l/chat/0/0?users=${email}&message=${encodeURIComponent(nudgeMessage)}`;
    }
  }
  
  // Hitung / Tampilkan SLA
  updateSingleSLATimer(p);
  
  // Render Horizontal Timeline Nodes (F0 s.d F5)
  renderHorizontalTimeline(p);
  
  // Tampilkan Sub-tahapan Dokumen untuk Tahapan Aktif saat ini
  let selectedPhase = p.currentPhase;
  // Jika project sudah rampung (BASO Approved), arahkan visual default ke F5
  const basoDoc = p.documents.find(d => d.code === "BASO");
  if (basoDoc && basoDoc.status === "Approved") {
    selectedPhase = "F5";
  }
  
  renderSubSteps(p, selectedPhase);
  
  // Render Audit Trail Log
  renderAuditTrail(p);
}

function renderHorizontalTimeline(p) {
  const container = document.getElementById("horizontal-timeline-nodes");
  container.innerHTML = "";
  
  // Dapatkan index tahapan aktif
  const phaseOrder = ["F0", "F1", "F2", "F3", "F4", "F5"];
  const activePhaseIndex = phaseOrder.indexOf(p.currentPhase);
  
  // Atur panjang garis progress
  const progressBar = document.getElementById("timeline-progress-bar");
  const progressPercent = (activePhaseIndex / (phaseOrder.length - 1)) * 100;
  progressBar.style.width = `${progressPercent}%`;
  
  STAGE_FLOW.forEach((stage, index) => {
    const node = document.createElement("div");
    node.className = "timeline-node";
    
    // Status progres aktif nyata proyek
    if (index < activePhaseIndex) {
      node.classList.add("completed");
    } else if (index === activePhaseIndex) {
      node.classList.add("active");
    }
    
    // Status visual tab terpilih
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const defaultSelectedPhase = (basoDoc && basoDoc.status === "Approved") ? "F5" : p.currentPhase;
    if (stage.phase === defaultSelectedPhase) {
      node.classList.add("selected");
    }
    
    // Klik node untuk melihat sub-dokumen di fase bersangkutan
    node.addEventListener("click", () => {
      // Hapus selected status dari node lain (hanya memindahkan fokus sorotan visual)
      document.querySelectorAll(".timeline-node").forEach(n => n.classList.remove("selected"));
      node.classList.add("selected");
      renderSubSteps(p, stage.phase);
    });
    
    node.innerHTML = `
      <div class="node-circle">
        <span class="node-num">${index + 1}</span>
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <span class="node-name">${stage.phase}</span>
    `;
    
    container.appendChild(node);
  });
}

function renderSubSteps(p, phase) {
  const stage = STAGE_FLOW.find(s => s.phase === phase);
  const container = document.getElementById("sub-steps-list");
  const subTitle = document.getElementById("sub-timeline-title-text");
  
  subTitle.textContent = `${stage.phase} - ${stage.desc}`;
  container.innerHTML = "";
  
  if (!stage.steps || stage.steps.length === 0) {
    container.innerHTML = `
      <div class="text-muted" style="grid-column: 1 / -1; padding: 10px 0; font-size: 0.8rem;">
        Tidak ada berkas dokumen kontrak khusus yang wajib di-upload pada fase ini. Proses dikelola langsung oleh sistem eksternal MyTens / DigiReview.
      </div>
    `;
    // Kosongkan preview area
    clearDocumentPreview();
    return;
  }
  
  // Default step aktif untuk di-preview
  let defaultStepCode = null;
  
  stage.steps.forEach(stepCode => {
    const doc = p.documents.find(d => d.code === stepCode);
    if (!doc) return;
    
    const card = document.createElement("div");
    const isLocked = isFutureStep(p, stepCode);
    
    card.className = `sub-step-card ${isLocked ? 'locked' : doc.status.toLowerCase()}`;
    
    if (p.currentStep === stepCode) {
      card.classList.add("active");
      defaultStepCode = stepCode;
    }
    
    card.addEventListener("click", () => {
      document.querySelectorAll(".sub-step-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      openDocumentPreview(p, doc);
    });
    
    let statusLabelIndonesian = "";
    if (isLocked) {
      statusLabelIndonesian = `<span style="display:flex; align-items:center; gap:4px;"><svg style="width:10px; height:10px; fill:#9ca3af;" viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg> Terkunci</span>`;
    } else {
      statusLabelIndonesian = {
        Approved: "Disetujui",
        Pending: "Menunggu",
        Rejected: "Ditolak",
        Revision: "Revisi",
        Empty: "Belum Diunggah"
      }[doc.status] || doc.status;
    }
    
    card.innerHTML = `
      <div class="sub-step-left">
        <span class="sub-step-indicator"></span>
        <div class="sub-step-info">
          <span class="sub-step-code">${doc.code}</span>
          <span class="sub-step-name">${doc.name}</span>
        </div>
      </div>
      <span style="font-size: 0.65rem; font-weight:600; color: #9ca3af;">${statusLabelIndonesian}</span>
    `;
    
    container.appendChild(card);
  });
  
  // Load preview draf dokumen default
  if (defaultStepCode) {
    const doc = p.documents.find(d => d.code === defaultStepCode);
    openDocumentPreview(p, doc);
  } else if (stage.steps.length > 0) {
    // Jika tidak ada yang aktif, ambil dokumen pertama di fase ini
    const doc = p.documents.find(d => d.code === stage.steps[0]);
    openDocumentPreview(p, doc);
  }
}

function clearDocumentPreview() {
  document.getElementById("preview-doc-title").textContent = "Pilih Dokumen";
  document.getElementById("preview-doc-status").textContent = "Silakan klik sub-tahap dokumen untuk melihat detail.";
  document.getElementById("doc-preview-inner").innerHTML = `
    <div class="pdf-empty-state">
      <svg class="doc-icon-svg" viewBox="0 0 24 24">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
      </svg>
      <h5>Belum ada berkas terpilih</h5>
      <p>Silakan klik salah satu simpul sub-tahapan di samping kiri.</p>
    </div>
  `;
  document.getElementById("preview-actions-container").style.display = "none";
}

function openDocumentPreview(p, doc) {
  activeSubStepCode = doc.code;
  
  document.getElementById("preview-doc-title").textContent = doc.name;
  
  const statusLabels = {
    Approved: "Disetujui",
    Pending: "Menunggu Persetujuan",
    Rejected: "Ditolak",
    Revision: "Butuh Revisi",
    Empty: "Belum Diunggah"
  };
  
  const actionContainer = document.getElementById("preview-actions-container");
  const uploadContainer = document.getElementById("preview-upload-container");
  const role = getCurrentUserRole();
  
  if (actionContainer) actionContainer.style.display = "none";
  if (uploadContainer) uploadContainer.style.display = "none";
  
  const isCurrentStep = p.currentStep === doc.code;
  const isPending = doc.status === "Pending";
  const isRevision = doc.status === "Revision";
  
  let hasRightToApprove = false;
  const currentUser = getCurrentUserData();
  const isExactCustodian = currentUser && p.custodian && p.custodian.name === currentUser.name;
  
  if (isExactCustodian) {
    if (role.startsWith("MANAGER")) {
      hasRightToApprove = false;
    } else if (p.currentStep === "P1" || p.currentStep === "P6" || p.currentStep === "BAST" || p.currentStep === "BASO") {
      hasRightToApprove = role.startsWith("AM");
    } else if (p.currentStep === "PA") {
      hasRightToApprove = role.startsWith("SDA");
    } else if (p.currentStep === "KL") {
      hasRightToApprove = role.startsWith("LEGAL");
    } else {
      hasRightToApprove = role.startsWith("BUD");
    }

    if (doc.code === "SPH" || doc.code === "SKM") {
      hasRightToApprove = (role.startsWith("AM") || role.startsWith("BUD"));
    }
  }

  const isFuture = isFutureStep(p, doc.code);
  const activeDoc = p.documents.find(d => d.code === p.currentStep) || { name: p.currentStep };
  const innerPreview = document.getElementById("doc-preview-inner");

  if (isFuture) {
    document.getElementById("preview-doc-status").textContent = "Status: Terkunci (Belum Mulai)";
    innerPreview.innerHTML = `
      <div class="pdf-empty-state" style="background: #ffffff; padding: 60px 40px; border-radius: 8px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; border: 1px solid var(--border-color);">
        <div style="width: 80px; height: 80px; background: rgba(148, 163, 184, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(148, 163, 184, 0.2);">
          <svg viewBox="0 0 24 24" style="width: 40px; height: 40px; fill: #94a3b8;">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        <h5 style="color: var(--dark-text); font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; font-family: var(--font-heading);">Tahapan Belum Mulai (Terkunci)</h5>
        <p style="color: var(--muted-text); font-size: 0.8rem; max-width: 380px; line-height: 1.5; margin: 0 auto; text-align: center;">
          Dokumen ini masih terkunci. Anda baru dapat mengakses berkas ini setelah berkas aktif saat ini (<b>${activeDoc.name}</b>) disetujui di platform utama.
        </p>
      </div>
    `;
    return;
  }

  // Hitung alert untuk custodian aktif jika status berkas membutuhkan tindakan
  let alertHtml = "";
  if (isCurrentStep && hasRightToApprove && doc.status !== "Approved") {
    let alertMsg = "";
    let alertBg = "#fef2f2";
    let alertBorder = "#fca5a5";
    let alertColor = "#b91c1c";
    const alertIcon = `<svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; flex-shrink: 0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;
    
    if (doc.status === "Empty") {
      alertMsg = `<b>Belum Diunggah:</b> Anda belum mengunggah draf pertama berkas ini. Hubungkan berkas segera agar tracking SLA dimulai.`;
    } else if (doc.status === "Revision") {
      alertMsg = `<b>Butuh Revisi:</b> Anda belum merevisi berkas ini. Harap perbarui draf dokumen berdasarkan catatan revisi di bawah.`;
    } else if (doc.status === "Pending") {
      alertMsg = `<b>Menunggu Aksi:</b> Anda belum memverifikasi berkas ini. Harap periksa dokumen dan lakukan persetujuan atau penolakan.`;
      alertBg = "#eff6ff";
      alertBorder = "#bfdbfe";
      alertColor = "#1e40af";
    }
    
    alertHtml = `
      <div class="active-custodian-alert" style="margin: 12px 12px 0 12px; display: flex; align-items: center; gap: 8px; background: ${alertBg}; border: 1px solid ${alertBorder}; color: ${alertColor}; padding: 10px 14px; border-radius: 6px; font-size: 0.72rem; font-weight: 500; line-height: 1.4; box-shadow: 0 2px 4px rgba(0,0,0,0.02); flex-shrink: 0;">
        ${alertIcon}
        <span style="flex-grow: 1;">${alertMsg}</span>
      </div>
    `;
  }

  if (doc.status === "Empty") {
    document.getElementById("preview-doc-status").textContent = `Status: ${statusLabels.Empty}`;
    innerPreview.innerHTML = alertHtml + `
      <div class="pdf-empty-state" style="background: #ffffff; padding: 60px 40px; border-radius: 8px; flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; border: 1px dashed var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <div style="width: 80px; height: 80px; background: rgba(100, 116, 139, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px dashed rgba(100, 116, 139, 0.2);">
          <svg viewBox="0 0 24 24" style="width: 40px; height: 40px; fill: #64748b;">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        </div>
        <h5 style="color: var(--dark-text); font-weight: 700; font-size: 1.1rem; margin-bottom: 8px; font-family: var(--font-heading);">Belum Ada Berkas Draf</h5>
        <p style="color: var(--muted-text); font-size: 0.8rem; max-width: 380px; line-height: 1.5; margin: 0 auto 12px; text-align: center;">
          Draf berkas untuk tahapan <b>${doc.name}</b> belum tersedia di sistem. Silakan pilih berkas dari Teams atau komputer lokal menggunakan tombol aksi di bawah untuk menghubungkan berkas dan memulai pelacakan durasi SLA.
        </p>
        <span style="font-size: 0.7rem; color: #94a3b8; font-style: italic;">SLA akan berjalan otomatis setelah berkas berhasil ditautkan.</span>
      </div>
    `;
    
    if (uploadContainer) {
      uploadContainer.style.display = "flex";
      const btnWrapper = document.getElementById("upload-buttons-wrapper");
      const waitingMsg = document.getElementById("upload-waiting-msg");
      
      if (hasRightToApprove) {
        if (btnWrapper) btnWrapper.style.display = "flex";
        if (waitingMsg) waitingMsg.style.display = "none";
        setupUploadHandlers(p, doc);
      } else {
        if (btnWrapper) btnWrapper.style.display = "none";
        if (waitingMsg) {
          waitingMsg.style.display = "block";
          waitingMsg.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%; background: #fef3c7; border: 1px solid #fde68a; color: #b45309; padding: 12px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 500;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; flex-shrink: 0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>Menunggu pengunggahan draf berkas oleh <b>${p.custodian.name} (${p.custodian.role})</b>.</span>
            </div>
          `;
        }
      }
    }
    return;
  }

  document.getElementById("preview-doc-status").textContent = `Status: ${statusLabels[doc.status] || doc.status} ${doc.date ? `(${formatDateString(doc.date)})` : ""}`;
  
  const formattedFilename = `${p.id}_${doc.code}_${doc.name.replace(/[\s/()]/g, "_")}.pdf`.toLowerCase();
  const formattedDate = doc.date ? formatDateString(doc.date) : "-";

  const isP1Approved = p.documents.find(d => d.code === "P1")?.status === "Approved";
  const isP2Approved = p.documents.find(d => d.code === "P2")?.status === "Approved";
  const isPaApproved = p.documents.find(d => d.code === "PA")?.status === "Approved";
  const isKlApproved = p.documents.find(d => d.code === "KL")?.status === "Approved";

  const klDoc = p.documents.find(d => d.code === "KL");
  let legalComment = "-";
  if (klDoc && klDoc.status === "Revision") {
    const latestRevisionLog = p.history.find(h => h.action.includes("Revisi") || h.notes.includes("revisi") || h.action.includes("Return"));
    if (latestRevisionLog) {
      legalComment = latestRevisionLog.notes
        .replace(/Dokumen .* ditandai butuh revisi. Catatan dari platform utama: "/, "")
        .replace(/Revisi diminta untuk berkas .*. Catatan: "/, "")
        .replace(/"$/, "");
    } else {
      legalComment = "Revisi anggaran & pasal draf";
    }
  } else if (klDoc && klDoc.status === "Rejected") {
    legalComment = "Draf ditolak (NO GO / P9)";
  }

  innerPreview.innerHTML = alertHtml + `
    <div class="pdf-viewer-container" style="flex: 1; min-height: 0;">
      <div class="pdf-toolbar">
        <div class="pdf-toolbar-left">
          <svg class="pdf-file-icon" viewBox="0 0 24 24">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
          </svg>
          <span class="pdf-filename" title="${formattedFilename}">${formattedFilename}</span>
        </div>
        <div class="pdf-toolbar-center">
          <button class="pdf-zoom-btn" title="Zoom Out">-</button>
          <span class="pdf-zoom-val">100%</span>
          <button class="pdf-zoom-btn" title="Zoom In">+</button>
          <div class="pdf-page-nav">
            <span>Page 1 of 1</span>
          </div>
        </div>
        <div class="pdf-toolbar-right">
          <button class="pdf-tool-btn" title="Download PDF" onclick="alert('Simulasi: Berkas ${formattedFilename} berhasil diunduh ke komputer Anda.')">
            <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
          </button>
          <button class="pdf-tool-btn" title="Print Document" onclick="window.print()">
            <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          </button>
        </div>
      </div>
      <div class="pdf-canvas">
        <div class="pdf-page-sheet" style="padding-bottom: 30px; min-height: auto;">
          <div class="pdf-doc-letterhead">
            <div class="pdf-letterhead-left">
              <span class="pdf-logo-text">Telkom Indonesia</span>
              <span style="font-size:0.6rem; color:#cbd5e1; font-weight:300;">|</span>
              <span class="pdf-logo-sub">Regional IV R-LEGS</span>
            </div>
            <div class="pdf-letterhead-right">
              <span class="pdf-unit-text">Divisi Large Enterprise</span>
              <div class="pdf-unit-sub">Government & Business Services</div>
            </div>
          </div>
          <div class="pdf-doc-title">
            <h2>${doc.name}</h2>
            <p>Nomor Validasi Elektronik: R-EDT/2026/0${p.id.replace(/\D/g, "")}/${doc.code}</p>
          </div>
          <table class="pdf-meta-table">
            <tr>
              <td class="label-col">ID Proyek</td>
              <td class="val-col" style="font-family:'Courier New', monospace; font-weight:bold; color:#004b87;">${p.id}</td>
            </tr>
            <tr>
              <td class="label-col">Nama Kerja Sama</td>
              <td class="val-col" style="font-weight:600; color:#004b87;">${p.name}</td>
            </tr>
            <tr>
              <td class="label-col">Klien Korporat</td>
              <td class="val-col">${p.client}</td>
            </tr>
            <tr>
              <td class="label-col">Kode Berkas</td>
              <td class="val-col"><span style="font-weight:700; color:#e61c24;">${doc.code}</span> - ${doc.name}</td>
            </tr>
            <tr>
              <td class="label-col">Tanggal Verifikasi</td>
              <td class="val-col">${formattedDate}</td>
            </tr>
          </table>
          <div class="pdf-doc-content" style="margin-bottom: 16px;">
            <p class="pdf-paragraph">
              Menimbang bahwa pihak penyedia layanan solusi digital, dalam hal ini diwakili oleh <b>PT Telekomunikasi Indonesia (Persero) Tbk Regional IV</b>, menyepakati perihal pengadaan berkas administratif untuk pelanggan segmen bisnis berskala besar / instansi pemerintah terkait proyek kerja sama di atas.
            </p>
            <p class="pdf-paragraph">
              Berkas <b>${doc.name}</b> ini diterbitkan secara resmi melalui sistem pemantauan terpadu <i>R-EDT (Regional Enterprise Document Tracking)</i> dan secara otomatis terintegrasi ke dalam *DigiReview* serta portal pengadaan internal *MyTens RPA*.
            </p>
            <p class="pdf-paragraph">
              Seluruh data validitas dokumen telah diverifikasi secara elektronik oleh pihak-pihak berwenang sesuai dengan matriks delegasi wewenang yang berlaku di lingkungan kerja PT Telkom Indonesia (Persero) Tbk.
            </p>
          </div>
          <div style="border-top: 1px solid #cbd5e1; padding-top: 10px;">
            <div style="font-size: 0.6rem; font-weight: 700; color: #475569; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">
              Lembar Pemeriksaan / Paraf Koordinasi
            </div>
            <table class="pdf-meta-table" style="font-size: 0.6rem; margin-bottom: 0;">
              <tr style="background: #f8fafc; font-weight: bold; text-align: center;">
                <td style="width: 25%; padding: 4px; font-weight: 700; color: #475569;">Jabatan</td>
                <td style="width: 30%; padding: 4px; font-weight: 700; color: #475569;">Nama</td>
                <td style="width: 20%; padding: 4px; font-weight: 700; color: #475569;">Paraf</td>
                <td style="width: 25%; padding: 4px; font-weight: 700; color: #475569;">Catatan</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Account Manager</td>
                <td style="padding: 4px;">${p.am}</td>
                <td style="padding: 4px; text-align: center; font-family: 'Caveat', cursive; font-size: 1.1rem; color: #1d4ed8; font-weight: bold; line-height: 1;">${doc.status !== "Empty" ? p.am.split(" ")[0] : ""}</td>
                <td style="padding: 4px; color: #64748b;">${doc.status !== "Empty" ? "Dikerjakan" : "Belum Ada"}</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">BUD Officer</td>
                <td style="padding: 4px;">Ahmad Yani</td>
                <td style="padding: 4px; text-align: center; font-family: 'Caveat', cursive; font-size: 1.1rem; color: #1d4ed8; font-weight: bold; line-height: 1;">${isP2Approved ? "Yani" : ""}</td>
                <td style="padding: 4px; color: #64748b;">${isP2Approved ? "Lolos Verifikasi" : "Menunggu"}</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">SDA Officer</td>
                <td style="padding: 4px;">Rian Wijaya</td>
                <td style="padding: 4px; text-align: center; font-family: 'Caveat', cursive; font-size: 1.1rem; color: #1d4ed8; font-weight: bold; line-height: 1;">${isPaApproved ? "RianW" : ""}</td>
                <td style="padding: 4px; color: #64748b;">${isPaApproved ? "Lolos Verifikasi" : "Menunggu"}</td>
              </tr>
              <tr>
                <td style="padding: 4px; font-weight: bold;">Legal Officer</td>
                <td style="padding: 4px;">Indra Hermawan, S.H.</td>
                <td style="padding: 4px; text-align: center; font-family: 'Caveat', cursive; font-size: 1.1rem; color: #1d4ed8; font-weight: bold; line-height: 1;">${isKlApproved ? "IndraH" : ""}</td>
                <td style="padding: 4px; color: #64748b; font-size: 0.55rem; line-height: 1.1;">${legalComment}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  const zoomBtns = innerPreview.querySelectorAll(".pdf-zoom-btn");
  const zoomValLabel = innerPreview.querySelector(".pdf-zoom-val");
  const pdfSheet = innerPreview.querySelector(".pdf-page-sheet");
  let currentZoom = 100;

  if (zoomBtns.length >= 2 && zoomValLabel && pdfSheet) {
    const btnZoomOut = zoomBtns[0];
    const btnZoomIn = zoomBtns[1];
    btnZoomIn.addEventListener("click", () => {
      if (currentZoom < 130) {
        currentZoom += 10;
        zoomValLabel.textContent = `${currentZoom}%`;
        pdfSheet.style.transform = `scale(${currentZoom / 100})`;
        pdfSheet.style.transformOrigin = "top center";
      }
    });
    btnZoomOut.addEventListener("click", () => {
      if (currentZoom > 70) {
        currentZoom -= 10;
        zoomValLabel.textContent = `${currentZoom}%`;
        pdfSheet.style.transform = `scale(${currentZoom / 100})`;
        pdfSheet.style.transformOrigin = "top center";
      }
    });
  }

  if (isCurrentStep && isPending && hasRightToApprove) {
    if (actionContainer) {
      actionContainer.style.display = "flex";
      const btnApprove = document.getElementById("btn-doc-approve");
      const btnReturn = document.getElementById("btn-doc-return");
      const btnReject = document.getElementById("btn-doc-reject");
      const newApprove = btnApprove.cloneNode(true);
      const newReturn = btnReturn.cloneNode(true);
      const newReject = btnReject.cloneNode(true);
      btnApprove.parentNode.replaceChild(newApprove, btnApprove);
      btnReturn.parentNode.replaceChild(newReturn, btnReturn);
      btnReject.parentNode.replaceChild(newReject, btnReject);
      newApprove.addEventListener("click", () => handleDocumentAction(p.id, doc.code, "Approve"));
      newReturn.addEventListener("click", () => handleDocumentAction(p.id, doc.code, "Return"));
      newReject.addEventListener("click", () => handleDocumentAction(p.id, doc.code, "Reject"));
    }
  }

  // Wadah Pengunggahan Revisi untuk AM (jika status Revision)
  if (isCurrentStep && doc.status === "Revision") {
    if (uploadContainer) {
      uploadContainer.style.display = "flex";
      const btnWrapper = document.getElementById("upload-buttons-wrapper");
      const waitingMsg = document.getElementById("upload-waiting-msg");
      if (hasRightToApprove) {
        if (btnWrapper) btnWrapper.style.display = "flex";
        if (waitingMsg) waitingMsg.style.display = "none";
        setupUploadHandlers(p, doc);
      } else {
        if (btnWrapper) btnWrapper.style.display = "none";
        if (waitingMsg) {
          waitingMsg.style.display = "block";
          waitingMsg.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; width: 100%; background: #fef3c7; border: 1px solid #fde68a; color: #b45309; padding: 12px 16px; border-radius: 8px; font-size: 0.8rem; font-weight: 500;">
              <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: currentColor; flex-shrink: 0;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              <span>Menunggu pengunggahan revisi berkas oleh <b>${p.custodian.name} (${p.custodian.role})</b>.</span>
            </div>
          `;
        }
      }
    }
  }
}

function handleDocumentAction(projectId, docCode, action) {
  const p = projects.find(proj => proj.id === projectId);
  if (!p) return;
  
  const doc = p.documents.find(d => d.code === docCode);
  if (!doc) return;
  
  const user = getCurrentUserData();
  const nowStr = new Date().toISOString();
  
  if (action === "Approve") {
    // 1. Perbarui status dokumen
    doc.status = "Approved";
    doc.updatedBy = `${user.name} (${user.role})`;
    doc.date = nowStr;
    
    // Dapatkan daftar seluruh kode langkah dokumen secara urut
    const allStepCodes = p.documents.map(d => d.code);
    const currIndex = allStepCodes.indexOf(docCode);
    
    let nextStepCode = null;
    let nextCustodian = null;
    let nextPhase = p.currentPhase;
    let actionLabel = "Update Tracking: Disetujui";
    let logMsg = `Status dokumen ${doc.name} ditandai disetujui berdasarkan data DigiReview/MyTens.`;
    
    if (currIndex < allStepCodes.length - 1) {
      nextStepCode = allStepCodes[currIndex + 1];
      
      // Tentukan Custodian & Fase berikutnya berdasarkan alur
      if (nextStepCode === "P2" || nextStepCode === "P3" || nextStepCode === "P4" || nextStepCode === "P5" || nextStepCode === "P7" || nextStepCode === "SPPBJ") {
        nextCustodian = USERS_ROLE.BUD;
        nextPhase = "F2";
      } else if (nextStepCode === "SPH" || nextStepCode === "SKM") {
        // Mitra Eksternal
        nextCustodian = {
          name: "Perwakilan Mitra Eksternal",
          role: "Mitra Pelaksana B2B",
          dept: "Mitra Korporat Telkom",
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80"
        };
        nextPhase = "F2";
      } else if (nextStepCode === "P6") {
        nextCustodian = USERS_ROLE.AM; // Negosiasi balik ke AM
        nextPhase = "F2";
      } else if (nextStepCode === "PA") {
        nextCustodian = USERS_ROLE.SDA;
        nextPhase = "F3"; // Masuk Fase Project Assessment
      } else if (nextStepCode === "KL") {
        nextCustodian = USERS_ROLE.LEGAL;
        nextPhase = "F5"; // Masuk Fase Win (SPPBJ selesai, langsung KL)
      } else if (nextStepCode === "BAST" || nextStepCode === "BASO") {
        nextCustodian = USERS_ROLE.AM; // Pengerjaan fisik & serah terima oleh AM
        nextPhase = "F5";
      }
    }
    
    // Update data proyek
    p.currentStep = nextStepCode || "BASO";
    p.currentPhase = nextPhase;
    p.lastUpdated = nowStr;
    
    if (nextCustodian) {
      p.custodian = nextCustodian;
    }
    
    // Jika ini adalah dokumen terakhir (BASO) yang disetujui
    if (docCode === "BASO") {
      logMsg = "Seluruh dokumen (P1 s.d BASO) telah ditandai selesai. Proyek sukses direalisasikan (WIN).";
      actionLabel = "Tracking: Proyek Selesai";
      p.custodian = {
        name: "Proyek Selesai",
        role: "Status: WIN",
        dept: "R-LEGS Telkom Indonesia",
        avatar: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=150&h=150&q=80"
      };
    }
    
    // Tulis ke Log Aktivitas
    p.history.unshift({
      timestamp: nowStr,
      user: user.name,
      role: user.role,
      action: actionLabel,
      notes: logMsg
    });
    
  } else if (action === "Return") {
    // Minta revisi: Kembalikan dokumen ke AM
    const notePrompt = prompt("Masukkan catatan revisi dari platform utama untuk AM:", "Mohon sesuaikan kembali nominal anggaran biaya atau draf pasal perjanjian.");
    const notes = notePrompt || "Draf dokumen membutuhkan perbaikan administratif.";
    
    doc.status = "Revision";
    doc.updatedBy = `${user.name} (${user.role})`;
    doc.date = nowStr;
    
    p.lastUpdated = nowStr;
    p.custodian = USERS_ROLE.AM; // Balik ke AM
    
    p.history.unshift({
      timestamp: nowStr,
      user: user.name,
      role: user.role,
      action: "Update Tracking: Perlu Revisi",
      notes: `Dokumen ${doc.name} ditandai butuh revisi. Catatan dari platform utama: "${notes}"`
    });
    
  } else if (action === "Reject") {
    // Tolak Proyek (Pembatalan / P9)
    if (confirm("Apakah Anda yakin ingin menolak berkas ini dan membatalkan proyek ini secara permanen?")) {
      doc.status = "Rejected";
      doc.updatedBy = `${user.name} (${user.role})`;
      doc.date = nowStr;
      
      p.currentStep = "P9";
      p.currentPhase = "F3"; // Menjadi status pembatalan
      p.lastUpdated = nowStr;
      p.custodian = {
        name: "Proyek Dibatalkan",
        role: "Status: GO-NO GO (NO GO)",
        dept: "SDA Regional IV",
        avatar: "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=150&h=150&q=80"
      };
      
      p.history.unshift({
        timestamp: nowStr,
        user: user.name,
        role: user.role,
        action: "Update Tracking: Ditolak/Batal",
        notes: `Dokumen ${doc.name} ditandai ditolak di platform utama. Proyek dibatalkan (NO GO / P9).`
      });
    } else {
      return;
    }
  }
  
  saveDatabase();
  renderProjectDetails(p.id);
  
  // Tampilkan notifikasi toast sukses singkat
  showToast(`Aksi "${action}" berhasil diproses.`);
}

function renderAuditTrail(p) {
  const container = document.getElementById("vertical-audit-trail");
  container.innerHTML = "";
  
  p.history.forEach((h, index) => {
    const item = document.createElement("div");
    item.className = "timeline-v-item";
    if (index === 0) {
      item.classList.add("latest");
    }
    
    item.innerHTML = `
      <span class="timeline-v-dot"></span>
      <div class="timeline-v-content">
        <div class="timeline-v-header">
          <span class="timeline-v-user">${h.user} <span style="font-weight:normal; color:#9ca3af; font-size:0.75rem;">(${h.role})</span></span>
          <span class="timeline-v-time">${formatDateString(h.timestamp)}</span>
        </div>
        <span class="timeline-v-action">${h.action}</span>
        <p class="timeline-v-notes">${h.notes}</p>
      </div>
    `;
    
    container.appendChild(item);
  });
}

// --- LOGIKA HITUNG MUNDUR SLA (SLA COUNTDOWN) ---
function updateAllSLATimers() {
  if (activeProjectId) {
    const p = projects.find(proj => proj.id === activeProjectId);
    if (p) updateSingleSLATimer(p);
  }
}

function updateSingleSLATimer(p) {
  const timerVal = document.getElementById("detail-sla-timer");
  if (!timerVal) return;
  
  // Cek apakah proyek sudah WIN (BASO Approved)
  const basoDoc = p.documents.find(d => d.code === "BASO");
  const isCompleted = basoDoc && basoDoc.status === "Approved";
  
  if (isCompleted) {
    timerVal.textContent = "SELESAI (WIN)";
    timerVal.className = "sla-timer-value green-text";
    return;
  }
  
  // Cek apakah dibatalkan
  if (p.currentStep === "P9") {
    timerVal.textContent = "DIBATALKAN (P9)";
    timerVal.className = "sla-timer-value red-text";
    return;
  }
  
  const now = new Date();
  const lastUpd = new Date(p.lastUpdated);
  const elapsedMs = now - lastUpd;
  const elapsedHrs = elapsedMs / (1000 * 60 * 60);
  
  let formattedTime = "";
  
  if (elapsedHrs > p.slaLimitHours) {
    // Overdue (Merah)
    const overdueHrs = Math.floor(elapsedHrs);
    const overdueMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    formattedTime = `MANDEK: ${overdueHrs}j ${overdueMins}m`;
    timerVal.className = "sla-timer-value red-text";
  } else {
    // On Track (Hijau / Kuning)
    const remainingMs = (p.slaLimitHours * 60 * 60 * 1000) - elapsedMs;
    const remHrs = Math.floor(remainingMs / (1000 * 60 * 60));
    const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    formattedTime = `${remHrs}j ${remMins}m sisa`;
    
    if (elapsedHrs >= 24) {
      timerVal.className = "sla-timer-value yellow-text";
    } else {
      timerVal.className = "sla-timer-value green-text";
    }
  }
  
  timerVal.textContent = formattedTime;
}

// --- PEMBUATAN PROYEK BARU oleh AM ---
function setupProjectForm() {
  const createBtns = document.querySelectorAll(".btn-create-project");
  const modal = document.getElementById("new-project-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelModalBtn = document.getElementById("cancel-modal-btn");
  const form = document.getElementById("new-project-form");
  
  createBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // Pastikan hanya AM yang boleh buka modal
      if (!getCurrentUserRole().startsWith("AM")) {
        alert("Hanya peran Account Manager (AM) yang diperkenankan untuk membuat proyek B2B baru.");
        return;
      }
      
      // Set nama AM otomatis di form
      const user = getCurrentUserData();
      document.getElementById("form-am-name").value = user.name;
      modal.classList.add("active");
    });
  });
  
  const hideModal = () => {
    modal.classList.remove("active");
    form.reset();
  };
  
  closeModalBtn.addEventListener("click", hideModal);
  cancelModalBtn.addEventListener("click", hideModal);
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = document.getElementById("form-project-name").value;
    const client = document.getElementById("form-client-name").value;
    const valueStr = document.getElementById("form-project-value").value;
    const value = parseInt(valueStr.replace(/\D/g, "")) || 0;
    
    if (!name || !client || value <= 0) {
      alert("Harap lengkapi semua data formulir dengan benar.");
      return;
    }
    
    const user = getCurrentUserData();
    const newId = `PRJ-2026-0${projects.length + 1}`;
    const nowStr = new Date().toISOString();
    
    // Inisialisasi struktur dokumen persis alur OBL BUD
    const newProjDocs = [
      { code: "P1", name: "Justkeb Barang/Jasa (P1)", status: "Empty", updatedBy: "-", date: "" },
      { code: "P2", name: "Evaluasi Bakal Calon Mitra (P2)", status: "Empty", updatedBy: "-", date: "" },
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
    ];
    
    const newProject = {
      id: newId,
      name: name,
      client: client,
      am: user.name,
      value: value,
      startDate: nowStr,
      currentPhase: "F2", // Dimulai dari input dokumen di F2 (Justkeb P1)
      currentStep: "P1",
      lastUpdated: nowStr,
      slaLimitHours: 48,
      custodian: {
        name: user.name,
        role: user.role,
        dept: user.dept,
        avatar: user.avatar
      },
      documents: newProjDocs,
      history: [
        {
          timestamp: nowStr,
          user: user.name,
          role: user.role,
          action: "Inisiasi Proyek Baru",
          notes: `Membuat proyek B2B "${name}" dengan nilai investasi awal Rp ${value.toLocaleString("id-ID")}. Kustodian awal berada pada AM untuk mengunggah berkas P1 Justkeb.`
        }
      ]
    };
    
    projects.push(newProject);
    saveDatabase();
    hideModal();
    
    // Perbarui Tampilan
    renderDashboard();
    renderProjectsTable();
    
    showToast(`Proyek ${newId} berhasil dibuat!`);
  });
}

// --- DUKUNGAN UTILITAS ---
function formatDateString(isoString) {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }) + " WIB";
}

function showToast(message) {
  // Buat wadah toast jika belum ada
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "24px";
    container.style.right = "24px";
    container.style.zIndex = "1000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }
  
  const toast = document.createElement("div");
  toast.style.background = "rgba(13, 19, 33, 0.9)";
  toast.style.color = "#ffffff";
  toast.style.border = "1px solid var(--telkom-red)";
  toast.style.borderRadius = "8px";
  toast.style.padding = "12px 20px";
  toast.style.fontSize = "0.85rem";
  toast.style.fontWeight = "600";
  toast.style.backdropFilter = "blur(10px)";
  toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
  toast.style.animation = "fadeIn 0.3s ease-out forwards";
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- LOGIKA SIMULASI UNGGAL BERKAS & MS TEAMS / LOCAL EXPLORER PICKER ---

const TEAMS_CHANNELS_FILES = {
  "AM B2B Regional IV": [
    { name: "justkeb_p1_final_signed.pdf", size: "1.5 MB", date: "Hari ini, 09:30", type: "pdf" },
    { name: "draf_perjanjian_b2b_rlegs_semarang.pdf", size: "4.2 MB", date: "14 Jun 2026", type: "pdf" }
  ],
  "Legal & Compliance": [
    { name: "KL_Draft_Final_Verified.docx", size: "1.8 MB", date: "Kemarin, 16:45", type: "docx" },
    { name: "Catatan_Koreksi_Legalitas_Kemitraan.docx", size: "420 KB", date: "12 Jun 2026", type: "docx" }
  ],
  "SDA Assurance Team": [
    { name: "PA_SmartCity_Semarang_Approved.pdf", size: "3.1 MB", date: "Hari ini, 08:15", type: "pdf" },
    { name: "assessment_teknis_cctv_iot.pdf", size: "2.9 MB", date: "11 Jun 2026", type: "pdf" }
  ],
  "General Witel NT": [
    { name: "data_justkeb_harga_boq_rab_approved.xlsx", size: "850 KB", date: "12 Jun 2026", type: "xlsx" },
    { name: "Katalog_Layanan_Telkom_2026.pdf", size: "5.4 MB", date: "05 Jun 2026", type: "pdf" }
  ]
};

const LOCAL_FOLDERS_FILES = {
  "Downloads": [
    { name: "BOQ_Internal_Semarang_v2.xlsx", size: "1.2 MB", date: "Kemarin, 11:30", type: "xlsx" },
    { name: "Nomor_Validasi_OBL.pdf", size: "450 KB", date: "10 Jun 2026", type: "pdf" }
  ],
  "My Documents": [
    { name: "P1_Justifikasi_Kebutuhan_Internal.docx", size: "1.4 MB", date: "Kemarin, 17:00", type: "docx" },
    { name: "Template_BASO_Telkom.docx", size: "900 KB", date: "12 Jun 2026", type: "docx" },
    { name: "Nota_Dinas_Persetujuan_Principle.pdf", size: "1.8 MB", date: "08 Jun 2026", type: "pdf" }
  ],
  "Desktop": [
    { name: "Draf_Kontrak_Regional_IV.pdf", size: "3.8 MB", date: "Hari ini, 07:45", type: "pdf" },
    { name: "File_Revisi_Segera_Kirim.pdf", size: "2.5 MB", date: "Kemarin, 16:50", type: "pdf" },
    { name: "Catatan_Meeting_Nego_Semarang.docx", size: "220 KB", date: "13 Jun 2026", type: "docx" }
  ]
};

function setupUploadHandlers(p, doc) {
  const btnLocal = document.getElementById("btn-upload-local");
  const btnTeams = document.getElementById("btn-upload-teams");
  
  if (!btnLocal || !btnTeams) return;
  
  const newLocal = btnLocal.cloneNode(true);
  const newTeams = btnTeams.cloneNode(true);
  
  btnLocal.parentNode.replaceChild(newLocal, btnLocal);
  btnTeams.parentNode.replaceChild(newTeams, btnTeams);
  
  newLocal.addEventListener("click", () => {
    openLocalFilePicker(p, doc);
  });
  
  newTeams.addEventListener("click", () => {
    openTeamsFilePicker(p, doc);
  });
}

function openTeamsFilePicker(p, doc) {
  const modal = document.getElementById("teams-picker-modal");
  if (!modal) return;
  
  let currentChannel = "AM B2B Regional IV";
  let selectedFile = null;
  
  const listContainer = document.getElementById("teams-files-list");
  const selectBtn = document.getElementById("select-teams-file-btn");
  const searchInput = document.getElementById("search-teams-files");
  
  if (searchInput) searchInput.value = "";
  selectBtn.disabled = true;
  
  const renderFiles = () => {
    listContainer.innerHTML = "";
    
    // Create the contextual files
    let files = [];
    if (currentChannel === "AM B2B Regional IV") {
      files.push({ name: `${doc.code}_Revised_${p.id.replace(/-/g,"_")}_v2.pdf`, size: "2.4 MB", date: "Hari ini, 09:30", type: "pdf" });
    } else if (currentChannel === "Legal & Compliance" && doc.code === "KL") {
      files.push({ name: `${doc.code}_Draft_Kontrak_Review_Legal.docx`, size: "1.9 MB", date: "Hari ini, 10:15", type: "docx" });
    } else if (currentChannel === "SDA Assurance Team" && doc.code === "PA") {
      files.push({ name: `${doc.code}_Assessment_GO_Final.pdf`, size: "3.2 MB", date: "Hari ini, 11:00", type: "pdf" });
    }
    
    const mockList = TEAMS_CHANNELS_FILES[currentChannel] || [];
    files = [...files, ...mockList];
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filtered = files.filter(f => f.name.toLowerCase().includes(query));
    
    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; font-size:0.75rem; color: var(--muted-text);">Tidak ada berkas yang sesuai.</div>`;
      return;
    }
    
    filtered.forEach((file) => {
      const fileRow = document.createElement("div");
      fileRow.className = "teams-file-row";
      if (selectedFile && selectedFile.name === file.name) {
        fileRow.classList.add("selected");
      }
      
      let iconSvg = "";
      if (file.type === "pdf") {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#ef4444;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-.5zm5 0c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-3z"/></svg>`;
      } else if (file.type === "xlsx") {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#10b981;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12H10v-2h2v2zm0-4H10V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>`;
      } else {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#3b82f6;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>`;
      }
      
      fileRow.innerHTML = `
        <div class="teams-file-left">
          ${iconSvg}
          <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
            <span class="teams-file-name" title="${file.name}">${file.name}</span>
            <span class="teams-file-meta">${file.size} &bull; Diubah: ${file.date}</span>
          </div>
        </div>
        <div style="font-size:0.65rem; color:#94a3b8; font-weight:600;">Teams Cloud</div>
      `;
      
      fileRow.addEventListener("click", () => {
        document.querySelectorAll(".teams-file-row").forEach(r => r.classList.remove("selected"));
        fileRow.classList.add("selected");
        selectedFile = file;
        selectBtn.disabled = false;
      });
      
      listContainer.appendChild(fileRow);
    });
  };

  const channelItems = document.querySelectorAll("#teams-channels-list .teams-channel-item");
  channelItems.forEach(item => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener("click", () => {
      document.querySelectorAll("#teams-channels-list .teams-channel-item").forEach(i => i.classList.remove("active"));
      newItem.classList.add("active");
      currentChannel = newItem.textContent.trim();
      selectedFile = null;
      selectBtn.disabled = true;
      renderFiles();
    });
  });
  
  document.querySelectorAll("#teams-channels-list .teams-channel-item").forEach(i => {
    i.classList.remove("active");
    if (i.textContent.trim() === currentChannel) {
      i.classList.add("active");
    }
  });

  if (searchInput) {
    const newSearch = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearch, searchInput);
    newSearch.addEventListener("input", () => {
      renderFiles();
    });
  }

  renderFiles();
  modal.classList.add("active");
  
  const closeBtn = document.getElementById("close-teams-modal-btn");
  const cancelBtn = document.getElementById("cancel-teams-modal-btn");
  
  const closeModal = () => modal.classList.remove("active");
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  
  selectBtn.onclick = () => {
    closeModal();
    if (selectedFile) {
      executeSimulationUpload(p, doc, selectedFile.name, "Microsoft Teams (SharePoint)");
    }
  };
}

function openLocalFilePicker(p, doc) {
  const modal = document.getElementById("local-picker-modal");
  if (!modal) return;
  
  let currentFolder = "Downloads";
  let selectedFile = null;
  
  const listContainer = document.getElementById("local-files-list");
  const selectBtn = document.getElementById("select-local-file-btn");
  const searchInput = document.getElementById("search-local-files");
  
  if (searchInput) searchInput.value = "";
  selectBtn.disabled = true;
  
  const renderFiles = () => {
    listContainer.innerHTML = "";
    
    // Create the contextual files
    let files = [];
    if (currentFolder === "Downloads") {
      files.push({ name: `${doc.code}_Draft_Revised_v3.pdf`, size: "2.1 MB", date: "Hari ini, 10:15", type: "pdf" });
    } else if (currentFolder === "Desktop" && doc.code === "P1") {
      files.push({ name: `Justkeb_P1_${p.client.replace(/\s+/g,"_")}_Final.pdf`, size: "1.7 MB", date: "Hari ini, 08:30", type: "pdf" });
    }
    
    const mockList = LOCAL_FOLDERS_FILES[currentFolder] || [];
    files = [...files, ...mockList];
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const filtered = files.filter(f => f.name.toLowerCase().includes(query));
    
    if (filtered.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; font-size:0.75rem; color: var(--muted-text);">Tidak ada berkas yang sesuai.</div>`;
      return;
    }
    
    filtered.forEach((file) => {
      const fileRow = document.createElement("div");
      fileRow.className = "local-file-row";
      if (selectedFile && selectedFile.name === file.name) {
        fileRow.classList.add("selected");
      }
      
      let iconSvg = "";
      if (file.type === "pdf") {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#ef4444;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5V12c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-.5zm5 0c0-.83.67-1.5 1.5-1.5h1c.83 0 1.5.67 1.5 1.5v3c0 .83-.67 1.5-1.5 1.5h-1c-.83 0-1.5-.67-1.5-1.5v-3z"/></svg>`;
      } else if (file.type === "xlsx") {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#10b981;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 12H10v-2h2v2zm0-4H10V9h2v2zm4 4h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>`;
      } else {
        iconSvg = `<svg class="teams-file-icon-doc" style="fill:#3b82f6;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>`;
      }
      
      fileRow.innerHTML = `
        <div class="teams-file-left">
          ${iconSvg}
          <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
            <span class="teams-file-name" title="${file.name}">${file.name}</span>
            <span class="teams-file-meta">${file.size} &bull; Diubah: ${file.date}</span>
          </div>
        </div>
        <div style="font-size:0.65rem; color:#64748b; font-weight:600;">Disk Lokal</div>
      `;
      
      fileRow.addEventListener("click", () => {
        document.querySelectorAll(".local-file-row").forEach(r => r.classList.remove("selected"));
        fileRow.classList.add("selected");
        selectedFile = file;
        selectBtn.disabled = false;
      });
      
      listContainer.appendChild(fileRow);
    });
  };

  const folderItems = document.querySelectorAll("#local-folders-list .local-folder-item");
  folderItems.forEach(item => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);
    
    newItem.addEventListener("click", () => {
      document.querySelectorAll("#local-folders-list .local-folder-item").forEach(i => i.classList.remove("active"));
      newItem.classList.add("active");
      currentFolder = newItem.getAttribute("data-folder");
      selectedFile = null;
      selectBtn.disabled = true;
      renderFiles();
    });
  });
  
  document.querySelectorAll("#local-folders-list .local-folder-item").forEach(i => {
    i.classList.remove("active");
    if (i.getAttribute("data-folder") === currentFolder) {
      i.classList.add("active");
    }
  });

  if (searchInput) {
    const newSearch = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearch, searchInput);
    newSearch.addEventListener("input", () => {
      renderFiles();
    });
  }

  renderFiles();
  modal.classList.add("active");
  
  const closeBtn = document.getElementById("close-local-modal-btn");
  const cancelBtn = document.getElementById("cancel-local-modal-btn");
  
  const closeModal = () => modal.classList.remove("active");
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  
  selectBtn.onclick = () => {
    closeModal();
    if (selectedFile) {
      executeSimulationUpload(p, doc, selectedFile.name, "File Explorer Lokal (C:)");
    }
  };
}

function executeSimulationUpload(projectId, docCode, filename, source) {
  const p = projects.find(proj => proj.id === projectId.id || proj.id === projectId);
  if (!p) return;
  
  const doc = p.documents.find(d => d.code === docCode.code || d.code === docCode);
  if (!doc) return;
  
  const user = getCurrentUserData();
  const nowStr = new Date().toISOString();
  
  const innerPreview = document.getElementById("doc-preview-inner");
  innerPreview.innerHTML = `
    <div class="pdf-empty-state" style="background:#cbd5e1; height: 100%;">
      <div class="spinner" style="width:40px; height:40px; border:4px solid rgba(255,255,255,0.3); border-top-color:#004b87; border-radius:50%; animation:spin 1s linear infinite; margin:120px auto 16px;"></div>
      <h5 style="color:var(--dark-text); font-weight: 700;">Menghubungkan Berkas...</h5>
      <p style="color:var(--muted-text); font-size:0.8rem;">Mengunggah "${filename}" dari ${source} ke R-EDT tracker...</p>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `;
  
  setTimeout(() => {
    const isFirstUpload = doc.status === "Empty";
    
    // 1. Perbarui status dokumen
    doc.status = "Pending";
    doc.updatedBy = `${user.name} (${user.role})`;
    doc.date = nowStr;
    
    // 2. Kembalikan custodian ke verifikator yang sesuai
    let nextCustodian = USERS_ROLE.AM;
    if (doc.code === "PA") {
      nextCustodian = USERS_ROLE.SDA;
    } else if (doc.code === "KL") {
      nextCustodian = USERS_ROLE.LEGAL;
    } else if (doc.code === "P1" || doc.code === "P6" || doc.code === "BAST" || doc.code === "BASO") {
      nextCustodian = USERS_ROLE.AM;
    } else {
      nextCustodian = USERS_ROLE.BUD;
    }
    
    p.custodian = nextCustodian;
    p.lastUpdated = nowStr;
    
    // 3. Tambahkan ke history log
    const actionLabel = isFirstUpload ? "Update Tracking: Unggah Draf" : "Update Tracking: Sinkronisasi Revisi";
    const roleAbbr = user.role.includes("Account Manager") ? "AM" : (user.role.includes("BUD") ? "BUD" : (user.role.includes("Legal") ? "Legal" : "SDA"));
    const logNotes = isFirstUpload
      ? `${roleAbbr} mengunggah berkas draf pertama "${filename}" langsung dari ${source}. Berkas masuk antrean verifikasi ${nextCustodian.role}.`
      : `${roleAbbr} mengunggah berkas revisi baru "${filename}" langsung dari ${source}. Berkas masuk antrean verifikasi ${nextCustodian.role}.`;
      
    p.history.unshift({
      timestamp: nowStr,
      user: user.name,
      role: user.role,
      action: actionLabel,
      notes: logNotes
    });
    
    saveDatabase();
    showToast(isFirstUpload ? `Draf berkas berhasil diunggah!` : `Draf revisi berhasil ditautkan!`);
    
    renderProjectDetails(p.id);
  }, 1800);
}

function renderActiveTasksReminder() {
  const myTasksContainer = document.getElementById("my-tasks-container");
  const teamTasksContainer = document.getElementById("team-tasks-container");
  
  if (!myTasksContainer || !teamTasksContainer) return;
  
  myTasksContainer.innerHTML = "";
  teamTasksContainer.innerHTML = "";
  
  // Group tasks by custodian name
  const tasksByCustodian = {};
  const now = new Date();
  
  projects.forEach(p => {
    // Proyek dianggap selesai jika berada di F5 dan dokumen BASO disetujui (Approved)
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    if (isCompleted) return;
    
    // Cari dokumen aktif saat ini
    const activeDoc = p.documents.find(d => d.code === p.currentStep);
    if (!activeDoc) return;
    
    // Hanya masukkan jika status dokumen memerlukan tindakan (bukan Approved)
    if (activeDoc.status === "Approved") return;
    
    const custodian = p.custodian;
    if (!custodian || !custodian.name) return;
    
    if (!tasksByCustodian[custodian.name]) {
      tasksByCustodian[custodian.name] = {
        name: custodian.name,
        role: custodian.role,
        avatar: custodian.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80",
        tasks: []
      };
    }
    
    // Hitung SLA jam
    const lastUpd = new Date(p.lastUpdated);
    const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
    let slaClass = "green";
    if (elapsedHrs > p.slaLimitHours) slaClass = "red";
    else if (elapsedHrs >= 24) slaClass = "yellow";
    
    let actionText = "";
    if (activeDoc.status === "Empty") {
      actionText = `Belum mengunggah draf pertama berkas <b>${activeDoc.code} (${activeDoc.name})</b>`;
    } else if (activeDoc.status === "Revision") {
      actionText = `Belum merevisi berkas <b>${activeDoc.code} (${activeDoc.name})</b>`;
    } else if (activeDoc.status === "Pending") {
      actionText = `Belum memverifikasi berkas <b>${activeDoc.code} (${activeDoc.name})</b>`;
    } else {
      actionText = `Tindakan tertunda pada berkas <b>${activeDoc.code}</b>`;
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
  const currentUser = getCurrentUserData();
  
  // Cari tugas milik user aktif
  const myTasksData = custodiansWithTasks.find(c => currentUser && c.name === currentUser.name);
  const teamTasksData = custodiansWithTasks.filter(c => !currentUser || c.name !== currentUser.name);
  
  // Render Tugas Anda
  if (myTasksData && myTasksData.tasks.length > 0) {
    const card = createCustodianCard(myTasksData, true);
    myTasksContainer.appendChild(card);
  } else {
    myTasksContainer.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; padding: 14px 20px; background: #f0fdf4; border: 1.5px dashed #bbf7d0; border-radius: 12px; color: #15803d; width: 100%;">
        <span style="font-size: 1.4rem;">✅</span>
        <div>
          <h4 style="margin: 0; font-size: 0.8rem; font-weight: 700;">Bebas Tugas Aktif!</h4>
          <p style="margin: 2px 0 0; font-size: 0.7rem; color: #166534;">Anda tidak memiliki dokumen tertunda yang perlu diunggah atau disetujui saat ini.</p>
        </div>
      </div>
    `;
  }
  
  // Render Tugas Rekan Tim
  if (teamTasksData.length === 0) {
    teamTasksContainer.innerHTML = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; color: var(--muted-text); font-size: 0.75rem; width: 100%;">
        <span>Tidak ada antrean tugas pada rekan tim lainnya.</span>
      </div>
    `;
  } else {
    // Urutkan berdasarkan tugas overdue/red didahulukan, baru berdasarkan jam tertahan terlama
    teamTasksData.sort((a, b) => {
      const aHasRed = a.tasks.some(t => t.slaClass === "red");
      const bHasRed = b.tasks.some(t => t.slaClass === "red");
      if (aHasRed && !bHasRed) return -1;
      if (!aHasRed && bHasRed) return 1;
      
      const aMaxHrs = Math.max(...a.tasks.map(t => t.elapsedHrs));
      const bMaxHrs = Math.max(...b.tasks.map(t => t.elapsedHrs));
      return bMaxHrs - aMaxHrs;
    });
    
    teamTasksData.forEach(c => {
      const card = createCustodianCard(c, false);
      teamTasksContainer.appendChild(card);
    });
  }
}

function createCustodianCard(c, isMe) {
  const card = document.createElement("div");
  card.className = "custodian-task-card";
  
  card.style.background = "#ffffff";
  card.style.borderRadius = "12px";
  card.style.padding = "16px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.transition = "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease";
  
  if (isMe) {
    card.style.border = "2px solid var(--telkom-red)";
    card.style.boxShadow = "0 8px 30px rgba(230, 28, 36, 0.08)";
    card.classList.add("active-user-card");
    
    card.onmouseenter = () => {
      card.style.transform = "translateY(-3px)";
      card.style.boxShadow = "0 12px 25px rgba(230, 28, 36, 0.15)";
    };
    card.onmouseleave = () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 8px 30px rgba(230, 28, 36, 0.08)";
    };
  } else {
    card.style.border = "1px solid var(--border-color)";
    card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
    // Diredam sedikit agar mata fokus ke area Tugas Anda
    card.style.opacity = "0.85";
    
    card.onmouseenter = () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.05)";
      card.style.opacity = "1";
    };
    card.onmouseleave = () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.02)";
      card.style.opacity = "0.85";
    };
  }
  
  const taskCount = c.tasks.length;
  let badgeHtml = "";
  if (isMe) {
    badgeHtml = `<span style="font-size: 0.6rem; font-weight: 800; background: var(--telkom-red); color: white; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; white-space: nowrap; box-shadow: 0 0 6px var(--status-red-glow); animation: pulse-glow-light 2.8s infinite;">TUGAS ANDA</span>`;
  } else {
    badgeHtml = `<span style="font-size: 0.6rem; font-weight: 700; background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 10px; flex-shrink: 0; white-space: nowrap;">${taskCount} Tugas</span>`;
  }
  
  let headerHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 12px; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
        <img src="${c.avatar}" alt="${c.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border-color); flex-shrink: 0;">
        <div style="min-width: 0;">
          <h4 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--dark-text); font-family: var(--font-heading); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.name}">${c.name}</h4>
          <span style="font-size: 0.65rem; color: var(--muted-text); font-weight: 500; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.role}">${c.role}</span>
        </div>
      </div>
      ${badgeHtml}
    </div>
  `;
  
  let tasksListHtml = `
    <div style="display: flex; flex-direction: column; gap: 10px; flex-grow: 1;">
      ${c.tasks.map(t => {
        let badgeColor = "";
        let badgeText = "On Track";
        if (t.slaClass === "red") {
          badgeColor = "var(--status-red)";
          badgeText = "Overdue";
        } else if (t.slaClass === "yellow") {
          badgeColor = "var(--status-yellow)";
          badgeText = "Mendekati SLA";
        } else {
          badgeColor = "var(--status-green)";
          badgeText = "On Track";
        }
        
        return `
          <div class="task-reminder-item" style="padding: 10px 12px; border-radius: 8px; background: #f8fafc; border-left: 3.5px solid ${badgeColor}; border-right: 1px solid rgba(0,0,0,0.02); border-top: 1px solid rgba(0,0,0,0.02); border-bottom: 1px solid rgba(0,0,0,0.02); cursor: pointer; transition: all 0.15s ease;" onclick="window.location.hash='#details/${t.project.id}'" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='rgba(0,0,0,0.06)';" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='rgba(0,0,0,0.02)';">
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--telkom-blue); line-height: 1.2; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;" title="${t.project.name}">${t.project.name}</span>
              <span style="font-size: 0.55rem; padding: 1px 4px; border-radius: 4px; background: rgba(0,0,0,0.05); color: var(--muted-text); font-weight: 600; flex-shrink: 0;">${t.project.id}</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--dark-text); line-height: 1.4; margin-bottom: 6px;">
              ${t.actionText}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
              <span style="font-size: 0.6rem; color: var(--muted-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${t.project.client}</span>
              <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <span style="font-size: 0.55rem; font-weight: 700; color: ${badgeColor}; background: ${badgeColor}0d; padding: 1px 4px; border-radius: 3px;">${badgeText}</span>
                <span style="font-size: 0.6rem; font-weight: 700; color: ${badgeColor};">${t.elapsedHrs}j</span>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
  
  card.innerHTML = headerHtml + tasksListHtml;
  return card;
}

function updateMyProjectsCount() {
  const currentUser = getCurrentUserData();
  if (!currentUser) return;
  
  const myTasksCount = projects.filter(p => {
    const basoDoc = p.documents.find(d => d.code === "BASO");
    const isCompleted = basoDoc && basoDoc.status === "Approved";
    if (isCompleted) return false;
    
    const activeDoc = p.documents.find(d => d.code === p.currentStep);
    if (!activeDoc || activeDoc.status === "Approved") return false;
    
    return p.custodian && p.custodian.name === currentUser.name;
  }).length;
  
  const el = document.getElementById("my-projects-count");
  if (el) el.textContent = myTasksCount;
  
  const notifBadge = document.getElementById("notification-badge");
  const notifDropdownCount = document.getElementById("notif-dropdown-count");
  const notifDropdownTitle = document.getElementById("notif-dropdown-title");
  
  if (notifBadge) {
    if (currentUser.role.includes("Head") || currentUser.role.includes("Manager") || currentUser.role === "Regional Head of R-LEGS") {
      // Manager/Head melihat semua proyek Overdue
      const overdueCount = projects.filter(p => {
        const basoDoc = p.documents.find(d => d.code === "BASO");
        const isCompleted = basoDoc && basoDoc.status === "Approved";
        if (isCompleted) return false;
        
        const lastUpd = new Date(p.lastUpdated);
        const elapsedHrs = (new Date() - lastUpd) / (1000 * 60 * 60);
        return elapsedHrs > p.slaLimitHours;
      }).length;
      notifBadge.textContent = overdueCount;
      notifBadge.style.display = overdueCount > 0 ? "flex" : "none";
      if (notifDropdownCount) notifDropdownCount.textContent = `${overdueCount} Overdue`;
      if (notifDropdownTitle) notifDropdownTitle.textContent = "Peringatan Overdue Kritis";
    } else {
      notifBadge.textContent = myTasksCount;
      notifBadge.style.display = myTasksCount > 0 ? "flex" : "none";
      if (notifDropdownCount) notifDropdownCount.textContent = `${myTasksCount} Tugas`;
      if (notifDropdownTitle) notifDropdownTitle.textContent = "Tugas Tertunda Anda";
    }
  }
}

function setupNotificationCenter() {
  const bellBtn = document.getElementById("notification-bell-btn");
  const dropdown = document.getElementById("notification-dropdown");
  
  if (bellBtn && dropdown) {
    bellBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === "block";
      dropdown.style.display = isOpen ? "none" : "block";
      if (!isOpen) {
        renderNotificationList();
      }
    };
    
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });
  }
}

function renderNotificationList() {
  const listContainer = document.getElementById("notification-list");
  if (!listContainer) return;
  
  listContainer.innerHTML = "";
  const currentUser = getCurrentUserData();
  const now = new Date();
  
  if (currentUser.role.includes("Head") || currentUser.role.includes("Manager") || currentUser.role === "Regional Head of R-LEGS") {
    // Manager melihat semua proyek Overdue
    const overdueProjects = projects.filter(p => {
      const basoDoc = p.documents.find(d => d.code === "BASO");
      const isCompleted = basoDoc && basoDoc.status === "Approved";
      if (isCompleted) return false;
      
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
      return elapsedHrs > p.slaLimitHours;
    });
    
    if (overdueProjects.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 16px; font-size: 0.72rem; color: #10b981; font-weight: 600;">
          🎉 Semua proyek berjalan sesuai SLA!
        </div>
      `;
      return;
    }
    
    overdueProjects.forEach(p => {
      const lastUpd = new Date(p.lastUpdated);
      const elapsedHrs = Math.floor((now - lastUpd) / (1000 * 60 * 60));
      
      const item = document.createElement("div");
      item.style.padding = "8px 10px";
      item.style.borderRadius = "6px";
      item.style.background = "#fef2f2";
      item.style.borderLeft = "3.5px solid var(--status-red)";
      item.style.cursor = "pointer";
      item.style.fontSize = "0.7rem";
      item.style.transition = "background 0.15s";
      item.onmouseover = () => item.style.background = "#fee2e2";
      item.onmouseout = () => item.style.background = "#fef2f2";
      
      item.onclick = () => {
        document.getElementById("notification-dropdown").style.display = "none";
        window.location.hash = `#details/${p.id}`;
      };
      
      item.innerHTML = `
        <div style="font-weight: 700; color: var(--telkom-blue); display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${p.name}</span>
          <span style="font-weight: 600; color: var(--muted-text); font-size: 0.6rem;">${p.id}</span>
        </div>
        <div style="color: var(--dark-text); margin-bottom: 4px;">
          Terlambat di meja <b>${p.custodian.name} (${p.custodian.role})</b>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--status-red); font-weight: 700;">
          <span>Client: ${p.client}</span>
          <span>Tertahan ${elapsedHrs}j (> ${p.slaLimitHours}j SLA)</span>
        </div>
      `;
      listContainer.appendChild(item);
    });
    
  } else {
    // User biasa melihat tugas tertunda mereka sendiri
    const myTasks = [];
    projects.forEach(p => {
      const basoDoc = p.documents.find(d => d.code === "BASO");
      const isCompleted = basoDoc && basoDoc.status === "Approved";
      if (isCompleted) return;
      
      const activeDoc = p.documents.find(d => d.code === p.currentStep);
      if (!activeDoc || activeDoc.status === "Approved") return;
      
      if (p.custodian && p.custodian.name === currentUser.name) {
        const lastUpd = new Date(p.lastUpdated);
        const elapsedHrs = (now - lastUpd) / (1000 * 60 * 60);
        let slaClass = "green";
        if (elapsedHrs > p.slaLimitHours) slaClass = "red";
        else if (elapsedHrs >= 24) slaClass = "yellow";
        
        let actionText = "";
        if (activeDoc.status === "Empty") {
          actionText = `Belum mengunggah draf pertama berkas <b>${activeDoc.code}</b>`;
        } else if (activeDoc.status === "Revision") {
          actionText = `Belum merevisi berkas <b>${activeDoc.code}</b>`;
        } else if (activeDoc.status === "Pending") {
          actionText = `Belum memverifikasi berkas <b>${activeDoc.code}</b>`;
        } else {
          actionText = `Tindakan tertunda pada berkas <b>${activeDoc.code}</b>`;
        }
        
        myTasks.push({
          project: p,
          doc: activeDoc,
          actionText: actionText,
          elapsedHrs: Math.floor(elapsedHrs),
          slaClass: slaClass
        });
      }
    });
    
    if (myTasks.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 16px; font-size: 0.72rem; color: #10b981; font-weight: 600;">
          🎉 Semua tugas Anda selesai!
        </div>
      `;
      return;
    }
    
    myTasks.forEach(t => {
      let badgeColor = "";
      let bg = "";
      if (t.slaClass === "red") {
        badgeColor = "var(--status-red)";
        bg = "#fef2f2";
      } else if (t.slaClass === "yellow") {
        badgeColor = "var(--status-yellow)";
        bg = "#fffbeb";
      } else {
        badgeColor = "var(--status-green)";
        bg = "#f0fdf4";
      }
      
      const item = document.createElement("div");
      item.style.padding = "8px 10px";
      item.style.borderRadius = "6px";
      item.style.background = bg;
      item.style.borderLeft = `3.5px solid ${badgeColor}`;
      item.style.cursor = "pointer";
      item.style.fontSize = "0.7rem";
      item.style.transition = "background 0.15s";
      item.onmouseover = () => item.style.background = "rgba(0,0,0,0.03)";
      item.onmouseout = () => item.style.background = bg;
      
      item.onclick = () => {
        document.getElementById("notification-dropdown").style.display = "none";
        window.location.hash = `#details/${t.project.id}`;
      };
      
      item.innerHTML = `
        <div style="font-weight: 700; color: var(--telkom-blue); display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${t.project.name}</span>
          <span style="font-weight: 600; color: var(--muted-text); font-size: 0.6rem;">${t.project.id}</span>
        </div>
        <div style="color: var(--dark-text); margin-bottom: 4px;">
          ${t.actionText}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.6rem; color: var(--muted-text);">
          <span>Client: ${t.project.client}</span>
          <span style="font-weight: 700; color: ${badgeColor};">Tertahan ${t.elapsedHrs}j</span>
        </div>
      `;
      listContainer.appendChild(item);
    });
  }
}

function resetProjectFilterMode() {
  activeProjectFilterMode = "all";
  const btnAll = document.getElementById("btn-filter-all-projects");
  const btnMy = document.getElementById("btn-filter-my-projects");
  if (btnAll && btnMy) {
    btnAll.style.background = "#ffffff";
    btnAll.style.color = "var(--telkom-blue)";
    btnAll.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)";
    btnAll.classList.add("active");
    
    btnMy.style.background = "transparent";
    btnMy.style.color = "var(--muted-text)";
    btnMy.style.boxShadow = "none";
    btnMy.classList.remove("active");
  }
}


