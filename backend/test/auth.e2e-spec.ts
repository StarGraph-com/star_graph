import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const projectUrl = 'https://stargraph-tests.supabase.co';
const authUrl = `${projectUrl}/auth/v1`;
const publishableKey = 'sb_publishable_test';
const user = {
  id: 'e58c052a-f3b7-4bbc-b66a-049a16abd9d0',
  email: 'user@example.com',
};
const providerUser = { ...user, app_metadata: { provider: 'email' } };
const credentials = { email: user.email, password: ' a test password ' };
const session = {
  accessToken: 'first.access.token',
  refreshToken: 'first-refresh',
  expiresIn: 3600,
};
const refreshedSession = {
  ...session,
  accessToken: 'new.access.token',
  refreshToken: 'new-refresh',
};

function sessionResponse(tokens: typeof session) {
  return Response.json({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expires_in: tokens.expiresIn,
    user: providerUser,
  });
}

function providerError(code: string, status: number) {
  return Response.json(
    { code, message: 'Internal provider details' },
    { status },
  );
}

describe('Authentication API', () => {
  let app: INestApplication<App>;
  let provider: jest.SpiedFunction<typeof fetch>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
    provider = jest.spyOn(globalThis, 'fetch');
  });

  beforeEach(() => {
    jest.replaceProperty(process, 'env', {
      ...process.env,
      SUPABASE_URL: `${projectUrl}/`,
      SUPABASE_PUBLISHABLE_KEY: publishableKey,
    });
    provider
      .mockReset()
      .mockRejectedValue(new Error('Unexpected upstream request'));
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('registers an account and returns a session when confirmation is disabled', async () => {
    provider.mockResolvedValueOnce(sessionResponse(session));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...credentials, role: 'service_role' })
      .expect(201, { user, session })
      .expect('Cache-Control', 'no-store');

    expect(provider).toHaveBeenCalledWith(
      `${authUrl}/signup`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          apikey: publishableKey,
          'Content-Type': 'application/json',
          'X-Supabase-Api-Version': '2024-01-01',
        },
        redirect: 'error',
      }),
    );
    const rawBody = provider.mock.calls[0][1]?.body;
    if (typeof rawBody !== 'string') {
      throw new Error('Expected a JSON request body');
    }
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    expect(body).toMatchObject({
      ...credentials,
      code_challenge_method: 's256',
    });
    expect(body.code_challenge).toMatch(/^[\w-]{43}$/);
    expect(body).not.toHaveProperty('role');
  });

  it('returns confirmation instructions and no identity or tokens when email confirmation is required', async () => {
    provider.mockResolvedValueOnce(Response.json(providerUser));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201, {
        user: null,
        session: null,
        message:
          'If this address can be registered, check your email for a confirmation link, then sign in.',
      });
  });

  it('logs in, checks the bearer token, rotates it, and revokes the session at logout', async () => {
    provider
      .mockResolvedValueOnce(sessionResponse(session))
      .mockResolvedValueOnce(Response.json(providerUser))
      .mockResolvedValueOnce(sessionResponse(refreshedSession))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(providerError('session_not_found', 403))
      .mockResolvedValueOnce(providerError('refresh_token_not_found', 400));

    const api = request(app.getHttpServer());
    await api
      .post('/auth/login')
      .send(credentials)
      .expect(200, { user, session })
      .expect('Cache-Control', 'no-store');
    await api
      .get('/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200, { user })
      .expect('Cache-Control', 'no-store');
    await api
      .post('/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(200, { user, session: refreshedSession })
      .expect('Cache-Control', 'no-store');
    await api
      .post('/auth/logout')
      .set('Authorization', `Bearer ${refreshedSession.accessToken}`)
      .expect(204, '');
    await api
      .get('/auth/me')
      .set('Authorization', `Bearer ${refreshedSession.accessToken}`)
      .expect(401);
    await api
      .post('/auth/refresh')
      .send({ refreshToken: refreshedSession.refreshToken })
      .expect(401);

    expect(provider).toHaveBeenNthCalledWith(
      1,
      `${authUrl}/token?grant_type=password`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    );
    expect(provider).toHaveBeenNthCalledWith(
      2,
      `${authUrl}/user`,
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(provider.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: `Bearer ${session.accessToken}`,
    });
    expect(provider).toHaveBeenNthCalledWith(
      3,
      `${authUrl}/token?grant_type=refresh_token`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      }),
    );
    expect(provider).toHaveBeenNthCalledWith(
      4,
      `${authUrl}/logout?scope=local`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(provider.mock.calls[3][1]?.headers).toMatchObject({
      Authorization: `Bearer ${refreshedSession.accessToken}`,
    });
  });

  it('rejects missing credentials and malformed bearer headers', async () => {
    const api = request(app.getHttpServer());
    await api
      .post('/auth/register')
      .send({ email: 'invalid', password: 'abc' })
      .expect(400);
    await api.post('/auth/login').send({ email: user.email }).expect(400);
    await api.post('/auth/refresh').send({ refreshToken: ' ' }).expect(400);
    await api.get('/auth/me').expect(401);
    await api
      .get('/auth/me')
      .set('Authorization', 'Bearer token, Bearer another')
      .expect(401);
    await api
      .post('/auth/logout')
      .set('Authorization', 'Basic token')
      .expect(401);
    expect(provider).not.toHaveBeenCalled();
  });

  it('rejects invalid and expired access tokens', async () => {
    provider.mockResolvedValueOnce(
      Response.json({ error_code: 'bad_jwt' }, { status: 403 }),
    );
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.token')
      .expect(401);
  });

  it.each([
    [
      'login',
      'invalid_credentials',
      400,
      401,
      'Email or password is incorrect.',
    ],
    ['login', 'user_banned', 400, 401, 'Email or password is incorrect.'],
    [
      'login',
      'email_not_confirmed',
      400,
      403,
      'Confirm your email before signing in.',
    ],
    [
      'register',
      'weak_password',
      422,
      400,
      'Choose a stronger password that meets the password requirements.',
    ],
  ])(
    'returns a safe error for %s when Supabase reports %s',
    async (route, code, upstreamStatus, status, message) => {
      provider.mockResolvedValueOnce(providerError(code, upstreamStatus));
      await request(app.getHttpServer())
        .post(`/auth/${route}`)
        .send(credentials)
        .expect(status)
        .expect(({ body }: { body: unknown }) => {
          expect(body).toEqual(expect.objectContaining({ message }));
        });
    },
  );

  it('keeps upstream rate limits and fails closed during an outage or malformed provider response', async () => {
    provider.mockResolvedValueOnce(
      new Response('Rate limited', { status: 429 }),
    );
    const api = request(app.getHttpServer());
    await api.post('/auth/login').send(credentials).expect(429);
    await api
      .get('/auth/me')
      .set('Authorization', 'Bearer valid.token')
      .expect(503);

    provider.mockResolvedValueOnce(
      Response.json({ access_token: 'partial.token' }),
    );
    await api.post('/auth/login').send(credentials).expect(503);
  });
});
