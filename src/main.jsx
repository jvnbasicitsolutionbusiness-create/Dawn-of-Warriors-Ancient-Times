import "@fontsource/cinzel/latin-400.css";
import "@fontsource/cinzel/latin-500.css";
import "@fontsource/cinzel/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/main.css";
if (typeof window !== "undefined") {
  window.__DOW_APP_LOADED__ = true;
  if (window.DawnAudio?.stopMusic) {
    window.DawnAudio.stopMusic();
  }
}
createRoot(document.getElementById("root")).render(<App />);
