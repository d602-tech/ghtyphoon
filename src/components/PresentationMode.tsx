import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { siteRecords, officeRecords, auditRecords, SiteRecord, getDepartments } from "@/lib/mockData";
import { useTheme } from "@/lib/themes";
import { useSitePhotos } from "@/lib/photoStore";
import ThemePicker from "@/components/ThemePicker";
import {
  Shield, ChevronLeft, ChevronRight, X, Droplets, Zap,
  HardHat, Building2, AlertTriangle, CheckCircle, FileText,
  ShieldCheck, Briefcase, UserCheck, Camera, ImagePlus, Trash2
} from "lucide-react";

/* ===================== TYPES ===================== */
type Slide =
  | { type: "cover" }
  | { type: "overview" }
  | { type: "department"; department: string; records: SiteRecord[] }
  | { type: "site"; record: SiteRecord }
  | { type: "closing" };

interface C {
  primary: string; accent: string; fg: string; cardBg: string;
  bg: string; muted: string; white: string; accentFg: string; mutedBg: string;
}

/* ===================== HELPERS ===================== */
function buildSlides(filterDept?: string): Slide[] {
  const slides: Slide[] = [{ type: "cover" }, { type: "overview" }];
  const depts = getDepartments();
  const filteredDepts = filterDept ? depts.filter(d => d === filterDept) : depts;
  filteredDepts.forEach(dept => {
    const records = siteRecords.filter(r => r.department === dept);
    slides.push({ type: "department", department: dept, records });
    records.forEach(r => slides.push({ type: "site", record: r }));
  });
  slides.push({ type: "closing" });
  return slides;
}

function hoursAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
}

function slideLabel(s: Slide): string {
  switch (s.type) {
    case "cover": return "封面";
    case "overview": return "總覽";
    case "department": return s.department;
    case "site": return s.record.projectShortName;
    case "closing": return "結尾";
  }
}

