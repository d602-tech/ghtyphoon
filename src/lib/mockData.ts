// Mock data simulating GAS API responses

export interface StandbyPerson {
  name: string;
  phone: string;
  role: string;  // 職務，例如水電技師、機械操作員
}

export interface ZoneEquipment {
  zoneName: string;
  mobilePumps: number;      // 移動式抽水機
  fixedPumps: number;       // 固定式抽水機
  dieselGenerators: number; // 柴油發電機
  gasGenerators: number;    // 汽油發電機
  gasolineLiters: number;   // 備用汽油(公升)
  dieselLiters: number;     // 備用柴油(公升)
  emergencyLights: number;  // 緊急照明燈(含手電筒)
  sandbags: number;         // 砂包
  firstAidKits: number;     // 急救箱
  fireExtinguishers: number;// 滅火器
  emergencyPersonnel: number;// 緊急動員人力
}

export function createEmptyZone(name = "工區1"): ZoneEquipment {
  return {
    zoneName: name,
    mobilePumps: 0, fixedPumps: 0,
    dieselGenerators: 0, gasGenerators: 0,
    gasolineLiters: 0, dieselLiters: 0,
    emergencyLights: 0, sandbags: 0,
    firstAidKits: 0, fireExtinguishers: 0,
    emergencyPersonnel: 0,
  };
}

export interface SiteRecord {
  id: string;
  projectName: string;
  department: string;
  inspector: string;
  contractor: string;
  safetyOfficer: string;
  siteDirector: string;
  constructionStatus: string;
  typhoonMeasures: string;
  ownPumps: number;
  rentedPumps: number;
  ownGenerators: number;
  rentedGenerators: number;
  projectShortName: string;
  lastUpdated: string;
  standbyPersonnel?: StandbyPerson[];
  zones?: ZoneEquipment[];
  // 檢查填報欄位
  pumpCapacity?: string;           // 抽水機容量
  testOperation?: string;          // 試操作結果
  waterBarrier?: string;           // 擋水設施(如沙包等防洪措施)
  roofDrainageCheck?: string;      // 屋頂排水、滲水檢查結果及地下室自動抽水機、警報、穿牆管止水檢查結果
  cableTrenchCheck?: string;       // 電纜溝清理、抽水機檢查及試運轉結果
  switchyardCheck?: string;        // 屋外式開關場開關箱上鎖及防水檢查巡視結果
  constructionTyphoon?: string;    // 開關場及輸電線旁在建工程防颱防汛措施準備情形
  lateralCommunication?: string;   // 與工程單位橫向聯繫及防颱防汛措施
}

export interface OfficeRecord {
  id: string;
  officeName: string;       // B欄
  department: string;       // C欄
  contact: string;          // D欄
  typhoonMeasures: string;  // E欄
  pumps: number;            // F欄
  generators: number;       // G欄
  lastUpdated: string;
}

export interface AuditRecord {
  department: string;
  lastUpdated: string;
}

