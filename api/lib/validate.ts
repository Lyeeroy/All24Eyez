/**
 * Username policy: 3–32 chars, letters, digits, underscore, hyphen, period.
 * Enforced on the server (never trust the client).
 */
export const USERNAME_RE = /^[A-Za-z0-9_.-]{3,32}$/;

/** Password must be at least 8 characters. */
export function validateCredentials(username: string, password: string):
  | { ok: true }
  | { ok: false; message: string } {
  const uname = typeof username === "string" ? username.trim() : "";
  const pword = typeof password === "string" ? password : "";

  if (!USERNAME_RE.test(uname)) {
    return {
      ok: false,
      message:
        "Username must be 3–32 characters using letters, numbers, _, -, or .",
    };
  }
  if (pword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  return { ok: true };
}
