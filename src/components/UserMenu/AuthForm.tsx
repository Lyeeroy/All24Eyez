import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const inputBase =
  "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] outline-none transition-colors focus:border-[var(--text-accent)]";

function Field({
  label,
  type,
  autoComplete,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  type: "text" | "password";
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const id = `user-menu-${label.toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        className={inputBase}
        spellCheck={false}
      />
    </div>
  );
}

export function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await signup(username, password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  };

  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-64 flex-col gap-3"
      noValidate
    >
      <p
        className="text-sm font-medium text-[var(--text-main)]"
        role="heading"
        aria-level={2}
      >
        {mode === "login" ? "Sign in" : "Create an account"}
      </p>

      <Field
        label="Username"
        type="text"
        autoComplete="username"
        value={username}
        onChange={setUsername}
        autoFocus
      />
      <Field
        label="Password"
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        value={password}
        onChange={setPassword}
      />

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400 dark:text-rose-300"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !username || password.length === 0}
        className="mt-1 rounded-lg bg-[var(--text-accent)] px-3 py-2 text-sm font-semibold text-black dark:text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>

      <button
        type="button"
        onClick={() => switchMode(mode === "login" ? "signup" : "login")}
        className="text-xs text-[var(--text-muted)] underline-offset-2 transition-colors hover:text-[var(--text-main)] hover:underline"
      >
        {mode === "login"
          ? "No account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
