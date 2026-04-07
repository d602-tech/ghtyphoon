import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDepartments, getProjectsByDepartment, SiteRecord } from "@/lib/mockData";
import { Building2, User, HardHat, Droplets, Zap, FileText, ShieldCheck, UserCheck, Briefcase } from "lucide-react";

const SiteInspection = () => {
  const [dept, setDept] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<SiteRecord | null>(null);

  const departments = getDepartments();
  const projects = dept ? getProjectsByDepartment(dept) : [];

  const handleDeptChange = (val: string) => {
    setDept(val);
    setProjectId("");
    setRecord(null);
  };

  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setLoading(true);
    setTimeout(() => {
      const found = projects.find(p => p.id === val);
      setRecord(found || null);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">主辦部門</label>
          <Select value={dept} onValueChange={handleDeptChange}>
            <SelectTrigger className="bg-card border-border focus:ring-primary">
              <SelectValue placeholder="請選擇主辦部門" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">工程簡稱</label>
          <Select value={projectId} onValueChange={handleProjectChange} disabled={!dept}>
            <SelectTrigger className="bg-card border-border focus:ring-primary">
              <SelectValue placeholder={dept ? "請選擇工程" : "請先選擇部門"} />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.projectShortName} — {p.projectName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      )}

      {/* Data display */}
      {!loading && record && (
        <div className="space-y-4 sm:space-y-6 card-fade-in">
          {/* Info cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard icon={<Building2 className="h-4 w-4" />} label="工程名稱" value={record.projectName} span />
            <InfoCard icon={<Briefcase className="h-4 w-4" />} label="主辦部門" value={record.department} />
            <InfoCard icon={<UserCheck className="h-4 w-4" />} label="現檢員" value={record.inspector} />
            <InfoCard icon={<HardHat className="h-4 w-4" />} label="承攬商" value={record.contractor} span />
            <InfoCard icon={<ShieldCheck className="h-4 w-4" />} label="職安人員" value={record.safetyOfficer} />
            <InfoCard icon={<User className="h-4 w-4" />} label="工地主任" value={record.siteDirector} />
            <InfoCard
              icon={<Droplets className="h-4 w-4" />}
              label="抽水機數量"
              value={`${record.ownPumps + record.rentedPumps} 台`}
              sub={`自有 ${record.ownPumps} ／租用 ${record.rentedPumps}`}
              highlight
            />
            <InfoCard
              icon={<Zap className="h-4 w-4" />}
              label="發電機數量"
              value={`${record.ownGenerators + record.rentedGenerators} 台`}
              sub={`自有 ${record.ownGenerators} ／租用 ${record.rentedGenerators}`}
              highlight
            />
          </div>

          {/* Content sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Card className="border-border shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">施工概況</h3>
                </div>
                <p className="text-xs sm:text-sm text-card-foreground/80 whitespace-pre-line leading-relaxed">
                  {record.constructionStatus}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">防颱作為</h3>
                </div>
                <p className="text-xs sm:text-sm text-card-foreground/80 whitespace-pre-line leading-relaxed">
                  {record.typhoonMeasures}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !record && projectId === "" && dept !== "" && (
        <div className="text-center py-12 sm:py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">請選擇工程以檢視整備資料</p>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({
  icon,
  label,
  value,
  sub,
  span,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  span?: boolean;
  highlight?: boolean;
}) => (
  <Card className={`border-border shadow-sm ${span ? "sm:col-span-2" : ""}`}>
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`font-semibold ${highlight ? "text-primary text-base sm:text-lg" : "text-card-foreground text-sm"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export default SiteInspection;