export const siteRecords: SiteRecord[] = [
  {
    id: "1",
    projectName: "臺北捷運環狀線北環段土建工程CF690A標",
    department: "北區工程處",
    inspector: "王大明",
    contractor: "大陸工程公司",
    safetyOfficer: "陳建安",
    siteDirector: "林志豪",
    constructionStatus: "目前進行地下連續壁施工，深度達 35 公尺。基地周圍已完成鋼板樁圍堰，地下水位控制正常。預計本月完成第三區段開挖作業。\n\n注意事項：鄰近建物沉陷監測值穩定，未超出警戒值。",
    typhoonMeasures: "1. 施工架已全面加強固定，增設斜撐鋼管。\n2. 工區排水系統已清理完畢，抽水機定位待命。\n3. 塔吊已降至安全高度並固定。\n4. 鋼筋材料場已覆蓋防水帆布。\n5. 臨時工寮屋頂加設壓條固定。\n6. 緊急聯絡名冊已更新並張貼於工務所。",
    ownPumps: 3,
    rentedPumps: 2,
    ownGenerators: 1,
    rentedGenerators: 1,
    projectShortName: "CF690A",
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    pumpCapacity: "4吋×2台、6吋×1台",
    testOperation: "全數正常運轉，出水量符合規範",
    waterBarrier: "砂包200包已堆置於基地低窪處，擋水閘門已關閉",
    roofDrainageCheck: "屋頂排水孔已清理，地下室自動抽水機運轉正常，穿牆管止水良好",
    cableTrenchCheck: "電纜溝已清理完畢，抽水機試運轉正常",
    switchyardCheck: "開關箱已上鎖，防水罩已安裝完成",
    constructionTyphoon: "施工架已加強固定，塔吊已降至安全高度",
    lateralCommunication: "已與業主召開防颱會議，緊急聯繫窗口已確認",
    standbyPersonnel: [
      { name: "陳建安", phone: "0912-345-678", role: "職安人員" },
      { name: "林志豪", phone: "0923-456-789", role: "工地主任" },
    ],
    zones: [
      { zoneName: "A區-連續壁", mobilePumps: 2, fixedPumps: 1, dieselGenerators: 1, gasGenerators: 0, gasolineLiters: 0, dieselLiters: 150, emergencyLights: 8, sandbags: 50, firstAidKits: 3, fireExtinguishers: 12, emergencyPersonnel: 5 },
      { zoneName: "B區-開挖面", mobilePumps: 1, fixedPumps: 2, dieselGenerators: 0, gasGenerators: 1, gasolineLiters: 80, dieselLiters: 0, emergencyLights: 6, sandbags: 80, firstAidKits: 2, fireExtinguishers: 8, emergencyPersonnel: 4 },
    ],
  },
  {
    id: "2",
    projectName: "高雄港第七貨櫃中心新建工程",
    department: "南區工程處",
    inspector: "張美玲",
    contractor: "榮工工程公司",
    safetyOfficer: "劉安全",
    siteDirector: "黃正勇",
    constructionStatus: "碼頭基樁打設完成 85%，目前進行上部結構模板組立。港區作業需配合潮汐時間施工。",
    typhoonMeasures: "1. 浮動碼頭已拖移至避風港區。\n2. 起重船已錨定並加強纜繩固定。\n3. 臨海側防波堤觀測站保持監測。\n4. 港區閘門已完成測試。",
    ownPumps: 5,
    rentedPumps: 3,
    ownGenerators: 2,
    rentedGenerators: 2,
    projectShortName: "KH-P7C",
    lastUpdated: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    standbyPersonnel: [
      { name: "劉安全", phone: "0933-567-890", role: "職安人員" },
      { name: "黃正勇", phone: "0944-678-901", role: "機械操作員" },
      { name: "王技師", phone: "0955-789-012", role: "水電技師" },
    ],
    zones: [
      { zoneName: "碼頭區", mobilePumps: 3, fixedPumps: 2, dieselGenerators: 1, gasGenerators: 1, gasolineLiters: 60, dieselLiters: 200, emergencyLights: 10, sandbags: 120, firstAidKits: 4, fireExtinguishers: 15, emergencyPersonnel: 8 },
      { zoneName: "倉儲區", mobilePumps: 1, fixedPumps: 1, dieselGenerators: 1, gasGenerators: 0, gasolineLiters: 0, dieselLiters: 100, emergencyLights: 5, sandbags: 40, firstAidKits: 2, fireExtinguishers: 6, emergencyPersonnel: 3 },
      { zoneName: "臨時辦公區", mobilePumps: 0, fixedPumps: 0, dieselGenerators: 0, gasGenerators: 1, gasolineLiters: 40, dieselLiters: 0, emergencyLights: 4, sandbags: 20, firstAidKits: 1, fireExtinguishers: 4, emergencyPersonnel: 2 },
    ],
  },
  {
    id: "3",
    projectName: "台中科學園區聯外道路拓寬工程",
    department: "中區工程處",
    inspector: "李承恩",
    contractor: "中華工程公司",
    safetyOfficer: "周偉翔",
    siteDirector: "吳建成",
    constructionStatus: "路面刨除與級配鋪設進行中，交通維持計畫正常執行。預計下週進入瀝青混凝土鋪設階段。",
    typhoonMeasures: "1. 交通錐與紐澤西護欄已加重固定。\n2. 臨時排水溝已疏通清理。\n3. 邊坡開挖面已覆蓋帆布。\n4. 施工機具已移至安全區域。",
    ownPumps: 2,
    rentedPumps: 1,
    ownGenerators: 1,
    rentedGenerators: 0,
    projectShortName: "TC-RD05",
    lastUpdated: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    projectName: "北部淨水場擴建工程第二期",
    department: "北區工程處",
    inspector: "蔡宜芳",
    contractor: "東元工程公司",
    safetyOfficer: "鄭守安",
    siteDirector: "許志遠",
    constructionStatus: "沉澱池結構體澆置完成，目前進行機電管線配置。化學加藥室設備安裝中。",
    typhoonMeasures: "1. 藥品儲存區已做好防潮措施。\n2. 臨時電力配電箱已加裝防水罩。\n3. 基地周邊擋土牆排水孔已確認暢通。",
    ownPumps: 4,
    rentedPumps: 2,
    ownGenerators: 2,
    rentedGenerators: 1,
    projectShortName: "WTP-N2",
    lastUpdated: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
];

export const officeRecords: OfficeRecord[] = [
  {
    id: "1",
    officeName: "台北總部辦公室",
    department: "總部行政處",
    contact: "王秘書",
    typhoonMeasures: "1. 頂樓排水孔已清理。\n2. 地下室抽水機已測試運轉正常。\n3. 窗戶膠帶已備妥。\n4. UPS 不斷電系統已充電滿載。\n5. 重要文件已備份雲端。",
    pumps: 2,
    generators: 1,
    lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    officeName: "高雄分處辦公室",
    department: "南區工程處",
    contact: "李助理",
    typhoonMeasures: "1. 鐵捲門已檢查運作正常。\n2. 一樓沙包已備妥 50 袋。\n3. 戶外招牌已加固。\n4. 頂樓水塔固定螺栓已確認鎖緊。",
    pumps: 3,
    generators: 1,
    lastUpdated: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    officeName: "台中辦事處",
    department: "中區工程處",
    contact: "張行政",
    typhoonMeasures: "1. 停車場排水系統已疏通。\n2. 緊急照明設備已測試。\n3. 發電機油量已補滿。",
    pumps: 1,
    generators: 1,
    lastUpdated: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
  },
];

export const auditRecords: AuditRecord[] = [
  { department: "北區工程處", lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { department: "南區工程處", lastUpdated: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString() },
  { department: "中區工程處", lastUpdated: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString() },
  { department: "總部行政處", lastUpdated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { department: "企劃處", lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { department: "財務處", lastUpdated: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
  { department: "人事處", lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
];

export function getDepartments(): string[] {
  return [...new Set(siteRecords.map(r => r.department))];
}

export function getProjectsByDepartment(dept: string): SiteRecord[] {
  return siteRecords.filter(r => r.department === dept);
}

export function getOfficeNames(): string[] {
  return officeRecords.map(r => r.officeName);
}

export function getOfficeByName(name: string): OfficeRecord | undefined {
  return officeRecords.find(r => r.officeName === name);
}
