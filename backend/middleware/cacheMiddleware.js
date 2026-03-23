const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 3600 });

const cacheMiddleware = (req, res, next) => {
  if (req.method !== "GET") return next();

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
