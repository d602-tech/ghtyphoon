import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteRecord } from "@/lib/mockData";
import { hoursAgo, getUpdateBadgeVariant } from "@/lib/utils/hoursAgo";

interface SiteDetailsTableProps {
  sites: SiteRecord[];
}

const SiteDetailsTable = ({ sites }: SiteDetailsTableProps) => (
  <Card>
    <CardHeader><CardTitle className="text-lg">工地詳細資料</CardTitle></CardHeader>
    <CardContent>
      {sites.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">暫無工地資料</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>簡稱</TableHead>
                <TableHead>工程名稱</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>自有抽水機</TableHead>
                <TableHead>租用抽水機</TableHead>
                <TableHead>自有發電機</TableHead>
                <TableHead>租用發電機</TableHead>
                <TableHead>更新狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map(s => {
                const h = hoursAgo(s.lastUpdated);
                return (
                  <TableRow key={s.id}>
                    <TableCell><Badge variant="secondary">{s.projectShortName}</Badge></TableCell>
                    <TableCell className="font-medium max-w-[180px] truncate">{s.projectName}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>{s.ownPumps}</TableCell>
                    <TableCell>{s.rentedPumps}</TableCell>
                    <TableCell>{s.ownGenerators}</TableCell>
                    <TableCell>{s.rentedGenerators}</TableCell>
                    <TableCell>
                      <Badge variant={getUpdateBadgeVariant(s.lastUpdated)}>{h}h 前</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SiteDetailsTable;
