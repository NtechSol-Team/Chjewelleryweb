"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* Chart tokens — validated (dataviz six checks) against the white card surface:
   series-1 gold #a8761c, series-2 blue #2e6aa8. Text never wears series colour. */
const S1 = "#a8761c";
const GRID = "#ecebe7";
const AXIS_TEXT = "#6b675e";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export type Point = { label: string; value: number; sub?: string };

/** Serializable unit so server components can configure client charts. */
export type Unit = "count" | "minutes" | "seconds";
const fmt = (unit: Unit = "count") => (v: number) =>
  unit === "minutes" ? `${Math.round(v)}m` : unit === "seconds" ? `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}` : Math.round(v).toLocaleString("en-GB");

/**
 * Single-series area chart (no legend: the card title names the series).
 * Crosshair snaps to the nearest day; tooltip on hover and keyboard focus.
 */
export function AreaChart({ data, height = 220, unit, ariaLabel }: { data: Point[]; height?: number; unit?: Unit; ariaLabel: string }) {
  const format = fmt(unit);
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId();
  const pad = { l: 36, r: 16, t: 12, b: 26 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const max = niceMax(Math.max(...data.map((d) => d.value), 1));
  const x = (i: number) => pad.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * w);
  const y = (v: number) => pad.t + h - (v / max) * h;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.t + h} L${x(0)},${pad.t + h} Z`;
  const ticks = [0, max / 2, max];
  const every = Math.ceil(data.length / (width < 500 ? 4 : 7));
  const last = data.length - 1;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad.l) / Math.max(1, w)) * last);
    setHover(Math.max(0, Math.min(last, i)));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(last)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? last) - 1));
            if (e.key === "ArrowRight") setHover((h) => Math.min(last, (h ?? 0) + 1));
          }}
          className="outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-champagne"
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={S1} stopOpacity={0.14} />
              <stop offset="100%" stopColor={S1} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={AXIS_TEXT} className="tabular">
                {format(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            (i % every === 0 && last - i >= every * 0.6) || i === last ? (
              <text key={d.label} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} fontSize={11} fill={AXIS_TEXT}>
                {d.sub ?? d.label}
              </text>
            ) : null,
          )}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={S1} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* End marker + direct label on the latest value */}
          <circle cx={x(last)} cy={y(data[last].value)} r={4} fill={S1} stroke="#fff" strokeWidth={2} />
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + h} stroke="#1d1c1a" strokeOpacity={0.25} strokeWidth={1} />
              <circle cx={x(hover)} cy={y(data[hover].value)} r={4.5} fill={S1} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-a-line bg-white px-3 py-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]"
          style={{ left: Math.min(Math.max(x(hover) - 60, 0), width - 130) }}
          role="status"
        >
          <p className="text-[14px] font-semibold tabular text-a-text">{format(data[hover].value)}</p>
          <p className="text-[11.5px] text-a-muted">{data[hover].label}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Horizontal bar list — magnitude by category. Bars ≤ 20px, 4px rounded
 * data-end, value at the tip, whole row is the hover/focus target.
 */
export function BarList({ items, unit, ariaLabel }: { items: (Point & { href?: string; meta?: string })[]; unit?: Unit; ariaLabel: string }) {
  const format = fmt(unit);
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul aria-label={ariaLabel} className="space-y-3">
      {items.map((it) => (
        <li key={it.label} className="group" tabIndex={0} title={`${it.label}: ${format(it.value)}${it.meta ? ` · ${it.meta}` : ""}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="min-w-0 truncate text-a-text">
              {it.label}
              {it.sub && <span className="ml-2 text-a-muted">{it.sub}</span>}
            </span>
            {it.meta && <span className="shrink-0 text-[11.5px] text-a-muted">{it.meta}</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-[14px] flex-1">
              <div
                className="h-full rounded-r transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                style={{ width: `${Math.max(1.5, (it.value / max) * 100)}%`, background: S1 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[12px] font-medium tabular text-a-text">{format(it.value)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Vertical columns with value on the cap; tooltip via hover/focus. */
export function ColumnChart({ items, unit, ariaLabel, height = 200 }: { items: Point[]; unit?: Unit; ariaLabel: string; height?: number }) {
  const format = fmt(unit);
  const max = niceMax(Math.max(...items.map((i) => i.value), 1));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div role="img" aria-label={ariaLabel}>
      <div className="relative flex items-end gap-2 border-b border-a-line" style={{ height }}>
        {[0.5, 1].map((t) => (
          <span key={t} className="pointer-events-none absolute inset-x-0 border-t" style={{ bottom: `${t * 100}%`, borderColor: GRID }} />
        ))}
        {items.map((it, i) => (
          <div
            key={it.label}
            className="relative flex h-full flex-1 flex-col items-center justify-end"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${it.label}: ${format(it.value)}`}
          >
            <span className="mb-1 text-[11px] font-medium tabular text-a-text">{format(it.value)}</span>
            <div className={cn("w-full max-w-[24px] rounded-t transition-opacity", hover !== null && hover !== i && "opacity-50")} style={{ height: `${(it.value / max) * 100 * 0.86}%`, background: S1 }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {items.map((it) => (
          <span key={it.label} className="flex-1 truncate text-center text-[11px] text-a-muted">
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Accessible table fallback for any chart. */
export function ChartTable({ rows, columns }: { rows: (string | number)[][]; columns: string[] }) {
  return (
    <details className="mt-4 text-[12px]">
      <summary className="cursor-pointer text-a-muted hover:text-a-text">View as table</summary>
      <table className="mt-2 w-full">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={cn("border-b border-a-line py-1.5 font-medium text-a-muted", i ? "text-right" : "text-left")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j} className={cn("border-b border-a-line py-1.5", j ? "text-right tabular" : "")}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
