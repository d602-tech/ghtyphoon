/**
 * GAS API 客戶端
 * 所有前端與 GAS 後端的通訊都透過這個模組
 */

import { GAS_URL } from "./config";
import type {
  GasResponse, GasSession, GasUser,
  Project, SitePrepPayload, SitePrepRecord,
  OfficePrepPayload, OfficePrepRecord,
  DashboardData, Settings,
  UserRecord, CreateUserPayload,
} from "./gasTypes";

/* ═══════════════════════════════════════════
   Token 儲存
═══════════════════════════════════════════ */
const TOKEN_KEY = "tps_token"; // typhoon prep system token

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/* ═══════════════════════════════════════════
   核心 fetch 封裝
═══════════════════════════════════════════ */
async function gasPost<T>(action: string, payload?: unknown, withToken = true): Promise<T> {
  if (!GAS_URL) throw new Error("GAS_URL 未設定，請在 .env.local 中設定 VITE_GAS_URL");

  const body: Record<string, unknown> = { action, payload };
  if (withToken) body.token = getStoredToken() || "";

  const res = await fetch(GAS_URL, {
    method:  "POST",
    headers: { "Content-Type": "text/plain" }, // GAS 需要 text/plain 避免 preflight
    body:    JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json: GasResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.error || "API 錯誤");
  return json.data as T;
}

/* ═══════════════════════════════════════════
   密碼 Hash (SHA-256, 大寫十六進位)
═══════════════════════════════════════════ */
export async function sha256(text: string): Promise<string> {
  const buf  = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/* ═══════════════════════════════════════════
   認證
═══════════════════════════════════════════ */
export async function authWithGoogle(idToken: string): Promise<GasSession> {
  const session = await gasPost<GasSession>("authGoogle", { idToken }, false);
  setStoredToken(session.token);
  return session;
}

export async function authWithPassword(account: string, password: string): Promise<GasSession> {
  const passwordHash = await sha256(password);
  const session      = await gasPost<GasSession>("authPassword", { account, passwordHash }, false);
  setStoredToken(session.token);
  return session;
}

export async function apiLogout(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await gasPost("logout", {}).catch(() => {});
  }
  clearStoredToken();
}

/* ═══════════════════════════════════════════
   專案
═══════════════════════════════════════════ */
export async function apiGetProjects(): Promise<Project[]> {
  return gasPost<Project[]>("getProjects");
}

export async function apiGetProjectBaseData(projectCode: string): Promise<Project> {
  return gasPost<Project>("getProjectBaseData", { projectCode });
}

/* ═══════════════════════════════════════════
   工地整備
═══════════════════════════════════════════ */
export async function apiGetLatestSiteRecord(projectCode: string): Promise<SitePrepRecord | null> {
  return gasPost<SitePrepRecord | null>("getLatestSiteRecord", { projectCode });
}

export async function apiGetSiteRecords(afterDate?: string): Promise<SitePrepRecord[]> {
  return gasPost<SitePrepRecord[]>("getSiteRecords", { afterDate });
}

export async function apiSubmitSite(
  payload: SitePrepPayload,
  photoFiles?: File[],
): Promise<{ recordId: string; submittedAt: string }> {
  // 先上傳圖片，取得 URL
  const photoUrls: string[] = [];
  if (photoFiles?.length) {
    for (const file of photoFiles) {
      const url = await apiUploadPhoto(file, "site", payload.projectShortName);
      photoUrls.push(url);
    }
  }
  return gasPost("submitSite", { ...payload, photoUrls });
}

/* ═══════════════════════════════════════════
   辦公室整備
═══════════════════════════════════════════ */
export async function apiGetLatestOfficeRecord(officeName: string): Promise<OfficePrepRecord | null> {
  return gasPost<OfficePrepRecord | null>("getLatestOfficeRecord", { officeName });
}

export async function apiGetOfficeRecords(): Promise<OfficePrepRecord[]> {
  return gasPost<OfficePrepRecord[]>("getOfficeRecords");
}

export async function apiSubmitOffice(
  payload: OfficePrepPayload,
  photoFiles?: File[],
): Promise<{ recordId: string; submittedAt: string }> {
  const photoUrls: string[] = [];
  if (photoFiles?.length) {
    for (const file of photoFiles) {
      const url = await apiUploadPhoto(file, "office", payload.officeName);
      photoUrls.push(url);
    }
  }
  return gasPost("submitOffice", { ...payload, photoUrls });
}

/* ═══════════════════════════════════════════
   圖片上傳
═══════════════════════════════════════════ */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** 上傳前壓縮至 ≤ 1.5 MB */
async function compressImage(file: File, maxBytes = 1.5 * 1024 * 1024): Promise<File> {
  if (file.size <= maxBytes) return file;
  return new Promise(resolve => {
    const img    = new Image();
    const url    = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const scale  = Math.sqrt(maxBytes / file.size);
      width  = Math.round(width  * scale);
      height = Math.round(height * scale);
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg", 0.85,
      );
    };
    img.src = url;
  });
}

export async function apiUploadPhoto(
  file: File,
  type: "site" | "office",
  projectName: string,
): Promise<string> {
  const compressed = await compressImage(file);
  const base64     = await fileToBase64(compressed);
  const date       = new Date().toISOString().slice(0, 10);
  const result     = await gasPost<{ url: string }>("uploadPhoto", {
    base64, fileName: file.name, type, projectName, date,
  });
  return result.url;
}

/* ═══════════════════════════════════════════
   Dashboard
═══════════════════════════════════════════ */
export async function apiGetDashboard(): Promise<DashboardData> {
  return gasPost<DashboardData>("getDashboard");
}

/* ═══════════════════════════════════════════
   系統設定
═══════════════════════════════════════════ */
export async function apiGetSettings(): Promise<Settings> {
  return gasPost<Settings>("getSettings");
}

export async function apiSetSetting(key: string, value: string): Promise<void> {
  await gasPost("setSetting", { key, value });
}

/* ═══════════════════════════════════════════
   使用者管理
═══════════════════════════════════════════ */
export async function apiGetUsers(): Promise<UserRecord[]> {
  return gasPost<UserRecord[]>("getUsers");
}

export async function apiCreateUser(payload: CreateUserPayload): Promise<void> {
  await gasPost("createUser", payload);
}

export async function apiUpdateUser(payload: Partial<CreateUserPayload> & { email: string }): Promise<void> {
  await gasPost("updateUser", payload);
}

export async function apiDeleteUser(email: string): Promise<void> {
  await gasPost("deleteUser", { email });
}

/* ═══════════════════════════════════════════
   React Query 用 Query Key 工廠
═══════════════════════════════════════════ */
export const queryKeys = {
  projects:         () => ["projects"]              as const,
  projectBase:      (code: string) => ["project", code] as const,
  latestSite:       (code: string) => ["latestSite", code] as const,
  latestOffice:     (name: string) => ["latestOffice", name] as const,
  siteRecords:      (after?: string) => ["siteRecords", after] as const,
  officeRecords:    () => ["officeRecords"]          as const,
  dashboard:        () => ["dashboard"]              as const,
  settings:         () => ["settings"]               as const,
  users:            () => ["users"]                  as const,
};

/* ═══════════════════════════════════════════
   連線測試
═══════════════════════════════════════════ */
export async function apiPing(): Promise<boolean> {
  try {
    await gasPost("ping", {}, false);
    return true;
  } catch {
    return false;
  }
}
