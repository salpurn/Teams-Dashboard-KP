import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance = null;

async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  if (!firebaseConfig.apiKey || !(await isSupported())) return null;

  const app = initializeApp(firebaseConfig);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

// Minta izin notifikasi browser, ambil FCM token, dan daftarkan ke backend.
export async function enableDeviceNotifications(apiBaseUrl, userEmail) {
  if (!('Notification' in window)) {
    throw new Error('Browser ini tidak mendukung notifikasi push.');
  }
  if (!firebaseConfig.apiKey) {
    throw new Error('Konfigurasi Firebase belum diisi di frontend/.env (VITE_FIREBASE_*).');
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    throw new Error('Firebase Messaging tidak didukung di browser ini.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Izin notifikasi ditolak.');
  }

  await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) {
    throw new Error('Gagal mendapatkan token perangkat dari Firebase.');
  }

  const response = await fetch(`${apiBaseUrl}/tracker/device-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_email: userEmail, token, platform: 'web' }),
  });
  if (!response.ok) {
    throw new Error('Gagal mendaftarkan token perangkat ke server.');
  }

  return token;
}

// Dengarkan notifikasi push yang masuk selagi tab aktif (foreground).
export async function listenForegroundMessages(onNotification) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    onNotification(payload.notification || {});
  });
}
