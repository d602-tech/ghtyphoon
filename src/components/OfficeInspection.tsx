import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOfficeNames, getOfficeByName, OfficeRecord } from "@/lib/mockData";
import { Building, User, Droplets, Zap, ShieldCheck, Briefcase } from "lucide-react";

const OfficeInspection = () => {
  const [officeName, setOfficeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<OfficeRecord | null>(null);

  const offices = getOfficeNames();

  const handleChange = (val: string) => {
    setOfficeName(val);
    setLoading(true);
    setTimeout(() => {
      setRecord(getOfficeByName(val) || null);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="max-w-full sm:max-w-sm">
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">辦公室</label>
        <Select value={officeName} onValueChange={handleChange}>
          <SelectTrigger className="bg-card border-border focus:ring-primary">
            <SelectValue placeholder="請選擇辦公室" />
          </SelectTrigger>
          <SelectContent>
            {offices.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-lg" />
        </div>
      )}

      {!loading && record && (
        <div className="space-y-4 sm:space-y-6 card-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <InfoCard icon={<Building className="h-4 w-4" />} label="辦公室" value={record.officeName} />
            <InfoCard icon={<Briefcase className="h-4 w-4" />} label="主辦部門" value={record.department} />
            <InfoCard icon={<User className="h-4 w-4" />} label="承辦人" value={record.contact} />
            <InfoCard icon={<Droplets className="h-4 w-4" />} label="抽水機" value={`${record.pumps} 台`} highlight />
            <InfoCard icon={<Zap className="h-4 w-4" />} label="發電機" value={`${record.generators} 台`} highlight />
          </div>

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
      )}

      {!loading && !record && (
        <div className="text-center py-12 sm:py-16 text-muted-foreground">
          <Building className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">請選擇辦公室以檢視整備資料</p>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) => (
  <Card className="border-border shadow-sm">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className={`font-semibold ${highlight ? "text-primary text-base sm:text-lg" : "text-card-foreground text-sm"}`}>
        {value}
      </p>
    </CardContent>
  </Card>
);

export default OfficeInspection;
