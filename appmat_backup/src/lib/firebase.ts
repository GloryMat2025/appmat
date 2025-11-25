import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function registerDeviceToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID,
    });

    return token;
  } catch (err) {
    console.error("FCM Token error", err);
    return null;
  }
}
