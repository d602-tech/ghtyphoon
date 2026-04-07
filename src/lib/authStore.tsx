/**
 * 認證狀態管理
 * 支援：Google OAuth (Google Identity Services) + 帳號/密碼
 */

import {
  createContext, useContext, useState, useCallback,
  useEffect, ReactNode,
} from "react";
import { GOOGLE_CLIENT_ID } from "./config";
import {
  authWithGoogle, authWithPassword, apiLogout,
  getStoredToken, clearStoredToken,
} from "./api";
import type { GasUser, UserRole } from "./gasTypes";

/* ── Google Identity Services 型別宣告 ── */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }) => void;
          prompt: () => void;
          cancel: () => void;
          renderButton: (el: HTMLElement, opts: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

/* ── 型別 ── */
export type { UserRole };
export type { GasUser as User };

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:        "系統管理員",
  dept_manager: "部門管理員",
  general:      "一般使用者",
};

interface AuthState {
  user:            GasUser | null;
  isAuthenticated: boolean;
  login:           (account: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout:          () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

/* ── Provider ── */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<GasUser | null>(null);

  /** 啟動時若 localStorage 有 token，嘗試還原 session
   *  （只讀取 token；實際使用者資料由後端驗證後回傳）
   */
  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    // 用 ping + getProjects 確認 token 是否仍有效
    // 這裡先不做 auto-restore，讓使用者重新登入（避免過期 token 問題）
    // 若需要 auto-restore 可在此呼叫 apiGetSettings() 並在成功時 setUser
  }, []);

  /* ── 帳號/密碼登入 ── */
  const login = useCallback(async (
    account: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const session = await authWithPassword(account, password);
      setUser(session.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message || "登入失敗" };
    }
  }, []);

  /* ── Google OAuth 登入 ── */
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      if (!window.google) {
        resolve({ success: false, error: "Google 登入服務尚未載入，請重新整理頁面" });
        return;
      }
      if (!GOOGLE_CLIENT_ID) {
        resolve({ success: false, error: "Google Client ID 未設定，請聯絡管理員" });
        return;
      }

      window.google.accounts.id.initialize({
        client_id:   GOOGLE_CLIENT_ID,
        auto_select: false,
        callback: async (response) => {
          try {
            const session = await authWithGoogle(response.credential);
            setUser(session.user);
            resolve({ success: true });
          } catch (err) {
            resolve({ success: false, error: (err as Error).message || "Google 登入失敗" });
          }
        },
      });

      window.google.accounts.id.prompt();
    });
  }, []);

  /* ── 登出 ── */
  const logout = useCallback(async () => {
    await apiLogout();
    window.google?.accounts.id.disableAutoSelect?.();
    clearStoredToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ── Google Sign-In Button（可掛在任意 div 上）── */
export function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (idToken: string) => void,
  onError: (msg: string) => void,
) {
  if (!window.google || !GOOGLE_CLIENT_ID) {
    onError("Google 登入服務未就緒");
    return;
  }
  window.google.accounts.id.initialize({
    client_id:   GOOGLE_CLIENT_ID,
    auto_select: false,
    callback: (response) => onSuccess(response.credential),
  });
  window.google.accounts.id.renderButton(container, {
    type: "standard", shape: "rectangular",
    theme: "outline", size: "large",
    text: "signin_with", locale: "zh-TW",
  });
}
