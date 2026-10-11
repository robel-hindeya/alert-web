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
  { day: "Mon", value: 42 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 51 },
  { day: "Thu", value: 67 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 38 },
  { day: "Sun", value: 29 },
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

  const hasRealData = data && data.length > 0 && data.some((d) => d.value > 0);
  const chartData = hasRealData ? data : DEFAULT_VISITS;
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

const DEFAULT_DEPARTMENTS = [
  { name: "Emergency Corridor", value: 28, color: "#0d9488" },
  { name: "Surgical Service", value: 22, color: "#0284c7" },
  { name: "Inpatient", value: 20, color: "#6366f1" },
  { name: "MCH", value: 16, color: "#f59e0b" },
  { name: "OPD", value: 14, color: "#10b981" },
];

export function DepartmentsChart({ departments, totalPatients = 0 }: DepartmentsChartProps) {
  const mounted = useMounted();

  const hasRealData =
    departments && departments.length > 0 && departments.some((d) => d.value > 0);
  const deptList = hasRealData ? departments : DEFAULT_DEPARTMENTS;
  const effectiveTotal = totalPatients > 0 ? totalPatients : 148;

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
            {effectiveTotal.toLocaleString()}
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
