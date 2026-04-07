/**
 * GAS API 共用型別定義
 * 對應 gas/Code.gs 的資料結構
 */

/* ── 角色 ── */
export type UserRole = "admin" | "dept_manager" | "general";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:        "系統管理員",
  dept_manager: "部門管理員",
  general:      "一般使用者",
};

/* ── 使用者 ── */
export interface GasUser {
  email:      string;
  name:       string;
  role:       UserRole;
  department: string;
  projects:   string[]; // 管轄專案代碼陣列
}

/* ── Session ── */
export interface GasSession {
  token: string;
  user:  GasUser;
}

/* ── 專案基本資料 ── */
export interface Project {
  專案代碼:  string;
  工程簡稱:  string;
  工程全名:  string;
  承攬商:    string;
  主辦部門:  string;
  工地地址:  string;
  工地主任:  string;
  主任電話:  string;
  職安人員:  string;
  職安電話:  string;
  工地監工:  string;
  監工電話:  string;
  狀態:      string;
  備註:      string;
}

/* ── 工地整備填報 ── */
export interface SitePrepPayload {
  projectCode:          string;
  projectShortName:     string;
  projectFullName:      string;
  department:           string;
  contractor:           string;
  safetyOfficer:        string;
  supervisor:           string;
  inspector:            string;
  constructionStatus:   string;
  typhoonMeasures:      string;
  mobilePumps:          number;
  fixedPumps:           number;
  dieselGenerators:     number;
  gasGenerators:        number;
  gasolineLiters:       number;
  dieselLiters:         number;
  emergencyLights:      number;
  sandbags:             number;
  firstAidKits:         number;
  fireExtinguishers:    number;
  emergencyPersonnel:   number;
  testOperation:        string;
  waterBarrier:         string;
  roofDrainageCheck:    string;
  cableTrenchCheck:     string;
  switchyardCheck:      string;
  constructionTyphoon:  string;
  lateralCommunication: string;
  standbyPersonnel:     string;
  photoUrls:            string[];
  modifiedFields?:      Record<string, { original: string; newVal: string; reason: string }>;
  modifyReason?:        string;
}

export interface SitePrepRecord extends SitePrepPayload {
  RecordID:   string;
  提交時間:   string;
  提交帳號:   string;
  提交者名:   string;
}

/* ── 辦公室整備填報 ── */
export interface OfficePrepPayload {
  officeName:      string;
  department:      string;
  contact:         string;
  typhoonMeasures: string;
  pumps:           number;
  generators:      number;
  emergencyLights: number;
  firstAidKits:    number;
  otherNotes:      string;
  photoUrls:       string[];
}

export interface OfficePrepRecord extends OfficePrepPayload {
  RecordID:  string;
  提交時間:  string;
  提交帳號:  string;
  提交者名:  string;
}

/* ── Dashboard ── */
export interface DashboardData {
  typhoonStartDate: string | null;
  sites: {
    total:       number;
    updated:     number;
    pending:     number;
    updatedList: Array<Project & { latestRecord: SitePrepRecord }>;
    pendingList: Project[];
  };
  offices: {
    total:   number;
    updated: number;
    list:    Array<{ name: string; latestRecord: OfficePrepRecord | null }>;
  };
}

/* ── 系統設定 ── */
export interface Settings {
  typhoonStartDate?: string;
  [key: string]: string | undefined;
}

/* ── 使用者管理 ── */
export interface UserRecord {
  department: string;
  name:       string;
  account:    string;
  email:      string;
  role:       UserRole;
  roleLabel:  string;
  projects:   string[];
}

export interface CreateUserPayload {
  department:   string;
  name:         string;
  account:      string;
  email:        string;
  roleLabel:    string;
  passwordHash: string;
  projects:     string[];
}

/* ── GAS API 回應 ── */
export interface GasResponse<T = unknown> {
  ok:    boolean;
  data?: T;
  error?: string;
  code?: number;
}

/* ── 部門選項 ── */
export const DEPARTMENTS = [
  "土木工程處",
  "建築工程處",
  "電力工程處",
  "機械工程處",
  "中區工程處",
  "南區工程處",
  "工程事業部",
] as const;

export const OFFICES = ["總部", "中區辦公室", "南區辦公室"] as const;

export type Department = typeof DEPARTMENTS[number];
export type OfficeName  = typeof OFFICES[number];
