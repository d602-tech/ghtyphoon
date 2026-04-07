import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";

interface EquipmentChartProps {
  data: { name: string; 抽水機: number; 發電機: number }[];
}

const chartConfig = {
  抽水機: { label: "抽水機", color: "hsl(var(--primary))" },
  發電機: { label: "發電機", color: "hsl(var(--accent))" },
};

const EquipmentChart = ({ data }: EquipmentChartProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />各部門設備分布
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <BarChart data={data} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="抽水機" fill="hsl(var(--primary))" radius={4} />
          <Bar dataKey="發電機" fill="hsl(var(--accent))" radius={4} />
        </BarChart>
      </ChartContainer>
    </CardContent>
  </Card>
);

export default EquipmentChart;
