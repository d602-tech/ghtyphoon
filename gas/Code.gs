/**
 * 防颱整備管理系統 - GAS 後端 API
 * 部署方式：以「我」身分執行，存取權限「所有人」
 */

/* ═══════════════════════════════════════════════
   設定常數
═══════════════════════════════════════════════ */
const SHEET_ID   = "1WNrkBAvncBEd5TTBRTebLy4wTpQHlG3SVocrIvuFYWU";
const DRIVE_ROOT = "1QdrgPsjeOiR8bib9y3lp8Z6vIzObknmz";

// Sheet 名稱
const S = {
  PROJECTS  : "ProjectBase",
  USERS     : "Users",
  SITE_PREP : "SitePrep",
  OFFICE    : "OfficePrep",
  HISTORY   : "History",
  MOD_LOGS  : "ModLogs",
  SETTINGS  : "Settings",
  SESSIONS  : "Sessions",
};

// Session 有效時間 (ms) — 24 小時
const SESSION_TTL = 24 * 60 * 60 * 1000;

/* ═══════════════════════════════════════════════
   進入點
═══════════════════════════════════════════════ */
function doGet(e) {
  // 讓 HTML 測試頁面可直接查看部署狀態
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: "防颱整備系統 API 運作中" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body    = JSON.parse(e.postData.contents);
    const action  = body.action  || "";
    const token   = body.token   || "";
    const payload = body.payload || {};

    // ── 不需要登入的動作 ──
    if (action === "authGoogle")   return ok(authGoogle(payload.idToken));
    if (action === "authPassword") return ok(authPassword(payload.account, payload.passwordHash));
    if (action === "ping")         return ok({ pong: true });

    // ── 需要有效 Session ──
    const session = validateSession(token);
    if (!session) return fail("請重新登入", 401);

    const user = session; // { email, name, role, department, projects }

    switch (action) {
      // 查詢
      case "getProjects":           return ok(getProjects(user));
      case "getProjectBaseData":    return ok(getProjectBaseData(payload.projectCode));
      case "getLatestSiteRecord":   return ok(getLatestSiteRecord(payload.projectCode));
      case "getLatestOfficeRecord": return ok(getLatestOfficeRecord(payload.officeName));
      case "getSiteRecords":        return ok(getSiteRecords(user, payload));
      case "getOfficeRecords":      return ok(getOfficeRecords(user));
      case "getDashboard":          return ok(getDashboard(user));
      case "getSettings":           return ok(getSettings());

      // 填報
      case "submitSite":   return ok(submitSite(payload, user));
      case "submitOffice": return ok(submitOffice(payload, user));

      // 圖片上傳（Base64）
      case "uploadPhoto": return ok(uploadPhoto(payload, user));

      // 系統設定（管理員）
      case "setSetting":  return adminOnly(user, () => setSetting(payload.key, payload.value, user));

      // 使用者管理（管理員）
      case "getUsers":    return adminOnly(user, getUsers);
      case "createUser":  return adminOnly(user, () => createUser(payload, user));
      case "updateUser":  return adminOnly(user, () => updateUser(payload, user));
      case "deleteUser":  return adminOnly(user, () => deleteUser(payload.email, user));

      // 登出
      case "logout": return ok(logout(token));

      default: return fail("未知的 action: " + action);
    }
  } catch (err) {
    return fail(err.message || "伺服器錯誤", 500);
  }
}

/* ═══════════════════════════════════════════════
   回應輔助
═══════════════════════════════════════════════ */
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail(message, code = 400) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message, code }))
    .setMimeType(ContentService.MimeType.JSON);
}

function adminOnly(user, fn) {
  if (user.role !== "admin") return fail("權限不足", 403);
  return ok(fn());
}

/* ═══════════════════════════════════════════════
   試算表輔助
═══════════════════════════════════════════════ */
function ss() { return SpreadsheetApp.openById(SHEET_ID); }

function getSheet(name) {
  let sheet = ss().getSheetByName(name);
  if (!sheet) {
    sheet = ss().insertSheet(name);
    initSheet(sheet, name);
  }
  return sheet;
}

