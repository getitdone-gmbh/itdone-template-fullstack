import { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

declare global {
  namespace Express {
    interface Request {
      user?: { sub: string; email?: string; name?: string };
    }
  }
}

const issuer = process.env.OIDC_ISSUER;
const clientId = process.env.OIDC_CLIENT_ID;

const jwks = issuer
  ? createRemoteJWKSet(new URL(`${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`))
  : null;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!issuer || !jwks) {
    return res.status(500).json({ error: 'OIDC_ISSUER not configured' });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    const sub = payload.sub;
    if (!sub) {
      return res.status(401).json({ error: 'Token missing sub' });
    }
    if (clientId) {
      const aud = payload.aud;
      const azp = (payload as JWTPayload & { azp?: string }).azp;
      const audOk = Array.isArray(aud) ? aud.includes(clientId) : aud === clientId;
      if (!audOk && azp !== clientId) {
        return res.status(401).json({ error: 'Token audience mismatch' });
      }
    }
    req.user = {
      sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
