import { useState, useRef, useCallback, useMemo } from "react";
import { useAdmin } from "@/lib/adminStore";
import { useAuth } from "@/lib/authStore";
import { useSitePhotos } from "@/lib/photoStore";
import { SiteRecord, StandbyPerson, ZoneEquipment, createEmptyZone } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import ZoneEquipmentEditor from "@/components/ZoneEquipmentEditor";
import {
  HardHat, Building2, FileText, ShieldCheck, Save,
  Camera, X, ImageIcon, Clock, Copy, ChevronDown, ChevronUp, Briefcase,
  UserPlus, Trash2, Phone, Users, Search, CalendarIcon, FilterX, Download
} from "lucide-react";

/* ===================== HISTORY STORE (in-memory) ===================== */
export interface HistoryEntry {
  id: string;
  siteId: string;
  constructionStatus: string;
  typhoonMeasures: string;
  ownPumps: number;
  rentedPumps: number;
  ownGenerators: number;
  rentedGenerators: number;
  submittedAt: string;
  submittedBy: string;
  zones?: ZoneEquipment[];
}

const ROLE_OPTIONS = ["職安人員", "工地主任", "工程師", "水電技師", "機械操作員", "監工", "品管人員", "測量人員", "行政人員"];

const initialHistory: HistoryEntry[] = [
  // Site 1 – CF690A
  {
    id: "h1-1", siteId: "1",
    constructionStatus: "地下連續壁第二區段施工中，深度達 30 公尺。地下水位控制正常，圍堰穩定。",
    typhoonMeasures: "1. 施工架已加強固定。\n2. 塔吊降至安全高度。\n3. 排水系統已清理。\n4. 鋼筋材料場覆蓋帆布。",
    ownPumps: 2, rentedPumps: 2, ownGenerators: 1, rentedGenerators: 1,
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "大陸工程公司",
  },
  {
    id: "h1-2", siteId: "1",
    constructionStatus: "地下連續壁第一區段完成，進行第二區段準備作業。基地抽水系統運轉正常。",
    typhoonMeasures: "1. 施工架全面檢查完畢。\n2. 臨時工寮屋頂加固。\n3. 材料堆置區整理完成。",
    ownPumps: 2, rentedPumps: 1, ownGenerators: 1, rentedGenerators: 0,
    submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "大陸工程公司",
  },
  {
    id: "h1-3", siteId: "1",
    constructionStatus: "鋼板樁圍堰施工完成 90%，預計三日內合龍。地下水抽排作業持續進行中。",
    typhoonMeasures: "1. 工區周圍排水溝疏通。\n2. 抽水機備品已到位。\n3. 緊急聯絡名冊更新完成。",
    ownPumps: 2, rentedPumps: 1, ownGenerators: 1, rentedGenerators: 0,
    submittedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "大陸工程公司",
  },
  // Site 2 – KH-P7C
  {
    id: "h2-1", siteId: "2",
    constructionStatus: "碼頭基樁打設完成 70%，配合潮汐施工。上部結構模板開始備料。",
    typhoonMeasures: "1. 浮動碼頭已檢查錨定狀況。\n2. 起重船纜繩加強。\n3. 港區閘門已測試正常。",
    ownPumps: 4, rentedPumps: 3, ownGenerators: 2, rentedGenerators: 1,
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "榮工工程公司",
  },
  {
    id: "h2-2", siteId: "2",
    constructionStatus: "碼頭基樁打設完成 55%，海象良好，施工進度正常。",
    typhoonMeasures: "1. 防波堤觀測站設備校驗完成。\n2. 港區排水設施已清理。\n3. 臨海側擋風牆檢查完畢。",
    ownPumps: 4, rentedPumps: 2, ownGenerators: 2, rentedGenerators: 1,
    submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "榮工工程公司",
  },
  // Site 3 – TC-RD05
  {
    id: "h3-1", siteId: "3",
    constructionStatus: "路面刨除作業完成 60%，交通維持計畫執行中，夜間施工為主。",
    typhoonMeasures: "1. 紐澤西護欄加重固定。\n2. 施工機具歸位安全區。\n3. 邊坡開挖面覆蓋完成。",
    ownPumps: 2, rentedPumps: 1, ownGenerators: 1, rentedGenerators: 0,
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "中華工程公司",
  },
  // Site 4 – WTP-N2
  {
    id: "h4-1", siteId: "4",
    constructionStatus: "沉澱池結構體鋼筋組立完成，準備澆置混凝土。化學加藥室基礎完工。",
    typhoonMeasures: "1. 藥品區防潮措施已就位。\n2. 配電箱防水罩已安裝。\n3. 基地排水系統已確認。",
    ownPumps: 3, rentedPumps: 2, ownGenerators: 1, rentedGenerators: 1,
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "東元工程公司",
  },
  {
    id: "h4-2", siteId: "4",
    constructionStatus: "沉澱池開挖完成，擋土支撐系統安裝中。機電管線預埋作業同步進行。",
    typhoonMeasures: "1. 開挖面已做好臨時排水。\n2. 擋土牆監測點已佈設。\n3. 緊急應變器材已備妥。",
    ownPumps: 3, rentedPumps: 1, ownGenerators: 1, rentedGenerators: 0,
    submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), submittedBy: "東元工程公司",
  },
];

