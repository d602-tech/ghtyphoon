import { useState } from "react";
import { ZoneEquipment, createEmptyZone } from "@/lib/mockData";
import { getHistory } from "@/components/ContractorSiteView";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Copy, Clock } from "lucide-react";

interface Props {
  zones: ZoneEquipment[];
  onChange: (zones: ZoneEquipment[]) => void;
  siteId?: string;
}

const FIELDS: { key: keyof Omit<ZoneEquipment, "zoneName">; label: string; unit: string }[] = [
  { key: "mobilePumps", label: "移動式抽水機", unit: "台" },
  { key: "fixedPumps", label: "固定式抽水機", unit: "台" },
  { key: "dieselGenerators", label: "柴油發電機", unit: "台" },
  { key: "gasGenerators", label: "汽油發電機", unit: "台" },
  { key: "gasolineLiters", label: "備用汽油", unit: "公升" },
  { key: "dieselLiters", label: "備用柴油", unit: "公升" },
  { key: "emergencyLights", label: "緊急照明燈(含手電筒)", unit: "只" },
  { key: "sandbags", label: "砂包", unit: "包" },
  { key: "firstAidKits", label: "急救箱", unit: "盒" },
  { key: "fireExtinguishers", label: "滅火器", unit: "只" },
  { key: "emergencyPersonnel", label: "緊急動員人力", unit: "人" },
];

const ZoneEquipmentEditor = ({ zones, onChange, siteId }: Props) => {
  const zone = zones[0] || createEmptyZone();
  const [showHistory, setShowHistory] = useState(false);

  const history = siteId ? getHistory(siteId).filter(h => h.zones && h.zones.length > 0) : [];

  const updateField = (key: string, value: number) => {
    onChange([{ ...zone, [key]: value }]);
  };

  const copyFromHistory = (histZone: ZoneEquipment) => {
    onChange([{ ...histZone, zoneName: zone.zoneName }]);
  };

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">設備整備數量</span>
          </div>
          {history.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 h-7 text-xs"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="h-3.5 w-3.5" />複製歷次數量
            </Button>
          )}
        </div>

        {/* Copy from history */}
        {showHistory && history.length > 0 && (
          <div className="mb-3 space-y-1.5 max-h-40 overflow-y-auto">
            {history.map(entry => {
              const hz = entry.zones![0];
              return (
                <div key={entry.id} className="flex items-center justify-between rounded-md bg-background border border-border px-3 py-1.5 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(entry.submittedAt).toLocaleDateString("zh-TW")} — 抽水機 {hz.mobilePumps + hz.fixedPumps} 台 / 發電機 {hz.dieselGenerators + hz.gasGenerators} 台
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="gap-1 h-6 text-xs" onClick={() => { copyFromHistory(hz); setShowHistory(false); }}>
                    <Copy className="h-3 w-3" />套用
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-[11px] font-medium text-muted-foreground">{f.label}</label>
              <div className="flex items-center gap-1 mt-0.5">
                <Input
                  type="number"
                  min={0}
                  value={zone[f.key] as number}
                  onChange={e => updateField(f.key, Math.max(0, +e.target.value))}
                  className="h-8 text-xs"
                />
                <span className="text-[10px] text-muted-foreground shrink-0 w-6">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fuel summary */}
        <div className="mt-2 text-xs text-muted-foreground">
          (備用油料：汽油 {zone.gasolineLiters} 公升 / 柴油 {zone.dieselLiters} 公升)
        </div>
      </CardContent>
    </Card>
  );
};

export default ZoneEquipmentEditor;
