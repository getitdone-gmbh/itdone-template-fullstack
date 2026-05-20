import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export interface AuthUser {
  sub: string;
  email?: string;
  name?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const issuer = process.env.OIDC_ISSUER;
    if (!issuer) {
      throw new Error('OIDC_ISSUER is not configured');
    }
    const audience = process.env.OIDC_CLIENT_ID;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${issuer.replace(/\/$/, '')}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer,
      algorithms: ['RS256'],
      // We validate audience/azp manually below, since access tokens may carry
      // it in `azp` rather than `aud`.
      audience: undefined,
      passReqToCallback: false,
    });

    this._audience = audience;
  }

  private readonly _audience?: string;

  async validate(payload: any): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Token missing sub');
    }
    if (this._audience) {
      const aud = payload.aud;
      const audOk = Array.isArray(aud) ? aud.includes(this._audience) : aud === this._audience;
      if (!audOk && payload.azp !== this._audience) {
        throw new UnauthorizedException('Token audience mismatch');
      }
    }
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  }
}
