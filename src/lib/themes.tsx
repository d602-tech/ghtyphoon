import { createContext, useContext, useState, ReactNode } from "react";

export interface ThemeColors {
  id: string;
  name: string;
  primary: string;       // HSL values like "213 65% 32%"
  accent: string;
  primaryFg: string;
  accentFg: string;
  background: string;
  foreground: string;
  card: string;
  cardFg: string;
  muted: string;
  mutedFg: string;
  border: string;
  secondary: string;
  secondaryFg: string;
}

export const dashboardThemes: ThemeColors[] = [
  {
    id: "navy", name: "深藍",
    primary: "217 71% 43%", accent: "32 95% 52%", primaryFg: "0 0% 100%", accentFg: "0 0% 100%",
    background: "220 20% 97%", foreground: "222 47% 11%", card: "0 0% 100%", cardFg: "222 47% 11%",
    muted: "220 18% 93%", mutedFg: "220 10% 46%", border: "220 13% 88%", secondary: "220 25% 93%", secondaryFg: "217 71% 43%",
  },
  {
    id: "forest", name: "森林綠",
    primary: "162 63% 32%", accent: "24 90% 50%", primaryFg: "0 0% 100%", accentFg: "0 0% 100%",
    background: "150 16% 96%", foreground: "160 40% 8%", card: "0 0% 100%", cardFg: "160 40% 8%",
    muted: "150 12% 92%", mutedFg: "155 10% 44%", border: "150 12% 86%", secondary: "150 20% 92%", secondaryFg: "162 63% 32%",
  },
  {
    id: "crimson", name: "暗紅",
    primary: "346 67% 40%", accent: "28 85% 52%", primaryFg: "0 0% 100%", accentFg: "0 0% 100%",
    background: "340 12% 96%", foreground: "340 40% 10%", card: "0 0% 100%", cardFg: "340 40% 10%",
    muted: "340 10% 92%", mutedFg: "340 8% 46%", border: "340 10% 86%", secondary: "340 16% 92%", secondaryFg: "346 67% 40%",
  },
  {
    id: "slate", name: "石板",
    primary: "226 40% 30%", accent: "199 80% 48%", primaryFg: "0 0% 100%", accentFg: "0 0% 100%",
    background: "225 14% 96%", foreground: "226 30% 10%", card: "0 0% 100%", cardFg: "226 30% 10%",
    muted: "225 10% 92%", mutedFg: "225 8% 46%", border: "225 10% 86%", secondary: "225 14% 92%", secondaryFg: "226 40% 30%",
  },
];

export const presentationThemes: ThemeColors[] = [
  { ...dashboardThemes[0], id: "p-navy", name: "深藍" },
  { ...dashboardThemes[1], id: "p-forest", name: "森林綠" },
  { ...dashboardThemes[2], id: "p-crimson", name: "暗紅" },
  {
    id: "p-dark", name: "暗色",
    primary: "224 30% 16%", accent: "32 95% 52%", primaryFg: "220 15% 92%", accentFg: "0 0% 100%",
    background: "224 25% 10%", foreground: "220 15% 92%", card: "224 22% 14%", cardFg: "220 15% 88%",
    muted: "224 18% 18%", mutedFg: "220 10% 56%", border: "224 15% 22%", secondary: "224 18% 18%", secondaryFg: "220 12% 80%",
  },
];

interface ThemeContextValue {
  dashboardTheme: ThemeColors;
  setDashboardTheme: (t: ThemeColors) => void;
  presTheme: ThemeColors;
  setPresTheme: (t: ThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [dashboardTheme, setDashboardTheme] = useState(dashboardThemes[0]);
  const [presTheme, setPresTheme] = useState(presentationThemes[0]);

  return (
    <ThemeContext.Provider value={{ dashboardTheme, setDashboardTheme, presTheme, setPresTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/** Apply a ThemeColors object as CSS custom properties on an element style */
export function themeToCSS(t: ThemeColors): React.CSSProperties {
  return {
    "--primary": t.primary,
    "--primary-foreground": t.primaryFg,
    "--accent": t.accent,
    "--accent-foreground": t.accentFg,
    "--background": t.background,
    "--foreground": t.foreground,
    "--card": t.card,
    "--card-foreground": t.cardFg,
    "--muted": t.muted,
    "--muted-foreground": t.mutedFg,
    "--border": t.border,
    "--input": t.border,
    "--ring": t.primary,
    "--secondary": t.secondary,
    "--secondary-foreground": t.secondaryFg,
    "--popover": t.card,
    "--popover-foreground": t.cardFg,
  } as React.CSSProperties;
}
