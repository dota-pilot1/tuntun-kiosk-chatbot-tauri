/**
 * 병원 서버 전용 API 클라이언트.
 * Towercrane 토큰 키를 쓰지 않도록 저장소 키에 병원 접두사를 붙인다.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4301";

const ACCESS_KEY = "tuntun.kiosk.accessToken";
const REFRESH_KEY = "tuntun.kiosk.refreshToken";

export const tokenStorage = {
  access: () => localStorage.getItem(ACCESS_KEY),
  refresh: () => localStorage.getItem(REFRESH_KEY),
  save(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  errorMessage?: string;
  /** 401 재시도 루프를 막기 위해 refresh 요청 자신은 이 플래그로 제외한다. */
  skipRefresh?: boolean;
};

async function rawRequest(path: string, options: RequestOptions): Promise<Response> {
  const token = tokenStorage.access();
  return fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/** access token 이 만료됐을 때 한 번만 조용히 재발급한다. 실패하면 로그아웃 상태로 떨군다. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStorage.refresh();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    tokenStorage.clear();
    return false;
  }

  const data = (await response.json()) as { accessToken: string; refreshToken: string };
  tokenStorage.save(data.accessToken, data.refreshToken);
  return true;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await rawRequest(path, options);

  if (response.status === 401 && !options.skipRefresh && (await tryRefresh())) {
    response = await rawRequest(path, options);
  }

  if (!response.ok) {
    let message = options.errorMessage ?? "요청을 처리하지 못했습니다.";
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // 응답 본문이 JSON이 아니면 기본 메시지를 그대로 쓴다
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
