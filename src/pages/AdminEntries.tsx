import { useAdmin } from "@/lib/adminStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, FileInput, PackageOpen, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const statusLabels: Record<string, string> = { pending: "待審核", approved: "已核准", rejected: "已退回" };
const statusVariants: Record<string, any> = { pending: "secondary", approved: "default", rejected: "destructive" };

const AdminEntries = () => {
  const { entries, setEntries, sites, personnel } = useAdmin();

  const getProjectName = (id: string) => sites.find(s => s.id === id)?.projectShortName || id;
  const getPersonName = (id: string) => personnel.find(p => p.id === id)?.name || id;

  const handleApprove = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "approved" as const, reviewedAt: new Date().toISOString(), reviewedBy: "p6" } : e));
    toast({ title: "已核准填報" });
  };

  const handleReject = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status: "rejected" as const, reviewedAt: new Date().toISOString(), reviewedBy: "p6" } : e));
    toast({ title: "已退回填報", variant: "destructive" });
  };

  const pending = entries.filter(e => e.status === "pending").length;
  const approved = entries.filter(e => e.status === "approved").length;
  const rejected = entries.filter(e => e.status === "rejected").length;

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">資料填報管理</h2>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:pt-6">
            <div className="rounded-xl p-2 sm:p-3 bg-status-yellow/10"><Clock className="h-5 w-5 sm:h-6 sm:w-6 text-status-yellow" /></div>
            <div><p className="text-xl sm:text-2xl font-bold text-foreground">{pending}</p><p className="text-xs sm:text-sm text-muted-foreground">待審核</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:pt-6">
            <div className="rounded-xl p-2 sm:p-3 bg-status-green/10"><CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-status-green" /></div>
            <div><p className="text-xl sm:text-2xl font-bold text-foreground">{approved}</p><p className="text-xs sm:text-sm text-muted-foreground">已核准</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:pt-6">
            <div className="rounded-xl p-2 sm:p-3 bg-destructive/10"><XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" /></div>
            <div><p className="text-xl sm:text-2xl font-bold text-foreground">{rejected}</p><p className="text-xs sm:text-sm text-muted-foreground">已退回</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileInput className="h-5 w-5" />填報紀錄</CardTitle></CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <PackageOpen className="h-12 w-12 opacity-40" />
              <p>尚無填報紀錄</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>工程</TableHead>
                      <TableHead>填報人</TableHead>
                      <TableHead>填報時間</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>審核人</TableHead>
                      <TableHead>審核時間</TableHead>
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map(e => (
                      <TableRow key={e.id}>
                        <TableCell><Badge variant="secondary">{getProjectName(e.projectId)}</Badge></TableCell>
                        <TableCell>{getPersonName(e.submittedBy)}</TableCell>
                        <TableCell className="text-sm">{new Date(e.submittedAt).toLocaleString("zh-TW")}</TableCell>
                        <TableCell><Badge variant={statusVariants[e.status]}>{statusLabels[e.status]}</Badge></TableCell>
                        <TableCell>{e.reviewedBy ? getPersonName(e.reviewedBy) : "-"}</TableCell>
                        <TableCell className="text-sm">{e.reviewedAt ? new Date(e.reviewedAt).toLocaleString("zh-TW") : "-"}</TableCell>
                        <TableCell>
                          {e.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="default" className="gap-1 h-8" onClick={() => handleApprove(e.id)}>
                                <CheckCircle className="h-3.5 w-3.5" />核准
                              </Button>
                              <Button size="sm" variant="destructive" className="gap-1 h-8" onClick={() => handleReject(e.id)}>
                                <XCircle className="h-3.5 w-3.5" />退回
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {entries.map(e => (
                  <Card key={e.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{getProjectName(e.projectId)}</Badge>
                            <Badge variant={statusVariants[e.status]}>{statusLabels[e.status]}</Badge>
                          </div>
                          <p className="text-sm text-foreground">填報人：{getPersonName(e.submittedBy)}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(e.submittedAt).toLocaleString("zh-TW")}
                          </p>
                          {e.reviewedBy && (
                            <p className="text-xs text-muted-foreground">
                              審核：{getPersonName(e.reviewedBy)} · {e.reviewedAt ? new Date(e.reviewedAt).toLocaleString("zh-TW") : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      {e.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" className="gap-1 h-8 flex-1" onClick={() => handleApprove(e.id)}>
                            <CheckCircle className="h-3.5 w-3.5" />核准
                          </Button>
                          <Button size="sm" variant="destructive" className="gap-1 h-8 flex-1" onClick={() => handleReject(e.id)}>
                            <XCircle className="h-3.5 w-3.5" />退回
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEntries;
