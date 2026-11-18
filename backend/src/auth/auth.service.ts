import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

type Credentials = { email: string; password: string };
export type AuthUser = { id: string; email: string | null };
export type AuthSession = {
  user: AuthUser;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

const endpoints = {
  register: 'signup',
  login: 'token?grant_type=password',
  refresh: 'token?grant_type=refresh_token',
  logout: 'logout?scope=local',
  user: 'user',
};

type AuthOperation = keyof typeof endpoints;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function providerUnavailable() {
  return new ServiceUnavailableException(
    'Authentication is temporarily unavailable.',
  );
}

function readUser(value: unknown): AuthUser {
  const { id, email, is_anonymous: isAnonymous } = asObject(value);
  if (isAnonymous === true) {
    throw new ForbiddenException('Sign in with a registered account.');
  }
  if (typeof id !== 'string' || !id) {
    throw providerUnavailable();
  }
  return { id, email: typeof email === 'string' && email ? email : null };
}

function readSession(data: Record<string, unknown>): AuthSession {
  const {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
  } = data;
  if (
    typeof accessToken !== 'string' ||
    !accessToken ||
    typeof refreshToken !== 'string' ||
    !refreshToken ||
    typeof expiresIn !== 'number' ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    throw providerUnavailable();
  }
  return {
    user: readUser(data.user),
    session: { accessToken, refreshToken, expiresIn },
  };
}

@Injectable()
export class AuthService {
  async register(credentials: Credentials) {
    const data = await this.request('register', {
      ...credentials,
      // The email link confirms the account without issuing tokens in the redirect.
      // The client signs in with its password after confirmation.
      code_challenge: randomBytes(32).toString('base64url'),
      code_challenge_method: 's256',
    });
    if (typeof data.id === 'string' && !('access_token' in data)) {
      return {
        user: null,
        session: null,
        message:
          'If this address can be registered, check your email for a confirmation link, then sign in.',
      };
    }
    return readSession(data);
  }

  async login(credentials: Credentials): Promise<AuthSession> {
    return readSession(await this.request('login', credentials));
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    return readSession(
      await this.request('refresh', { refresh_token: refreshToken }),
    );
  }

  async logout(accessToken: string): Promise<void> {
    await this.request('logout', undefined, accessToken);
  }

  async getUser(accessToken: string): Promise<AuthUser> {
    return readUser(await this.request('user', undefined, accessToken));
  }

  private async request(
    operation: AuthOperation,
    body?: Record<string, string>,
    accessToken?: string,
  ): Promise<Record<string, unknown>> {
    const projectUrl = process.env.SUPABASE_URL?.trim();
    const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
    if (!projectUrl || !apiKey) {
      throw providerUnavailable();
    }

    const url = `${projectUrl.replace(/\/+$/, '')}/auth/v1/${endpoints[operation]}`;
    const headers: Record<string, string> = {
      apikey: apiKey,
      'X-Supabase-Api-Version': '2024-01-01',
    };
    if (body) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: operation === 'user' ? 'GET' : 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw providerUnavailable();
    }

    if (response.status === 204 && operation === 'logout') {
      return {};
    }
    const result = asObject(await response.json().catch(() => null));
    if (!response.ok) {
      const code =
        typeof result.code === 'string' ? result.code : result.error_code;
      throw this.authError(operation, response.status, code);
    }
    if (operation === 'logout') {
      throw providerUnavailable();
    }
    return result;
  }

  private authError(operation: AuthOperation, status: number, code: unknown) {
    if (status >= 500) {
      return providerUnavailable();
    }
    if (status === 429) {
      return new HttpException(
        'Too many authentication attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    switch (code) {
      case 'invalid_credentials':
      case 'user_banned':
        // Supabase can report a ban before verifying the password.
        if (code === 'user_banned' && operation !== 'login') {
          return new ForbiddenException('This account is blocked.');
        }
        return new UnauthorizedException('Email or password is incorrect.');
      case 'email_not_confirmed':
        return new ForbiddenException('Confirm your email before signing in.');
      case 'weak_password':
        return new BadRequestException(
          'Choose a stronger password that meets the password requirements.',
        );
      case 'email_address_invalid':
        return new BadRequestException('Enter a valid email address.');
      case 'validation_failed':
        return operation === 'user'
          ? new UnauthorizedException(
              'Session is invalid or expired. Sign in again.',
            )
          : new BadRequestException(
              'Check the submitted authentication details.',
            );
      case 'email_address_not_authorized':
        return new ForbiddenException(
          'Registration emails cannot be sent to this address.',
        );
      case 'user_already_exists':
      case 'email_exists':
        return new ConflictException(
          'An account already exists for this email.',
        );
      case 'email_provider_disabled':
      case 'signup_disabled':
        return new ForbiddenException(
          'This authentication operation is disabled.',
        );
      case 'bad_jwt':
      case 'no_authorization':
      case 'session_expired':
      case 'session_not_found':
      case 'user_not_found':
      case 'refresh_token_not_found':
      case 'refresh_token_already_used':
        return new UnauthorizedException(
          'Session is invalid or expired. Sign in again.',
        );
      default:
        return providerUnavailable();
    }
  }
}
