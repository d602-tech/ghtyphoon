import { useState, useMemo } from "react";
import { useAdmin, DataEntry } from "@/lib/adminStore";
import { useAuth } from "@/lib/authStore";
import { getHistory, HistoryEntry } from "@/components/ContractorSiteView";
import { SiteRecord } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  HardHat, Droplets, Zap, FileText, ShieldCheck, ImageIcon,
  Building2, Briefcase, Eye
} from "lucide-react";

/* ===================== STATUS HELPERS ===================== */
const statusConfig = {
  pending: { label: "待審核", variant: "secondary" as const, icon: Clock },
  approved: { label: "已核准", variant: "default" as const, icon: CheckCircle },
  rejected: { label: "退回", variant: "destructive" as const, icon: XCircle },
};

function getSubmissionStatus(site: SiteRecord, entries: DataEntry[]): "pending" | "approved" | "rejected" | "not_submitted" {
  const latest = entries
    .filter(e => e.projectId === site.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
  return latest?.status || "not_submitted";
}

/* ===================== MAIN COMPONENT ===================== */
const DeptManagerReview = () => {
  const { user } = useAuth();
  const { sites, personnel, entries, setEntries } = useAdmin();

  // Find the manager's personnel record to get their department
  const managerPerson = personnel.find(
    p => p.role === "dept_manager" && (p.email === user?.email || p.name === user?.name)
  );

  const department = managerPerson?.department || "";

  // Get department's sites
  const deptSites = useMemo(
    () => sites.filter(s => s.department === department),
    [sites, department]
  );

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Building2 className="h-12 w-12 opacity-30" />
        <p className="text-sm">找不到您的部門資訊</p>
      </div>
    );
  }

  if (deptSites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <HardHat className="h-12 w-12 opacity-30" />
        <p className="text-sm">您的部門目前沒有工程項目</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department summary header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{department}</h2>
                <p className="text-sm text-muted-foreground">共 {deptSites.length} 項工程</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SummaryBadge label="待審核" count={deptSites.filter(s => getSubmissionStatus(s, entries) === "pending").length} variant="secondary" />
              <SummaryBadge label="已核准" count={deptSites.filter(s => getSubmissionStatus(s, entries) === "approved").length} variant="default" />
              <SummaryBadge label="未填報" count={deptSites.filter(s => getSubmissionStatus(s, entries) === "not_submitted").length} variant="outline" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Site review cards */}
      {deptSites.map(site => (
        <SiteReviewCard
          key={site.id}
          site={site}
          entries={entries}
          setEntries={setEntries}
          personnel={personnel}
          reviewerName={user?.name || "部門管理員"}
        />
      ))}
    </div>
  );
};

/* ===================== SUMMARY BADGE ===================== */
const SummaryBadge = ({ label, count, variant }: { label: string; count: number; variant: "default" | "secondary" | "destructive" | "outline" }) => (
  <Badge variant={variant} className="text-xs px-3 py-1 gap-1.5">
    <span className="font-bold">{count}</span>
    <span>{label}</span>
  </Badge>
);