/** 初始化各 Sheet 標題列 */
function initSheet(sheet, name) {
  const headers = {
    [S.PROJECTS]:  ["專案代碼","工程簡稱","工程全名","承攬商","主辦部門","工地地址","工地主任","主任電話","職安人員","職安電話","工地監工","監工電話","狀態","備註"],
    [S.USERS]:     ["部門","姓名","帳號","Email","角色","密碼Hash","管轄專案"],
    [S.SITE_PREP]: ["RecordID","提交時間","提交帳號","提交者名","專案代碼","工程簡稱","工程全名","主辦部門","承攬商","職安人員","工地監工","現檢員","施工概況","防颱作為","移動式抽水機","固定式抽水機","柴油發電機","汽油發電機","備用汽油L","備用柴油L","緊急照明","砂包","急救箱","滅火器","緊急動員人力","試操作結果","擋水設施","屋頂排水檢查","電纜溝清理","開關場防水","在建工程防颱","橫向聯繫","待命人員","照片連結","是否手動修改","修改原因"],
    [S.OFFICE]:    ["RecordID","提交時間","提交帳號","提交者名","辦公室名稱","負責部門","聯絡人","防颱作為","抽水機","發電機","緊急照明","急救箱","其他說明","照片連結"],
    [S.HISTORY]:   ["時間","操作類型","操作帳號","操作者","相關RecordID","整備類型","工程/辦公室","操作摘要"],
    [S.MOD_LOGS]:  ["時間","相關RecordID","工程簡稱","修改帳號","修改者","欄位名稱","原值","新值","修改原因"],
    [S.SETTINGS]:  ["鍵","值","最後修改者","最後修改時間","說明"],
    [S.SESSIONS]:  ["Token","Email","到期時間","建立時間"],
  };
  if (headers[name]) sheet.appendRow(headers[name]);
  // 預設設定值
  if (name === S.SETTINGS) {
    sheet.appendRow(["typhoonStartDate", "", "system", new Date().toISOString(), "颱風啟始日期"]);
  }
}

/** 取得 Sheet 所有資料（含標題）轉成 object 陣列 */
function sheetToObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const [header, ...rows] = sheet.getDataRange().getValues();
  return rows.map(row => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/* ═══════════════════════════════════════════════
   Session 管理
═══════════════════════════════════════════════ */
function generateUUID() {
  return Utilities.getUuid();
}

function createSession(email, name, role, department, projects) {
  const token   = generateUUID();
  const expires = new Date(Date.now() + SESSION_TTL);
  getSheet(S.SESSIONS).appendRow([token, email, expires.toISOString(), new Date().toISOString()]);
  return { token, user: { email, name, role, department, projects } };
}

function validateSession(token) {
  if (!token) return null;
  const sheet = getSheet(S.SESSIONS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const [t, email, expires] = data[i];
    if (t === token) {
      if (new Date(expires) < new Date()) {
        sheet.deleteRow(i + 1);
        return null;
      }
      // 找對應 User 資訊
      return getUserByEmail(email);
    }
  }
  return null;
}

function logout(token) {
  const sheet = getSheet(S.SESSIONS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) { sheet.deleteRow(i + 1); break; }
  }
  return { message: "已登出" };
}

/* ═══════════════════════════════════════════════
   認證
═══════════════════════════════════════════════ */
function authGoogle(idToken) {
  if (!idToken) throw new Error("缺少 idToken");
  const res  = UrlFetchApp.fetch(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken,
    { muteHttpExceptions: true }
  );
  const info = JSON.parse(res.getContentText());
  if (info.error) throw new Error("Google 驗證失敗：" + (info.error_description || info.error));

  const email = info.email;
  const user  = getUserByEmail(email);
  if (!user) throw new Error("此 Google 帳號尚未在系統中登錄，請聯絡管理員");

  return createSession(email, user.name, user.role, user.department, user.projects);
}

