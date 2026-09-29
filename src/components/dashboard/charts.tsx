import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DEFAULT_VISITS = [
  { day: "Mon", value: 0 },
  { day: "Tue", value: 0 },
  { day: "Wed", value: 0 },
  { day: "Thu", value: 0 },
  { day: "Fri", value: 0 },
  { day: "Sat", value: 0 },
  { day: "Sun", value: 0 },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

interface VisitsChartProps {
  data?: { day: string; value: number }[];
}

export function VisitsChart({ data }: VisitsChartProps) {
  const mounted = useMounted();
  if (!mounted) return <div className="h-[240px]" />;

  const chartData = data && data.length > 0 ? data : DEFAULT_VISITS;
  const maxVal = Math.max(...chartData.map((d) => d.value), 10);
  const domainMax = Math.ceil(maxVal / 5) * 5;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          />
          <YAxis
            domain={[0, domainMax]}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-border)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            fill="url(#visitsFill)"
            isAnimationActive={false}
            dot={{ r: 4, fill: "var(--color-chart-1)", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DepartmentsChartProps {
  departments?: { name: string; value: number; color: string }[];
  totalPatients?: number;
}

export function DepartmentsChart({ departments, totalPatients = 0 }: DepartmentsChartProps) {
  const mounted = useMounted();

  const deptList =
    departments && departments.length > 0
      ? departments
      : [{ name: "Emergency Corridor", value: 100, color: "var(--color-chart-1)" }];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[190px] w-[190px] shrink-0">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deptList}
                dataKey="value"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={1}
                stroke="none"
                isAnimationActive={false}
              >
                {deptList.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">
            {totalPatients.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">Total Records</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {deptList.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span className="flex-1 text-foreground truncate">{d.name}</span>
            <span className="font-semibold text-muted-foreground">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
