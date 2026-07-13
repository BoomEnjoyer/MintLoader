# Security Hardening Implementation Guide for DeASI

## Overview
This document provides comprehensive security hardening recommendations for the DeASI project.

## 1. DATABASE SECURITY - CRITICAL ISSUES

### Current Problems:
- ❌ SHA256 used for password hashing (not resistant to attacks)
- ❌ No input validation
- ❌ No rate limiting on login
- ❌ Insecure password requirements
- ❌ No audit logging

### Fixes Applied:

#### Replace SHA256 with bcrypt:
```javascript
// BEFORE (INSECURE)
password: crypto.createHash('sha256').update(password).digest('hex')

// AFTER (SECURE)
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 12);
```

#### Add Input Validation:
- Username: minimum 3 characters
- Password: minimum 8 characters
- IP validation for bots
- MongoDB ObjectId validation

#### Add Password Change Verification:
- Requires old password verification
- Enforces new password complexity

---

## 2. API SECURITY

### Recommended Middleware:
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Data sanitization
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

---

## 3. AUTHENTICATION & AUTHORIZATION

### Implement JWT:
```javascript
const jwt = require('jsonwebtoken');

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}
```

### Add Role-Based Access Control:
```javascript
const roles = {
  ADMIN: 'admin',
  USER: 'user',
  BOT_MANAGER: 'bot_manager'
};

function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}
```

---

## 4. DATA PROTECTION

### Encryption at Rest:
```javascript
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

function encryptField(value, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptField(encrypted, key) {
  const [iv, authTag, encryptedValue] = encrypted.split(':');
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedValue, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

### TLS Configuration:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

---

## 5. CODE & DEPLOYMENT SECURITY

### ESLint Security Rules:
```json
{
  "extends": ["plugin:security/recommended"],
  "plugins": ["security"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error"
  }
}
```

### Secrets Management (.env):
```
DB_URI=mongodb+srv://user:password@cluster.mongodb.net/deasi
JWT_SECRET=your_super_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret_key
ENCRYPTION_KEY=your_32_char_encryption_key
API_KEY=your_api_key
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### .gitignore:
```
.env
.env.local
.env.*.local
node_modules/
dist/
build/
*.log
.DS_Store
```

---

## 6. CI/CD SECURITY PIPELINE

### GitHub Actions Workflow:
```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run ESLint security
        run: npx eslint . --ext .js
      
      - name: Run Snyk scan
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        run: npx snyk test
      
      - name: SonarCloud scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

## 7. MONITORING & LOGGING

### Security Event Logging:
```javascript
const logger = require('winston');

const securityLogger = logger.createLogger({
  level: 'info',
  format: logger.format.json(),
  transports: [
    new logger.transports.File({ filename: 'security.log' }),
    new logger.transports.Console()
  ]
});

// Log security events
function logSecurityEvent(event, user, details) {
  securityLogger.info({
    timestamp: new Date().toISOString(),
    event,
    user,
    details,
    ip: details.ip,
    userAgent: details.userAgent
  });
}
```

### Audit Trail:
```javascript
const auditSchema = new mongoose.Schema({
  userId: String,
  action: String,
  resource: String,
  changes: Object,
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
});
```

---

## 8. PACKAGE DEPENDENCIES

### Add to package.json:
```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.1.2",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-mongo-sanitize": "^2.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "eslint": "^8.54.0",
    "eslint-plugin-security": "^1.7.1",
    "snyk": "^1.1277.0"
  }
}
```

---

## 9. DEPLOYMENT CHECKLIST

- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database backups automated
- [ ] Security headers enabled
- [ ] Rate limiting activated
- [ ] Monitoring enabled
- [ ] Audit logging active
- [ ] Secrets rotated
- [ ] Dependencies updated
- [ ] Security tests passing
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Security headers validated

---

## 10. DEPLOYMENT STEPS

1. **Backup Current Code:**
   ```bash
   git checkout -b security-hardening
   ```

2. **Install Dependencies:**
   ```bash
   npm install bcrypt jsonwebtoken helmet express-rate-limit express-mongo-sanitize
   npm install --save-dev eslint eslint-plugin-security
   ```

3. **Update Database Module:**
   - Replace SHA256 with bcrypt
   - Add input validation
   - Add error handling

4. **Add Middleware:**
   - Helmet for security headers
   - Rate limiting
   - CORS configuration
   - MongoDB sanitization

5. **Configure Environment:**
   - Create .env file
   - Set all required variables
   - Test locally

6. **Run Security Scans:**
   ```bash
   npm audit
   npx snyk test
   npx eslint . --ext .js
   ```

7. **Deploy:**
   ```bash
   git push origin security-hardening
   # Create pull request for review
   ```

---

## CRITICAL ACTIONS REQUIRED

1. ✅ **Rotate all credentials** that may have been exposed
2. ✅ **Update password hashing** to bcrypt immediately
3. ✅ **Enable MFA** for all admin accounts
4. ✅ **Review access logs** for suspicious activity
5. ✅ **Implement rate limiting** on all login endpoints
6. ✅ **Add comprehensive audit logging**
7. ✅ **Set up monitoring alerts**

---

**Generated:** 2026-07-13
**Status:** RECOMMENDED FOR IMMEDIATE IMPLEMENTATION
