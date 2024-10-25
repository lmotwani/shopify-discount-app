import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Provider } from "@shopify/app-bridge-react";
import { Banner, Layout, Page } from "@shopify/polaris";

export function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const history = useMemo(
    () => ({
      replace: (path) => {
        navigate(path, { replace: true });
      },
    }),
    [navigate]
  );

  const routerConfig = useMemo(
    () => ({ history, location }),
    [history, location]
  );

  // Get API key from window
  const apiKey = process.env.SHOPIFY_API_KEY;

  if (!apiKey) {
    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <Banner title="Missing Shopify API key" status="critical">
              Your app is running without the SHOPIFY_API_KEY environment variable.
              Please ensure it is set when running the app.
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const host = new URLSearchParams(location.search).get("host");

  if (!host) {
    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <Banner title="Missing host parameter" status="critical">
              Your app can only load if the URL has a host parameter.
              Please ensure it is set when running the app.
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Provider
      config={{
        apiKey,
        host,
        forceRedirect: true,
      }}
      router={routerConfig}
    >
      {children}
    </Provider>
  );
}
