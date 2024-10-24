import { Shopify } from "@shopify/shopify-api";

export default function applyAuthMiddleware(app) {
  app.use(async (req, res, next) => {
    if (req.path.match(/^\/api\//)) {
      const session = await Shopify.Utils.loadCurrentSession(req, res);
      if (!session?.shop) {
        res.status(401).send("Unauthorized");
        return;
      }
      req.shopify = { session };
    }
    next();
  });
}

export function verifyRequest(app, { returnHeader = true } = {}) {
  return async (req, res, next) => {
    const session = await Shopify.Utils.loadCurrentSession(req, res);

    if (!session) {
      if (returnHeader) {
        res.status(403).send("Unauthorized");
        return;
      } else {
        res.redirect(`/auth?shop=${req.query.shop}`);
        return;
      }
    }

    next();
  };
}