/* ===================== MAIN COMPONENT ===================== */
const PresentationMode = ({ onClose }: { onClose: () => void }) => {
  const [filterDept, setFilterDept] = useState<string | undefined>(undefined);
  const slides = useMemo(() => buildSlides(filterDept), [filterDept]);
  const [idx, setIdx] = useState(0);
  const [scale, setScale] = useState(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animKey, setAnimKey] = useState(0);
  const { presTheme } = useTheme();

  useEffect(() => { setIdx(0); }, [filterDept]);

  const departments = useMemo(() => getDepartments(), []);
  const deptCounts = useMemo(() => {
    const map: Record<string, number> = {};
    departments.forEach(d => { map[d] = siteRecords.filter(r => r.department === d).length; });
    return map;
  }, [departments]);

  const c: C = {
    primary: `hsl(${presTheme.primary})`, accent: `hsl(${presTheme.accent})`,
    fg: `hsl(${presTheme.foreground})`, cardBg: `hsl(${presTheme.card})`,
    bg: `hsl(${presTheme.background})`, muted: `hsl(${presTheme.mutedFg})`,
    white: `hsl(${presTheme.primaryFg})`, accentFg: `hsl(${presTheme.accentFg})`,
    mutedBg: `hsl(${presTheme.muted})`,
  };

  const go = useCallback((dir: "next" | "prev") => {
    setDirection(dir);
    setIdx(i => dir === "next" ? Math.min(slides.length - 1, i + 1) : Math.max(0, i - 1));
    setAnimKey(k => k + 1);
  }, [slides.length]);

  const jumpTo = useCallback((target: number) => {
    setDirection(target > idx ? "next" : "prev");
    setIdx(target);
    setAnimKey(k => k + 1);
  }, [idx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); go("next"); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go("prev"); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, onClose]);

  useEffect(() => {
    const calc = () => setScale(Math.min(window.innerWidth / 1920, (window.innerHeight - 80) / 1080));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const handler = () => { if (!document.fullscreenElement) onClose(); };
    document.addEventListener("fullscreenchange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onClose]);

  const safeIdx = Math.min(idx, slides.length - 1);
  const slide = slides[safeIdx];
  const thumbRef = useRef<HTMLDivElement>(null);

  // Scroll active thumbnail into view
  useEffect(() => {
    const el = thumbRef.current?.querySelector(`[data-idx="${idx}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  const renderSlide = () => {
    switch (slide.type) {
      case "cover": return <CoverSlide c={c} />;
      case "overview": return <OverviewSlide c={c} />;
      case "department": return <DepartmentSlide department={slide.department} records={slide.records} c={c} />;
      case "site": return <SiteSlide record={slide.record} c={c} />;
      case "closing": return <ClosingSlide c={c} />;
    }
  };

  const animStyle: React.CSSProperties = {
    animation: `slideIn${direction === "next" ? "Right" : "Left"} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both`,
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none" style={{ background: `hsl(${presTheme.foreground})` }}>
      {/* Inline keyframes */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Top bar: department filter + theme + close */}
      <div className="flex items-center justify-between px-4 py-2.5 z-10 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setFilterDept(undefined)}
            className="px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap"
            style={{
              background: !filterDept ? c.accent : `${c.cardBg}`,
              color: !filterDept ? c.accentFg : c.fg,
              border: `2px solid ${!filterDept ? c.accent : c.muted}`,
            }}>
            全部
          </button>
          {departments.map(dept => (
            <button key={dept} onClick={() => setFilterDept(dept)}
              className="px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-1.5 whitespace-nowrap"
              style={{
                background: filterDept === dept ? c.accent : c.cardBg,
                color: filterDept === dept ? c.accentFg : c.fg,
                border: `2px solid ${filterDept === dept ? c.accent : c.muted}`,
              }}>
              {dept}<span className="opacity-70">({deptCounts[dept]})</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemePicker mode="presentation" />
          <button onClick={onClose} className="transition p-1 rounded" style={{ color: `${c.white}66` }}><X className="h-6 w-6" /></button>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute" style={{
          width: 1920, height: 1080,
          left: "50%", top: "50%",
          marginLeft: -960, marginTop: -540,
          transform: `scale(${scale})`, transformOrigin: "center center",
        }}>
          <div key={animKey} style={animStyle}>{renderSlide()}</div>
        </div>

        {/* Nav arrows */}
        <button onClick={() => go("prev")} disabled={idx === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 disabled:opacity-10 transition hover:scale-110"
          style={{ color: `${c.white}99` }}>
          <ChevronLeft className="h-10 w-10" />
        </button>
        <button onClick={() => go("next")} disabled={idx === slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 disabled:opacity-10 transition hover:scale-110"
          style={{ color: `${c.white}99` }}>
          <ChevronRight className="h-10 w-10" />
        </button>
      </div>

      {/* Bottom thumbnail navigation */}
      <div className="shrink-0 py-2 px-4" ref={thumbRef}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${c.white}33 transparent` }}>
          {slides.map((s, i) => {
            const active = i === idx;
            const typeColor = s.type === "cover" || s.type === "closing" ? c.primary
              : s.type === "department" ? c.accent : c.muted;
            return (
              <button key={i} data-idx={i} onClick={() => jumpTo(i)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all"
                style={{
                  background: active ? c.accent : c.cardBg,
                  color: active ? c.accentFg : c.fg,
                  borderBottom: `3px solid ${active ? c.accent : typeColor}`,
                  transform: active ? "scale(1.08)" : "scale(1)",
                  boxShadow: active ? `0 2px 8px ${c.accent}44` : "none",
                }}>
                <span className="opacity-50 mr-1">{i + 1}</span>{slideLabel(s)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ===================== SLIDE FRAME ===================== */
const SlideFrame = ({ children, bgColor }: { children: React.ReactNode; bgColor: string }) => (
  <div className="w-[1920px] h-[1080px] overflow-hidden relative" style={{ background: bgColor }}>{children}</div>
);

/* ===================== COVER ===================== */
const CoverSlide = ({ c }: { c: C }) => {
  const now = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" });
  return (
    <SlideFrame bgColor={c.primary}>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: c.white }}>
        <div className="rounded-3xl p-6 mb-10" style={{ background: c.accent }}>
          <Shield className="h-20 w-20" />
        </div>
        <h1 className="text-[80px] font-bold tracking-wider mb-4">防颱整備狀況報告</h1>
        <p className="text-[36px] opacity-70">{now}</p>
        <p className="text-[28px] opacity-50 mt-4">Typhoon Preparedness Status Report</p>
      </div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[200px] rounded-tl-[200px]" style={{ background: `${c.accent}1a` }} />
    </SlideFrame>
  );
};

/* ===================== OVERVIEW ===================== */
const OverviewSlide = ({ c }: { c: C }) => {
  const totalSites = siteRecords.length;
  const totalOffices = officeRecords.length;
  const totalPumps = siteRecords.reduce((s, r) => s + r.ownPumps + r.rentedPumps, 0) + officeRecords.reduce((s, r) => s + r.pumps, 0);
  const totalGens = siteRecords.reduce((s, r) => s + r.ownGenerators + r.rentedGenerators, 0) + officeRecords.reduce((s, r) => s + r.generators, 0);
  const overdueCount = auditRecords.filter(r => Date.now() - new Date(r.lastUpdated).getTime() > 24 * 60 * 60 * 1000).length;
  const overdueSites = siteRecords.filter(r => hoursAgo(r.lastUpdated) > 24);

  return (
    <SlideFrame bgColor={c.cardBg}>
      <div className="h-[6px] w-full" style={{ background: c.primary }} />
      <div className="px-[120px] pt-[60px]">
        <h2 className="text-[56px] font-bold mb-[50px]" style={{ color: c.fg }}>整備總覽</h2>
        <div className="grid grid-cols-5 gap-[30px] mb-[60px]">
          <StatBox icon={<HardHat className="h-10 w-10" />} label="工地數" value={totalSites} iconBg={`${c.primary}1a`} iconColor={c.primary} c={c} />
          <StatBox icon={<Building2 className="h-10 w-10" />} label="辦公室數" value={totalOffices} iconBg={`${c.primary}1a`} iconColor={c.primary} c={c} />
          <StatBox icon={<Droplets className="h-10 w-10" />} label="抽水機總數" value={totalPumps} iconBg={`${c.accent}1a`} iconColor={c.accent} c={c} />
          <StatBox icon={<Zap className="h-10 w-10" />} label="發電機總數" value={totalGens} iconBg={`${c.accent}1a`} iconColor={c.accent} c={c} />
          <StatBox icon={<AlertTriangle className="h-10 w-10" />} label="未更新部門" value={overdueCount}
            iconBg={overdueCount > 0 ? "hsl(0 72% 51% / 0.1)" : "hsl(142 60% 45% / 0.1)"}
            iconColor={overdueCount > 0 ? "hsl(0,72%,51%)" : "hsl(142,60%,45%)"} c={c} />
        </div>
        {overdueSites.length > 0 && (
          <div className="rounded-3xl p-[40px]" style={{ background: "hsl(0 72% 51% / 0.05)", border: "2px solid hsl(0 72% 51% / 0.2)" }}>
            <div className="flex items-center gap-3 mb-[24px]">
              <AlertTriangle className="h-8 w-8" style={{ color: "hsl(0,72%,51%)" }} />
              <span className="text-[32px] font-bold" style={{ color: "hsl(0,72%,51%)" }}>尚未更新工程</span>
            </div>
            <div className="space-y-[16px]">
              {overdueSites.map(p => (
                <div key={p.id} className="flex items-center justify-between text-[26px] py-[8px]" style={{ borderBottom: "1px solid hsl(0 72% 51% / 0.1)" }}>
                  <span className="font-semibold" style={{ color: c.fg }}>{p.projectShortName} <span className="font-normal ml-3" style={{ color: c.muted }}>{p.projectName}</span></span>
                  <span className="font-bold" style={{ color: "hsl(0,72%,51%)" }}>{hoursAgo(p.lastUpdated)}h 未更新</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlideFrame>
  );
};

/* ===================== STAT BOX ===================== */
const StatBox = ({ icon, label, value, iconBg, iconColor, c }: { icon: React.ReactNode; label: string; value: number; iconBg: string; iconColor: string; c: C }) => (
  <div className="rounded-3xl p-[30px] flex items-center gap-[20px]" style={{ background: c.mutedBg }}>
    <div className="rounded-2xl p-4" style={{ background: iconBg, color: iconColor }}>{icon}</div>
    <div>
      <p className="text-[48px] font-bold" style={{ color: c.fg }}>{value}</p>
      <p className="text-[22px]" style={{ color: c.muted }}>{label}</p>
    </div>
  </div>
);

/* ===================== DEPARTMENT ===================== */
const DepartmentSlide = ({ department, records, c }: { department: string; records: SiteRecord[]; c: C }) => {
  const totalPumps = records.reduce((s, r) => s + r.ownPumps + r.rentedPumps, 0);
  const totalGens = records.reduce((s, r) => s + r.ownGenerators + r.rentedGenerators, 0);
  const overdueCount = records.filter(r => hoursAgo(r.lastUpdated) > 24).length;

  return (
    <SlideFrame bgColor={c.cardBg}>
      <div className="h-[6px] w-full" style={{ background: c.primary }} />
      <div className="px-[120px] pt-[60px]">
        <div className="flex items-center gap-5 mb-[50px]">
          <div className="rounded-2xl p-5" style={{ background: `${c.primary}1a`, color: c.primary }}>
            <Building2 className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-[56px] font-bold" style={{ color: c.fg }}>{department}</h2>
            <p className="text-[28px]" style={{ color: c.muted }}>共 {records.length} 項工程</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[30px] mb-[50px]">
          <StatBox icon={<HardHat className="h-10 w-10" />} label="工程數" value={records.length} iconBg={`${c.primary}1a`} iconColor={c.primary} c={c} />
          <StatBox icon={<Droplets className="h-10 w-10" />} label="抽水機" value={totalPumps} iconBg={`${c.accent}1a`} iconColor={c.accent} c={c} />
          <StatBox icon={<Zap className="h-10 w-10" />} label="發電機" value={totalGens} iconBg={`${c.accent}1a`} iconColor={c.accent} c={c} />
          <StatBox icon={<AlertTriangle className="h-10 w-10" />} label="逾期未更新" value={overdueCount}
            iconBg={overdueCount > 0 ? "hsl(0 72% 51% / 0.1)" : "hsl(142 60% 45% / 0.1)"}
            iconColor={overdueCount > 0 ? "hsl(0,72%,51%)" : "hsl(142,60%,45%)"} c={c} />
        </div>
        <div className="space-y-[20px]">
          {records.map(r => {
            const h = hoursAgo(r.lastUpdated);
            const statusColor = h <= 24 ? "hsl(142,60%,45%)" : h <= 48 ? "hsl(43,90%,55%)" : "hsl(0,72%,51%)";
            return (
              <div key={r.id} className="flex items-center justify-between rounded-2xl px-[36px] py-[24px]" style={{ background: c.mutedBg }}>
                <div className="flex items-center gap-4">
                  <span className="text-[26px] font-bold px-4 py-1.5 rounded-xl" style={{ background: c.accent, color: c.accentFg }}>{r.projectShortName}</span>
                  <span className="text-[26px] font-semibold" style={{ color: c.fg }}>{r.projectName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full" style={{ background: statusColor }} />
                  <span className="text-[22px] font-semibold" style={{ color: statusColor }}>{h}h 前更新</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideFrame>
  );
};

/* ===================== SITE SLIDE (with photos) ===================== */
const SiteSlide = ({ record, c }: { record: SiteRecord; c: C }) => {
  const h = hoursAgo(record.lastUpdated);
  const statusColor = h <= 24 ? "hsl(142,60%,45%)" : h <= 48 ? "hsl(43,90%,55%)" : "hsl(0,72%,51%)";
  const statusLabel = h <= 24 ? "已更新" : h <= 48 ? "待更新" : "逾期";
  const totalPumps = record.ownPumps + record.rentedPumps;
  const totalGens = record.ownGenerators + record.rentedGenerators;
  const [photos, addPhoto, removePhoto, updateCaption] = useSitePhotos(record.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasPhotos = photos.length > 0;

  return (
    <SlideFrame bgColor={c.cardBg}>
      <div className="h-[6px] w-full" style={{ background: c.primary }} />
      <div className="px-[100px] pt-[40px] h-full flex flex-col">
        {/* Header */}
        <div className="mb-[24px]">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[28px] font-bold px-5 py-2 rounded-xl" style={{ background: c.accent, color: c.accentFg }}>{record.projectShortName}</span>
            <span className="flex items-center gap-2 text-[24px] font-semibold" style={{ color: statusColor }}>
              <span className="w-4 h-4 rounded-full" style={{ background: statusColor }} />
              {statusLabel}（{h}h 前）
            </span>
          </div>
          <h2 className="text-[40px] font-bold leading-tight" style={{ color: c.fg }}>{record.projectName}</h2>
        </div>

        {/* Info pills */}
        <div className="grid grid-cols-6 gap-[16px] mb-[24px]">
          <InfoPill icon={<Briefcase className="h-5 w-5" />} label="主辦部門" value={record.department} c={c} />
          <InfoPill icon={<UserCheck className="h-5 w-5" />} label="現檢員" value={record.inspector} c={c} />
          <InfoPill icon={<HardHat className="h-5 w-5" />} label="承攬商" value={record.contractor} c={c} />
          <InfoPill icon={<ShieldCheck className="h-5 w-5" />} label="職安人員" value={record.safetyOfficer} c={c} />
          <InfoPill icon={<Droplets className="h-5 w-5" />} label="抽水機" value={`${totalPumps} 台`} c={c} highlight />
          <InfoPill icon={<Zap className="h-5 w-5" />} label="發電機" value={`${totalGens} 台`} c={c} highlight />
        </div>

        {/* Content area: text + photos */}
        <div className="flex-1 grid grid-cols-[1fr_420px] gap-[24px] min-h-0">
          <div className="grid grid-rows-2 gap-[20px] min-h-0">
            <ContentBlock icon={<FileText className="h-6 w-6" />} iconColor={c.primary} title="施工概況" content={record.constructionStatus} borderColor={`${c.primary}33`} c={c} />
            <ContentBlock icon={<ShieldCheck className="h-6 w-6" />} iconColor={c.accent} title="防颱作為" content={record.typhoonMeasures} borderColor={`${c.accent}33`} c={c} />
          </div>

          {/* Photo panel */}
          <div className="rounded-3xl p-[24px] flex flex-col" style={{ border: `2px solid ${c.primary}33` }}>
            <div className="flex items-center justify-between mb-[16px]">
              <div className="flex items-center gap-2" style={{ color: c.fg }}>
                <Camera className="h-6 w-6" style={{ color: c.primary }} />
                <h3 className="text-[26px] font-bold">現場照片</h3>
                <span className="text-[20px]" style={{ color: c.muted }}>({photos.length})</span>
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[18px] font-semibold transition hover:opacity-80"
                style={{ background: c.accent, color: c.accentFg }}>
                <ImagePlus className="h-5 w-5" />上傳
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { Array.from(e.target.files || []).forEach(addPhoto); e.target.value = ""; }} />
            </div>

            {photos.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl" style={{ background: c.mutedBg }}>
                <Camera className="h-16 w-16 mb-4" style={{ color: `${c.muted}` }} />
                <p className="text-[22px]" style={{ color: c.muted }}>點擊上方按鈕上傳現場照片</p>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-2 gap-[12px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {photos.map((photo, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <img src={photo.dataUrl} alt={`現場照片 ${i + 1}`} className="w-full h-full object-cover" />
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">{photo.caption}</div>
                    )}
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "hsl(0 72% 51% / 0.85)", color: "white" }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
};

/* ===================== SHARED COMPONENTS ===================== */
const InfoPill = ({ icon, label, value, c, highlight }: { icon: React.ReactNode; label: string; value: string; c: C; highlight?: boolean }) => (
  <div className="rounded-2xl px-[20px] py-[14px]" style={{ background: c.mutedBg }}>
    <div className="flex items-center gap-2 mb-1" style={{ color: c.muted }}>
      {icon}<span className="text-[17px]">{label}</span>
    </div>
    <p className="font-bold" style={{ color: highlight ? c.primary : c.fg, fontSize: highlight ? 26 : 21 }}>{value}</p>
  </div>
);

const ContentBlock = ({ icon, iconColor, title, content, borderColor, c }: { icon: React.ReactNode; iconColor: string; title: string; content: string; borderColor: string; c: C }) => (
  <div className="rounded-3xl p-[28px] overflow-hidden" style={{ border: `2px solid ${borderColor}` }}>
    <div className="flex items-center gap-3 mb-[14px]">
      <span style={{ color: iconColor }}>{icon}</span>
      <h3 className="text-[26px] font-bold" style={{ color: c.fg }}>{title}</h3>
    </div>
    <p className="text-[22px] whitespace-pre-line leading-[1.65]" style={{ color: c.muted }}>{content}</p>
  </div>
);

/* ===================== CLOSING ===================== */
const ClosingSlide = ({ c }: { c: C }) => (
  <SlideFrame bgColor={c.primary}>
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: c.white }}>
      <CheckCircle className="h-24 w-24 mb-10 opacity-80" />
      <h2 className="text-[72px] font-bold mb-6">報告完畢</h2>
      <p className="text-[32px] opacity-60">如有問題，請隨時提出討論</p>
    </div>
    <div className="absolute bottom-0 left-0 w-[600px] h-[200px] rounded-tr-[200px]" style={{ background: `${c.accent}1a` }} />
  </SlideFrame>
);

export default PresentationMode;
