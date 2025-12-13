import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    // snapshot BEFORE register: if null => first install
    const hadController = !!navigator.serviceWorker.controller;

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");

      // Only force-activate updates (when there was already a controller)
      if (hadController && reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && hadController && reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });

      // Reload only if this was an update scenario
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController) return;          // ✅ prevents first-run reload
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      console.error("SW registration failed", err);
    }
  });
}

reportWebVitals();
