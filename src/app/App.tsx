import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../features/auth/auth-store";
import LoginScreen from "../features/auth/LoginScreen";
import StaffAppShell from "../widgets/app-shell/StaffAppShell";
import HospitalPlaybookModule from "../widgets/hospital-playbook/HospitalPlaybookModule";
import ChatbotModule from "../widgets/chatbot/ChatbotModule";
import SettingsPage from "../widgets/settings/SettingsPage";
import ProfilePage from "../widgets/profile/ProfilePage";
import PageHeader from "../shared/ui/PageHeader";
import type { StaffViewId } from "../shared/config/app-modules";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader>
        <span className="text-[14px] font-bold tracking-tight text-text-primary">{title}</span>
      </PageHeader>
      <div className="grid min-h-0 flex-1 place-items-center bg-surface-muted">
        <p className="text-sm font-semibold text-text-muted">준비 중인 화면입니다.</p>
      </div>
    </>
  );
}

function StaffConsole() {
  const [active, setActive] = useState<StaffViewId>("playbook");

  return (
    <StaffAppShell active={active} onSelect={setActive}>
      {active === "playbook" ? (
        <HospitalPlaybookModule />
      ) : active === "chatbot" ? (
        <ChatbotModule />
      ) : active === "handoff" ? (
        <Placeholder title="직원 연결" />
      ) : active === "settings" ? (
        <SettingsPage />
      ) : (
        <ProfilePage />
      )}
    </StaffAppShell>
  );
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const restoring = useAuthStore((s) => s.restoring);
  const restore = useAuthStore((s) => s.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  if (restoring) {
    return (
      <div className="grid h-screen place-items-center bg-surface-muted text-text-muted">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {user ? <StaffConsole /> : <LoginScreen />}
    </QueryClientProvider>
  );
}
