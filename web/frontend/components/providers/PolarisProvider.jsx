import { useCallback } from "react";
import { AppProvider } from "@shopify/polaris";
import { useNavigate } from "@shopify/app-bridge-react";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";

export function PolarisProvider({ children }) {
  const navigate = useNavigate();
  const linkComponent = useCallback(
    ({
      children,
      url = "",
      external,
      ref,
      ...rest
    }) => {
      // Use DOM link for external links
      if (external) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            {...rest}
          >
            {children}
          </a>
        );
      }

      // Use navigate for internal links
      return (
        <a
          {...rest}
          onClick={(e) => {
            e.preventDefault();
            navigate(url);
          }}
        >
          {children}
        </a>
      );
    },
    [navigate]
  );

  return (
    <AppProvider i18n={translations} linkComponent={linkComponent}>
      {children}
    </AppProvider>
  );
}
