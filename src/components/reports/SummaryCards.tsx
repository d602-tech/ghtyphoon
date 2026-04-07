import { Card, CardContent } from "@/components/ui/card";
import { HardHat, Building2, Droplets, Zap, AlertTriangle } from "lucide-react";

interface SummaryCardsProps {
  siteCount: number;
  officeCount: number;
  totalPumps: number;
  totalGens: number;
  overdueCount: number;
}

const items = [
  { key: "sites", icon: HardHat, label: "工地", color: "bg-primary/10", iconColor: "text-primary" },
  { key: "offices", icon: Building2, label: "辦公室", color: "bg-primary/10", iconColor: "text-primary" },
  { key: "pumps", icon: Droplets, label: "抽水機", color: "bg-accent/10", iconColor: "text-accent" },
  { key: "gens", icon: Zap, label: "發電機", color: "bg-accent/10", iconColor: "text-accent" },
  { key: "overdue", icon: AlertTriangle, label: "逾期未更新", color: "bg-destructive/10", iconColor: "text-destructive" },
] as const;

const SummaryCards = ({ siteCount, officeCount, totalPumps, totalGens, overdueCount }: SummaryCardsProps) => {
  const values: Record<string, number> = {
    sites: siteCount,
    offices: officeCount,
    pumps: totalPumps,
    gens: totalGens,
    overdue: overdueCount,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {items.map(({ key, icon: Icon, label, color, iconColor }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className={`rounded-xl p-2.5 ${color}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{values[key]}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
