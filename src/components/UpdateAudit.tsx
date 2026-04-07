import { auditRecords } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

function getStatus(lastUpdated: string): { label: string; color: string; dotClass: string } {
  const diff = Date.now() - new Date(lastUpdated).getTime();
  const hours = diff / (1000 * 60 * 60);
  if (hours <= 24) return { label: "已更新", color: "text-status-green", dotClass: "bg-status-green" };
  if (hours <= 48) return { label: "待更新", color: "text-status-yellow", dotClass: "bg-status-yellow" };
  return { label: "逾期未更新", color: "text-status-red", dotClass: "bg-status-red" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoursAgo(iso: string) {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
  return h < 1 ? "<1h" : `${h}h`;
}

const UpdateAudit = () => {
  const sorted = [...auditRecords].sort(
    (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
  );

  return (
    <div className="space-y-4 card-fade-in">
      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-green inline-block" /> 24h 內</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-yellow inline-block" /> 24–48h</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-status-red inline-block" /> &gt;48h</span>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {sorted.map(r => {
          const s = getStatus(r.lastUpdated);
          return (
            <Card key={r.department} className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{r.department}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.color}`}>
                    <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                    {s.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>{formatDate(r.lastUpdated)}</span>
                  <span>{hoursAgo(r.lastUpdated)} 前</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop table view */}
      <Card className="border-border shadow-sm overflow-hidden hidden sm:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">部門</TableHead>
                <TableHead className="font-semibold">最後更新</TableHead>
                <TableHead className="font-semibold">距今</TableHead>
                <TableHead className="font-semibold text-center">狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(r => {
                const s = getStatus(r.lastUpdated);
                return (
                  <TableRow key={r.department}>
                    <TableCell className="font-medium">{r.department}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(r.lastUpdated)}</TableCell>
                    <TableCell className="text-muted-foreground">{hoursAgo(r.lastUpdated)} 前</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.color}`}>
                        <span className={`w-2 h-2 rounded-full ${s.dotClass}`} />
                        {s.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateAudit;
