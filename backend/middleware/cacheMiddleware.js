const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 });

const cacheMiddleware = (req, res, next) => {
  // Explicit list of routes that are safe to cache
  const safeRoutes = [
    "/api/jobs/all",
    "/api/jobs/by-company",
    "/api/domenii/all",
    "/api/cv/analyze",
    "/api/cv/suggestions",
    "/api/cv/job-cv-match",
  ];
  const isSafe = safeRoutes.some((route) => req.originalUrl.startsWith(route));

  if (!isSafe) {
    return next();
  }

  // Create a cache key based on method, URL and body
  let key = `${req.method}:${req.originalUrl}`;
  if (req.method === "POST" && req.body) {
    key += ":" + JSON.stringify(req.body);
  }

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
