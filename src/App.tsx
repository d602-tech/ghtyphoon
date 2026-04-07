import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminProvider } from "@/lib/adminStore";
import { AuthProvider, useAuth } from "@/lib/authStore";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import NotFound from "./pages/NotFound";

const AdminProjects = lazy(() => import("./pages/AdminProjects"));
const AdminPersonnel = lazy(() => import("./pages/AdminPersonnel"));
const AdminEntries = lazy(() => import("./pages/AdminEntries"));
const AdminReports = lazy(() => import("./pages/AdminReports"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

/** Redirect to login if not authenticated */
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

/** Redirect to role-based home if already logged in */
const RedirectIfAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/** Only allow admin role */
const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
      <Route path="/" element={
        <RequireAuth>
          {user?.role === "admin" ? <Navigate to="/admin" replace /> : <Index />}
        </RequireAuth>
      } />
      <Route path="/admin" element={
        <RequireAuth>
          <RequireAdmin><AdminLayout /></RequireAdmin>
        </RequireAuth>
      }>
        <Route index element={<Navigate to="projects" replace />} />
        <Route path="projects" element={<Suspense fallback={<PageLoader />}><AdminProjects /></Suspense>} />
        <Route path="personnel" element={<Suspense fallback={<PageLoader />}><AdminPersonnel /></Suspense>} />
        <Route path="entries" element={<Suspense fallback={<PageLoader />}><AdminEntries /></Suspense>} />
        <Route path="reports" element={<Suspense fallback={<PageLoader />}><AdminReports /></Suspense>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AdminProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