function authPassword(account, passwordHash) {
  if (!account || !passwordHash) throw new Error("請輸入帳號與密碼");
  const rows = sheetToObjects(S.USERS);
  const row  = rows.find(r => r["帳號"] === account && r["密碼Hash"] === passwordHash.toUpperCase());
  if (!row) throw new Error("帳號或密碼錯誤");

  const projects = row["管轄專案"]
    ? String(row["管轄專案"]).split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return createSession(
    row["Email"] || account,
    row["姓名"],
    mapRole(row["角色"]),
    row["部門"],
    projects
  );
}

function getUserByEmail(email) {
  const rows = sheetToObjects(S.USERS);
  const row  = rows.find(r => r["Email"] === email);
  if (!row) return null;
  const projects = row["管轄專案"]
    ? String(row["管轄專案"]).split(",").map(s => s.trim()).filter(Boolean)
    : [];
  return {
    email,
    name:       row["姓名"],
    role:       mapRole(row["角色"]),
    department: row["部門"],
    projects,
  };
}

function mapRole(roleText) {
  if (!roleText) return "general";
  if (roleText === "系統管理員") return "admin";
  if (roleText === "部門管理員") return "dept_manager";
  return "general";
}

/* ═══════════════════════════════════════════════
   專案查詢
═══════════════════════════════════════════════ */
function getProjects(user) {
  const rows = sheetToObjects(S.PROJECTS).filter(r => r["狀態"] !== "已完工" && r["狀態"] !== "暫停");
  if (user.role === "admin") return rows;
  if (user.role === "dept_manager") {
    return rows.filter(r => r["主辦部門"] === user.department);
  }
  // general user: 只看被指定的專案
  return rows.filter(r => user.projects.includes(r["專案代碼"]));
}

function getProjectBaseData(projectCode) {
  const rows = sheetToObjects(S.PROJECTS);
  const row  = rows.find(r => r["專案代碼"] === projectCode);
  if (!row) throw new Error("找不到專案：" + projectCode);
  return row;
}

/* ═══════════════════════════════════════════════
   工地整備
═══════════════════════════════════════════════ */
function getLatestSiteRecord(projectCode) {
  const rows = sheetToObjects(S.SITE_PREP)
    .filter(r => r["專案代碼"] === projectCode)
    .sort((a, b) => new Date(b["提交時間"]) - new Date(a["提交時間"]));
  return rows[0] || null;
}

function getSiteRecords(user, { afterDate } = {}) {
  let rows = sheetToObjects(S.SITE_PREP);
  if (afterDate) rows = rows.filter(r => new Date(r["提交時間"]) >= new Date(afterDate));
  if (user.role === "dept_manager") rows = rows.filter(r => r["主辦部門"] === user.department);
  if (user.role === "general")      rows = rows.filter(r => user.projects.includes(r["專案代碼"]));
  // 每個專案只取最新一筆
  const latest = {};
  rows.sort((a, b) => new Date(b["提交時間"]) - new Date(a["提交時間"]));
  rows.forEach(r => { if (!latest[r["專案代碼"]]) latest[r["專案代碼"]] = r; });
  return Object.values(latest);
}

