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
