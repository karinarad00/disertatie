const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 });

const cacheMiddleware = (req, res, next) => {
  // Allow caching for GET and POST (for AI analysis routes)
  if (req.method !== "GET" && req.method !== "POST") return next();

  // Do not cache sensitive user-specific routes or frequently updated lists
  if (
    req.originalUrl.includes("/api/users/profil") ||
    req.originalUrl.includes("/api/favorites") ||
    req.originalUrl.includes("/api/jobs/by-company") ||
    req.originalUrl.includes("/api/stripe/session")
  ) {
    return next();
  }

  // Include the Authorization header and request body in the cache key
  const authHeader = req.headers.authorization || "";
  const bodyKey = JSON.stringify(req.body);
  const key = req.originalUrl + authHeader + bodyKey;

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
