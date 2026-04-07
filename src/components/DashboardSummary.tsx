import { Card, CardContent } from "@/components/ui/card";
import { siteRecords, officeRecords, auditRecords } from "@/lib/mockData";
import { HardHat, Building, Droplets, Zap, AlertTriangle, CheckCircle } from "lucide-react";

function getOverdueProjects() {
  const threshold = 24 * 60 * 60 * 1000;
  return siteRecords.filter(r => Date.now() - new Date(r.lastUpdated).getTime() > threshold);
}

function hoursAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
}

const DashboardSummary = () => {
  const totalSites = siteRecords.length;
  const totalOffices = officeRecords.length;
  const totalPumps = siteRecords.reduce((s, r) => s + r.ownPumps + r.rentedPumps, 0) +
    officeRecords.reduce((s, r) => s + r.pumps, 0);
  const totalGenerators = siteRecords.reduce((s, r) => s + r.ownGenerators + r.rentedGenerators, 0) +
    officeRecords.reduce((s, r) => s + r.generators, 0);
  const overdueCount = auditRecords.filter(r => Date.now() - new Date(r.lastUpdated).getTime() > 24 * 60 * 60 * 1000).length;
  const overdueProjects = getOverdueProjects();

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <StatCard icon={<HardHat className="h-5 w-5" />} label="工地數" value={totalSites} />
        <StatCard icon={<Building className="h-5 w-5" />} label="辦公室數" value={totalOffices} />
        <StatCard icon={<Droplets className="h-5 w-5" />} label="抽水機總數" value={totalPumps} accent />
        <StatCard icon={<Zap className="h-5 w-5" />} label="發電機總數" value={totalGenerators} accent />
        <StatCard
          icon={overdueCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          label="未更新部門"
          value={overdueCount}
          danger={overdueCount > 0}
        />
      </div>

      {/* Overdue projects alert */}
      {overdueProjects.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-destructive text-sm">尚未更新工程（超過 24 小時）</h3>
            </div>
            <div className="space-y-2">
              {overdueProjects.map(p => {
                const h = hoursAgo(p.lastUpdated);
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-destructive/10 last:border-0">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{p.projectShortName}</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.projectName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground">{p.department}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        h > 48 ? "bg-destructive/10 text-destructive" : "bg-status-yellow/20 text-status-yellow"
                      }`}>
                        {h}h 未更新
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const StatCard = ({
  icon, label, value, accent, danger,
}: {
  icon: React.ReactNode; label: string; value: number; accent?: boolean; danger?: boolean;
}) => (
  <Card className={`shadow-sm ${danger ? "border-destructive/40" : "border-border"}`}>
    <CardContent className="p-3 sm:p-4 flex items-center gap-3">
      <div className={`rounded-lg p-2 shrink-0 ${
        danger ? "bg-destructive/10 text-destructive" : accent ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
      }`}>
        {icon}
      </div>
      <div>
        <p className={`text-xl sm:text-2xl font-bold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default DashboardSummary;
