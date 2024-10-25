import { BrowserRouter } from "react-router-dom";
import { AppBridgeProvider } from "./components/providers/AppBridgeProvider";
import { QueryProvider } from "./components/providers/QueryProvider";
import { PolarisProvider } from "./components/providers/PolarisProvider";
import { Routes } from "./Routes";

export default function App() {
  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider>
          <QueryProvider>
            <Routes />
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
