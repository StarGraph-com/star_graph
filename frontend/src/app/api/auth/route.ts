import { type NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth";

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type SignedIn = { user: AuthUser; session: SessionTokens };
type Registration = SignedIn | { user: null; session: null; message: string };
type CurrentSession = {
  user: AuthUser;
  accessToken: string;
  renewed?: SessionTokens;
};

const accessCookie = "stargraph_access";
const refreshCookie = "stargraph_refresh";
const privateHeaders = { "Cache-Control": "no-store" };
const unavailable = "Authentication is temporarily unavailable.";

class AuthError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function callBackend(
  action: "login" | "register" | "me" | "refresh" | "logout",
  options: { body?: object; token?: string } = {},
) {
  const backend = process.env.BACKEND_URL || "http://127.0.0.1:3001";
  const headers = new Headers();
  if (options.body) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${backend.replace(/\/+$/, "")}/auth/${action}`, {
      method: action === "me" ? "GET" : "POST",
      headers,
      body: options.body && JSON.stringify(options.body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new AuthError(503, unavailable);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new AuthError(
      response.status,
      typeof body?.message === "string" ? body.message : unavailable,
    );
  }
  return response;
}

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return json({ message: error.message }, error.status);
  }
  return json({ message: unavailable }, 503);
}

function setSession(
  request: NextRequest,
  response: NextResponse,
  tokens: SessionTokens | null,
) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
    path: "/api/auth",
  };
  response.cookies.set(accessCookie, tokens?.accessToken ?? "", {
    ...options,
    maxAge: tokens?.expiresIn ?? 0,
  });
  response.cookies.set(
    refreshCookie,
    tokens?.refreshToken ?? "",
    tokens ? options : { ...options, maxAge: 0 },
  );
}

function sessionRejected(error: unknown) {
  return error instanceof AuthError && [401, 403].includes(error.status);
}

async function currentSession(request: NextRequest): Promise<CurrentSession | null> {
  const accessToken = request.cookies.get(accessCookie)?.value;
  const refreshToken = request.cookies.get(refreshCookie)?.value;

  if (accessToken) {
    try {
      const response = await callBackend("me", { token: accessToken });
      const { user }: { user: AuthUser } = await response.json();
      return { user, accessToken };
    } catch (error) {
      if (!sessionRejected(error)) throw error;
    }
  }

  if (!refreshToken) return null;

  try {
    const response = await callBackend("refresh", { body: { refreshToken } });
    const { user, session }: SignedIn = await response.json();
    return { user, accessToken: session.accessToken, renewed: session };
  } catch (error) {
    if (sessionRejected(error)) return null;
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await currentSession(request);
    const response = json({ user: auth?.user ?? null });
    if (auth?.renewed) {
      setSession(request, response, auth.renewed);
    } else if (!auth && (request.cookies.has(accessCookie) || request.cookies.has(refreshCookie))) {
      setSession(request, response, null);
    }
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return json({ message: "Send authentication details as JSON." }, 415);
  }
  const { action, email, password } = (await request.json().catch(() => null)) ?? {};
  if (action !== "login" && action !== "register") {
    return json({ message: "Choose sign in or registration." }, 400);
  }

  try {
    const upstream = await callBackend(action, { body: { email, password } });
    const result: Registration = await upstream.json();
    const response = json(
      { user: result.user, message: "message" in result ? result.message : undefined },
      upstream.status,
    );
    if (result.session) setSession(request, response, result.session);
    return response;
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  let auth: CurrentSession | null = null;
  try {
    auth = await currentSession(request);
    if (auth) await callBackend("logout", { token: auth.accessToken });
  } catch (error) {
    if (!sessionRejected(error)) {
      const response = authErrorResponse(error);
      if (auth?.renewed) setSession(request, response, auth.renewed);
      return response;
    }
  }

  const response = new NextResponse(null, { status: 204, headers: privateHeaders });
  setSession(request, response, null);
  return response;
}
