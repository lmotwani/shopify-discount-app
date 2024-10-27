import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from "@shopify/app-bridge-utils";
import { Redirect } from '@shopify/app-bridge/actions';

export function useAuthenticatedFetch() {
  const app = useAppBridge();
  const fetchFunction = authenticatedFetch(app);

  return async (uri, options) => {
    const response = await fetchFunction(uri, options);
    
    if (response.status === 401) {
      const authUrlHeader = response.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");

      if (authUrlHeader) {
        const redirect = Redirect.create(app);
        redirect.dispatch(Redirect.Action.REMOTE, authUrlHeader);
        return null;
      }
    }

    return response;
  };
}
