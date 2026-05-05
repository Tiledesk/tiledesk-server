/**
 * In-memory per-IP rate limits for /auth signin and signup.
 * Skipped when NODE_ENV=test (see test files) or AUTH_RATE_LIMIT_ENABLED=false.
 * For multi-node deployments, use a shared store (e.g. Redis) if you need global limits.
 */
var winston = require('../config/winston');

var windowMs = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10);
var signinMax = parseInt(process.env.AUTH_SIGNIN_RATE_LIMIT_MAX || '60', 10);
var signupMax = parseInt(process.env.AUTH_SIGNUP_RATE_LIMIT_MAX || '30', 10);

var signinStore = new Map();
var signupStore = new Map();

function isRateLimitDisabled() {
  return process.env.NODE_ENV === 'test' || process.env.AUTH_RATE_LIMIT_ENABLED === 'false';
}

function pruneStore(store) {
  if (store.size < 10000) {
    return;
  }
  var now = Date.now();
  for (var k of store.keys()) {
    var e = store.get(k);
    if (e && now > e.resetAt) {
      store.delete(k);
    }
  }
}

function makeLimiter(name, store, max) {
  return function authRouteRateLimit(req, res, next) {
    if (isRateLimitDisabled()) {
      return next();
    }
    var fwd = req.headers['x-forwarded-for'];
    var ip = (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.ip || '';
    var key = ip + ':' + name;
    var now = Date.now();
    pruneStore(store);
    var entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      winston.warn('Auth rate limit exceeded', { name: name, ip: ip, path: req.path });
      var retrySec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', retrySec);
      return res.status(429).json({ success: false, msg: 'Too many requests. Try again later.' });
    }
    next();
  };
}

module.exports = {
  signin: makeLimiter('signin', signinStore, signinMax),
  signup: makeLimiter('signup', signupStore, signupMax)
};
