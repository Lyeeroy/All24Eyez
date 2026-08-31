import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  type AuthUser,
} from "./api";

export type AuthStatus = "loading" | "guest" | "authenticated" | "error";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancelled) return;
        setUser(me);
        setStatus(me ? "authenticated" : "guest");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const { user } = await apiLogin(username, password);
      setUser(user);
      setStatus("authenticated");
    },
    []
  );

  const signup = useCallback(
    async (username: string, password: string) => {
      const { user } = await apiSignup(username, password);
      setUser(user);
      setStatus("authenticated");
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Logout should still clear local state even if the request fails.
    }
    setUser(null);
    setStatus("guest");
  }, []);

  const clearError = useCallback(() => {
    setStatus((s) => (s === "error" ? "guest" : s));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, signup, signOut, clearError }),
    [user, status, login, signup, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
