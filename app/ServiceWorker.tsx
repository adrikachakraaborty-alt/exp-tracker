"use client";
import { useEffect } from "react";
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // If an old worker controls this page and a new deploy takes over,
    // reload once so the user never sees a stale cached version.
    if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    navigator.serviceWorker.register("/sw.js").then(r => r.update()).catch(() => {});
  }, []);
  return null;
}
