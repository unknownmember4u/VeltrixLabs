// app/energy/page.js — Energy Monitoring Dashboard
"use client";

import dynamic from "next/dynamic";
import { useRobots, useEnergyLogs } from "../../lib/spacetime";
import NavBar from "../../components/NavBar";

const BarChart        = dynamic(() => import("recharts").then((m) => m.BarChart),        { ssr: false });
const Bar             = dynamic(() => import("recharts").then((m) => m.Bar),              { ssr: false });
const XAxis           = dynamic(() => import("recharts").then((m) => m.XAxis),            { ssr: false });
const YAxis           = dynamic(() => import("recharts").then((m) => m.YAxis),            { ssr: false });
const Tooltip         = dynamic(() => import("recharts").then((m) => m.Tooltip),          { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Cell            = dynamic(() => import("recharts").then((m) => m.Cell),              { ssr: false });

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function barColor(kw) {
  if (kw < 9)  return "#22c55e";
  if (kw <= 12) return "#f59e0b";
  return "#ef4444";
}

function zoneColor(avg) {
  if (avg < 9)  return "rgba(34,197,94,0.25)";
  if (avg <= 12) return "rgba(245,158,11,0.25)";
  return "rgba(239,68,68,0.25)";
}

function fmt2(n) { return Number(n).toFixed(2); }

// ─── SECTION A — Zone Energy Map (SVG) ───────────────────────────────────────

function ZoneMap({ robots }) {
  const zoneA = robots.filter((r) => r.zone === "Zone-A");
  const zoneB = robots.filter((r) => r.zone === "Zone-B");
  const avgA  = zoneA.length ? zoneA.reduce((s, r) => s + Number(r.energyKw), 0) / zoneA.length : 0;
  const avgB  = zoneB.length ? zoneB.reduce((s, r) => s + Number(r.energyKw), 0) / zoneB.length : 0;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Zone Energy Map
      </h2>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 700 160" className="w-full max-w-2xl" style={{ height: 160 }}>
          {/* Zone A */}
          <rect x="20" y="20" width="310" height="120" rx="12" fill={zoneColor(avgA)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="175" y="65" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">
            Zone-A
          </text>
          <text x="175" y="90" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
            {fmt2(avgA)} kW avg
          </text>
          <text x="175" y="112" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
            {zoneA.length} robots
          </text>

          {/* Zone B */}
          <rect x="370" y="20" width="310" height="120" rx="12" fill={zoneColor(avgB)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          <text x="525" y="65" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">
            Zone-B
          </text>
          <text x="525" y="90" textAnchor="middle" fill="#94a3b8" fontSize="12" fontFamily="monospace">
            {fmt2(avgB)} kW avg
          </text>
          <text x="525" y="112" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">
            {zoneB.length} robots
          </text>
        </svg>
      </div>
    </div>
  );
}

// ─── SECTION B — Per-Robot Bar Chart ─────────────────────────────────────────

function RobotBarChart({ robots }) {
  const data = [...robots]
    .sort((a, b) => Number(b.energyKw) - Number(a.energyKw))
    .map((r) => ({ name: r.name, kw: parseFloat(Number(r.energyKw).toFixed(2)) }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono">
        <p className="text-white font-bold">{payload[0].payload.name}</p>
        <p className="text-amber-400">{payload[0].value} kW</p>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Per-Robot Energy Consumption
      </h2>
      {data.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No robot data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="kw" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.kw)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── SECTION C — Shift Comparison Table ──────────────────────────────────────

function ShiftTable({ robots, energyLogs }) {
  // Group logs by robot_id and shift
  const byRobot = {};
  for (const r of robots) {
    byRobot[r.id] = { name: r.name, shifts: {}, current: Number(r.energyKw) };
  }
  for (const log of energyLogs) {
    if (!byRobot[log.robotId]) continue;
    if (!byRobot[log.robotId].shifts[log.shift]) {
      byRobot[log.robotId].shifts[log.shift] = [];
    }
    byRobot[log.robotId].shifts[log.shift].push(Number(log.consumptionKw));
  }

  const rows = Object.values(byRobot).map((r) => {
    const shiftKeys = Object.keys(r.shifts);
    const current   = shiftKeys[shiftKeys.length - 1];
    const previous  = shiftKeys[shiftKeys.length - 2];
    const avg7 = shiftKeys.flatMap((k) => r.shifts[k]);
    const avg7Val = avg7.length ? avg7.reduce((s, v) => s + v, 0) / avg7.length : r.current;
    const currVal = r.shifts[current]
      ? r.shifts[current].reduce((s, v) => s + v, 0) / r.shifts[current].length
      : r.current;
    const prevVal = r.shifts[previous]
      ? r.shifts[previous].reduce((s, v) => s + v, 0) / r.shifts[previous].length
      : null;
    const delta = prevVal != null ? ((currVal - prevVal) / prevVal) * 100 : null;

    return { name: r.name, currVal, prevVal, avg7Val, delta };
  });

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4 overflow-x-auto">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Shift Comparison
      </h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 uppercase text-[10px]">
            <th className="text-left py-2 px-2">Robot</th>
            <th className="text-right py-2 px-2">Current Shift</th>
            <th className="text-right py-2 px-2">Previous Shift</th>
            <th className="text-right py-2 px-2">7-Day Avg</th>
            <th className="text-right py-2 px-2">Δ%</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r) => {
            const deltaColor =
              r.delta == null ? "text-gray-500"
              : r.delta > 20  ? "text-red-400 font-bold"
              : r.delta < -10 ? "text-green-400 font-bold"
              : "text-gray-300";
            return (
              <tr key={r.name} className="border-t border-gray-700/50">
                <td className="py-2 px-2 text-white">{r.name}</td>
                <td className="py-2 px-2 text-right text-gray-300">{fmt2(r.currVal)} kW</td>
                <td className="py-2 px-2 text-right text-gray-500">
                  {r.prevVal != null ? `${fmt2(r.prevVal)} kW` : "—"}
                </td>
                <td className="py-2 px-2 text-right text-gray-400">{fmt2(r.avg7Val)} kW</td>
                <td className={`py-2 px-2 text-right ${deltaColor}`}>
                  {r.delta != null ? `${r.delta > 0 ? "+" : ""}${r.delta.toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── SECTION D — Outlier Alerts ──────────────────────────────────────────────

function OutlierAlerts({ robots, energyLogs }) {
  // Compute per-robot averages from energy logs
  const avgByRobot = {};
  for (const log of energyLogs) {
    if (!avgByRobot[log.robotId]) avgByRobot[log.robotId] = [];
    avgByRobot[log.robotId].push(Number(log.consumptionKw));
  }

  const alerts = robots
    .filter((r) => {
      const logs = avgByRobot[r.id];
      if (!logs || logs.length === 0) return false;
      const avg = logs.reduce((s, v) => s + Number(v), 0) / logs.length;
      return Number(r.energyKw) > avg * 1.3;
    })
    .map((r) => {
      const logs = avgByRobot[r.id];
      const avg  = logs.reduce((s, v) => s + Number(v), 0) / logs.length;
      const pct  = (((Number(r.energyKw) - avg) / avg) * 100).toFixed(0);
      return { name: r.name, pct, vibration: Number(r.vibration) };
    });

  if (alerts.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        ⚡ Outlier Alerts
      </h2>
      <div className="space-y-2">
        {alerts.map((a) => (
          <div key={a.name} className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-amber-400 text-lg">⚠</span>
            <p className="text-sm text-amber-300">
              <span className="font-mono font-bold">{a.name}</span> consuming{" "}
              <span className="font-bold">{a.pct}% above baseline</span> — check vibration (
              {a.vibration.toFixed(2)})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function EnergyPage() {
  const robots     = useRobots();
  const energyLogs = useEnergyLogs();

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ robots, energyLogs }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href    = url;
    a.download = "energy_report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      <NavBar />

      <main className="p-4 max-w-[1600px] mx-auto space-y-2">
        {/* Page header */}
        <div className="flex items-center justify-between py-2">
          <div>
            <h1 className="text-lg font-mono font-bold text-white">Energy Monitor</h1>
            <p className="text-xs text-gray-500">Real-time power consumption across all zones</p>
          </div>
          <button
            onClick={handleExport}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            ↓ Export JSON
          </button>
        </div>

        {robots.length === 0 ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-4 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <>
            <ZoneMap robots={robots} />
            <RobotBarChart robots={robots} />
            <OutlierAlerts robots={robots} energyLogs={energyLogs} />
            <ShiftTable robots={robots} energyLogs={energyLogs} />
          </>
        )}
      </main>
    </div>
  );
}
