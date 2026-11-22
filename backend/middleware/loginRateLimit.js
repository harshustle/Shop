const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

module.exports = function loginRateLimit(req, res, next) {
    const phone = String(req.body?.phone || '').replace(/\D/g, '').slice(-10);
    const key = `${req.ip}:${phone || 'unknown'}`;
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }

    if (current.count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((current.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({ error: 'Too many login attempts. Try again later.', retryAfterSeconds: retryAfter });
    }

    current.count += 1;
    return next();
};
