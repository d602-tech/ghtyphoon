import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Legend } from "recharts";
import { CalendarDays } from "lucide-react";
import { SiteRecord } from "@/lib/mockData";
import { hoursAgo } from "@/lib/utils/hoursAgo";

const TREND_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(210, 60%, 50%)",
  "hsl(150, 50%, 45%)",
  "hsl(30, 70%, 50%)",
];

interface TrendChartProps {
  sites: SiteRecord[];
}

const TrendChart = ({ sites }: TrendChartProps) => {
  const siteNames = sites.slice(0, 6).map(s => s.projectShortName);

  const trendData = useMemo(() => {
    const days: { date: string; dateLabel: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({
        date: d.toISOString().slice(0, 10),
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }

    return days.map(({ date, dateLabel }) => {
      const row: Record<string, string | number> = { date: dateLabel };
      sites.slice(0, 6).forEach(site => {
        const h = hoursAgo(site.lastUpdated);
        const baseFreq = h <= 24 ? 3 : h <= 48 ? 2 : 1;
        const dayOffset = Math.abs(new Date(date).getDate() % 3);
        const seed = site.id.charCodeAt(site.id.length - 1) + dayOffset;
        row[site.projectShortName] = Math.max(0, baseFreq + (seed % 3) - 1);
      });
      return row;
    });
  }, [sites]);

  const chartConfig = Object.fromEntries(
    siteNames.map((name, i) => [name, { label: name, color: TREND_COLORS[i] }])
  );

  if (siteNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />過去 7 天更新頻率趨勢
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">暫無資料</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />過去 7 天更新頻率趨勢
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={trendData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {siteNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={TREND_COLORS[i]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
            <Legend />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
