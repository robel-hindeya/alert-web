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

const visits = [
  { day: "Apr 18", value: 62 },
  { day: "Apr 19", value: 88 },
  { day: "Apr 20", value: 95 },
  { day: "Apr 21", value: 150 },
  { day: "Apr 22", value: 100 },
  { day: "Apr 23", value: 118 },
  { day: "Apr 24", value: 138 },
];

const departments = [
  { name: "Internal Medicine", value: 32, color: "var(--color-chart-2)" },
  { name: "Pediatrics", value: 24, color: "var(--color-chart-1)" },
  { name: "Orthopedics", value: 16, color: "var(--color-chart-4)" },
  { name: "Cardiology", value: 14, color: "var(--color-chart-3)" },
  { name: "Others", value: 14, color: "var(--color-chart-5)" },
];

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function VisitsChart() {
  const mounted = useMounted();
  if (!mounted) return <div className="h-[240px]" />;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visits} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            domain={[0, 200]}
            ticks={[0, 50, 100, 150, 200]}
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

export function DepartmentsChart() {
  const mounted = useMounted();

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[190px] w-[190px] shrink-0">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departments}
                dataKey="value"
                innerRadius={58}
                outerRadius={90}
                paddingAngle={1}
                stroke="none"
                isAnimationActive={false}
              >
                {departments.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground">1,248</span>
          <span className="text-xs text-muted-foreground">Total Patients</span>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {departments.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden
            />
            <span className="flex-1 text-foreground">{d.name}</span>
            <span className="font-semibold text-muted-foreground">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
