import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initI18n } from "./utils/i18n.js";

// Initialize i18n
initI18n();

createRoot(document.getElementById("app")).render(<App />);
