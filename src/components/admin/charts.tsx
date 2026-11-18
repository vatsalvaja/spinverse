"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatCompact } from "@/lib/utils";

// Validated categorical slots 1 and 2 (blue, orange) from the reference palette.
export const SERIES = { a: "#2a78d6", b: "#eb6834" };
const AXIS = "#8b92a0";
const GRID = "#e8eaee";

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({ active, payload, label, labels }: TooltipProps<number, string> & { labels: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-semibold text-slate-900">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center justify-between gap-6 text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{labels[String(p.dataKey)] ?? p.name}</span>
          <b className="font-semibold tabular-nums text-slate-900">{Number(p.value).toLocaleString("en-US")}</b>
        </p>
      ))}
    </div>
  );
}

export function GrowthChart({ data }: { data: { label: string; registered: number; guests: number }[] }) {
  const labels = { registered: "Registered", guests: "Guests" };
  return (
    <div className="h-[260px] w-full" role="img" aria-label="Line chart of cumulative registered and guest users by month">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
          <Tooltip content={<ChartTooltip labels={labels} />} cursor={{ stroke: "#c3c8d1", strokeWidth: 1 }} />
          <Line type="monotone" dataKey="registered" stroke={SERIES.a} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
          <Line type="monotone" dataKey="guests" stroke={SERIES.b} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PointsChart({ data }: { data: { label: string; credited: number; debited: number }[] }) {
  const labels = { credited: "Points credited", debited: "Points debited" };
  return (
    <div className="h-[260px] w-full" role="img" aria-label="Bar chart of weekly virtual points credited and debited">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
          <Tooltip content={<ChartTooltip labels={labels} />} cursor={{ fill: "rgba(15,23,42,.04)" }} />
          <Bar dataKey="credited" fill={SERIES.a} radius={[4, 4, 0, 0]} maxBarSize={12} />
          <Bar dataKey="debited" fill={SERIES.b} radius={[4, 4, 0, 0]} maxBarSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SingleBars({ data, color = SERIES.a, label }: { data: { label: string; value: number }[]; color?: string; label: string }) {
  return (
    <div className="h-[240px] w-full" role="img" aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap="38%">
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
          <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 12 }} />
          <Tooltip content={<ChartTooltip labels={{ value: label }} />} cursor={{ fill: "rgba(15,23,42,.04)" }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
