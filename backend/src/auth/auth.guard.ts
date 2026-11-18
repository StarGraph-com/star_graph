import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth.service';

export type AuthenticatedRequest = Request & { authUser: AuthUser };

export function readBearerToken(authorization: string | undefined): string {
  const token = /^Bearer +([A-Za-z0-9._~+/-]+=*)$/i.exec(
    authorization ?? '',
  )?.[1];
  if (!token) {
    throw new UnauthorizedException('Provide a Bearer access token.');
  }
  return token;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = readBearerToken(request.headers.authorization);
    request.authUser = await this.authService.getUser(token);
    return true;
  }
}
