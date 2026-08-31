import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth } from "../../lib/auth";
import { AuthForm } from "./AuthForm";
import { UserIcon } from "./UserIcon";
import { cn } from "../../utils/cn";

export function UserMenu() {
  const { user, status, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const isAuthed = status === "authenticated" && user !== null;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the panel for keyboard users.
    const t = window.setTimeout(() => {
      panelRef.current?.focus?.();
    }, 0);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, close]);

  const onSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    close();
  };

  const focusedClass = isAuthed
    ? "border-[#f5d7a4]/70 text-[#f5d7a4]"
    : "border-white/15 text-white/70 hover:text-white";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={`user-menu-trigger-${panelId}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `user-menu-panel-${panelId}` : undefined}
        aria-label={isAuthed ? `Account menu for ${user.username}` : "Account"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border bg-black/30 transition-colors",
          focusedClass
        )}
      >
        <UserIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          id={`user-menu-panel-${panelId}`}
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={isAuthed ? "Account menu" : "Sign in"}
          tabIndex={-1}
          className="absolute right-0 top-11 z-50 rounded-xl border border-white/12 bg-[#111012]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur outline-none"
        >
          {status === "loading" ? (
            <p className="w-64 text-sm text-white/50" aria-live="polite">
              Loading…
            </p>
          ) : isAuthed ? (
            <div className="flex w-64 flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5d7a4]/15 text-[#f5d7a4]">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium text-[#e8e4dc]"
                    title={user.username}
                  >
                    {user.username}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-white/35">
                    Signed in
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="rounded-lg px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <AuthForm />
          )}
        </div>
      )}
    </div>
  );
}
