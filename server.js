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

// Ensure DB directory and files exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, 'Customer_ID,Date,Customer_Name,Phone,City,Marquee_Name,Design_Title,Category,Length_ft,Width_ft,Total_SqFt,Rate_Per_SqFt,Quantity,Total_Amount_PKR,Advance_Paid_PKR,Balance_Due_PKR,Payment_Status,Order_Status\n', 'utf8');
}
if (!fs.existsSync(JSON_FILE)) {
    fs.writeFileSync(JSON_FILE, '[]', 'utf8');
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
