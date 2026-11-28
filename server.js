const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3000;
const DB_DIR = path.join(__dirname, 'database');
const CSV_FILE = path.join(DB_DIR, 'customers.csv');
const JSON_FILE = path.join(DB_DIR, 'customers.json');
const AUTH_FILE = path.join(DB_DIR, 'admin_auth.json');
const AUDIT_LOG_FILE = path.join(DB_DIR, 'security_audit.log');
const KARIGARS_FILE = path.join(DB_DIR, 'karigars.json');
const KARIGAR_WORK_FILE = path.join(DB_DIR, 'karigar_work.json');
const KARIGAR_PAYMENTS_FILE = path.join(DB_DIR, 'karigar_payments.json');

// Ensure DB directory and files exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Customer_ID,Date,Customer_Name,Phone,City,Marquee_Name,Design_Title,Category,Length_ft,Width_ft,Total_SqFt,Rate_Per_SqFt,Quantity,Total_Amount_PKR,Advance_Paid_PKR,Balance_Due_PKR,Payment_Status,Order_Status\n', 'utf8');
}
if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, '[]', 'utf8');
}
if (!fs.existsSync(KARIGARS_FILE)) {
    fs.writeFileSync(KARIGARS_FILE, '[]', 'utf8');
}
if (!fs.existsSync(KARIGAR_WORK_FILE)) {
    fs.writeFileSync(KARIGAR_WORK_FILE, '[]', 'utf8');
}
if (!fs.existsSync(KARIGAR_PAYMENTS_FILE)) {
    fs.writeFileSync(KARIGAR_PAYMENTS_FILE, '[]', 'utf8');
}

