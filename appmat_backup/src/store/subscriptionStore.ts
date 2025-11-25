import { create } from "zustand";
import { registerPushSubscription, listenPushMessages } from "@/lib/push";
import { saveSubscription } from "@/services/subscriptions";

interface SubState {
  ready: boolean;
  lastMessage: any | null;

  init: (userId: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubState>((set) => ({
  ready: false,
  lastMessage: null,

  init: async (userId: string) => {
    // Register push
    const sub = await registerPushSubscription();
    if (sub) {
      await saveSubscription(userId, {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.toJSON().keys.p256dh,
          auth: sub.toJSON().keys.auth
        }
      });
    }

    // Listen for foreground push
    listenPushMessages((msg) => {
      set({ lastMessage: msg });
    });

    set({ ready: true });
  }
}));