/* ===================== SITE REVIEW CARD ===================== */
const SiteReviewCard = ({
  site,
  entries,
  setEntries,
  personnel,
  reviewerName,
}: {
  site: SiteRecord;
  entries: DataEntry[];
  setEntries: React.Dispatch<React.SetStateAction<DataEntry[]>>;
  personnel: { id: string; name: string; role: string; assignedProjects?: string[] }[];
  reviewerName: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  const history = getHistory(site.id);
  const latestEntry = entries
    .filter(e => e.projectId === site.id)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

  const status = latestEntry?.status || "not_submitted";
  const contractor = personnel.find(p => p.role === "contractor" && p.assignedProjects?.includes(site.id));

  const handleReview = (action: "approved" | "rejected") => {
    if (latestEntry) {
      setEntries(prev =>
        prev.map(e =>
          e.id === latestEntry.id
            ? { ...e, status: action, reviewedBy: reviewerName, reviewedAt: new Date().toISOString(), notes: reviewNote || undefined }
            : e
        )
      );
    } else {
      // Create an entry for tracking
      const newEntry: DataEntry = {
        id: `e-${Date.now()}`,
        projectId: site.id,
        submittedBy: contractor?.id || "",
        submittedAt: site.lastUpdated,
        status: action,
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
        notes: reviewNote || undefined,
        data: {},
      };
      setEntries(prev => [...prev, newEntry]);
    }
    setReviewNote("");
    toast({
      title: action === "approved" ? "已核准" : "已退回",
      description: `${site.projectShortName} ${action === "approved" ? "審核通過" : "已退回修改"}`,
    });
  };

  const hoursAgo = Math.round((Date.now() - new Date(site.lastUpdated).getTime()) / (1000 * 60 * 60));
  const updateStatus = hoursAgo <= 24 ? "ok" : hoursAgo <= 48 ? "warning" : "overdue";

  return (
    <Card className={status === "pending" ? "border-amber-500/30" : ""}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="default">{site.projectShortName}</Badge>
              {status !== "not_submitted" ? (
                <Badge variant={statusConfig[status].variant} className="gap-1">
                  {(() => { const Icon = statusConfig[status].icon; return <Icon className="h-3 w-3" />; })()}
                  {statusConfig[status].label}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground gap-1">
                  <Clock className="h-3 w-3" />未填報
                </Badge>
              )}
              <Badge
                variant={updateStatus === "ok" ? "default" : updateStatus === "warning" ? "secondary" : "destructive"}
                className="text-[10px]"
              >
                {hoursAgo < 1 ? "剛更新" : `${hoursAgo} 小時前`}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg leading-tight">{site.projectName}</CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="gap-1 h-8">
              <Eye className="h-4 w-4" />
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {/* Site info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InfoPill icon={<Briefcase className="h-3.5 w-3.5" />} label="承攬商" value={site.contractor} />
            <InfoPill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="職安人員" value={site.safetyOfficer} />
            <InfoPill icon={<Building2 className="h-3.5 w-3.5" />} label="工地主任" value={site.siteDirector} />
            <InfoPill icon={<HardHat className="h-3.5 w-3.5" />} label="填報人" value={contractor?.name || site.contractor} />
          </div>

          {/* Current data */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <EquipmentPill icon={<Droplets className="h-3.5 w-3.5" />} label="自有抽水機" value={site.ownPumps} />
            <EquipmentPill icon={<Droplets className="h-3.5 w-3.5" />} label="租用抽水機" value={site.rentedPumps} />
            <EquipmentPill icon={<Zap className="h-3.5 w-3.5" />} label="自有發電機" value={site.ownGenerators} />
            <EquipmentPill icon={<Zap className="h-3.5 w-3.5" />} label="租用發電機" value={site.rentedGenerators} />
          </div>

          {/* Text content */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />施工概況
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">{site.constructionStatus || "（尚未填寫）"}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />防颱作為
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">{site.typhoonMeasures || "（尚未填寫）"}</p>
            </div>
          </div>

          {/* History section */}
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition w-full py-2"
            >
              <Clock className="h-4 w-4" />
              承攬商歷次填報紀錄 ({history.length})
              {showHistory ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
            </button>
            {showHistory && (
              <div className="space-y-2 mt-2 max-h-80 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">尚無歷史紀錄</p>
                ) : (
                  history.map(entry => (
                    <HistoryCard key={entry.id} entry={entry} />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Review actions */}
          <Card className="border-dashed border-primary/30 bg-muted/30">
            <CardContent className="p-3 sm:p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">審核意見</p>
              <Textarea
                rows={2}
                placeholder="輸入審核意見或備註（選填）..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleReview("rejected")}
                >
                  <XCircle className="h-4 w-4" />退回修改
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleReview("approved")}
                >
                  <CheckCircle className="h-4 w-4" />核准
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      )}
    </Card>
  );
};

/* ===================== HISTORY CARD ===================== */
const HistoryCard = ({ entry }: { entry: HistoryEntry }) => (
  <Card className="border shadow-none">
    <CardContent className="p-3 space-y-2">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        {new Date(entry.submittedAt).toLocaleString("zh-TW")}
        <span className="text-foreground font-medium ml-1">{entry.submittedBy}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <p className="font-medium text-foreground mb-0.5">施工概況</p>
          <p className="text-muted-foreground whitespace-pre-line line-clamp-3">{entry.constructionStatus}</p>
        </div>
        <div>
          <p className="font-medium text-foreground mb-0.5">防颱作為</p>
          <p className="text-muted-foreground whitespace-pre-line line-clamp-3">{entry.typhoonMeasures}</p>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>抽水機 {entry.ownPumps + entry.rentedPumps} 台</span>
        <span>發電機 {entry.ownGenerators + entry.rentedGenerators} 台</span>
      </div>
    </CardContent>
  </Card>
);

/* ===================== INFO PILL ===================== */
const InfoPill = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-lg bg-muted/50 px-3 py-2">
    <div className="flex items-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-[11px]">{label}</span></div>
    <p className="text-xs font-semibold text-foreground truncate">{value}</p>
  </div>
);

/* ===================== EQUIPMENT PILL ===================== */
const EquipmentPill = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-lg bg-muted/50 px-3 py-2">
    <div className="flex items-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-[11px]">{label}</span></div>
    <p className="text-sm font-bold text-foreground">{value} 台</p>
  </div>
);

export default DeptManagerReview;
