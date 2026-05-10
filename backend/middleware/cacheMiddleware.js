const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 });

const cacheMiddleware = (req, res, next) => {
  // Only cache simple public GET routes
  if (req.method !== "GET") return next();

  // Explicit list of routes that are safe to cache globally
  const safeRoutes = ["/api/jobs/all", "/api/domenii/all"];
  const isSafe = safeRoutes.some((route) => req.originalUrl.startsWith(route));

  if (!isSafe) {
    return next();
  }

  const key = req.originalUrl;
  const cached = myCache.get(key);

  if (cached) {
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    myCache.set(key, body);
    return originalJson(body);
  };

  next();
};

module.exports = cacheMiddleware;
module.exports.cache = myCache;
