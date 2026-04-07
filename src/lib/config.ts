/**
 * 環境設定
 * 在 GitHub Secrets 設定以下變數：
 *   VITE_GAS_URL          - GAS 部署網址 (doPost endpoint)
 *   VITE_GOOGLE_CLIENT_ID - Google OAuth Client ID
 */

export const GAS_URL =
  import.meta.env.VITE_GAS_URL as string || "";

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID as string || "";

/** 本地開發時若沒設定 GAS_URL，顯示警告 */
if (!GAS_URL && import.meta.env.DEV) {
  console.warn("[config] VITE_GAS_URL 未設定，API 呼叫將失敗。請複製 .env.example 為 .env.local 並填入正確值。");
}
