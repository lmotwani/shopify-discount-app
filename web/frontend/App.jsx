import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";
import Routes from "./Routes";
import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
} from "./components/providers";
import Loading from "./components/Loading"; // Import the Loading component

export default function App({ polarisTranslations, apiKey, host }) {
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider apiKey={apiKey} host={host}>
          <QueryProvider>
            <NavigationMenu
              navigationLinks={[
                {
                  label: "Discount Rules",
                  destination: "/",
                },
                {
                  label: "Cart Summary",
                  destination: "/cart",
                },
              ]}
            />
            <Routes pages={pages} />
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
