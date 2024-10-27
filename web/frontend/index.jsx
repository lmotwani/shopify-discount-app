import React from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import App from "./App";
import { initI18n } from "./utils/i18n.js";

// Initialize i18n
initI18n().then((i18nInstance) => {
  createRoot(document.getElementById("app")).render(
    <I18nextProvider i18n={i18nInstance}>
      <App />
    </I18nextProvider>
  );
});
