# GAS 後端部署指南

## 前置需求
- Google 帳號（擁有目標 Google Sheet 的所有者權限）
- clasp CLI（Google Apps Script 命令列工具）

---

## 步驟 1：安裝 clasp

```bash
npm install -g @google/clasp
clasp login
```

---

## 步驟 2：建立 GAS 專案並上傳

```bash
cd gas

# 建立新專案（或綁定現有專案）
clasp create --type webapp --title "防颱整備系統API"

# 上傳程式碼
clasp push
```

---

## 步驟 3：部署為 Web App

1. 開啟 [Google Apps Script](https://script.google.com)
2. 進入專案 → **部署** → **管理部署作業** → **新增部署**
3. 設定：
   - 類型：**網頁應用程式**
   - 執行身分：**我（部署者帳號）**
   - 存取權：**所有人**（無需 Google 帳號）
4. 點擊「部署」，複製 **Web App URL**

---

## 步驟 4：設定 Google Sheets

確認 `Code.gs` 中的 `SHEET_ID` 對應到正確的 Google Sheet ID：

```javascript
const SHEET_ID = "1WNrkBAvncBEd5TTBRTebLy4wTpQHlG3SVocrIvuFYWU";
```

Sheet 會在第一次呼叫時自動建立各分頁與標題列。若要手動初始化：

```javascript
// 在 GAS Script Editor 中執行
function setup() {
  const names = ["ProjectBase","Users","SitePrep","OfficePrep","History","ModLogs","Settings","Sessions"];
  names.forEach(n => getSheet(n)); // 觸發 initSheet()
}
```

---

## 步驟 5：設定 Google Drive 資料夾

確認 `DRIVE_ROOT` 對應到正確的 Google Drive 資料夾 ID：

```javascript
const DRIVE_ROOT = "1QdrgPsjeOiR8bib9y3lp8Z6vIzObknmz";
```

資料夾結構會在上傳照片時自動建立。

---

## 步驟 6：設定 Google OAuth Client ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立或選擇專案 → **API 和服務** → **憑證**
3. 建立 **OAuth 2.0 用戶端 ID**（類型：**網頁應用程式**）
4. 授權的 JavaScript 來源：
   - `http://localhost:8080`（本機開發）
   - `https://d602-tech.github.io`（生產環境）
5. 複製 **用戶端 ID**

---

## 步驟 7：設定 GitHub Secrets

在 GitHub Repository → **Settings** → **Secrets and variables** → **Actions** 新增：

| Secret 名稱           | 值                              |
|----------------------|--------------------------------|
| `VITE_GAS_URL`       | GAS Web App URL（步驟 3 取得） |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID（步驟 6 取得）|

---

## 步驟 8：啟用 GitHub Pages

Repository → **Settings** → **Pages**：
- Source：**GitHub Actions**

推送到 `main` 分支後，GitHub Actions 會自動建置並部署。

---

## 步驟 9：新增第一個管理員帳號

在 Google Sheet 的 **Users** 分頁手動新增一列：

| 部門   | 姓名   | 帳號    | Email              | 角色       | 密碼Hash | 管轄專案 |
|--------|--------|---------|-------------------|------------|----------|---------|
| 工程部 | 管理員 | admin01 | admin@example.com | 系統管理員 | （見下）  |          |

密碼 Hash 計算方式（SHA-256，大寫十六進位）：

```javascript
// 瀏覽器 Console 執行
const hash = await crypto.subtle.digest(
  'SHA-256', new TextEncoder().encode('你的密碼')
);
console.log(
  Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2,'0'))
    .join('').toUpperCase()
);
```

---

## 本機開發設定

```bash
# 複製環境變數範本
cp .env.example .env.local

# 編輯 .env.local
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com

# 啟動開發伺服器
npm run dev
```

---

## 每日提醒觸發器設定（可選）

在 GAS Script Editor：
1. **觸發器** → **新增觸發器**
2. 函式：`dailyReminderTrigger`
3. 活動來源：**時間驅動**
4. 類型：**每日**
5. 時間：**上午 9:00 – 10:00**
