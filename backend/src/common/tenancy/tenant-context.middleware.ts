import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { tenantStorage } from './tenant-context';

export interface AuthPayload {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
}

declare module 'express' {
  interface Request {
    auth?: AuthPayload;
  }
}

/**
 * Best-effort: verifies the access token (if present), attaches req.auth, and
 * runs the rest of the request inside the tenant AsyncLocalStorage context.
 * Enforcement (required auth, roles) is handled by guards.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    let payload: AuthPayload | undefined;
    const header = req.headers.authorization;

    if (header?.startsWith('Bearer ')) {
      const token = header.slice(7);
      try {
        payload = this.jwt.verify<AuthPayload>(token, {
          secret: this.config.get<string>('jwt.accessSecret'),
        });
        req.auth = payload;
      } catch {
        // Invalid/expired token: leave req.auth unset; guards will reject if needed.
      }
    }

    tenantStorage.run(
      {
        tenantId: payload?.tenantId ?? null,
        userId: payload?.sub ?? null,
        role: payload?.role ?? null,
      },
      () => next(),
    );
  }
}