let historyStore: HistoryEntry[] = [...initialHistory];

export function getHistory(siteId: string) {
  return historyStore.filter(h => h.siteId === siteId).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

function addHistory(entry: HistoryEntry) {
  historyStore = [entry, ...historyStore];
}

/* ===================== MAIN COMPONENT ===================== */
const ContractorSiteView = () => {
  const { user } = useAuth();
  const { sites, setSites, personnel } = useAdmin();

  // Find contractor personnel record matching current user
  const contractorPerson = personnel.find(
    p => p.role === "contractor" && (p.email === user?.email || p.name === user?.name)
  );

  // Get assigned sites
  const assignedSites = contractorPerson
    ? sites.filter(s => contractorPerson.assignedProjects.includes(s.id))
    : sites.filter(s => s.contractor === user?.name);

  if (assignedSites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <HardHat className="h-12 w-12 opacity-30" />
        <p className="text-sm">您目前沒有被指派的工程</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {assignedSites.map(site => (
        <SiteEditor key={site.id} site={site} setSites={setSites} userName={user?.name || "承攬商"} />
      ))}
    </div>
  );
};

/* ===================== SITE EDITOR ===================== */
const SiteEditor = ({
  site,
  setSites,
  userName,
}: {
  site: SiteRecord;
  setSites: React.Dispatch<React.SetStateAction<SiteRecord[]>>;
  userName: string;
}) => {
  const [form, setForm] = useState({
    constructionStatus: site.constructionStatus,
    typhoonMeasures: site.typhoonMeasures,
    safetyOfficer: site.safetyOfficer,
    siteDirector: site.siteDirector,
    pumpCapacity: site.pumpCapacity || "",
    testOperation: site.testOperation || "",
    waterBarrier: site.waterBarrier || "",
    roofDrainageCheck: site.roofDrainageCheck || "",
    cableTrenchCheck: site.cableTrenchCheck || "",
    switchyardCheck: site.switchyardCheck || "",
    constructionTyphoon: site.constructionTyphoon || "",
    lateralCommunication: site.lateralCommunication || "",
  });
  const [equipment, setEquipment] = useState<ZoneEquipment>(site.zones?.[0] || createEmptyZone(site.projectShortName));
  const [standby, setStandby] = useState<StandbyPerson[]>(site.standbyPersonnel || []);
  const [newPerson, setNewPerson] = useState<StandbyPerson>({ name: "", phone: "", role: "" });
  const [showHistory, setShowHistory] = useState(false);
  const [photos, addPhoto, removePhoto, updateCaption] = useSitePhotos(site.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const history = getHistory(site.id);

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = useCallback(() => {
    const zonesArr = [equipment];
    addHistory({
      id: String(Date.now()),
      siteId: site.id,
      constructionStatus: form.constructionStatus,
      typhoonMeasures: form.typhoonMeasures,
      ownPumps: equipment.mobilePumps + equipment.fixedPumps,
      rentedPumps: 0,
      ownGenerators: equipment.dieselGenerators + equipment.gasGenerators,
      rentedGenerators: 0,
      submittedAt: new Date().toISOString(),
      submittedBy: userName,
      zones: zonesArr,
    });

    setSites(prev =>
      prev.map(s =>
        s.id === site.id
          ? {
              ...s,
              ...form,
              zones: zonesArr,
              standbyPersonnel: standby,
              ownPumps: equipment.mobilePumps + equipment.fixedPumps,
              rentedPumps: 0,
              ownGenerators: equipment.dieselGenerators + equipment.gasGenerators,
              rentedGenerators: 0,
              lastUpdated: new Date().toISOString(),
            }
          : s
      )
    );

    toast({ title: "已儲存更新", description: `${site.projectShortName} 整備資料已更新` });
  }, [form, equipment, standby, site.id, site.projectShortName, setSites, userName]);

  const handleCopyHistory = (entry: HistoryEntry) => {
    setForm(f => ({
      ...f,
      constructionStatus: entry.constructionStatus,
      typhoonMeasures: entry.typhoonMeasures,
    }));
    toast({ title: "已複製歷史資料", description: `來自 ${new Date(entry.submittedAt).toLocaleString("zh-TW")}` });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">{site.projectShortName}</Badge>
              <Badge variant="secondary">{site.department}</Badge>
            </div>
            <CardTitle className="text-base sm:text-lg leading-tight">{site.projectName}</CardTitle>
          </div>
          <Button onClick={handleSave} className="gap-1.5 shrink-0">
            <Save className="h-4 w-4" />儲存
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Site info – editable: safetyOfficer, siteDirector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <InfoPill icon={<Briefcase className="h-3.5 w-3.5" />} label="主辦部門" value={site.department} />
          <InfoPill icon={<HardHat className="h-3.5 w-3.5" />} label="承攬商" value={site.contractor} />
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <label className="flex items-center gap-1 text-muted-foreground mb-1"><ShieldCheck className="h-3.5 w-3.5" /><span className="text-[11px]">職安人員</span></label>
            <Input value={form.safetyOfficer} onChange={e => set("safetyOfficer", e.target.value)} className="h-7 text-xs font-semibold" />
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <label className="flex items-center gap-1 text-muted-foreground mb-1"><Building2 className="h-3.5 w-3.5" /><span className="text-[11px]">工地主任</span></label>
            <Input value={form.siteDirector} onChange={e => set("siteDirector", e.target.value)} className="h-7 text-xs font-semibold" />
          </div>
        </div>

        {/* Standby personnel */}
        <Card className="border-dashed border-accent/30 bg-accent/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm font-medium text-foreground">留守人員</span>
              </div>
              <Badge variant="secondary" className="text-xs">{standby.length} 人</Badge>
            </div>
            {standby.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {standby.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 border border-border text-xs">
                    <Badge variant="outline" className="text-[10px] shrink-0">{p.role || "未指定"}</Badge>
                    <span className="font-semibold text-foreground min-w-[3rem]">{p.name}</span>
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{p.phone}</span>
                    <button type="button" onClick={() => setStandby(s => s.filter((_, idx) => idx !== i))} className="ml-auto text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={newPerson.role} onValueChange={v => setNewPerson(p => ({ ...p, role: v }))}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="選擇職務" /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="姓名" value={newPerson.name} onChange={e => setNewPerson(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs flex-1 min-w-[4rem]" />
              <Input placeholder="電話" value={newPerson.phone} onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))} className="h-8 text-xs flex-1 min-w-[5rem]" />
              <Button type="button" variant="outline" size="sm" className="gap-1 h-8 shrink-0"
                disabled={!newPerson.name.trim() || !newPerson.phone.trim()}
                onClick={() => { setStandby(s => [...s, { name: newPerson.name.trim(), phone: newPerson.phone.trim(), role: newPerson.role.trim() || "留守人員" }]); setNewPerson({ name: "", phone: "", role: "" }); }}>
                <UserPlus className="h-3.5 w-3.5" />新增
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Equipment */}
        <ZoneEquipmentEditor zones={[equipment]} onChange={z => setEquipment(z[0] || createEmptyZone(site.projectShortName))} siteId={site.id} />

        {/* Text fields */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
            <FileText className="h-4 w-4 text-primary" />施工概況
          </label>
          <Textarea rows={4} value={form.constructionStatus} onChange={e => set("constructionStatus", e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-accent" />防颱作為
          </label>
          <Textarea rows={4} value={form.typhoonMeasures} onChange={e => set("typhoonMeasures", e.target.value)} />
        </div>

        {/* Inspection check fields */}
        <Card className="border border-border">
          <CardContent className="p-3 sm:p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">檢查填報項目</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">抽水機容量</label>
                <Input value={form.pumpCapacity} onChange={e => set("pumpCapacity", e.target.value)} placeholder="例：4吋×2台、6吋×1台" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">試操作結果</label>
                <Input value={form.testOperation} onChange={e => set("testOperation", e.target.value)} placeholder="例：全數正常運轉" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">擋水設施（沙包等防洪措施）</label>
                <Textarea rows={2} value={form.waterBarrier} onChange={e => set("waterBarrier", e.target.value)} placeholder="例：砂包200包已堆置，擋水閘門已關閉" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">屋頂排水/地下室抽水機/穿牆管止水檢查</label>
                <Textarea rows={2} value={form.roofDrainageCheck} onChange={e => set("roofDrainageCheck", e.target.value)} placeholder="例：屋頂排水孔已清理，地下室抽水機運轉正常" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">電纜溝清理/抽水機檢查及試運轉結果</label>
                <Textarea rows={2} value={form.cableTrenchCheck} onChange={e => set("cableTrenchCheck", e.target.value)} placeholder="例：電纜溝已清理完畢，抽水機試運轉正常" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">屋外式開關場開關箱上鎖及防水檢查</label>
                <Textarea rows={2} value={form.switchyardCheck} onChange={e => set("switchyardCheck", e.target.value)} placeholder="例：開關箱已上鎖，防水罩已安裝" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">在建工程防颱防汛措施準備情形</label>
                <Textarea rows={2} value={form.constructionTyphoon} onChange={e => set("constructionTyphoon", e.target.value)} placeholder="例：施工架已加強固定，塔吊已降至安全高度" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">與工程單位橫向聯繫及防颱防汛措施</label>
                <Textarea rows={2} value={form.lateralCommunication} onChange={e => set("lateralCommunication", e.target.value)} placeholder="例：已與業主召開防颱會議，聯繫窗口已確認" className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo upload */}
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">現場照片</span>
              </div>
              <Badge variant="secondary" className="text-xs">{photos.length} 張</Badge>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { Array.from(e.target.files || []).forEach(addPhoto); e.target.value = ""; }} />
            <Button type="button" variant="outline" size="sm" className="gap-1.5 mb-3" onClick={() => fileRef.current?.click()}>
              <Camera className="h-3.5 w-3.5" />選擇照片
            </Button>
            {photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="relative group rounded-md overflow-hidden border border-border aspect-square">
                      <img src={photo.dataUrl} alt={`照片 ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      placeholder="輸入照片說明..."
                      value={photo.caption}
                      onChange={e => updateCaption(i, e.target.value)}
                      className="text-xs h-7"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border border-dashed border-border rounded-md">
                <ImageIcon className="h-8 w-8 opacity-30 mb-1" />
                <p className="text-xs">尚未上傳照片</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History section */}
        <HistorySection history={history} onCopy={handleCopyHistory} />
      </CardContent>
    </Card>
  );
};

/* ===================== CSV EXPORT ===================== */
function escapeCsv(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function exportHistoryCsv(entries: HistoryEntry[]) {
  const headers = ["填報時間", "填報人", "施工概況", "防颱作為", "移動式抽水機", "固定式抽水機", "柴油發電機", "汽油發電機", "砂包", "緊急動員人力"];
  const rows = entries.map(e => {
    const z = e.zones?.[0];
    return [
      new Date(e.submittedAt).toLocaleString("zh-TW"),
      e.submittedBy,
      e.constructionStatus,
      e.typhoonMeasures,
      z ? String(z.mobilePumps) : String(e.ownPumps),
      z ? String(z.fixedPumps) : "0",
      z ? String(z.dieselGenerators) : String(e.ownGenerators),
      z ? String(z.gasGenerators) : "0",
      z ? String(z.sandbags) : "-",
      z ? String(z.emergencyPersonnel) : "-",
    ].map(escapeCsv);
  });
  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `歷史填報紀錄_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ===================== HISTORY SECTION ===================== */
const HistorySection = ({ history, onCopy }: { history: HistoryEntry[]; onCopy: (e: HistoryEntry) => void }) => {
  const [show, setShow] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const hasFilter = !!(keyword || dateFrom || dateTo);
  const filtered = useMemo(() => {
    return history.filter(entry => {
      const ts = new Date(entry.submittedAt);
      if (dateFrom) { const f = new Date(dateFrom); f.setHours(0,0,0,0); if (ts < f) return false; }
      if (dateTo) { const t = new Date(dateTo); t.setHours(23,59,59,999); if (ts > t) return false; }
      if (keyword) {
        const kw = keyword.toLowerCase();
        return entry.constructionStatus.toLowerCase().includes(kw) || entry.typhoonMeasures.toLowerCase().includes(kw) || entry.submittedBy.toLowerCase().includes(kw);
      }
      return true;
    });
  }, [history, keyword, dateFrom, dateTo]);
  const clearFilters = () => { setKeyword(""); setDateFrom(undefined); setDateTo(undefined); };
  return (
    <div>
      <button onClick={() => setShow(!show)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition w-full py-2">
        <Clock className="h-4 w-4" />歷史填報紀錄 ({history.length})
        {show ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
      </button>
      {show && (
        <div className="space-y-2 mt-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-2 border border-border">
            <div className="relative flex-1 min-w-[10rem]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="搜尋關鍵字..." value={keyword} onChange={e => setKeyword(e.target.value)} className="h-8 text-xs pl-7" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1 h-8 text-xs", dateFrom && "text-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />{dateFrom ? format(dateFrom, "yyyy/MM/dd") : "起始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">~</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1 h-8 text-xs", dateTo && "text-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />{dateTo ? format(dateTo, "yyyy/MM/dd") : "結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            {hasFilter && (
              <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs text-destructive" onClick={clearFilters}>
                <FilterX className="h-3.5 w-3.5" />清除
              </Button>
            )}
            <Badge variant="secondary" className="text-[10px]">{filtered.length} / {history.length} 筆</Badge>
            <Button variant="outline" size="sm" className="gap-1 h-8 text-xs ml-auto" disabled={filtered.length === 0} onClick={() => exportHistoryCsv(filtered)}>
              <Download className="h-3.5 w-3.5" />匯出 CSV
            </Button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{history.length === 0 ? "尚無歷史紀錄，儲存後將自動記錄" : "無符合條件的紀錄"}</p>
          ) : (
            filtered.map((entry, idx) => {
              const z = entry.zones?.[0];
              const ts = new Date(entry.submittedAt);
              const ago = getRelativeTime(ts);
              const isLatest = idx === 0 && !hasFilter;
              return (
                <Card key={entry.id} className={`border shadow-none transition ${isLatest ? "border-primary/40 bg-primary/5" : ""}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isLatest && <Badge className="text-[10px] h-5">最新</Badge>}
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /><span title={ts.toLocaleString("zh-TW")}>{ago}</span>
                          <span className="text-foreground font-medium">· {entry.submittedBy}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="gap-1 h-7 text-xs" onClick={() => onCopy(entry)}>
                        <Copy className="h-3 w-3" />複製
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {z ? (
                        <>
                          <MiniChip label="移動式抽水機" value={z.mobilePumps} unit="台" />
                          <MiniChip label="固定式抽水機" value={z.fixedPumps} unit="台" />
                          <MiniChip label="柴油發電機" value={z.dieselGenerators} unit="台" />
                          <MiniChip label="汽油發電機" value={z.gasGenerators} unit="台" />
                          <MiniChip label="砂包" value={z.sandbags} unit="包" />
                          <MiniChip label="緊急動員" value={z.emergencyPersonnel} unit="人" />
                        </>
                      ) : (
                        <>
                          <MiniChip label="抽水機" value={entry.ownPumps + entry.rentedPumps} unit="台" />
                          <MiniChip label="發電機" value={entry.ownGenerators + entry.rentedGenerators} unit="台" />
                        </>
                      )}
                    </div>
                    <ExpandableText label="施工概況" text={entry.constructionStatus} />
                    <ExpandableText label="防颱作為" text={entry.typhoonMeasures} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

/* ===================== INFO PILL ===================== */
const InfoPill = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg bg-muted/50 px-3 py-2">
    <div className="flex items-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-[11px]">{label}</span></div>
    <p className="text-xs font-semibold text-foreground truncate">{value}</p>
  </div>
);

/* ===================== MINI CHIP ===================== */
const MiniChip = ({ label, value, unit }: { label: string; value: number; unit: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
    {label} <span className="font-semibold text-foreground">{value}</span> {unit}
  </span>
);

/* ===================== EXPANDABLE TEXT ===================== */
const ExpandableText = ({ label, text }: { label: string; text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;
  return (
    <div className="text-xs">
      <p className="font-medium text-foreground mb-0.5">{label}</p>
      <p className={`text-muted-foreground whitespace-pre-line ${!expanded && isLong ? "line-clamp-2" : ""}`}>{text}</p>
      {isLong && (
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-primary text-[10px] mt-0.5 hover:underline">
          {expanded ? "收合" : "展開全文"}
        </button>
      )}
    </div>
  );
};

/* ===================== RELATIVE TIME ===================== */
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "剛剛";
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString("zh-TW");
}

export default ContractorSiteView;
