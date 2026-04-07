export function hoursAgo(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60));
}

export function getUpdateStatus(iso: string): "ok" | "warning" | "overdue" {
  const h = hoursAgo(iso);
  if (h <= 24) return "ok";
  if (h <= 48) return "warning";
  return "overdue";
}

export function getUpdateBadgeVariant(iso: string): "default" | "secondary" | "destructive" {
  const status = getUpdateStatus(iso);
  return status === "ok" ? "default" : status === "warning" ? "secondary" : "destructive";
}