function submitSite(payload, user) {
  const recordId  = generateUUID();
  const now       = new Date().toISOString();
  const sheet     = getSheet(S.SITE_PREP);
  const modFields = payload.modifiedFields || {};
  const hasModify = Object.keys(modFields).length > 0;

  sheet.appendRow([
    recordId,
    now,
    user.email,
    user.name,
    payload.projectCode       || "",
    payload.projectShortName  || "",
    payload.projectFullName   || "",
    payload.department        || "",
    payload.contractor        || "",
    payload.safetyOfficer     || "",
    payload.supervisor        || "",
    payload.inspector         || "",
    payload.constructionStatus|| "",
    payload.typhoonMeasures   || "",
    payload.mobilePumps       || 0,
    payload.fixedPumps        || 0,
    payload.dieselGenerators  || 0,
    payload.gasGenerators     || 0,
    payload.gasolineLiters    || 0,
    payload.dieselLiters      || 0,
    payload.emergencyLights   || 0,
    payload.sandbags          || 0,
    payload.firstAidKits      || 0,
    payload.fireExtinguishers || 0,
    payload.emergencyPersonnel|| 0,
    payload.testOperation     || "",
    payload.waterBarrier      || "",
    payload.roofDrainageCheck || "",
    payload.cableTrenchCheck  || "",
    payload.switchyardCheck   || "",
    payload.constructionTyphoon|| "",
    payload.lateralCommunication|| "",
    payload.standbyPersonnel  || "",
    (payload.photoUrls || []).join(","),
    hasModify ? "是" : "否",
    payload.modifyReason      || "",
  ]);

  // 記錄欄位修改
  if (hasModify) {
    Object.entries(modFields).forEach(([field, { original, newVal, reason }]) => {
      writeModLog(recordId, payload.projectShortName, user, field, original, newVal, reason);
    });
  }

  writeHistory("新增填報", user, recordId, "工地整備", payload.projectShortName, `${payload.projectShortName} 提交工地整備`);
  sendNotification("site", payload, user);

  return { recordId, submittedAt: now };
}

/* ═══════════════════════════════════════════════
   辦公室整備
═══════════════════════════════════════════════ */
function getLatestOfficeRecord(officeName) {
  const rows = sheetToObjects(S.OFFICE)
    .filter(r => r["辦公室名稱"] === officeName)
    .sort((a, b) => new Date(b["提交時間"]) - new Date(a["提交時間"]));
  return rows[0] || null;
}

function getOfficeRecords(user) {
  const rows = sheetToObjects(S.OFFICE);
  if (user.role === "dept_manager") return rows.filter(r => r["負責部門"] === user.department);
  return rows;
}

function submitOffice(payload, user) {
  const recordId = generateUUID();
  const now      = new Date().toISOString();
  getSheet(S.OFFICE).appendRow([
    recordId,
    now,
    user.email,
    user.name,
    payload.officeName       || "",
    payload.department       || "",
    payload.contact          || "",
    payload.typhoonMeasures  || "",
    payload.pumps            || 0,
    payload.generators       || 0,
    payload.emergencyLights  || 0,
    payload.firstAidKits     || 0,
    payload.otherNotes       || "",
    (payload.photoUrls || []).join(","),
  ]);

  writeHistory("新增填報", user, recordId, "辦公室整備", payload.officeName, `${payload.officeName} 提交辦公室整備`);
  return { recordId, submittedAt: now };
}

/* ═══════════════════════════════════════════════
   Dashboard
═══════════════════════════════════════════════ */
function getDashboard(user) {
  const settings       = getSettings();
  const startDate      = settings.typhoonStartDate ? new Date(settings.typhoonStartDate) : null;

  // 所有進行中專案
  const allProjects = sheetToObjects(S.PROJECTS)
    .filter(r => r["狀態"] === "進行中" || !r["狀態"]);

  // 過濾出符合角色的專案
  let scopedProjects = allProjects;
  if (user.role === "dept_manager") scopedProjects = allProjects.filter(p => p["主辦部門"] === user.department);

  // 取各專案最新整備紀錄
  let siteRows = sheetToObjects(S.SITE_PREP);
  if (startDate) siteRows = siteRows.filter(r => new Date(r["提交時間"]) >= startDate);

  const latestSite = {};
  siteRows.sort((a, b) => new Date(b["提交時間"]) - new Date(a["提交時間"]));
  siteRows.forEach(r => { if (!latestSite[r["專案代碼"]]) latestSite[r["專案代碼"]] = r; });

  const updatedSites    = scopedProjects.filter(p => latestSite[p["專案代碼"]]);
  const notUpdatedSites = scopedProjects.filter(p => !latestSite[p["專案代碼"]]);

  // 辦公室
  const offices = ["總部", "中區辦公室", "南區辦公室"];
  let officeRows = sheetToObjects(S.OFFICE);
  if (startDate) officeRows = officeRows.filter(r => new Date(r["提交時間"]) >= startDate);
  const latestOffice = {};
  officeRows.sort((a, b) => new Date(b["提交時間"]) - new Date(a["提交時間"]));
  officeRows.forEach(r => { if (!latestOffice[r["辦公室名稱"]]) latestOffice[r["辦公室名稱"]] = r; });

  return {
    typhoonStartDate: settings.typhoonStartDate || null,
    sites: {
      total:    scopedProjects.length,
      updated:  updatedSites.length,
      pending:  notUpdatedSites.length,
      updatedList:   updatedSites.map(p => ({ ...p, latestRecord: latestSite[p["專案代碼"]] })),
      pendingList:   notUpdatedSites,
    },
    offices: {
      total:   offices.length,
      updated: offices.filter(o => latestOffice[o]).length,
      list:    offices.map(o => ({ name: o, latestRecord: latestOffice[o] || null })),
    },
  };
}

