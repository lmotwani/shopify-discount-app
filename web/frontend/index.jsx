import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "@shopify/polaris";
import { Provider as AppBridgeProvider } from "@shopify/app-bridge-react";
import { BrowserRouter } from "react-router-dom";
import translations from "@shopify/polaris/locales/en.json";
import App from "./App";

const root = createRoot(document.getElementById("app"));

// App Bridge configuration
const config = {
  apiKey: process.env.SHOPIFY_API_KEY,
  host: new URL(location.href).searchParams.get("host"),
  forceRedirect: true,
};

root.render(
  <AppBridgeProvider config={config}>
    <BrowserRouter>
      <AppProvider i18n={translations}>
        <App />
      </AppProvider>
    </BrowserRouter>
  </AppBridgeProvider>
);
