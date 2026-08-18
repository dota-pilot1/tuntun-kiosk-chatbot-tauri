import { BookOpenText, Bot, PhoneCall, type LucideIcon } from "lucide-react";

export type StaffViewId = "playbook" | "chatbot" | "handoff" | "settings" | "profile";

export type StaffModuleDefinition = {
  id: StaffViewId;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

/** 직원 콘솔 레일 메뉴. 계획서 §6의 직원 모드 메뉴에서 1차 MVP 범위만 노출한다. */
export const STAFF_MODULES: StaffModuleDefinition[] = [
  { id: "playbook", label: "튼튼척 노트", icon: BookOpenText, ready: true },
  { id: "chatbot", label: "챗봇", icon: Bot, ready: true },
  { id: "handoff", label: "직원 연결", icon: PhoneCall, ready: false },
];

export const APP_PROFILE = {
  displayName: "튼튼 키오스크",
  hospitalName: "튼튼척의원",
} as const;