/* ═══════════════════════════════════════════════
   系統設定
═══════════════════════════════════════════════ */
function getSettings() {
  const rows   = sheetToObjects(S.SETTINGS);
  const result = {};
  rows.forEach(r => { result[r["鍵"]] = r["值"]; });
  return result;
}

function setSetting(key, value, user) {
  const sheet = getSheet(S.SETTINGS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(user.email);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      writeHistory("系統設定", user, "", "N/A", "系統", `設定 ${key} = ${value}`);
      return { key, value };
    }
  }
  // 不存在則新增
  sheet.appendRow([key, value, user.email, new Date().toISOString(), ""]);
  return { key, value };
}

/* ═══════════════════════════════════════════════
   使用者管理
═══════════════════════════════════════════════ */
function getUsers() {
  return sheetToObjects(S.USERS).map(r => ({
    department: r["部門"],
    name:       r["姓名"],
    account:    r["帳號"],
    email:      r["Email"],
    role:       mapRole(r["角色"]),
    roleLabel:  r["角色"],
    projects:   r["管轄專案"] ? String(r["管轄專案"]).split(",").map(s=>s.trim()).filter(Boolean) : [],
  }));
}

function createUser(payload, actor) {
  getSheet(S.USERS).appendRow([
    payload.department || "",
    payload.name       || "",
    payload.account    || "",
    payload.email      || "",
    payload.roleLabel  || "一般使用者",
    payload.passwordHash || "",
    (payload.projects || []).join(","),
  ]);
  writeHistory("使用者管理", actor, "", "N/A", "系統", `新增使用者 ${payload.name}`);
  return { message: "使用者已新增" };
}

function updateUser(payload, actor) {
  const sheet = getSheet(S.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === payload.email || data[i][2] === payload.account) {
      if (payload.department !== undefined) sheet.getRange(i+1, 1).setValue(payload.department);
      if (payload.name       !== undefined) sheet.getRange(i+1, 2).setValue(payload.name);
      if (payload.account    !== undefined) sheet.getRange(i+1, 3).setValue(payload.account);
      if (payload.roleLabel  !== undefined) sheet.getRange(i+1, 5).setValue(payload.roleLabel);
      if (payload.passwordHash)             sheet.getRange(i+1, 6).setValue(payload.passwordHash);
      if (payload.projects   !== undefined) sheet.getRange(i+1, 7).setValue((payload.projects||[]).join(","));
      writeHistory("使用者管理", actor, "", "N/A", "系統", `更新使用者 ${payload.name || payload.email}`);
      return { message: "使用者已更新" };
    }
  }
  throw new Error("找不到使用者：" + (payload.email || payload.account));
}

function deleteUser(email, actor) {
  const sheet = getSheet(S.USERS);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][3] === email) {
      sheet.deleteRow(i + 1);
      writeHistory("使用者管理", actor, "", "N/A", "系統", `刪除使用者 ${email}`);
      return { message: "使用者已刪除" };
    }
  }
  throw new Error("找不到使用者：" + email);
}

