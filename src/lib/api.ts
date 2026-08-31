export interface AuthUser {
  id: string;
  username: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // Network / CORS failure (e.g. backend not running or blocked).
    throw new ApiError(
      0,
      "Could not reach the server. Is the API running? (use `vercel dev`)"
    );
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const serverMsg =
      body && typeof body === "object" && "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : undefined;

    const message =
      serverMsg ??
      (body === null
        ? `Request failed (${res.status}). The API returned a non-JSON response — is the backend running?`
        : `Request failed (${res.status})`);
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export async function signup(username: string, password: string) {
  return request<{ user: AuthUser }>("/api/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username: string, password: string) {
  return request<{ user: AuthUser }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return request<{ ok: boolean }>("/api/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await request<{ user: AuthUser }>("/api/me", {
      method: "GET",
    });
    return res.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}
