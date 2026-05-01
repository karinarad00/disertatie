const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 });

const cacheMiddleware = (req, res, next) => {
  if (req.method !== "GET") return next();

  // Do not cache sensitive user-specific routes
  if (req.originalUrl.includes("/api/users/profil") || req.originalUrl.includes("/api/favorites")) {
    return next();
  }

  // Include the Authorization header in the cache key to separate data by user
  const authHeader = req.headers.authorization || "";
  const key = req.originalUrl + authHeader;

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
