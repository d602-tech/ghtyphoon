import { useTheme, dashboardThemes, presentationThemes, ThemeColors } from "@/lib/themes";
import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ThemePickerProps {
  mode: "dashboard" | "presentation";
}

const ThemePicker = ({ mode }: ThemePickerProps) => {
  const { dashboardTheme, setDashboardTheme, presTheme, setPresTheme } = useTheme();
  const themes = mode === "dashboard" ? dashboardThemes : presentationThemes;
  const current = mode === "dashboard" ? dashboardTheme : presTheme;
  const setCurrent = mode === "dashboard" ? setDashboardTheme : setPresTheme;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition">
          <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">配色</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <p className="text-xs text-muted-foreground px-2 py-1 mb-1">
          {mode === "dashboard" ? "儀表板配色" : "簡報配色"}
        </p>
        {themes.map(t => (
          <ThemeOption key={t.id} theme={t} active={current.id === t.id} onClick={() => setCurrent(t)} />
        ))}
      </PopoverContent>
    </Popover>
  );
};

const ThemeOption = ({ theme, active, onClick }: { theme: ThemeColors; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm transition ${
      active ? "bg-accent/20 font-semibold" : "hover:bg-muted"
    }`}
  >
    <div className="flex gap-1">
      <span className="w-4 h-4 rounded-full border border-border" style={{ background: `hsl(${theme.primary})` }} />
      <span className="w-4 h-4 rounded-full border border-border" style={{ background: `hsl(${theme.accent})` }} />
    </div>
    <span>{theme.name}</span>
  </button>
);

export default ThemePicker;
