import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Hospital, Loader2 } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuthStore } from "./auth-store";
import { APP_PROFILE } from "../../shared/config/app-modules";
import WindowControls from "../../shared/ui/WindowControls";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** 직원 콘솔 로그인. 참조앱 Login 화면의 구성을 병원 브랜드로 옮겼다. */
function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "로그인에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-surface-muted">
      <header
        className="flex h-12 shrink-0 select-none items-center justify-between border-b border-surface-border-soft bg-surface-raised px-4"
        onMouseDown={(e) => {
          if (!isTauri || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
          void getCurrentWindow().startDragging();
        }}
      >
        <span className="text-[14px] font-bold tracking-tight text-text-primary">
          {APP_PROFILE.displayName}
        </span>
        <WindowControls />
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center px-5">
        <form
          onSubmit={submit}
          className="w-full max-w-[380px] rounded-xl border border-surface-border-soft bg-surface-raised p-7 shadow-sm"
        >
          <div className="flex flex-col items-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-glass">
              <Hospital className="size-7 text-brand-primary" />
            </span>
            <h1 className="mt-4 text-xl font-black tracking-tight text-text-primary">
              {APP_PROFILE.hospitalName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-text-secondary">직원 콘솔에 로그인하세요</p>
          </div>

          <label className="mt-6 block text-[13px] font-bold text-text-primary" htmlFor="email">
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="ui-input mt-1.5"
          />

          <label className="mt-4 block text-[13px] font-bold text-text-primary" htmlFor="password">
            비밀번호
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-text-muted transition-colors hover:text-text-primary"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] font-semibold text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email.trim() || !password}
            className="ui-icon-button-brand mt-6 h-10 w-full gap-2 text-sm font-black disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            로그인
          </button>

          <p className="mt-5 text-center text-[12px] font-semibold leading-5 text-text-muted">
            환자용 안내 화면은 로그인 없이 동작합니다.
            <br />
            직원 계정은 병원 관리자에게 문의하세요.
          </p>
        </form>
      </main>
    </div>
  );
}

export default LoginScreen;
