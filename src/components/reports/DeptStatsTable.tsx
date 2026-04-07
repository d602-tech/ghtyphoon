import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3 } from "lucide-react";

interface DeptStat {
  dept: string;
  count: number;
  pumps: number;
  gens: number;
  overdue: number;
}

interface DeptStatsTableProps {
  stats: DeptStat[];
}

const DeptStatsTable = ({ stats }: DeptStatsTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />各部門統計
      </CardTitle>
    </CardHeader>
    <CardContent>
      {stats.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">暫無部門資料</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>部門</TableHead>
              <TableHead>工程數</TableHead>
              <TableHead>抽水機</TableHead>
              <TableHead>發電機</TableHead>
              <TableHead>逾期未更新</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map(d => (
              <TableRow key={d.dept}>
                <TableCell className="font-semibold">{d.dept}</TableCell>
                <TableCell>{d.count}</TableCell>
                <TableCell>{d.pumps}</TableCell>
                <TableCell>{d.gens}</TableCell>
                <TableCell>
                  {d.overdue > 0
                    ? <Badge variant="destructive">{d.overdue}</Badge>
                    : <Badge variant="default">0</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </CardContent>
  </Card>
);

export default DeptStatsTable;
