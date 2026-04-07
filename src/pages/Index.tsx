import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardSummary from "@/components/DashboardSummary";
import SiteInspection from "@/components/SiteInspection";
import OfficeInspection from "@/components/OfficeInspection";
import UpdateAudit from "@/components/UpdateAudit";
import PresentationMode from "@/components/PresentationMode";
import ContractorSiteView from "@/components/ContractorSiteView";
import DeptManagerReview from "@/components/DeptManagerReview";
import { ThemeProvider, useTheme, themeToCSS } from "@/lib/themes";
import { useAuth } from "@/lib/authStore";
import { HardHat, Building, ClipboardCheck } from "lucide-react";

const IndexInner = () => {
  const [presenting, setPresenting] = useState(false);
  const { dashboardTheme } = useTheme();
  const { user } = useAuth();
  const isContractor = user?.role === "contractor";
  const isDeptManager = user?.role === "dept_manager";

  return (
    <div className="min-h-screen bg-background" style={themeToCSS(dashboardTheme)}>
      <DashboardHeader onPresent={() => setPresenting(true)} />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {!isContractor && !isDeptManager && <DashboardSummary />}
        {isContractor ? (
          <ContractorSiteView />
        ) : isDeptManager ? (
          <DeptManagerReview />
        ) : (
          <Tabs defaultValue="site" className="space-y-4 sm:space-y-6">
            <TabsList className="bg-card border border-border shadow-sm p-1 h-auto w-full grid grid-cols-3">
              <TabsTrigger value="site" className="gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm">
                <HardHat className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>工地整備</span>
              </TabsTrigger>
              <TabsTrigger value="office" className="gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm">
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>辦公室整備</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm">
                <ClipboardCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>更新稽核</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site"><SiteInspection /></TabsContent>
            <TabsContent value="office"><OfficeInspection /></TabsContent>
            <TabsContent value="audit"><UpdateAudit /></TabsContent>
          </Tabs>
        )}
      </main>

      {presenting && <PresentationMode onClose={() => setPresenting(false)} />}
    </div>
  );
};

const Index = () => (
  <ThemeProvider>
    <IndexInner />
  </ThemeProvider>
);

export default Index;
