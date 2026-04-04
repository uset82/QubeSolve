"use client";

import { useEffect } from "react";

export default function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      if ("caches" in window) {
        void caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            void caches.delete(cacheName);
          });
        });
      }
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      } catch {
        // Keep service worker registration failures silent for the UI.
      }
    };

    if (document.readyState === "complete") {
      void register();
      return;
    }

    const handleLoad = () => {
      void register();
    };

    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  return null;
}
