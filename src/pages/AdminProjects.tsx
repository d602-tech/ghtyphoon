import { useState, useCallback, useRef } from "react";
import { useAdmin } from "@/lib/adminStore";
import { useSitePhotos } from "@/lib/photoStore";
import { SiteRecord, OfficeRecord } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, HardHat, Building2, Search, PackageOpen, Droplets, Zap, Copy, Camera, X, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { hoursAgo, getUpdateBadgeVariant } from "@/lib/utils/hoursAgo";
import ConfirmDialog from "@/components/ConfirmDialog";

const AdminProjects = () => {
  const { sites, setSites, offices, setOffices } = useAdmin();
  const [search, setSearch] = useState("");
  const [editSite, setEditSite] = useState<SiteRecord | null>(null);
  const [editOffice, setEditOffice] = useState<OfficeRecord | null>(null);
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [officeDialogOpen, setOfficeDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "site" | "office"; id: string } | null>(null);

  const filteredSites = sites.filter(s =>
    s.projectName.includes(search) || s.projectShortName.includes(search) || s.department.includes(search)
  );
  const filteredOffices = offices.filter(o =>
    o.officeName.includes(search) || o.department.includes(search)
  );

  const handleSaveSite = useCallback((data: Partial<SiteRecord>) => {
    if (editSite) {
      setSites(prev => prev.map(s => s.id === editSite.id ? { ...s, ...data, lastUpdated: new Date().toISOString() } : s));
      toast({ title: "已更新工地資料" });
    } else {
      const newSite: SiteRecord = {
        id: String(Date.now()),
        projectName: data.projectName || "",
        projectShortName: data.projectShortName || "",
        department: data.department || "",
        inspector: data.inspector || "",
        contractor: data.contractor || "",
        safetyOfficer: data.safetyOfficer || "",
        siteDirector: data.siteDirector || "",
        constructionStatus: data.constructionStatus || "",
        typhoonMeasures: data.typhoonMeasures || "",
        ownPumps: data.ownPumps || 0,
        rentedPumps: data.rentedPumps || 0,
        ownGenerators: data.ownGenerators || 0,
        rentedGenerators: data.rentedGenerators || 0,
        lastUpdated: new Date().toISOString(),
      };
      setSites(prev => [...prev, newSite]);
      toast({ title: "已新增工地" });
    }
    setSiteDialogOpen(false);
    setEditSite(null);
  }, [editSite, setSites]);

  const handleSaveOffice = useCallback((data: Partial<OfficeRecord>) => {
    if (editOffice) {
      setOffices(prev => prev.map(o => o.id === editOffice.id ? { ...o, ...data, lastUpdated: new Date().toISOString() } : o));
      toast({ title: "已更新辦公室資料" });
    } else {
      const newOffice: OfficeRecord = {
        id: String(Date.now()),
        officeName: data.officeName || "",
        department: data.department || "",
        contact: data.contact || "",
        typhoonMeasures: data.typhoonMeasures || "",
        pumps: data.pumps || 0,
        generators: data.generators || 0,
        lastUpdated: new Date().toISOString(),
      };
      setOffices(prev => [...prev, newOffice]);
      toast({ title: "已新增辦公室" });
    }
    setOfficeDialogOpen(false);
    setEditOffice(null);
  }, [editOffice, setOffices]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "site") {
      setSites(prev => prev.filter(s => s.id !== deleteTarget.id));
      toast({ title: "已刪除工地", variant: "destructive" });
    } else {
      setOffices(prev => prev.filter(o => o.id !== deleteTarget.id));
      toast({ title: "已刪除辦公室", variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
      <PackageOpen className="h-12 w-12 opacity-40" />
      <p>尚無{label}資料</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">工程項目管理</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜尋工程名稱、部門..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs defaultValue="sites">
        <TabsList>
          <TabsTrigger value="sites" className="gap-2"><HardHat className="h-4 w-4" />工地 ({sites.length})</TabsTrigger>
          <TabsTrigger value="offices" className="gap-2"><Building2 className="h-4 w-4" />辦公室 ({offices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">工地清單</CardTitle>
              <Dialog open={siteDialogOpen} onOpenChange={o => { setSiteDialogOpen(o); if (!o) setEditSite(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" onClick={() => setEditSite(null)}><Plus className="h-4 w-4" />新增工地</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editSite ? "編輯工地" : "新增工地"}</DialogTitle></DialogHeader>
                  <SiteForm initial={editSite} onSave={handleSaveSite} allSites={sites} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredSites.length === 0 ? <EmptyState label="工地" /> : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>簡稱</TableHead>
                          <TableHead>工程名稱</TableHead>
                          <TableHead>部門</TableHead>
                          <TableHead>抽水機</TableHead>
                          <TableHead>發電機</TableHead>
                          <TableHead>更新</TableHead>
                          <TableHead className="w-24">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSites.map(s => {
                          const h = hoursAgo(s.lastUpdated);
                          return (
                            <TableRow key={s.id}>
                              <TableCell><Badge variant="secondary">{s.projectShortName}</Badge></TableCell>
                              <TableCell className="font-medium max-w-[200px] truncate">{s.projectName}</TableCell>
                              <TableCell>{s.department}</TableCell>
                              <TableCell>{s.ownPumps + s.rentedPumps}</TableCell>
                              <TableCell>{s.ownGenerators + s.rentedGenerators}</TableCell>
                              <TableCell><Badge variant={getUpdateBadgeVariant(s.lastUpdated)}>{h}h</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" onClick={() => { setEditSite(s); setSiteDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ type: "site", id: s.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden space-y-3">
                    {filteredSites.map(s => {
                      const h = hoursAgo(s.lastUpdated);
                      return (
                        <Card key={s.id} className="border shadow-none">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="shrink-0">{s.projectShortName}</Badge>
                                  <Badge variant={getUpdateBadgeVariant(s.lastUpdated)} className="shrink-0">{h}h</Badge>
                                </div>
                                <p className="text-sm font-medium text-foreground truncate">{s.projectName}</p>
                                <p className="text-xs text-muted-foreground">{s.department}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditSite(s); setSiteDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteTarget({ type: "site", id: s.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />抽水機 {s.ownPumps + s.rentedPumps}</span>
                              <span className="flex items-center gap-1"><Zap className="h-3 w-3" />發電機 {s.ownGenerators + s.rentedGenerators}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offices" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">辦公室清單</CardTitle>
              <Dialog open={officeDialogOpen} onOpenChange={o => { setOfficeDialogOpen(o); if (!o) setEditOffice(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5" onClick={() => setEditOffice(null)}><Plus className="h-4 w-4" />新增辦公室</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>{editOffice ? "編輯辦公室" : "新增辦公室"}</DialogTitle></DialogHeader>
                  <OfficeForm initial={editOffice} onSave={handleSaveOffice} allOffices={offices} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {filteredOffices.length === 0 ? <EmptyState label="辦公室" /> : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>辦公室名稱</TableHead>
                          <TableHead>部門</TableHead>
                          <TableHead>聯絡人</TableHead>
                          <TableHead>抽水機</TableHead>
                          <TableHead>發電機</TableHead>
                          <TableHead className="w-24">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOffices.map(o => (
                          <TableRow key={o.id}>
                            <TableCell className="font-medium">{o.officeName}</TableCell>
                            <TableCell>{o.department}</TableCell>
                            <TableCell>{o.contact}</TableCell>
                            <TableCell>{o.pumps}</TableCell>
                            <TableCell>{o.generators}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => { setEditOffice(o); setOfficeDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget({ type: "office", id: o.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden space-y-3">
                    {filteredOffices.map(o => (
                      <Card key={o.id} className="border shadow-none">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{o.officeName}</p>
                              <p className="text-xs text-muted-foreground">{o.department} · {o.contact}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditOffice(o); setOfficeDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteTarget({ type: "office", id: o.id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />抽水機 {o.pumps}</span>
                            <span className="flex items-center gap-1"><Zap className="h-3 w-3" />發電機 {o.generators}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        description={`確定要刪除此${deleteTarget?.type === "site" ? "工地" : "辦公室"}？此操作無法復原。`}
      />
    </div>
  );
};

/* ===================== FORMS ===================== */
const SiteForm = ({ initial, onSave, allSites }: { initial: SiteRecord | null; onSave: (d: Partial<SiteRecord>) => void; allSites: SiteRecord[] }) => {
  const siteId = initial?.id || "__new__";
  const [photos, addPhoto, removePhoto, updateCaption] = useSitePhotos(siteId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    projectName: initial?.projectName || "",
    projectShortName: initial?.projectShortName || "",
    department: initial?.department || "",
    inspector: initial?.inspector || "",
    contractor: initial?.contractor || "",
    safetyOfficer: initial?.safetyOfficer || "",
    siteDirector: initial?.siteDirector || "",
    constructionStatus: initial?.constructionStatus || "",
    typhoonMeasures: initial?.typhoonMeasures || "",
    ownPumps: initial?.ownPumps || 0,
    rentedPumps: initial?.rentedPumps || 0,
    ownGenerators: initial?.ownGenerators || 0,
    rentedGenerators: initial?.rentedGenerators || 0,
  });
  const [copySource, setCopySource] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const set = (k: string, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: false }));
  };

  const handleCopyFromPrevious = () => {
    const source = allSites.find(s => s.id === copySource);
    if (source) {
      setForm(f => ({
        ...f,
        constructionStatus: source.constructionStatus,
        typhoonMeasures: source.typhoonMeasures,
      }));
      toast({ title: "已複製施工概況與防颱作為", description: `來源：${source.projectShortName}` });
    }
  };

  // Other sites to copy from (exclude current editing site)
  const copyableSites = allSites.filter(s => s.id !== initial?.id);

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.projectName.trim()) newErrors.projectName = true;
    if (!form.projectShortName.trim()) newErrors.projectShortName = true;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">工程簡稱 *</label>
          <Input value={form.projectShortName} onChange={e => set("projectShortName", e.target.value)} className={fieldClass("projectShortName")} />
          {errors.projectShortName && <p className="text-xs text-destructive mt-1">必填欄位</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">主辦部門 *</label>
          <Input value={form.department} onChange={e => set("department", e.target.value)} className={fieldClass("department")} />
          {errors.department && <p className="text-xs text-destructive mt-1">必填欄位</p>}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">工程名稱 *</label>
        <Input value={form.projectName} onChange={e => set("projectName", e.target.value)} className={fieldClass("projectName")} />
        {errors.projectName && <p className="text-xs text-destructive mt-1">必填欄位</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-foreground">現檢員</label><Input value={form.inspector} onChange={e => set("inspector", e.target.value)} /></div>
        <div><label className="text-sm font-medium text-foreground">承攬商</label><Input value={form.contractor} onChange={e => set("contractor", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-foreground">職安人員</label><Input value={form.safetyOfficer} onChange={e => set("safetyOfficer", e.target.value)} /></div>
        <div><label className="text-sm font-medium text-foreground">工地主任</label><Input value={form.siteDirector} onChange={e => set("siteDirector", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div><label className="text-sm font-medium text-foreground">自有抽水機</label><Input type="number" min={0} value={form.ownPumps} onChange={e => set("ownPumps", +e.target.value)} /></div>
        <div><label className="text-sm font-medium text-foreground">租用抽水機</label><Input type="number" min={0} value={form.rentedPumps} onChange={e => set("rentedPumps", +e.target.value)} /></div>
        <div><label className="text-sm font-medium text-foreground">自有發電機</label><Input type="number" min={0} value={form.ownGenerators} onChange={e => set("ownGenerators", +e.target.value)} /></div>
        <div><label className="text-sm font-medium text-foreground">租用發電機</label><Input type="number" min={0} value={form.rentedGenerators} onChange={e => set("rentedGenerators", +e.target.value)} /></div>
      </div>

      {/* Copy from previous section */}
      {copyableSites.length > 0 && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">複製上次資料</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">從其他工程複製施工概況與防颱作為</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={copySource} onValueChange={setCopySource}>
                <SelectTrigger className="flex-1 bg-card">
                  <SelectValue placeholder="選擇來源工程" />
                </SelectTrigger>
                <SelectContent>
                  {copyableSites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.projectShortName} — {s.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" disabled={!copySource} onClick={handleCopyFromPrevious}>
                <Copy className="h-3.5 w-3.5" />複製
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div><label className="text-sm font-medium text-foreground">施工概況</label><Textarea rows={3} value={form.constructionStatus} onChange={e => set("constructionStatus", e.target.value)} /></div>
      <div><label className="text-sm font-medium text-foreground">防颱作為</label><Textarea rows={3} value={form.typhoonMeasures} onChange={e => set("typhoonMeasures", e.target.value)} /></div>

      {/* Photo upload section */}
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">現場照片</span>
            </div>
            <Badge variant="secondary" className="text-xs">{photos.length} 張</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">承攬商可上傳工地現場照片（暫存於瀏覽器記憶體）</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              const files = e.target.files;
              if (files) Array.from(files).forEach(f => addPhoto(f));
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" className="gap-1.5 mb-3" onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-3.5 w-3.5" />選擇照片
          </Button>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative group rounded-md overflow-hidden border border-border aspect-square">
                  <img src={photo.dataUrl} alt={`現場照片 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border border-dashed border-border rounded-md">
              <ImageIcon className="h-8 w-8 opacity-30 mb-1" />
              <p className="text-xs">尚未上傳照片</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full">儲存</Button>
    </div>
  );
};

const OfficeForm = ({ initial, onSave, allOffices = [] }: { initial: OfficeRecord | null; onSave: (d: Partial<OfficeRecord>) => void; allOffices?: OfficeRecord[] }) => {
  const [form, setForm] = useState({
    officeName: initial?.officeName || "",
    department: initial?.department || "",
    contact: initial?.contact || "",
    typhoonMeasures: initial?.typhoonMeasures || "",
    pumps: initial?.pumps || 0,
    generators: initial?.generators || 0,
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [copySource, setCopySource] = useState("");
  const set = (k: string, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: false }));
  };

  const copyOptions = allOffices.filter(o => o.id !== initial?.id && o.typhoonMeasures?.trim());

  const handleCopyFromPrevious = () => {
    const source = allOffices.find(o => o.id === copySource);
    if (!source) return;
    setForm(f => ({ ...f, typhoonMeasures: source.typhoonMeasures }));
    toast({ title: "已複製", description: `已從「${source.officeName}」複製防颱作為` });
  };

  const handleSubmit = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.officeName.trim()) newErrors.officeName = true;
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
        <label className="text-sm font-medium text-foreground">辦公室名稱 *</label>
        <Input value={form.officeName} onChange={e => { setForm(f => ({ ...f, officeName: e.target.value })); setErrors(e2 => ({ ...e2, officeName: false })); }} className={fieldClass("officeName")} />
        {errors.officeName && <p className="text-xs text-destructive mt-1">必填欄位</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">部門 *</label>
        <Input value={form.department} onChange={e => { setForm(f => ({ ...f, department: e.target.value })); setErrors(e2 => ({ ...e2, department: false })); }} className={fieldClass("department")} />
        {errors.department && <p className="text-xs text-destructive mt-1">必填欄位</p>}
      </div>
      <div><label className="text-sm font-medium text-foreground">聯絡人</label><Input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-foreground">抽水機</label><Input type="number" min={0} value={form.pumps} onChange={e => setForm(f => ({ ...f, pumps: +e.target.value }))} /></div>
        <div><label className="text-sm font-medium text-foreground">發電機</label><Input type="number" min={0} value={form.generators} onChange={e => setForm(f => ({ ...f, generators: +e.target.value }))} /></div>
      </div>

      {copyOptions.length > 0 && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardContent className="p-3 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" />從其他辦公室複製防颱作為</label>
            <div className="flex gap-2">
              <Select value={copySource} onValueChange={setCopySource}>
                <SelectTrigger className="flex-1 h-9 text-sm"><SelectValue placeholder="選擇來源辦公室" /></SelectTrigger>
                <SelectContent>
                  {copyOptions.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.officeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" disabled={!copySource} onClick={handleCopyFromPrevious} className="gap-1"><Copy className="h-3.5 w-3.5" />複製</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div><label className="text-sm font-medium text-foreground">防颱作為</label><Textarea rows={3} value={form.typhoonMeasures} onChange={e => setForm(f => ({ ...f, typhoonMeasures: e.target.value }))} /></div>
      <Button onClick={handleSubmit} className="w-full">儲存</Button>
    </div>
  );
};

export default AdminProjects;
