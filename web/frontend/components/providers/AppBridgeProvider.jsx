import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Provider } from "@shopify/app-bridge-react";
import { Banner, Layout, Page } from "@shopify/polaris";

export function AppBridgeProvider({ children, apiKey, host }) {
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

  if (!apiKey || !host) {
    const bannerProps = !apiKey 
      ? {
          title: "Missing Shopify API key",
          children: "Your app is running without the SHOPIFY_API_KEY environment variable. Please ensure it is set when running the app.",
        }
      : {
          title: "Missing host parameter",
          children: "Your app can only load if the URL has a host parameter. Please ensure it is set when running the app.",
        };

    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <Banner
              title={bannerProps.title}
              status="critical"
            >
              <p>{bannerProps.children}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const config = {
    host,
    apiKey,
    forceRedirect: true
  };

  return (
    <Provider config={config} router={routerConfig}>
      {children}
    </Provider>
  );
}
