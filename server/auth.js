import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

const COOKIE = 'cs_token';

export function verifyCredentials(username, password) {
  if (!username || !password) return false;
  if (username !== config.adminUser) return false;
  if (config.adminPasswordHash) {
    return bcrypt.compareSync(password, config.adminPasswordHash);
  }
  return password === config.adminPassword;
}

export function issueToken(res, username) {
  const token = jwt.sign({ sub: username, role: 'admin' }, config.jwtSecret, {
    expiresIn: '7d',
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearToken(res) {
  res.clearCookie(COOKIE);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
