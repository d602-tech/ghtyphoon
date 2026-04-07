import { useMemo, useRef } from "react";
import { useAdmin } from "@/lib/adminStore";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { hoursAgo } from "@/lib/utils/hoursAgo";
import jsPDF from "jspdf";

import SummaryCards from "@/components/reports/SummaryCards";
import EquipmentChart from "@/components/reports/EquipmentChart";
import StatusPieChart from "@/components/reports/StatusPieChart";
import TrendChart from "@/components/reports/TrendChart";
import DeptStatsTable from "@/components/reports/DeptStatsTable";
import SiteDetailsTable from "@/components/reports/SiteDetailsTable";
import { ZoneEquipment } from "@/lib/mockData";

/* ── helpers ── */
function sumZoneField(sites: { zones?: ZoneEquipment[] }[], key: keyof Omit<ZoneEquipment, "zoneName">): number {
  return sites.reduce((total, s) => {
    const z = s.zones?.[0];
    return total + (z ? (z[key] as number) : 0);
  }, 0);
}

const AdminReports = () => {
  const { sites, offices } = useAdmin();
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const totalPumps = sites.reduce((s, r) => s + r.ownPumps + r.rentedPumps, 0) + offices.reduce((s, r) => s + r.pumps, 0);
    const totalGens = sites.reduce((s, r) => s + r.ownGenerators + r.rentedGenerators, 0) + offices.reduce((s, r) => s + r.generators, 0);
    const overdueCount = sites.filter(r => hoursAgo(r.lastUpdated) > 24).length;
    const departments = [...new Set(sites.map(s => s.department))];
    const deptStats = departments.map(dept => {
      const deptSites = sites.filter(s => s.department === dept);
      return {
        dept, count: deptSites.length,
        pumps: deptSites.reduce((s, r) => s + r.ownPumps + r.rentedPumps, 0),
        gens: deptSites.reduce((s, r) => s + r.ownGenerators + r.rentedGenerators, 0),
        overdue: deptSites.filter(r => hoursAgo(r.lastUpdated) > 24).length,
      };
    });
    const equipmentChartData = deptStats.map(d => ({ name: d.dept.replace("工程處", ""), 抽水機: d.pumps, 發電機: d.gens }));
    const onTime = sites.filter(r => hoursAgo(r.lastUpdated) <= 24).length;
    const warning = sites.filter(r => hoursAgo(r.lastUpdated) > 24 && hoursAgo(r.lastUpdated) <= 48).length;
    const overdue = sites.filter(r => hoursAgo(r.lastUpdated) > 48).length;
    const statusChartData = [
      { name: "已更新 (24h內)", value: onTime, fill: "hsl(var(--primary))" },
      { name: "待更新 (24-48h)", value: warning, fill: "hsl(var(--muted-foreground))" },
      { name: "逾期 (>48h)", value: overdue, fill: "hsl(var(--destructive))" },
    ].filter(d => d.value > 0);
    return { totalPumps, totalGens, overdueCount, deptStats, equipmentChartData, statusChartData };
  }, [sites, offices]);

  const exportCSV = () => {
    const headers = ["工程簡稱", "工程名稱", "部門", "承攬商", "移動式抽水機", "固定式抽水機", "柴油發電機", "汽油發電機", "最後更新"];
    const rows = sites.map(s => {
      const z = s.zones?.[0];
      return [
        s.projectShortName, s.projectName, s.department, s.contractor,
        z?.mobilePumps ?? s.ownPumps, z?.fixedPumps ?? 0,
        z?.dieselGenerators ?? s.ownGenerators, z?.gasGenerators ?? 0,
        new Date(s.lastUpdated).toLocaleString("zh-TW"),
      ];
    });
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `防颱整備報表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "已匯出 CSV 報表" });
  };

  const exportPDF = async () => {
    const refs = [page1Ref.current, page2Ref.current, page3Ref.current];
    if (refs.some(r => !r)) return;
    toast({ title: "正在生成 PDF...", description: "請稍候" });
    try {
      const { default: html2canvas } = await import("html2canvas");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < refs.length; i++) {
        if (i > 0) pdf.addPage("a4", "landscape");
        const el = refs[i]!;
        el.style.display = "block";
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
        el.style.display = "none";
        const imgData = canvas.toDataURL("image/png");
        const imgW = pageW - 16;
        const imgH = (canvas.height * imgW) / canvas.width;
        // If content is taller than page, scale down to fit
        const finalH = Math.min(imgH, pageH - 16);
        const finalW = imgH > pageH - 16 ? (canvas.width * finalH) / canvas.height : imgW;
        pdf.addImage(imgData, "PNG", 8, 8, finalW, finalH);
      }

      pdf.save(`防颱整備報表_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "已匯出 PDF 報表" });
    } catch {
      toast({ title: "PDF 匯出失敗", variant: "destructive" });
    }
  };

  const dateStr = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });

  /* ── hidden print pages ── */
  const thStyle = "border: 1px solid #999; padding: 6px 8px; background: #e2e8f0; font-size: 11px; font-weight: 600; text-align: center; white-space: nowrap;";
  const tdStyle = "border: 1px solid #ccc; padding: 5px 8px; font-size: 11px; text-align: center;";
  const tdLeft = "border: 1px solid #ccc; padding: 5px 8px; font-size: 11px; text-align: left;";
  const titleStyle = "font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px;";
  const subtitleStyle = "font-size: 12px; text-align: center; color: #666; margin-bottom: 16px;";

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">報表與匯出</h2>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" className="gap-2"><FileText className="h-4 w-4" />匯出 PDF</Button>
          <Button onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" />匯出 CSV</Button>
        </div>
      </div>

      {/* Visible report content */}
      <div className="space-y-6 bg-background p-4">
        <SummaryCards siteCount={sites.length} officeCount={offices.length} totalPumps={stats.totalPumps} totalGens={stats.totalGens} overdueCount={stats.overdueCount} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EquipmentChart data={stats.equipmentChartData} />
          <StatusPieChart data={stats.statusChartData} />
        </div>
        <TrendChart sites={sites} />
        <DeptStatsTable stats={stats.deptStats} />
        <SiteDetailsTable sites={sites} />
      </div>

      {/* ═══════ HIDDEN PDF PAGES ═══════ */}

      {/* Page 1: 工程 */}
      <div ref={page1Ref} style={{ display: "none", width: "1120px", padding: "24px", fontFamily: "sans-serif", background: "#fff" }}>
        <div style={{ ...parseStyle(titleStyle) }}>防颱整備報表 — 工程</div>
        <div style={{ ...parseStyle(subtitleStyle) }}>報表日期：{dateStr}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...parseStyle(thStyle) }}>序號</th>
              <th style={{ ...parseStyle(thStyle) }}>工程名稱</th>
              <th style={{ ...parseStyle(thStyle) }}>承攬商</th>
              <th style={{ ...parseStyle(thStyle) }}>抽水機數量</th>
              <th style={{ ...parseStyle(thStyle) }}>發電機數量</th>
              <th style={{ ...parseStyle(thStyle) }}>抽水機容量</th>
              <th style={{ ...parseStyle(thStyle) }}>試操作</th>
              <th style={{ ...parseStyle(thStyle) }}>擋水設施</th>
              <th style={{ ...parseStyle(thStyle) }}>屋頂排水/地下室檢查</th>
              <th style={{ ...parseStyle(thStyle) }}>電纜溝檢查</th>
              <th style={{ ...parseStyle(thStyle) }}>開關場防水檢查</th>
              <th style={{ ...parseStyle(thStyle) }}>颱風人員待機</th>
              <th style={{ ...parseStyle(thStyle) }}>在建工程防颱</th>
              <th style={{ ...parseStyle(thStyle) }}>橫向聯繫</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s, i) => {
              const z = s.zones?.[0];
              const pumpCount = z ? z.mobilePumps + z.fixedPumps : s.ownPumps + s.rentedPumps;
              const genCount = z ? z.dieselGenerators + z.gasGenerators : s.ownGenerators + s.rentedGenerators;
              const standbyCount = s.standbyPersonnel?.length ?? 0;
              return (
                <tr key={s.id}>
                  <td style={{ ...parseStyle(tdStyle) }}>{i + 1}</td>
                  <td style={{ ...parseStyle(tdLeft), maxWidth: "160px" }}>{s.projectShortName}<br/><span style={{ fontSize: "9px", color: "#888" }}>{s.projectName}</span></td>
                  <td style={{ ...parseStyle(tdStyle) }}>{s.contractor}</td>
                  <td style={{ ...parseStyle(tdStyle) }}>{pumpCount} 台</td>
                  <td style={{ ...parseStyle(tdStyle) }}>{genCount} 台</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px" }}>{s.pumpCapacity || "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px" }}>{s.testOperation || "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "100px" }}>{s.waterBarrier || "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "100px" }}>{s.roofDrainageCheck || "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "100px" }}>{s.cableTrenchCheck || "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "100px" }}>{s.switchyardCheck || "—"}</td>
                  <td style={{ ...parseStyle(tdStyle) }}>{standbyCount > 0 ? `${standbyCount} 人待命` : "—"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "9px", maxWidth: "120px" }}>{s.constructionTyphoon || s.typhoonMeasures.slice(0, 40) + "…"}</td>
                  <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "100px" }}>{s.lateralCommunication || "—"}</td>
                  <td style={{ ...parseStyle(tdStyle) }}>✓</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Page 2: 辦公室 */}
      <div ref={page2Ref} style={{ display: "none", width: "1120px", padding: "24px", fontFamily: "sans-serif", background: "#fff" }}>
        <div style={{ ...parseStyle(titleStyle) }}>防颱整備報表 — 辦公室</div>
        <div style={{ ...parseStyle(subtitleStyle) }}>報表日期：{dateStr}</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...parseStyle(thStyle) }}>序號</th>
              <th style={{ ...parseStyle(thStyle) }}>辦公室</th>
              <th style={{ ...parseStyle(thStyle) }}>主辦部門</th>
              <th style={{ ...parseStyle(thStyle) }}>防颱作為</th>
              <th style={{ ...parseStyle(thStyle) }}>抽水機數量</th>
              <th style={{ ...parseStyle(thStyle) }}>發電機數量</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((o, i) => (
              <tr key={o.id}>
                <td style={{ ...parseStyle(tdStyle) }}>{i + 1}</td>
                <td style={{ ...parseStyle(tdLeft) }}>{o.officeName}</td>
                <td style={{ ...parseStyle(tdStyle) }}>{o.department}</td>
                <td style={{ ...parseStyle(tdLeft), fontSize: "10px", maxWidth: "400px", whiteSpace: "pre-line" as const }}>{o.typhoonMeasures}</td>
                <td style={{ ...parseStyle(tdStyle) }}>{o.pumps} 台</td>
                <td style={{ ...parseStyle(tdStyle) }}>{o.generators} 台</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ ...parseStyle(thStyle), textAlign: "right" }}>合計</td>
              <td style={{ ...parseStyle(thStyle) }}>{offices.reduce((s, o) => s + o.pumps, 0)} 台</td>
              <td style={{ ...parseStyle(thStyle) }}>{offices.reduce((s, o) => s + o.generators, 0)} 台</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Page 3: 主管處彙整 */}
      <div ref={page3Ref} style={{ display: "none", width: "1120px", padding: "24px", fontFamily: "sans-serif", background: "#fff" }}>
        <div style={{ ...parseStyle(titleStyle) }}>防颱整備報表 — 主管處彙整</div>
        <div style={{ ...parseStyle(subtitleStyle) }}>報表日期：{dateStr}</div>

        <div style={{ display: "flex", gap: "40px", marginBottom: "24px" }}>
          {/* 抽水機 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", borderBottom: "2px solid #334155", paddingBottom: "4px" }}>抽水機數量</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>移動式抽水機</td><td style={{ ...parseStyle(tdStyle), width: "100px" }}>{sumZoneField(sites, "mobilePumps")} 台</td></tr>
                <tr><td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>固定式抽水機</td><td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "fixedPumps")} 台</td></tr>
              </tbody>
            </table>
          </div>

          {/* 發電機 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", borderBottom: "2px solid #334155", paddingBottom: "4px" }}>發電機數量</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>柴油發電機</td><td style={{ ...parseStyle(tdStyle), width: "100px" }}>{sumZoneField(sites, "dieselGenerators")} 台</td></tr>
                <tr><td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>汽油發電機</td><td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "gasGenerators")} 台</td></tr>
                <tr><td colSpan={2} style={{ ...parseStyle(tdLeft), fontSize: "10px", color: "#666" }}>
                  (備用油料：汽油 {sumZoneField(sites, "gasolineLiters")} 公升 / 柴油 {sumZoneField(sites, "dieselLiters")} 公升)
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 其他整備項目 */}
        <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px", borderBottom: "2px solid #334155", paddingBottom: "4px" }}>其他整備項目</div>
        <table style={{ width: "60%", borderCollapse: "collapse" }}>
          <tbody>
            <tr><td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>緊急照明燈(含手電筒)</td><td style={{ ...parseStyle(tdStyle), width: "120px" }}>{sumZoneField(sites, "emergencyLights")} 只</td></tr>
            <tr>
              <td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>砂包</td>
              <td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "sandbags")} 包</td>
            </tr>
            <tr>
              <td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>急救箱</td>
              <td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "firstAidKits")} 盒</td>
            </tr>
            <tr>
              <td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>滅火器</td>
              <td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "fireExtinguishers")} 只</td>
            </tr>
            <tr>
              <td style={{ ...parseStyle(tdLeft), fontWeight: 600 }}>緊急動員人力</td>
              <td style={{ ...parseStyle(tdStyle) }}>{sumZoneField(sites, "emergencyPersonnel")} 人</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── inline style parser (CSS string → CSSProperties object) ── */
function parseStyle(css: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  css.split(";").forEach(pair => {
    const [key, val] = pair.split(":").map(s => s.trim());
    if (key && val) {
      const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      obj[camel] = val;
    }
  });
  return obj as unknown as React.CSSProperties;
}

export default AdminReports;
