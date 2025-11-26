import { messaging } from "@/lib/firebase";
import { onMessage } from "firebase/messaging";

export function initPushListener() {
  onMessage(messaging, (payload) => {
    console.log("Push received:", payload);

    const title = payload.notification?.title;
    const body = payload.notification?.body;

    if (title && body) {
      new Notification(title, { body });
    }
  });
}
