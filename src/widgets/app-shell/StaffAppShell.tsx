import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { APP_PROFILE, STAFF_MODULES, type StaffViewId } from "../../shared/config/app-modules";
import { useAuthStore } from "../../features/auth/auth-store";
import WindowControls from "../../shared/ui/WindowControls";
import { ContentRefreshProvider } from "../../shared/lib/content-refresh";

const APP_VERSION = __APP_VERSION__;

/**
 * 직원 콘솔 셸. 참조앱(tc-dx-mybatis) 레일 구조를 병원 브랜드로 옮겼다.
 * 좌측 레일 = 모듈 + 하단 계정, 우상단 = 창 조작 버튼.
 */
function StaffAppShell({
  active,
  onSelect,
  children,
}: {
  active: StaffViewId;
  onSelect: (id: StaffViewId) => void;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  // 참조앱과 동일한 소프트 새로고침: 본문을 key 로 리마운트하고 650ms 동안 스피너를 돌린다.
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const [isRefreshingContent, setIsRefreshingContent] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  function refreshContent() {
    if (isRefreshingContent) return;
    setIsRefreshingContent(true);
    setContentRefreshKey((key) => key + 1);
    refreshTimerRef.current = window.setTimeout(() => {
      setIsRefreshingContent(false);
      refreshTimerRef.current = null;
    }, 650);
  }

  useEffect(
    () => () => {
      if (refreshTimerRef.current !== null) window.clearTimeout(refreshTimerRef.current);
    },
    [],
  );

  const displayName = user?.username || user?.email || "직원";
  const roleName = user?.role?.name ?? "직원";

  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  const railTint = (percent: number) =>
    `color-mix(in srgb, var(--primary-foreground) ${percent}%, transparent)`;

  return (
    <div className="relative flex h-screen overflow-hidden">
      <nav
        className="flex w-[72px] shrink-0 flex-col items-center text-text-on-brand"
        style={{
          backgroundImage:
            "linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 82%, black) 100%)",
        }}
      >
        <div
          className="flex h-12 w-full shrink-0 items-center justify-center border-b"
          style={{ borderColor: railTint(10) }}
        >
          <span
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[22px] text-[22px] shadow-sm"
            style={{ backgroundColor: railTint(15) }}
            title={APP_PROFILE.hospitalName}
          >
            🏥
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto py-1.5">
          {STAFF_MODULES.map((module) => {
            const isActive = module.id === active;
            return (
              <button
                key={module.id}
                onClick={() => onSelect(module.id)}
                title={module.ready ? module.label : `${module.label} (준비 중)`}
                className={
                  "group relative flex h-[44px] w-[50px] flex-col items-center justify-center gap-0.5 transition-all duration-300 ease-in-out " +
                  (isActive ? "rounded-[15px]" : "rounded-[24px] hover:rounded-[15px]") +
                  (module.ready ? "" : " opacity-55")
                }
                style={{ backgroundColor: isActive ? railTint(25) : undefined }}
              >
                <span
                  className={
                    "absolute -left-2.5 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-text-on-brand transition-all duration-300 ease-in-out " +
                    (isActive ? "h-6" : "h-0 group-hover:h-3")
                  }
                />
                <module.icon className="size-[18px] shrink-0" strokeWidth={2} />
                <span className="w-full overflow-hidden px-0.5 text-center text-[9px] font-semibold leading-[1.05] [word-break:keep-all]">
                  {module.label}
                </span>
              </button>
            );
          })}
        </div>

        <div
          ref={accountRef}
          className="relative flex w-full flex-wrap items-center justify-center gap-1.5 border-t px-1 py-2"
          style={{ borderColor: railTint(10) }}
        >
          <span
            title={`${APP_PROFILE.displayName} v${APP_VERSION}`}
            className="max-h-3 select-none overflow-hidden text-[9px] font-bold tabular-nums"
            style={{ color: railTint(85) }}
          >
            v{APP_VERSION}
          </span>

          <button
            onClick={() => onSelect("settings")}
            title="설정"
            className={
              "flex h-[34px] w-[34px] items-center justify-center transition-all duration-200 " +
              (active === "settings" ? "rounded-[14px]" : "rounded-[20px] hover:rounded-[14px]")
            }
            style={{ backgroundColor: active === "settings" ? railTint(25) : undefined }}
          >
            <Settings className="size-[18px]" strokeWidth={2} />
          </button>

          <button
            onClick={() => setAccountOpen((open) => !open)}
            title={`${displayName} · ${roleName}`}
            className={
              "grid h-[34px] w-[34px] place-items-center rounded-lg border p-0 transition-all " +
              (accountOpen
                ? "bg-surface-raised shadow-lg"
                : "border-transparent bg-transparent hover:bg-[color-mix(in_srgb,var(--primary-foreground)_20%,transparent)]")
            }
            style={{ borderColor: accountOpen ? railTint(60) : undefined }}
          >
            <span className="grid h-[28px] w-[28px] place-items-center overflow-hidden rounded-full border bg-surface-raised text-[11px] font-black uppercase text-text-primary"
                  style={{ borderColor: railTint(30) }}>
              {displayName.charAt(0) || "U"}
            </span>
          </button>

          {accountOpen && (
            <div className="absolute bottom-[52px] left-[64px] z-50 w-[200px] rounded-lg border border-surface-border bg-surface-raised p-1.5 text-text-primary shadow-xl">
              <div className="border-b border-surface-border-soft px-2.5 py-2">
                <p className="truncate text-[13px] font-black">{displayName}</p>
                <p className="truncate text-[11px] font-semibold text-text-secondary">{roleName}</p>
              </div>
              <button
                onClick={() => {
                  setAccountOpen(false);
                  onSelect("profile");
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-bold transition-colors hover:bg-surface-muted"
              >
                <User className="size-4" /> 내 정보
              </button>
              <button
                onClick={() => {
                  setAccountOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-bold text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </nav>

      <ContentRefreshProvider value={{ refresh: refreshContent, isRefreshing: isRefreshingContent }}>
        <div
          key={contentRefreshKey}
          className={
            "flex min-w-0 flex-1 flex-col transition-opacity duration-300 " +
            (isRefreshingContent ? "opacity-60" : "opacity-100")
          }
        >
          {children}
        </div>
      </ContentRefreshProvider>

      <div className="pointer-events-none absolute right-0 top-0 z-50 flex h-12 items-center pr-2">
        <div className="pointer-events-auto">
          <WindowControls />
        </div>
      </div>
    </div>
  );
}

export default StaffAppShell;
