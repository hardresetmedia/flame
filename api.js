const { join } = require('path');
const express = require('express');
const helmet = require('helmet');
const { errorHandler } = require('./middleware');
const { apiLimiter } = require('./middleware/rateLimiters');

const api = express();

// Exactly one trusted proxy hop (Cloudflare / the local reverse proxy) sits
// in front of the origin; required so req.ip and the rate limiters see real
// client IPs. Trust assumptions documented in utils/getClientIp.js.
api.set('trust proxy', 1);

// Security headers. CSP notes:
//  - style-src 'unsafe-inline': theme colors are applied as inline style
//    properties and uploaded SVGs render inline
//  - img-src / connect-src allow https:: app and bookmark icons may point
//    at arbitrary external image URLs, which external-svg-loader fetch()es
//    from the browser
//  - ws:/wss:: the weather widget's /socket connection
//  - upgrade-insecure-requests disabled: the origin itself serves plain
//    HTTP (TLS terminates at Cloudflare)
api.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https:', 'ws:', 'wss:'],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'upgrade-insecure-requests': null,
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Static files
api.use(express.static(join(__dirname, 'public')));
api.use('/uploads', express.static(join(__dirname, 'data/uploads')));
api.get(/^\/(?!api)/, (req, res) => {
  res.sendFile(join(__dirname, 'public/index.html'));
});

// Body parser — 100kb is also the express default; spelled out on purpose
api.use(express.json({ limit: '100kb' }));

// Coarse API-wide rate limit (login has its own stricter limiter)
api.use('/api', apiLimiter);

// Link controllers with routes
api.use('/api/apps', require('./routes/apps'));
api.use('/api/config', require('./routes/config'));
api.use('/api/weather', require('./routes/weather'));
api.use('/api/categories', require('./routes/category'));
api.use('/api/bookmarks', require('./routes/bookmark'));
api.use('/api/queries', require('./routes/queries'));
api.use('/api/auth', require('./routes/auth'));
api.use('/api/themes', require('./routes/themes'));
api.use('/api/profiles', require('./routes/profile'));
api.use('/api/client-hints', require('./routes/clientHints'));

// Custom error handler
api.use(errorHandler);

module.exports = api;