/* ═══════════════════════════════════════════════
   圖片上傳
═══════════════════════════════════════════════ */
function uploadPhoto({ base64, fileName, type, projectName, date }, user) {
  const folder    = getOrCreateFolder(type || "SitePrep", projectName || "未分類", date || formatDate(new Date()));
  const blob      = Utilities.newBlob(Utilities.base64Decode(base64), "image/jpeg", fileName || "photo.jpg");
  const file      = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: file.getUrl(), fileId: file.getId() };
}

function getOrCreateFolder(type, projectName, date) {
  let root = DriveApp.getFolderById(DRIVE_ROOT);

  // Level 1: Site/Office
  const typeFolder = getSubFolder(root, type === "office" ? "辦公室整備" : "工地整備");

  // Level 2: Project/Office name
  const projFolder = getSubFolder(typeFolder, projectName);

  // Level 3: Date
  return getSubFolder(projFolder, date);
}

function getSubFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/* ═══════════════════════════════════════════════
   歷史 & 修改日誌
═══════════════════════════════════════════════ */
function writeHistory(type, user, recordId, prepType, target, summary) {
  getSheet(S.HISTORY).appendRow([
    new Date().toISOString(),
    type,
    user.email,
    user.name,
    recordId,
    prepType,
    target,
    summary,
  ]);
}

function writeModLog(recordId, shortName, user, field, original, newVal, reason) {
  getSheet(S.MOD_LOGS).appendRow([
    new Date().toISOString(),
    recordId,
    shortName,
    user.email,
    user.name,
    field,
    original,
    newVal,
    reason,
  ]);
}

/* ═══════════════════════════════════════════════
   Email 通知
═══════════════════════════════════════════════ */
function sendNotification(type, payload, submitter) {
  try {
    const admins = sheetToObjects(S.USERS).filter(r => r["角色"] === "系統管理員").map(r => r["Email"]).filter(Boolean);
    const deptMgrs = type === "site"
      ? sheetToObjects(S.USERS)
          .filter(r => r["角色"] === "部門管理員" && r["部門"] === payload.department)
          .map(r => r["Email"]).filter(Boolean)
      : [];

    const recipients = [...new Set([...admins, ...deptMgrs])].join(",");
    if (!recipients) return;

    const target  = type === "site" ? payload.projectShortName : payload.officeName;
    const subject = `[防颱整備] ${target} 已更新`;
    const body    = `${target} 已於 ${new Date().toLocaleString("zh-TW")} 由 ${submitter.name}（${submitter.email}）完成整備填報。\n\n請登入系統確認。`;

    MailApp.sendEmail({ to: recipients, subject, body });
  } catch (e) {
    // 郵件失敗不影響主流程
    Logger.log("sendNotification error: " + e.message);
  }
}

/** 每日早上 09:00 提醒觸發器（手動設定觸發器後自動執行） */
function dailyReminderTrigger() {
  const settings  = getSettings();
  const startDate = settings.typhoonStartDate ? new Date(settings.typhoonStartDate) : null;
  if (!startDate) return;

  const allProjects = sheetToObjects(S.PROJECTS).filter(r => r["狀態"] === "進行中");
  const siteRows    = sheetToObjects(S.SITE_PREP).filter(r => new Date(r["提交時間"]) >= startDate);
  const reported    = new Set(siteRows.map(r => r["專案代碼"]));
  const pending     = allProjects.filter(p => !reported.has(p["專案代碼"]));

  if (pending.length === 0) return;

  const users = sheetToObjects(S.USERS);
  const adminEmails = users.filter(r => r["角色"] === "系統管理員").map(r => r["Email"]).filter(Boolean);

  const body = `以下工程尚未完成防颱整備填報：\n\n${pending.map(p => `• ${p["工程簡稱"]} (${p["主辦部門"]})`).join("\n")}\n\n請督促相關人員盡快填報。`;
  const to   = adminEmails.join(",");
  if (to) MailApp.sendEmail({ to, subject: `[防颱整備提醒] ${pending.length} 項工程待更新`, body });
}
