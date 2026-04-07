import { Outlet, useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { PageTransition } from "@/components/PageTransition";
import { HardHat, Users, FileInput, BarChart3, Home, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "工程項目", url: "/admin/projects", icon: HardHat },
  { title: "人員權限", url: "/admin/personnel", icon: Users },
  { title: "資料填報", url: "/admin/entries", icon: FileInput },
  { title: "報表匯出", url: "/admin/reports", icon: BarChart3 },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar collapsible="icon">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>後台管理系統</span>
                  </div>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map(item => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-primary/10 text-primary font-semibold">
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="hidden md:flex" />
              <h1 className="text-base sm:text-lg font-bold text-foreground">防颱整備管理系統</h1>
            </div>
            <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">回儀表板</span>
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-6 pb-20 md:pb-6">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map(item => {
              const isActive = location.pathname.startsWith(item.url);
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className={cn(
                    "text-[10px] leading-tight truncate",
                    isActive ? "font-semibold" : "font-normal"
                  )}>
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-6 h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
