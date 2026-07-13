// Service worker Firebase Cloud Messaging: menangani notifikasi push saat tab browser
// tidak aktif/di-background. Berkas ini disajikan apa adanya oleh Vite (folder public/),
// jadi config Firebase di-hardcode langsung di sini (nilainya memang publik, bukan secret,
// diproteksi oleh Firebase Security Rules bukan oleh kerahasiaan config).
//
// Isi nilai di bawah dengan config yang sama seperti di frontend/.env
// (VITE_FIREBASE_*), lalu jaga tetap sinkron kalau config berubah.
// Di-host lokal (bukan dari CDN gstatic.com) karena fetch/importScripts dari
// konteks Service Worker sering diblokir oleh proxy/firewall jaringan korporat
// meski akses langsung dari tab browser tetap berhasil.
importScripts("/firebase-app-compat.js");
importScripts("/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDZNlt-p4aAWElGDPOwtU0NEgatma4XNRQ",
  authDomain: "teams-dashboard-939e7.firebaseapp.com",
  projectId: "teams-dashboard-939e7",
  storageBucket: "teams-dashboard-939e7.firebasestorage.app",
  messagingSenderId: "311541185032",
  appId: "1:311541185032:web:5c1adac4e168844383afbd",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "TR3-LEGS Tracker", {
    body: body || "",
    icon: "/favicon.svg",
    data: payload.data || {},
  });
});
