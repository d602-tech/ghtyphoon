import { useState } from "react";
import { useAdmin, Personnel } from "@/lib/adminStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Shield, UserCheck, HardHat, PackageOpen, Phone, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const roleLabels: Record<string, string> = { contractor: "承攬商", dept_manager: "部門管理員", admin: "管理者" };
const roleColors: Record<string, string> = { contractor: "secondary", dept_manager: "default", admin: "destructive" };

const AdminPersonnel = () => {
  const { personnel, setPersonnel, sites } = useAdmin();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editPerson, setEditPerson] = useState<Personnel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = personnel.filter(p => {
    const matchSearch = p.name.includes(search) || p.department.includes(search) || p.email.includes(search);
    const matchRole = roleFilter === "all" || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleSave = (data: Omit<Personnel, "id">) => {
    if (editPerson) {
      setPersonnel(prev => prev.map(p => p.id === editPerson.id ? { ...p, ...data } : p));
      toast({ title: "已更新人員資料" });
    } else {
      setPersonnel(prev => [...prev, { ...data, id: `p${Date.now()}` }]);
      toast({ title: "已新增人員" });
    }
    setDialogOpen(false);
    setEditPerson(null);
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    setPersonnel(prev => prev.filter(p => p.id !== deleteId));
    toast({ title: "已刪除人員", variant: "destructive" });
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">人員權限管理</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-28 sm:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="contractor">承攬商</SelectItem>
              <SelectItem value="dept_manager">部門管理員</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜尋..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {(["admin", "dept_manager", "contractor"] as const).map(role => {
          const count = personnel.filter(p => p.role === role).length;
          const Icon = role === "admin" ? Shield : role === "dept_manager" ? UserCheck : HardHat;
          return (
            <Card key={role}>
              <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:pt-6">
                <div className="rounded-xl p-2 sm:p-3 bg-primary/10"><Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /></div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{roleLabels[role]}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">人員清單</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditPerson(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => setEditPerson(null)}><Plus className="h-4 w-4" />新增人員</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editPerson ? "編輯人員" : "新增人員"}</DialogTitle></DialogHeader>
              <PersonnelForm initial={editPerson} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <PackageOpen className="h-12 w-12 opacity-40" />
              <p>尚無人員資料</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>負責工程</TableHead>
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant={roleColors[p.role] as any}>{roleLabels[p.role]}</Badge></TableCell>
                        <TableCell>{p.department}</TableCell>
                        <TableCell className="text-sm">{p.phone}</TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>{p.assignedProjects.length > 0 ? `${p.assignedProjects.length} 項` : "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => { setEditPerson(p); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filtered.map(p => (
                  <Card key={p.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-foreground">{p.name}</span>
                            <Badge variant={roleColors[p.role] as any} className="text-[10px]">{roleLabels[p.role]}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.department}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditPerson(p); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>}
                        {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>}
                        {p.assignedProjects.length > 0 && <span>{p.assignedProjects.length} 項工程</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null); }}
        onConfirm={confirmDelete}
        description="確定要刪除此人員？此操作無法復原。"
      />
    </div>
  );
};

const PersonnelForm = ({ initial, onSave }: { initial: Personnel | null; onSave: (d: Omit<Personnel, "id">) => void }) => {
  const [form, setForm] = useState({
    name: initial?.name || "",
    role: initial?.role || "contractor" as Personnel["role"],
    department: initial?.department || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    assignedProjects: initial?.assignedProjects || [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.department.trim()) newErrors.department = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  const fieldClass = (key: string) => errors[key] ? "border-destructive" : "";

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">姓名 *</label>
        <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(e2 => ({ ...e2, name: false })); }} className={fieldClass("name")} />
        {errors.name && <p className="text-xs text-destructive mt-1">必填欄位</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">角色</label>
        <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as Personnel["role"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contractor">承攬商</SelectItem>
              <SelectItem value="dept_manager">部門管理員</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
            </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">部門 *</label>
        <Input value={form.department} onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setErrors(e2 => ({ ...e2, department: false })); }} className={fieldClass("department")} />
        {errors.department && <p className="text-xs text-destructive mt-1">必填欄位</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-foreground">電話</label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div><label className="text-sm font-medium text-foreground">Email</label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
      </div>
      <Button onClick={handleSubmit} className="w-full">儲存</Button>
    </div>
  );
};

export default AdminPersonnel;
