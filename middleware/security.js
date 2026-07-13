const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const logger = require('winston');

// Configure logger
const securityLogger = logger.createLogger({
  level: 'info',
  format: logger.format.json(),
  transports: [
    new logger.transports.File({ filename: 'logs/security.log' }),
    new logger.transports.Console()
  ]
});

/**
 * Security Headers Middleware
 * Protects against common attacks using Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

/**
 * Stricter Rate Limiting for Login
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by username + IP for better security
    return `${req.body.username}:${req.ip}`;
  }
});

/**
 * Rate Limiting for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * CORS Configuration
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

const corsMiddleware = cors(corsOptions);

/**
 * MongoDB Injection Prevention
 */
const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    securityLogger.warn({
      event: 'MongoDB_Injection_Attempt',
      key,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  },
});

/**
 * Request body size limiting
 */
const bodyLimiter = (req, res, next) => {
  const maxBodySize = 1024 * 1024; // 1MB
  
  if (req.headers['content-length'] > maxBodySize) {
    return res.status(413).json({ error: 'Payload too large' });
  }
  
  next();
};

/**
 * JWT Authentication Middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    securityLogger.warn({
      event: 'Invalid_JWT_Token',
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Input Validation Middleware
 */
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      securityLogger.warn({
        event: 'Invalid_Input',
        error: error.details[0].message,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.details[0].message 
      });
    }
    
    req.body = value;
    next();
  };
};

/**
 * Security Event Logging Middleware
 */
const securityEventLogger = (req, res, next) => {
  // Log security-relevant events
  if (req.path.includes('/login') || req.path.includes('/auth')) {
    securityLogger.info({
      event: 'Auth_Attempt',
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  securityLogger.error({
    event: 'Error',
    error: err.message,
    stack: err.stack,
    ip: req.ip,
    path: req.path,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({ error: message });
};

/**
 * HTTPS Enforcement Middleware
 */
const enforceHTTPS = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  
  next();
};

/**
 * Security Headers - Additional
 */
const securityHeadersAdditional = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Request ID Middleware for tracking
 */
const requestIdMiddleware = (req, res, next) => {
  const crypto = require('crypto');
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = {
  securityHeaders,
  globalLimiter,
  loginLimiter,
  apiLimiter,
  corsMiddleware,
  mongoSanitizeMiddleware,
  bodyLimiter,
  authenticateToken,
  validateInput,
  securityEventLogger,
  errorHandler,
  enforceHTTPS,
  securityHeadersAdditional,
  requestIdMiddleware,
  securityLogger
};