// Helpers for reading/writing JSON files
function readJsonFile(filePath, defaultVal = []) {
    if (!fs.existsSync(filePath)) return defaultVal;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
        return defaultVal;
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// =========================================================
// SECURITY & CRYPTOGRAPHY ENGINE
// =========================================================

/**
 * PBKDF2 Password Hashing with Salt (10,000 iterations, SHA-512)
 * Meets NIST & OWASP cryptographic standards.
 */
function hashPassword(password, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, storedHash) {
    if (!password || !salt || !storedHash) return false;
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
}

// Initialize admin credentials securely on first run
function getOrInitAdminAuth() {
    if (fs.existsSync(AUTH_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
        } catch (e) {
            console.error('Error parsing admin_auth.json, re-initializing...', e);
        }
    }

    const { salt, hash } = hashPassword('bilal123');
    const authData = {
        username: 'admin',
        salt,
        passwordHash: hash,
        lastChanged: new Date().toISOString(),
        algorithm: 'PBKDF2-SHA512-10000'
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf8');
    logSecurityEvent('SYSTEM_INIT', '127.0.0.1', 'Initialized master admin credentials with PBKDF2 SHA-512 hash.');
    return authData;
}

let adminAuth = getOrInitAdminAuth();

// Brute Force & Rate Limiting Map: IP -> { attempts, lockUntil, lastAttempt }
const loginAttempts = new Map();

// Active Admin Sessions Map: token -> { createdAt, expiresAt, ip }
const activeSessions = new Map();

/**
 * Audit Logger: Persists every sensitive security event
 */
function logSecurityEvent(event, ip, details = '') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [IP: ${ip}] [EVENT: ${event}] ${details}\n`;
    try {
        fs.appendFileSync(AUDIT_LOG_FILE, logLine, 'utf8');
    } catch (e) {
        console.error('Failed to write security audit log:', e);
    }
}

/**
 * Check if an IP is currently rate-limited/locked
 */
function checkRateLimit(ip) {
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (!record) return { allowed: true, remaining: 5 };

    if (record.lockUntil && record.lockUntil > now) {
        const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000);
        return {
            allowed: false,
            locked: true,
            remainingMinutes,
            message: `Security Lock: 5 baar ghalat password ki wajah se aap ka IP ${remainingMinutes} minute ke liye block hai.`
        };
    }

    // Reset attempts if 15 minutes of inactivity passed
    if (now - record.lastAttempt > 15 * 60 * 1000) {
        loginAttempts.delete(ip);
        return { allowed: true, remaining: 5 };
    }

    const remaining = Math.max(0, 5 - record.attempts);
    return { allowed: remaining > 0, remaining };
}

function recordFailedLogin(ip) {
    const now = Date.now();
    const record = loginAttempts.get(ip) || { attempts: 0, lastAttempt: now };
    record.attempts += 1;
    record.lastAttempt = now;

    if (record.attempts >= 5) {
        record.lockUntil = now + (15 * 60 * 1000); // 15 minute lockout
        logSecurityEvent('BRUTE_FORCE_LOCKOUT', ip, `5 failed attempts reached. Locked for 15 minutes.`);
    } else {
        logSecurityEvent('LOGIN_FAILED', ip, `Failed password attempt (${record.attempts}/5).`);
    }

    loginAttempts.set(ip, record);
    return record;
}

function recordSuccessfulLogin(ip) {
    loginAttempts.delete(ip);
    logSecurityEvent('LOGIN_SUCCESS', ip, 'Admin successfully authenticated.');
}

/**
 * Generate 64-character cryptographically random session token
 */
function createSessionToken(ip) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + (12 * 60 * 60 * 1000); // 12 hours duration
    activeSessions.set(token, { createdAt: now, expiresAt, ip });
    return token;
}

/**
 * Validate incoming Authorization Bearer token
 */
function validateSessionToken(token) {
    if (!token) return false;
    const session = activeSessions.get(token);
    if (!session) return false;

    if (Date.now() > session.expiresAt) {
        activeSessions.delete(token);
        return false;
    }
    return true;
}

function extractBearerToken(req) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    if (req.headers['x-admin-token']) {
        return req.headers['x-admin-token'].trim();
    }
    // Also check query param for direct downloads like CSV
    const urlParts = req.url.split('?');
    if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const queryToken = params.get('token');
        if (queryToken) return queryToken.trim();
    }
    return null;
}

// =========================================================
// KARIGAR (WORKER) SESSION & SECURITY MANAGEMENT
// =========================================================
const activeKarigarSessions = new Map(); // token -> { karigarId, createdAt, expiresAt, ip }
const karigarLoginAttempts = new Map(); // ip -> { attempts, lockUntil, lastAttempt }

function checkKarigarRateLimit(ip) {
    const now = Date.now();
    const record = karigarLoginAttempts.get(ip);
    if (!record) return { allowed: true, remaining: 5 };

    if (record.lockUntil && record.lockUntil > now) {
        const remainingMinutes = Math.ceil((record.lockUntil - now) / 60000);
        return {
            allowed: false,
            locked: true,
            remainingMinutes,
            message: `Security Lock: 5 baar ghalat password ki wajah se aap ka IP ${remainingMinutes} minute ke liye block hai.`
        };
    }

    if (now - record.lastAttempt > 15 * 60 * 1000) {
        karigarLoginAttempts.delete(ip);
        return { allowed: true, remaining: 5 };
    }

    const remaining = Math.max(0, 5 - record.attempts);
    return { allowed: remaining > 0, remaining };
}

function recordFailedKarigarLogin(ip) {
    const now = Date.now();
    const record = karigarLoginAttempts.get(ip) || { attempts: 0, lastAttempt: now };
    record.attempts += 1;
    record.lastAttempt = now;
    if (record.attempts >= 5) {
        record.lockUntil = now + (15 * 60 * 1000);
        logSecurityEvent('KARIGAR_BRUTE_FORCE_LOCKOUT', ip, `5 failed attempts. Locked for 15 minutes.`);
    } else {
        logSecurityEvent('KARIGAR_LOGIN_FAILED', ip, `Failed attempt (${record.attempts}/5).`);
    }
    karigarLoginAttempts.set(ip, record);
    return record;
}

function recordSuccessfulKarigarLogin(ip) {
    karigarLoginAttempts.delete(ip);
    logSecurityEvent('KARIGAR_LOGIN_SUCCESS', ip, 'Karigar successfully authenticated.');
}

function createKarigarSessionToken(karigarId, ip) {
    const token = 'krg_' + crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours duration
    activeKarigarSessions.set(token, { karigarId, createdAt: now, expiresAt, ip });
    return token;
}

function extractKarigarToken(req) {
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
    }
    if (req.headers['x-karigar-token']) {
        return req.headers['x-karigar-token'].trim();
    }
    const urlParts = req.url.split('?');
    if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1]);
        const queryToken = params.get('karigar_token');
        if (queryToken) return queryToken.trim();
    }
    return null;
}

function validateKarigarToken(token) {
    if (!token) return null;
    const session = activeKarigarSessions.get(token);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
        activeKarigarSessions.delete(token);
        return null;
    }
    return session.karigarId;
}

/**
 * Apply Standard HTTP Security Headers
 */
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
    setSecurityHeaders(res);
    const parsedUrl = req.url.split('?')[0];
    const clientIp = getClientIp(req);

    // ==========================================
    // API: POST /api/admin/login (Protected with Rate-Limiting & PBKDF2)
    // ==========================================
    if (req.method === 'POST' && parsedUrl === '/api/admin/login') {
        const rateCheck = checkRateLimit(clientIp);
        if (!rateCheck.allowed) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                locked: true,
                message: rateCheck.message 
            }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const password = String(data.password || '').trim();

                const isValid = verifyPassword(password, adminAuth.salt, adminAuth.passwordHash);

                if (isValid) {
                    recordSuccessfulLogin(clientIp);
                    const token = createSessionToken(clientIp);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        token,
                        message: "Kamyabi se login ho gaye.",
                        expiresIn: 43200
                    }));
                } else {
                    const failRecord = recordFailedLogin(clientIp);
                    const remaining = Math.max(0, 5 - failRecord.attempts);
                    const locked = failRecord.attempts >= 5;

                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        locked,
                        remainingAttempts: remaining,
                        message: locked 
                            ? "Security Alert: 5 baar ghalat password. Account 15 minute ke liye lock ho gaya." 
                            : `Ghalat password! Aap ke paas ${remaining} koshish(ein) baqi hain.`
                    }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid request payload." }));
            }
        });
        return;
    }

    // ==========================================
    // API: POST /api/admin/verify (Verify Token Validity)
    // ==========================================
    if (req.method === 'POST' && parsedUrl === '/api/admin/verify') {
        const token = extractBearerToken(req);
        const valid = validateSessionToken(token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid }));
        return;
    }

    // ==========================================
    // API: POST /api/admin/logout (Revoke Session Token)
    // ==========================================
    if (req.method === 'POST' && parsedUrl === '/api/admin/logout') {
        const token = extractBearerToken(req);
        if (token) {
            activeSessions.delete(token);
            logSecurityEvent('LOGOUT', clientIp, 'Admin token revoked.');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // ==========================================
    // API: POST /api/admin/change-password (Requires Valid Session)
    // ==========================================
    if (req.method === 'POST' && parsedUrl === '/api/admin/change-password') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Security Alert: Unauthorized. Login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const oldPassword = String(data.oldPassword || '').trim();
                const newPassword = String(data.newPassword || '').trim();

                if (!verifyPassword(oldPassword, adminAuth.salt, adminAuth.passwordHash)) {
                    logSecurityEvent('PASSWORD_CHANGE_FAIL', clientIp, 'Incorrect old password provided.');
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Purana password ghalat hai." }));
                    return;
                }

                if (newPassword.length < 6) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Naya password kam az kam 6 characters ka hona chahiye." }));
                    return;
                }

                const newHashed = hashPassword(newPassword);
                adminAuth = {
                    username: 'admin',
                    salt: newHashed.salt,
                    passwordHash: newHashed.hash,
                    lastChanged: new Date().toISOString(),
                    algorithm: 'PBKDF2-SHA512-10000'
                };
                fs.writeFileSync(AUTH_FILE, JSON.stringify(adminAuth, null, 2), 'utf8');
                logSecurityEvent('PASSWORD_CHANGE_SUCCESS', clientIp, 'Admin password changed successfully.');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: "Admin password kamyabi se update ho gaya." }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // ==========================================
    // API: GET /api/admin/security-status (Security Audit & Threat Overview)
    // ==========================================
    if (req.method === 'GET' && parsedUrl === '/api/admin/security-status') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Unauthorized" }));
            return;
        }

        let auditLines = 0;
        if (fs.existsSync(AUDIT_LOG_FILE)) {
            try {
                const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
                auditLines = content.trim().split('\n').filter(Boolean).length;
            } catch (e) { auditLines = 0; }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            activeSessionsCount: activeSessions.size,
            trackedIpsCount: loginAttempts.size,
            auditLogEntries: auditLines,
            lastPasswordChange: adminAuth.lastChanged,
            encryption: adminAuth.algorithm
        }));
        return;
    }

    // ==========================================
    // API: GET /api/customers (PROTECTED: Requires Admin Token)
    // ==========================================
    if (req.method === 'GET' && parsedUrl === '/api/customers') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            logSecurityEvent('UNAUTHORIZED_DATA_ACCESS', clientIp, 'Attempted to fetch customer database without admin token.');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Security Alert: Admin authorization required to view customer database." }));
            return;
        }

        fs.readFile(JSON_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Failed to read database" }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
        return;
    }

    // ==========================================
    // API: GET /api/export-csv (PROTECTED: Requires Admin Token)
    // ==========================================
    if (req.method === 'GET' && parsedUrl === '/api/export-csv') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            logSecurityEvent('UNAUTHORIZED_CSV_EXPORT', clientIp, 'Attempted to export customer CSV without admin token.');
            res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end("Security Alert: Admin login zaroori hai.");
            return;
        }

        fs.readFile(CSV_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("CSV export failed");
                return;
            }
            res.writeHead(200, {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="Bilal_Decor_Customers_Database.csv"'
            });
            res.end(data);
        });
        return;
    }

    // ==========================================
    // API: POST /api/save-customer (Public Lead/Order Capture with Sanitization)
    // ==========================================
    if (req.method === 'POST' && parsedUrl === '/api/save-customer') {
        let body = '';
        req.on('data', chunk => { 
            body += chunk; 
            if (body.length > 50000) req.destroy(); // Prevent memory flood
        });
        req.on('end', () => {
            try {
                const record = JSON.parse(body);
                record.date = record.date || new Date().toISOString().slice(0, 10);
                record.customerId = record.customerId || ("CUST-" + Math.floor(1000 + Math.random() * 9000));

                // Sanitize fields to prevent CSV Injection / XSS
                const sanitize = (val) => String(val || '')
                    .replace(/[=+\-@\t\r]/g, ' ') // CSV formula injection guard
                    .replace(/,/g, ' ')
                    .replace(/\n/g, ' ')
                    .replace(/[<>]/g, '')
                    .trim();

                const csvRow = `${sanitize(record.customerId)},${sanitize(record.date)},${sanitize(record.customerName)},${sanitize(record.phone)},${sanitize(record.city)},${sanitize(record.marqueeName)},${sanitize(record.designTitle)},${sanitize(record.category)},${parseFloat(record.length_ft) || 0},${parseFloat(record.width_ft) || 0},${parseFloat(record.total_sqft) || 0},${parseFloat(record.rate_sqft) || 0},${parseInt(record.quantity, 10) || 1},${parseFloat(record.totalAmount_PKR) || 0},${parseFloat(record.advancePaid_PKR) || 0},${parseFloat(record.balanceDue_PKR) || 0},${sanitize(record.paymentStatus)},${sanitize(record.orderStatus)}\n`;
                fs.appendFileSync(CSV_FILE, csvRow, 'utf8');

                let currentJson = [];
                try {
                    currentJson = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
                } catch (e) { currentJson = []; }

                currentJson.unshift(record);
                fs.writeFileSync(JSON_FILE, JSON.stringify(currentJson, null, 2), 'utf8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, record }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid request payload." }));
            }
        });
        return;
    }

    // ==========================================
    // KARIGAR AUTHENTICATION & WORKER PORTAL APIs
    // ==========================================

    // API: POST /api/karigar/login (Worker Authentication)
    if (req.method === 'POST' && parsedUrl === '/api/karigar/login') {
        const rateCheck = checkKarigarRateLimit(clientIp);
        if (!rateCheck.allowed) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, locked: true, message: rateCheck.message }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const identifier = String(data.username || data.phone || '').trim().toLowerCase();
                const password = String(data.password || '').trim();

                const karigars = readJsonFile(KARIGARS_FILE, []);
                const karigar = karigars.find(k => 
                    (k.username && k.username.toLowerCase() === identifier) ||
                    (k.phone && k.phone.replace(/[^0-9]/g, '') === identifier.replace(/[^0-9]/g, '')) ||
                    (k.id && k.id.toLowerCase() === identifier)
                );

                if (!karigar) {
                    recordFailedKarigarLogin(clientIp);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar account nahi mila. Username ya phone check karein." }));
                    return;
                }

                if (karigar.status && karigar.status.toLowerCase() === 'inactive') {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Aap ka account filhal band (Inactive) hai. Admin se rabta karein." }));
                    return;
                }

                const isValid = verifyPassword(password, karigar.salt, karigar.passwordHash);
                if (isValid) {
                    recordSuccessfulKarigarLogin(clientIp);
                    const token = createKarigarSessionToken(karigar.id, clientIp);
                    const safeKarigar = {
                        id: karigar.id,
                        name: karigar.name,
                        phone: karigar.phone,
                        username: karigar.username,
                        craft: karigar.craft,
                        defaultRate: karigar.defaultRate || 12,
                        joinedDate: karigar.joinedDate
                    };
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        token,
                        karigar: safeKarigar,
                        message: "Khush-amdeed " + karigar.name
                    }));
                } else {
                    const failRecord = recordFailedKarigarLogin(clientIp);
                    const remaining = Math.max(0, 5 - failRecord.attempts);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: `Ghalat password! ${remaining} koshish(ein) baqi hain.`
                    }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // API: GET /api/karigar/me (Worker Dashboard Data)
    if (req.method === 'GET' && parsedUrl === '/api/karigar/me') {
        const token = extractKarigarToken(req);
        const karigarId = validateKarigarToken(token);
        if (!karigarId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Unauthorized. Karigar login zaroori hai." }));
            return;
        }

        const karigars = readJsonFile(KARIGARS_FILE, []);
        const karigar = karigars.find(k => k.id === karigarId);
        if (!karigar) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Karigar record nahi mila." }));
            return;
        }

        const allWork = readJsonFile(KARIGAR_WORK_FILE, []);
        const allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);

        const work = allWork.filter(w => w.karigarId === karigarId).sort((a, b) => new Date(b.date) - new Date(a.date));
        const payments = allPayments.filter(p => p.karigarId === karigarId).sort((a, b) => new Date(b.date) - new Date(a.date));

        const totalWorkAmount = work.reduce((sum, w) => sum + (parseFloat(w.totalAmount) || 0), 0);
        const totalPaidAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const balanceDue = totalWorkAmount - totalPaidAmount;
        const totalSqFt = work.reduce((sum, w) => sum + (parseFloat(w.totalSqFt) || 0), 0);
        const totalItems = work.reduce((sum, w) => sum + ((w.items && w.items.length) ? w.items.reduce((s, it) => s + (parseInt(it.quantity, 10) || 1), 0) : 1), 0);

        const safeKarigar = {
            id: karigar.id,
            name: karigar.name,
            phone: karigar.phone,
            username: karigar.username,
            craft: karigar.craft,
            defaultRate: karigar.defaultRate || 12,
            joinedDate: karigar.joinedDate,
            status: karigar.status || 'Active'
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            karigar: safeKarigar,
            summary: {
                totalWorkAmount: Math.round(totalWorkAmount * 100) / 100,
                totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
                balanceDue: Math.round(balanceDue * 100) / 100,
                totalSqFt: Math.round(totalSqFt * 100) / 100,
                totalItems,
                workCount: work.length,
                paymentCount: payments.length
            },
            work,
            payments
        }));
        return;
    }

    // API: POST /api/karigar/change-password
    if (req.method === 'POST' && parsedUrl === '/api/karigar/change-password') {
        const token = extractKarigarToken(req);
        const karigarId = validateKarigarToken(token);
        if (!karigarId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Unauthorized. Login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const oldPassword = String(data.oldPassword || '').trim();
                const newPassword = String(data.newPassword || '').trim();

                const karigars = readJsonFile(KARIGARS_FILE, []);
                const idx = karigars.findIndex(k => k.id === karigarId);
                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar record nahi mila." }));
                    return;
                }

                if (!verifyPassword(oldPassword, karigars[idx].salt, karigars[idx].passwordHash)) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Purana password ghalat hai." }));
                    return;
                }

                if (newPassword.length < 4) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Naya password kam az kam 4 characters ka hona chahiye." }));
                    return;
                }

                const newHashed = hashPassword(newPassword);
                karigars[idx].salt = newHashed.salt;
                karigars[idx].passwordHash = newHashed.hash;
                writeJsonFile(KARIGARS_FILE, karigars);

                logSecurityEvent('KARIGAR_PASSWORD_CHANGE', clientIp, `Karigar ${karigarId} updated their password.`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: "Password kamyabi se badal gaya." }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // API: POST /api/karigar/logout
    if (req.method === 'POST' && parsedUrl === '/api/karigar/logout') {
        const token = extractKarigarToken(req);
        if (token) activeKarigarSessions.delete(token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Logout kamyab." }));
        return;
    }

    // ==========================================
    // ADMIN KARIGAR MANAGEMENT APIs (Protected by Admin Token)
    // ==========================================

    // API: GET /api/admin/karigars (List all karigars with live computed balance)
    if (req.method === 'GET' && parsedUrl === '/api/admin/karigars') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        const karigars = readJsonFile(KARIGARS_FILE, []);
        const allWork = readJsonFile(KARIGAR_WORK_FILE, []);
        const allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);

        let overallTotalWork = 0;
        let overallTotalPaid = 0;

        const roster = karigars.map(k => {
            const kWork = allWork.filter(w => w.karigarId === k.id);
            const kPayments = allPayments.filter(p => p.karigarId === k.id);

            const totalWork = kWork.reduce((sum, w) => sum + (parseFloat(w.totalAmount) || 0), 0);
            const totalPaid = kPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const balanceDue = totalWork - totalPaid;
            const totalSqFt = kWork.reduce((sum, w) => sum + (parseFloat(w.totalSqFt) || 0), 0);

            overallTotalWork += totalWork;
            overallTotalPaid += totalPaid;

            return {
                id: k.id,
                name: k.name,
                phone: k.phone,
                username: k.username,
                craft: k.craft || 'Ceiling Maker',
                defaultRate: k.defaultRate !== undefined ? k.defaultRate : 12,
                status: k.status || 'Active',
                joinedDate: k.joinedDate || '',
                notes: k.notes || '',
                totalWork: Math.round(totalWork * 100) / 100,
                totalPaid: Math.round(totalPaid * 100) / 100,
                balanceDue: Math.round(balanceDue * 100) / 100,
                totalSqFt: Math.round(totalSqFt * 100) / 100,
                workCount: kWork.length,
                paymentCount: kPayments.length,
                lastWorkDate: kWork.length ? kWork[kWork.length - 1].date : null,
                lastPaymentDate: kPayments.length ? kPayments[kPayments.length - 1].date : null
            };
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            karigars: roster,
            stats: {
                totalKarigars: karigars.length,
                activeKarigars: karigars.filter(k => (k.status || 'Active') === 'Active').length,
                overallTotalWork: Math.round(overallTotalWork * 100) / 100,
                overallTotalPaid: Math.round(overallTotalPaid * 100) / 100,
                overallBalanceDue: Math.round((overallTotalWork - overallTotalPaid) * 100) / 100
            }
        }));
        return;
    }

    // API: POST /api/admin/karigars (Create New Karigar)
    if (req.method === 'POST' && parsedUrl === '/api/admin/karigars') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const name = String(data.name || '').trim();
                const phone = String(data.phone || '').trim();
                let username = String(data.username || '').trim().toLowerCase();
                const password = String(data.password || '').trim() || 'karigar123';
                const craft = String(data.craft || 'Ceiling Maker').trim();
                const defaultRate = (data.defaultRate !== undefined && data.defaultRate !== '' && !isNaN(parseFloat(data.defaultRate)))
                    ? parseFloat(data.defaultRate) : 12;
                const notes = String(data.notes || '').trim();

                if (!name) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar ka naam lazmi hai." }));
                    return;
                }

                const karigars = readJsonFile(KARIGARS_FILE, []);

                // Generate clean username if not provided
                if (!username) {
                    username = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) + Math.floor(100 + Math.random() * 900);
                }

                // Check username conflict
                if (karigars.some(k => k.username && k.username.toLowerCase() === username)) {
                    username = username + Math.floor(10 + Math.random() * 90);
                }

                const { salt, hash } = hashPassword(password);
                const newId = "KRG-" + (1000 + karigars.length + 1);

                const newKarigar = {
                    id: newId,
                    name,
                    phone,
                    username,
                    salt,
                    passwordHash: hash,
                    craft,
                    defaultRate,
                    status: 'Active',
                    joinedDate: new Date().toISOString().slice(0, 10),
                    notes
                };

                karigars.push(newKarigar);
                writeJsonFile(KARIGARS_FILE, karigars);
                logSecurityEvent('ADMIN_KARIGAR_CREATED', clientIp, `Created karigar ${newId} (${name})`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    karigar: {
                        id: newKarigar.id,
                        name: newKarigar.name,
                        phone: newKarigar.phone,
                        username: newKarigar.username,
                        craft: newKarigar.craft,
                        defaultRate: newKarigar.defaultRate,
                        status: newKarigar.status,
                        joinedDate: newKarigar.joinedDate,
                        notes: newKarigar.notes
                    },
                    initialPassword: password,
                    message: "Karigar kamyabi se shamil ho gaya."
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // API: PUT /api/admin/karigars (Edit Karigar Profile & Default Rate)
    if (req.method === 'PUT' && parsedUrl === '/api/admin/karigars') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const id = String(data.id || '').trim();
                const karigars = readJsonFile(KARIGARS_FILE, []);
                const idx = karigars.findIndex(k => k.id === id);

                if (idx === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar nahi mila." }));
                    return;
                }

                if (data.name) karigars[idx].name = String(data.name).trim();
                if (data.phone !== undefined) karigars[idx].phone = String(data.phone).trim();
                if (data.username) karigars[idx].username = String(data.username).trim().toLowerCase();
                if (data.craft) karigars[idx].craft = String(data.craft).trim();
                if (data.defaultRate !== undefined && data.defaultRate !== '' && !isNaN(parseFloat(data.defaultRate))) {
                    karigars[idx].defaultRate = parseFloat(data.defaultRate);
                }
                if (data.status) karigars[idx].status = String(data.status).trim();
                if (data.notes !== undefined) karigars[idx].notes = String(data.notes).trim();

                // If admin entered a new password for this karigar
                if (data.password && String(data.password).trim().length >= 4) {
                    const hashed = hashPassword(String(data.password).trim());
                    karigars[idx].salt = hashed.salt;
                    karigars[idx].passwordHash = hashed.hash;
                }

                writeJsonFile(KARIGARS_FILE, karigars);
                logSecurityEvent('ADMIN_KARIGAR_UPDATED', clientIp, `Updated karigar ${id}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    karigar: {
                        id: karigars[idx].id,
                        name: karigars[idx].name,
                        phone: karigars[idx].phone,
                        username: karigars[idx].username,
                        craft: karigars[idx].craft,
                        defaultRate: karigars[idx].defaultRate,
                        status: karigars[idx].status,
                        joinedDate: karigars[idx].joinedDate,
                        notes: karigars[idx].notes
                    },
                    message: "Karigar profile kamyabi se update ho gai."
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // API: DELETE /api/admin/karigars (Delete or Inactivate Karigar)
    if (req.method === 'DELETE' && parsedUrl === '/api/admin/karigars') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        const urlParts = req.url.split('?');
        const params = new URLSearchParams(urlParts[1] || '');
        const id = params.get('id');

        let karigars = readJsonFile(KARIGARS_FILE, []);
        const exists = karigars.some(k => k.id === id);
        if (!exists) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Karigar record nahi mila." }));
            return;
        }

        karigars = karigars.filter(k => k.id !== id);
        writeJsonFile(KARIGARS_FILE, karigars);
        logSecurityEvent('ADMIN_KARIGAR_DELETED', clientIp, `Deleted karigar ${id}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Karigar record delete ho gaya." }));
        return;
    }

    // API: GET /api/admin/karigar-ledger (Full Ledger Statement with Running Balance)
    if (req.method === 'GET' && parsedUrl === '/api/admin/karigar-ledger') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        const urlParts = req.url.split('?');
        const params = new URLSearchParams(urlParts[1] || '');
        const id = params.get('id');

        const karigars = readJsonFile(KARIGARS_FILE, []);
        const karigar = karigars.find(k => k.id === id);
        if (!karigar) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Karigar record nahi mila." }));
            return;
        }

        const allWork = readJsonFile(KARIGAR_WORK_FILE, []);
        const allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);

        const work = allWork.filter(w => w.karigarId === id).sort((a, b) => new Date(a.date) - new Date(b.date));
        const payments = allPayments.filter(p => p.karigarId === id).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Build combined chronological ledger
        const events = [];
        work.forEach(w => {
            events.push({
                type: 'WORK',
                id: w.id,
                date: w.date,
                timestamp: new Date(w.createdAt || w.date).getTime(),
                title: (w.items && w.items.length) ? w.items.map(i => `${i.title} (${i.totalAmount} PKR)`).join(' + ') : 'Chadar / Ceiling Kaam',
                items: w.items || [],
                totalSqFt: w.totalSqFt || 0,
                debit: 0,
                credit: parseFloat(w.totalAmount) || 0, // Karigar earned this
                notes: w.notes || ''
            });
        });

        payments.forEach(p => {
            events.push({
                type: 'PAYMENT',
                id: p.id,
                date: p.date,
                timestamp: new Date(p.createdAt || p.date).getTime(),
                title: `Adaigi (${p.paymentMethod || 'Cash'})`,
                debit: parseFloat(p.amount) || 0, // Paid to Karigar (deduction)
                credit: 0,
                receiptNo: p.receiptNo || '',
                notes: p.notes || ''
            });
        });

        events.sort((a, b) => a.timestamp - b.timestamp);

        let runningBalance = 0;
        const ledger = events.map(ev => {
            runningBalance += (ev.credit - ev.debit);
            return {
                ...ev,
                balanceAfter: Math.round(runningBalance * 100) / 100
            };
        });

        const totalWork = work.reduce((s, w) => s + (parseFloat(w.totalAmount) || 0), 0);
        const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            karigar: {
                id: karigar.id,
                name: karigar.name,
                phone: karigar.phone,
                username: karigar.username,
                craft: karigar.craft,
                defaultRate: karigar.defaultRate || 12,
                status: karigar.status || 'Active',
                joinedDate: karigar.joinedDate
            },
            summary: {
                totalWork: Math.round(totalWork * 100) / 100,
                totalPaid: Math.round(totalPaid * 100) / 100,
                balanceDue: Math.round((totalWork - totalPaid) * 100) / 100
            },
            work: [...work].reverse(), // latest first for display
            payments: [...payments].reverse(), // latest first for display
            ledger: [...ledger].reverse() // latest first for display
        }));
        return;
    }

    // API: POST /api/admin/karigar-work (Record Daily Work Entry with Multi-Items & Optional Payment Deduction)
    if (req.method === 'POST' && parsedUrl === '/api/admin/karigar-work') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const karigarId = String(data.karigarId || '').trim();
                const date = String(data.date || new Date().toISOString().slice(0, 10)).trim();
                const rawItems = Array.isArray(data.items) ? data.items : [];
                const notes = String(data.notes || '').trim();

                const karigars = readJsonFile(KARIGARS_FILE, []);
                const karigar = karigars.find(k => k.id === karigarId);
                if (!karigar) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar select nahi kia gaya ya mojood nahi." }));
                    return;
                }

                if (rawItems.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Kam az kam 1 item/chadar shamil karein." }));
                    return;
                }

                const defaultWorkerRate = (karigar.defaultRate !== undefined && !isNaN(parseFloat(karigar.defaultRate)))
                    ? parseFloat(karigar.defaultRate) : 12;

                let totalSqFt = 0;
                let totalWorkAmount = 0;
                const processedItems = [];

                for (let i = 0; i < rawItems.length; i++) {
                    const item = rawItems[i];
                    const title = String(item.title || item.name || `Item #${i+1}`).trim();
                    const category = String(item.category || 'General').trim();
                    const length = parseFloat(item.length) || 0;
                    const width = parseFloat(item.width) || 0;
                    const qty = parseInt(item.quantity || item.qty, 10) || 1;

                    let sqFt = parseFloat(item.sqFt) || 0;
                    if (length > 0 && width > 0) {
                        sqFt = Math.round(length * width * 100) / 100;
                    }

                    // Rate logic: default to 12 or karigar's default rate if not explicitly specified
                    let rate = null;
                    if (item.rate !== undefined && item.rate !== '' && !isNaN(parseFloat(item.rate))) {
                        rate = parseFloat(item.rate);
                    } else if (sqFt > 0) {
                        rate = defaultWorkerRate; // default 12
                    }

                    let lineTotal = 0;
                    if (rate !== null && rate > 0 && sqFt > 0) {
                        lineTotal = Math.round(sqFt * rate * qty * 100) / 100;
                    } else if (item.totalAmount !== undefined && item.totalAmount !== '' && !isNaN(parseFloat(item.totalAmount))) {
                        lineTotal = Math.round(parseFloat(item.totalAmount) * 100) / 100;
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            message: `Item "${title}" ke liye rate ya total amount dalna lazmi hai.`
                        }));
                        return;
                    }

                    totalSqFt += (sqFt * qty);
                    totalWorkAmount += lineTotal;

                    processedItems.push({
                        title,
                        category,
                        length,
                        width,
                        sqFt,
                        rate: rate !== null ? rate : 0,
                        quantity: qty,
                        totalAmount: lineTotal,
                        customNote: String(item.customNote || item.notes || '').trim()
                    });
                }

                const allWork = readJsonFile(KARIGAR_WORK_FILE, []);
                const workId = "WRK-" + Date.now();

                const newWorkEntry = {
                    id: workId,
                    karigarId: karigar.id,
                    karigarName: karigar.name,
                    date,
                    items: processedItems,
                    totalSqFt: Math.round(totalSqFt * 100) / 100,
                    totalAmount: Math.round(totalWorkAmount * 100) / 100,
                    notes,
                    createdAt: new Date().toISOString()
                };

                allWork.unshift(newWorkEntry);
                writeJsonFile(KARIGAR_WORK_FILE, allWork);

                // Check for immediate payment deduction if admin provided
                let linkedPayment = null;
                if (data.paymentDeduction && parseFloat(data.paymentDeduction.amount) > 0) {
                    const payAmount = parseFloat(data.paymentDeduction.amount);
                    const allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);
                    const payId = "PAY-" + (Date.now() + 1);
                    linkedPayment = {
                        id: payId,
                        karigarId: karigar.id,
                        karigarName: karigar.name,
                        date,
                        amount: Math.round(payAmount * 100) / 100,
                        paymentMethod: String(data.paymentDeduction.method || 'Cash').trim(),
                        notes: String(data.paymentDeduction.notes || 'Roznamcha bill ke waqt adaigi (Deduction)').trim(),
                        receiptNo: "REC-" + Math.floor(1000 + Math.random() * 9000),
                        linkedWorkId: workId,
                        createdAt: new Date().toISOString()
                    };
                    allPayments.unshift(linkedPayment);
                    writeJsonFile(KARIGAR_PAYMENTS_FILE, allPayments);
                }

                logSecurityEvent('ADMIN_KARIGAR_WORK_RECORDED', clientIp, `Recorded work ${workId} for ${karigar.name} (Amount: Rs. ${totalWorkAmount})`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    workEntry: newWorkEntry,
                    paymentEntry: linkedPayment,
                    message: "Roznamcha kaam kamyabi se darj ho gaya."
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload: " + err.message }));
            }
        });
        return;
    }

    // API: DELETE /api/admin/karigar-work
    if (req.method === 'DELETE' && parsedUrl === '/api/admin/karigar-work') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        const urlParts = req.url.split('?');
        const params = new URLSearchParams(urlParts[1] || '');
        const id = params.get('id');

        let allWork = readJsonFile(KARIGAR_WORK_FILE, []);
        allWork = allWork.filter(w => w.id !== id);
        writeJsonFile(KARIGAR_WORK_FILE, allWork);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Work entry delete ho gai." }));
        return;
    }

    // API: POST /api/admin/karigar-payment (Record Cash/Transfer Payment & Deduct From Balance)
    if (req.method === 'POST' && parsedUrl === '/api/admin/karigar-payment') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const karigarId = String(data.karigarId || '').trim();
                const amount = parseFloat(data.amount);
                const date = String(data.date || new Date().toISOString().slice(0, 10)).trim();
                const paymentMethod = String(data.paymentMethod || 'Cash').trim();
                const notes = String(data.notes || '').trim();
                const receiptNo = String(data.receiptNo || ("REC-" + Math.floor(1000 + Math.random() * 9000))).trim();

                const karigars = readJsonFile(KARIGARS_FILE, []);
                const karigar = karigars.find(k => k.id === karigarId);
                if (!karigar) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Karigar select nahi kia gaya." }));
                    return;
                }

                if (!amount || isNaN(amount) || amount <= 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Durust raqam (Amount > 0) darj karein." }));
                    return;
                }

                const allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);
                const payId = "PAY-" + Date.now();

                const newPayment = {
                    id: payId,
                    karigarId: karigar.id,
                    karigarName: karigar.name,
                    date,
                    amount: Math.round(amount * 100) / 100,
                    paymentMethod,
                    notes,
                    receiptNo,
                    createdAt: new Date().toISOString()
                };

                allPayments.unshift(newPayment);
                writeJsonFile(KARIGAR_PAYMENTS_FILE, allPayments);

                logSecurityEvent('ADMIN_KARIGAR_PAYMENT_RECORDED', clientIp, `Recorded payment of Rs. ${amount} to ${karigar.name}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    payment: newPayment,
                    message: `Rs. ${amount} ki adaigi kamyabi se record ho gai aur khata se deduct ho gai.`
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid payload." }));
            }
        });
        return;
    }

    // API: DELETE /api/admin/karigar-payment
    if (req.method === 'DELETE' && parsedUrl === '/api/admin/karigar-payment') {
        const token = extractBearerToken(req);
        if (!validateSessionToken(token)) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Admin login zaroori hai." }));
            return;
        }

        const urlParts = req.url.split('?');
        const params = new URLSearchParams(urlParts[1] || '');
        const id = params.get('id');

        let allPayments = readJsonFile(KARIGAR_PAYMENTS_FILE, []);
        allPayments = allPayments.filter(p => p.id !== id);
        writeJsonFile(KARIGAR_PAYMENTS_FILE, allPayments);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: "Payment entry delete ho gai." }));
        return;
    }

    // ==========================================
    // Static File Serving with Strict Path Traversal Protection
    // ==========================================
    let reqUrl = parsedUrl;
    if (reqUrl === '/') reqUrl = '/index.html';

    // Prevent directory traversal attacks
    const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    // Verify filePath is strictly inside the project root
    if (!filePath.startsWith(__dirname)) {
        logSecurityEvent('PATH_TRAVERSAL_BLOCKED', clientIp, `Attempted path: ${reqUrl}`);
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Bilal Decor Studio secure server running at http://localhost:${PORT}`);
    console.log(`[Security] PBKDF2 Password Hashing & Anti-Brute-Force Rate Limiting Active.`);
});
