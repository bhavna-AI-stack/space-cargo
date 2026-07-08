import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight admin auth using an HMAC-signed session token.
 *
 * We deliberately avoid adding a JWT dependency (the deploy env can't always
 * fetch new packages). Instead we mint a compact, stateless token of the form:
 *
 *   base64url(payloadJson) + "." + base64url(hmacSha256(payloadJson, secret))
 *
 * The payload carries an expiry; the signature proves it was minted by a holder
 * of ADMIN_TOKEN_SECRET. No DB session table required.
 */

const SECRET = () => process.env.ADMIN_TOKEN_SECRET || '';
const ADMIN_PASSWORD = () => process.env.ADMIN_PASSWORD || '';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadJson: string): string {
  return crypto.createHmac('sha256', SECRET()).update(payloadJson).digest('base64url');
}

export function isAdminConfigured(): boolean {
  return !!SECRET() && !!ADMIN_PASSWORD();
}

/** Constant-time password check against ADMIN_PASSWORD. */
export function verifyAdminPassword(password: string): boolean {
  const expected = ADMIN_PASSWORD();
  if (!expected || typeof password !== 'string') return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function issueToken(): string {
  const payload = { role: 'admin', exp: Date.now() + SESSION_TTL_MS };
  const payloadJson = JSON.stringify(payload);
  const encoded = b64url(payloadJson);
  return `${encoded}.${sign(payloadJson)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token || !SECRET()) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [encoded, sig] = parts;

  let payloadJson: string;
  try {
    payloadJson = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const expectedSig = sign(payloadJson);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(payloadJson);
    if (payload.role !== 'admin') return false;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Express middleware: require a valid admin token in the Authorization header. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: 'Admin panel is not configured on the server.' });
    return;
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}
