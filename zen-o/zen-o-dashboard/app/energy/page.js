// app/energy/page.js — Energy Monitoring Dashboard with AI Explanations
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
import { useState, useEffect } from "react";
const Cell            = dynamic(() => import("recharts").then((m) => m.Cell),              { ssr: false });
import { 
  ShieldAlert, 
  AlertTriangle, 
  RotateCcw, 
  Activity, 
  Zap, 
  ChevronRight, 
  BarChart3, 
  Map as MapIcon, 
  Table as TableIcon,
  Brain,
  Power,
  PowerOff,
  Lightbulb,
  ArrowRight
} from "lucide-react";

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

function zoneBorderColor(avg) {
  if (avg < 9)  return "#22c55e";
  if (avg <= 12) return "#f59e0b";
  return "#ef4444";
}

function fmt2(n) { return Number(n).toFixed(2); }

// ─── SECTION A — Dynamic Zone Energy Map ─────────────────────────────────────

function ZoneMap({ robots }) {
  const zoneA = robots.filter((r) => r.zone === "Zone-A");
  const zoneB = robots.filter((r) => r.zone === "Zone-B");
  const avgA  = zoneA.length ? zoneA.reduce((s, r) => s + Number(r.energyKw), 0) / zoneA.length : 0;
  const avgB  = zoneB.length ? zoneB.reduce((s, r) => s + Number(r.energyKw), 0) / zoneB.length : 0;
  const totalA = zoneA.reduce((s, r) => s + Number(r.energyKw), 0);
  const totalB = zoneB.reduce((s, r) => s + Number(r.energyKw), 0);
  const totalAll = totalA + totalB;
  const faultsA = zoneA.filter(r => r.status === "fault").length;
  const faultsB = zoneB.filter(r => r.status === "fault").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <MapIcon className="w-4 h-4 text-blue-600" /> Dynamic Zone Energy Map
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Zone A */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-500`}
             style={{ backgroundColor: zoneColor(avgA), borderColor: zoneBorderColor(avgA) }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono font-bold text-gray-900">Zone-A</span>
            {faultsA > 0 && (
              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">
                {faultsA} FAULT{faultsA > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <p className="text-2xl font-mono font-bold text-gray-900 mb-1">{fmt2(avgA)} <span className="text-sm text-gray-500">kW avg</span></p>
          <p className="text-[10px] text-gray-600 font-mono mb-2">Total: {fmt2(totalA)} kW • {zoneA.length} robots</p>
          
          {/* Per-robot bars */}
          <div className="space-y-1.5">
            {zoneA.map(r => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-gray-600 w-14">{r.name}</span>
                <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" 
                       style={{ width: `${Math.min(100, (Number(r.energyKw) / 15) * 100)}%`, backgroundColor: barColor(Number(r.energyKw)) }} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-700 w-12 text-right">{Number(r.energyKw).toFixed(1)}kW</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone B */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-500`}
             style={{ backgroundColor: zoneColor(avgB), borderColor: zoneBorderColor(avgB) }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-mono font-bold text-gray-900">Zone-B</span>
            {faultsB > 0 && (
              <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">
                {faultsB} FAULT{faultsB > 1 ? "S" : ""}
              </span>
            )}
          </div>
          <p className="text-2xl font-mono font-bold text-gray-900 mb-1">{fmt2(avgB)} <span className="text-sm text-gray-500">kW avg</span></p>
          <p className="text-[10px] text-gray-600 font-mono mb-2">Total: {fmt2(totalB)} kW • {zoneB.length} robots</p>
          
          {/* Per-robot bars */}
          <div className="space-y-1.5">
            {zoneB.map(r => (
              <div key={r.id} className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-gray-600 w-14">{r.name}</span>
                <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" 
                       style={{ width: `${Math.min(100, (Number(r.energyKw) / 15) * 100)}%`, backgroundColor: barColor(Number(r.energyKw)) }} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-700 w-12 text-right">{Number(r.energyKw).toFixed(1)}kW</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total bar */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Total Factory Consumption</span>
          <span className="text-xs font-mono font-bold text-gray-900">{fmt2(totalAll)} kW</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (totalAll / 100) * 100)}%` }} />
        </div>
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
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono shadow-lg">
        <p className="text-gray-900 font-bold">{payload[0].payload.name}</p>
        <p className="text-blue-600 font-bold">{payload[0].value.toFixed(1)} kW</p>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-600" /> consumption profiling
      </h2>
      {data.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No robot data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm overflow-x-auto">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <TableIcon className="w-4 h-4 text-blue-600" /> Shift Performance Comparison
      </h2>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-400 uppercase text-[10px] font-bold tracking-tighter border-b border-gray-100">
            <th className="text-left py-2 px-2">Robot Unit</th>
            <th className="text-right py-2 px-2">Current Shift</th>
            <th className="text-right py-2 px-2">Previous Shift</th>
            <th className="text-right py-2 px-2">Historical Avg</th>
            <th className="text-right py-2 px-2">Variance</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, idx) => {
            const deltaColor =
              r.delta == null ? "text-gray-400"
              : r.delta > 20  ? "text-red-600 font-bold"
              : r.delta < -10 ? "text-green-600 font-bold"
              : "text-gray-600";
            return (
              <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="py-2.5 px-2 text-gray-900 font-bold">{r.name}</td>
                <td className="py-2.5 px-2 text-right text-gray-800 font-bold">{fmt2(r.currVal)} kW</td>
                <td className="py-2.5 px-2 text-right text-gray-500">
                  {r.prevVal != null ? `${fmt2(r.prevVal)} kW` : "—"}
                </td>
                <td className="py-2.5 px-2 text-right text-gray-500">{fmt2(r.avg7Val)} kW</td>
                <td className={`py-2.5 px-2 text-right ${deltaColor}`}>
                  {r.delta != null ? <span className="flex items-center justify-end gap-1">{r.delta > 0 ? <ChevronRight className="w-3 h-3 rotate-[270deg]"/> : <ChevronRight className="w-3 h-3 rotate-90 text-green-600"/>} {r.delta.toFixed(1)}%</span> : "—"}
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
           Energy Overflow Alerts
        </h2>
      </div>
      <div className="space-y-2">
        {alerts.map((a, idx) => (
          <div key={idx} className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-amber-800 font-medium">
                <span className="font-mono font-bold">{a.name}</span> detected at{" "}
                <span className="font-bold text-red-600">{a.pct}% above</span> baseline. 
              </p>
            </div>
            <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-700 font-mono font-bold">
               VIBRATION: {a.vibration.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION E — Grid Load Balancer with AI Explanations ─────────────────────

function GridLoadBalancer({ robots }) {
  const [gridConstrained, setGridConstrained] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Normal capacity is 100kW, constrained is 40kW
  const maxCapacity = gridConstrained ? 40 : 100;
  
  // High priority = Zone A (ids 1-4), Low priority = Zone B (ids 5-8)
  const prioritized = [...robots].sort((a, b) => a.zone === "Zone-A" ? -1 : 1);
  
  let currentUsage = 0;
  const assignments = prioritized.map(r => {
    let allocated = 0;
    let status = "NORMAL";
    
    const needed = Number(r.energyKw);
    if (currentUsage + needed <= maxCapacity) {
      allocated = needed;
      currentUsage += allocated;
    } else if (currentUsage < maxCapacity) {
      allocated = maxCapacity - currentUsage;
      currentUsage += allocated;
      status = "PARTIAL";
    } else {
      status = "SUSPENDED";
    }
    
    return { ...r, allocated, loadStatus: status };
  });

  // Call Ollama AI for real explanation when constrained
  const fetchAiAnalysis = async () => {
    setAiLoading(true);
    setAiExplanation(null);
    
    const suspended = assignments.filter(a => a.loadStatus === "SUSPENDED");
    const partial = assignments.filter(a => a.loadStatus === "PARTIAL");
    const normal = assignments.filter(a => a.loadStatus === "NORMAL");

    const contextPrompt = `The factory grid is constrained to 40kW (normal: 100kW). 
Priority: Zone-A > Zone-B.
Current assignments:
${normal.map(r => `- ${r.name} (${r.zone}): FULL POWER at ${fmt2(r.allocated)}kW`).join("\n")}
${partial.map(r => `- ${r.name} (${r.zone}): RESTRICTED to ${fmt2(r.allocated)}kW (needed ${fmt2(Number(r.energyKw))}kW)`).join("\n")}
${suspended.map(r => `- ${r.name} (${r.zone}): SUSPENDED (needed ${fmt2(Number(r.energyKw))}kW, no capacity left)`).join("\n")}

Explain in 3-4 sentences: Why was power removed from the suspended devices? Why were some restricted? Why did Zone-A keep full power? Include impact on production.`;

    try {
      const res = await fetch("http://localhost:5001/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robot_id: 0,
          robot_name: "GridController",
          vibration: 0,
          temperature: 0,
          energy_kw: 40,
          anomaly_type: contextPrompt,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.recommendation || "AI analysis unavailable.");
      } else {
        setAiExplanation("Could not reach AI service. The grid load balancer suspended Zone-B units to protect Zone-A critical assembly stations under the 40kW constraint.");
      }
    } catch {
      setAiExplanation("AI service offline. Power was redistributed based on Zone-A > Zone-B priority protocol to maintain critical production lanes.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!gridConstrained) {
      setAiExplanation(null);
      return;
    }
    fetchAiAnalysis();
  }, [gridConstrained]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Grid Load Balancer
        </h2>
        <button 
          onClick={() => setGridConstrained(!gridConstrained)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${gridConstrained ? "bg-red-600 hover:bg-red-700 text-white" : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-700"}`}
        >
          {gridConstrained ? <><RotateCcw className="w-3.5 h-3.5"/> Reset Grid (100kW)</> : <><Activity className="w-3.5 h-3.5"/> Simulate Low Power Grid (40kW)</>}
        </button>
      </div>

      {gridConstrained && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center justify-between">
          <span>Grid constraint active. Total available capacity: 40 kW.</span>
          <span className="font-mono">Priority: Zone-A &gt; Zone-B</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {assignments.map(r => (
          <div key={r.id} className={`p-3 rounded-lg border ${r.loadStatus === 'SUSPENDED' ? 'bg-gray-50 border-gray-200 opacity-50 grayscale' : 'bg-white border-green-200 shadow-sm'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-sm text-gray-900 font-bold">{r.name}</span>
              <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{r.zone}</span>
            </div>
            
            {r.loadStatus === 'SUSPENDED' ? (
              <p className="text-[10px] text-red-600 mt-2 font-semibold">POWER SACRIFICED</p>
            ) : r.loadStatus === 'PARTIAL' ? (
              <p className="text-[10px] text-amber-600 mt-2 font-semibold flex justify-between">
                <span>Power Restricted</span>
                <span className="font-mono">{fmt2(r.allocated)}kW</span>
              </p>
            ) : (
              <p className="text-[10px] text-green-600 mt-2 font-semibold flex justify-between">
                <span>Operating Nominal</span>
                <span className="font-mono">{fmt2(r.allocated)}kW</span>
              </p>
            )}
            
            {r.loadStatus === 'SUSPENDED' && (
              <p className="text-[9px] text-gray-400 mt-1">Sacrificed for Zone-A priorities</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-500 uppercase">Grid Usage</span>
          <span className="text-xs font-mono font-bold text-gray-900">{currentUsage.toFixed(1)} / {maxCapacity.toFixed(1)} kW</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(currentUsage/maxCapacity)*100}%` }} />
        </div>
      </div>

      {/* AI Explanation Section */}
      {gridConstrained && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">AI Power Distribution Analysis (Ollama)</h3>
          </div>
          
          {aiLoading ? (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-xs text-blue-700 font-medium">Analyzing power distribution with Ollama AI...</p>
            </div>
          ) : aiExplanation ? (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{aiExplanation}</p>
            </div>
          ) : null}
        </div>
      )}
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
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <NavBar />

      <main className="p-4 space-y-4 max-w-[1600px] mx-auto mt-4">
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-mono font-bold text-gray-900">Energy Monitor</h1>
            <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Phase 3 Allocation Config</span>
          </div>
          <button
            onClick={handleExport}
            className="bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
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
            <GridLoadBalancer robots={robots} />
            <ShiftTable robots={robots} energyLogs={energyLogs} />
          </>
        )}
      </main>
    </div>
  );
}
