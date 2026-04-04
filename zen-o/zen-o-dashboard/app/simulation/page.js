// app/simulation/page.js — Simulation Lab
"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRobots, useSimulations } from "../../lib/spacetime";
import NavBar from "../../components/NavBar";

const LineChart        = dynamic(() => import("recharts").then((m) => m.LineChart),        { ssr: false });
const Line             = dynamic(() => import("recharts").then((m) => m.Line),              { ssr: false });
const XAxis            = dynamic(() => import("recharts").then((m) => m.XAxis),             { ssr: false });
const YAxis            = dynamic(() => import("recharts").then((m) => m.YAxis),             { ssr: false });
const Tooltip          = dynamic(() => import("recharts").then((m) => m.Tooltip),           { ssr: false });
const ReferenceLine    = dynamic(() => import("recharts").then((m) => m.ReferenceLine),     { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const FLASK_URL = "http://localhost:5001";

// ─── SCENARIO PRESETS ─────────────────────────────────────────────────────────

const PRESETS = [
  { label: "Zone A: +8hrs",          icon: "⏱",  parameter: "zone_a_shift",   delta: 15  },
  { label: "Zone A: Conveyor +20%",  icon: "⚙",  parameter: "zone_a_conveyor", delta: 20  },
  { label: "Zone B: Temp −10°C",     icon: "🌡",  parameter: "zone_b_temp",  delta: -10 },
  { label: "Zone B: Run Overclock",  icon: "🤖",  parameter: "zone_b_clock",   delta: 12  },
];

// ─── RISK GAUGE ───────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = score < 30 ? "bg-green-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const text  = score < 30 ? "text-green-400" : score <= 60 ? "text-amber-400" : "text-red-400";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase">Risk Score</span>
        <span className={`text-xs font-mono font-bold ${text}`}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── PDF UPLOAD COMPONENT ───────────────────────────────────────────────────

function PdfUpload() {
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("Uploading...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${FLASK_URL}/upload_pdf`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setMsg(`✓ RAG updated: ${data.chunks_added} new chunks.`);
      } else {
        setMsg("✗ Upload failed.");
      }
    } catch {
      setMsg("✗ Error connecting to AI Service.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex items-center gap-4">
      <div>
        <h3 className="text-xs font-semibold text-gray-300">Ollama RAG Context</h3>
        <p className="text-[10px] text-gray-500">Upload PDF manuals so Ollama can analyze specific machines.</p>
      </div>
      <label className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
        {uploading ? "Processing..." : "📄 Upload PDF"}
        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {msg && <span className="text-[10px] text-gray-400 font-mono">{msg}</span>}
    </div>
  );
}

// ─── SINGLE SIMULATOR PANEL ───────────────────────────────────────────────────

function SimPanel({ label, preset, robots, onResult }) {
  const [parameter,   setParameter]   = useState(preset?.parameter || "conveyor_speed");
  const [deltaPercent, setDeltaPercent] = useState(preset?.delta ?? 0);
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  // Apply preset changes when preset prop changes
  useMemo(() => {
    if (preset) {
      setParameter(preset.parameter);
      setDeltaPercent(preset.delta);
    }
  }, [preset]);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Convert robots to plain objects Flask can parse
      const robotsPlain = robots.map((r) => ({
        id: r.id,
        name: r.name,
        zone: r.zone,
        status: r.status,
        temperature: r.temperature,
        vibration: r.vibration,
        energy_kw: r.energyKw,
      }));
      const res = await fetch(`${FLASK_URL}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameter, delta_percent: deltaPercent, current_state_json: robotsPlain }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      onResult(data);
    } catch (err) {
      setError(err.message || "Simulation failed");
      onResult(null);
    } finally {
      setLoading(false);
    }
  };

  const recColor = result
    ? result.risk_score > 60 ? "bg-red-500/10 border-red-500/30 text-red-300"
    : result.risk_score > 30 ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
    : "bg-green-500/10 border-green-500/30 text-green-300"
    : "";

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col gap-3">
      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{label}</p>

      <div>
        <label className="text-[10px] text-gray-500 uppercase block mb-1">Parameter</label>
        <input
          type="text"
          value={parameter}
          onChange={(e) => setParameter(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500 uppercase">Delta (%)</label>
          <span className={`text-xs font-mono font-bold ${deltaPercent > 0 ? "text-green-400" : deltaPercent < 0 ? "text-red-400" : "text-gray-400"}`}>
            {deltaPercent > 0 ? "+" : ""}{deltaPercent}%
          </span>
        </div>
        <input
          type="range" min={-50} max={50}
          value={deltaPercent}
          onChange={(e) => setDeltaPercent(parseInt(e.target.value))}
          className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
          <span>-50%</span><span>0</span><span>+50%</span>
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={loading || !parameter}
        className="w-full py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running...
          </span>
        ) : "▶ Run Simulation"}
      </button>

      {result && (
        <div className="bg-gray-900 rounded-lg p-3 space-y-2.5 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase">Projected Output</span>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-mono font-bold ${result.projected_output >= 100 ? "text-green-400" : "text-red-400"}`}>
                {result.projected_output.toFixed(1)}
              </span>
              <span className={`text-sm ${result.projected_output >= 100 ? "text-green-400" : "text-red-400"}`}>
                {result.projected_output >= 100 ? "↑" : "↓"}
              </span>
            </div>
          </div>
          <RiskGauge score={result.risk_score} />
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-400 uppercase">Fault Probability</span>
            <span className="text-xs font-mono text-white">{(result.fault_probability * 100).toFixed(1)}%</span>
          </div>
          <div className={`rounded-lg p-2 text-xs border ${recColor}`}>{result.recommendation}</div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

// ─── RISK CURVE CHART ─────────────────────────────────────────────────────────

function RiskCurve() {
  const data = Array.from({ length: 11 }, (_, i) => {
    const delta = -50 + i * 10;
    return {
      delta,
      projected_output: parseFloat((100 + delta * 0.6).toFixed(1)),
      risk_score:        parseFloat((Math.abs(delta) * 0.4).toFixed(1)),
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono">
        <p className="text-gray-400 mb-1">Δ = {label}%</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Risk Curve — Delta vs Output &amp; Risk
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="delta" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 4"
            label={{ value: "High Risk", position: "insideTopRight", fill: "#ef4444", fontSize: 10 }} />
          <Line type="monotone" dataKey="projected_output" name="Projected Output"
            stroke="#60a5fa" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="risk_score" name="Risk Score"
            stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── AT-RISK ROBOTS ───────────────────────────────────────────────────────────

function AtRiskRobots({ robots, riskScore }) {
  if (riskScore <= 60) return null;
  const atRisk = robots.filter((r) => Number(r.vibration) > 0.7);
  if (atRisk.length === 0) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
      <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
        ⚠ High Risk — At-Risk Robots
      </h2>
      <p className="text-xs text-gray-400 mb-3">
        These robots are closest to fault threshold and would be affected first by this parameter change.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {atRisk.map((r) => (
          <div key={r.id} className="bg-gray-900 rounded-lg p-3 border border-red-500/20">
            <p className="text-xs font-mono font-bold text-white">{r.name}</p>
            <p className="text-[10px] text-gray-400 mt-1">Vibration: <span className="text-red-400 font-bold">{Number(r.vibration).toFixed(2)}</span></p>
            <p className="text-[10px] text-gray-400">Temp: <span className="text-amber-400 font-bold">{Number(r.temperature).toFixed(1)}°C</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SIMULATION HISTORY ───────────────────────────────────────────────────────

function SimHistory({ sims }) {
  if (sims.length === 0) return null;
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Recent Simulations (from SpacetimeDB)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-500 uppercase">
              <th className="text-left py-1.5 px-2">Parameter</th>
              <th className="text-right py-1.5 px-2">Δ%</th>
              <th className="text-right py-1.5 px-2">Output</th>
              <th className="text-right py-1.5 px-2">Risk</th>
              <th className="text-right py-1.5 px-2">Run By</th>
            </tr>
          </thead>
          <tbody className="font-mono text-gray-300">
            {sims.map((s) => (
              <tr key={s.id} className="border-t border-gray-700/50">
                <td className="py-1.5 px-2 truncate max-w-[120px]">{s.parameter}</td>
                <td className={`py-1.5 px-2 text-right ${Number(s.deltaPercent) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {Number(s.deltaPercent) > 0 ? "+" : ""}{Number(s.deltaPercent)}
                </td>
                <td className="py-1.5 px-2 text-right">{Number(s.projectedOutput)?.toFixed(0) ?? "—"}</td>
                <td className="py-1.5 px-2 text-right">{Number(s.riskScore)?.toFixed(0) ?? "—"}</td>
                <td className="py-1.5 px-2 text-right text-gray-500">{s.ranBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const robots  = useRobots();
  const sims    = useSimulations();

  const [presetA, setPresetA] = useState(null);
  const [presetB, setPresetB] = useState(null);
  
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);

  const maxRisk = Math.max(resultA?.risk_score ?? 0, resultB?.risk_score ?? 0);

  let comparison = null;
  if (resultA && resultB) {
    if (resultA.risk_score < resultB.risk_score)       comparison = "Simulation A has lower risk";
    else if (resultB.risk_score < resultA.risk_score)  comparison = "Simulation B has lower risk";
    else comparison = "Both simulations show identical risk";
  } else if (resultA || resultB) {
    const r = (resultA ?? resultB).risk_score;
    if (r <= 60) comparison = "Simulation shows acceptable risk";
    else comparison = "High risk — consider adjusting parameters";
  }

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      <NavBar />

      <main className="p-4 max-w-[1600px] mx-auto space-y-4">
        <div className="py-2">
          <h1 className="text-lg font-mono font-bold text-white">Simulation Lab</h1>
          <p className="text-xs text-gray-500">Model parameter changes before applying to the factory floor</p>
        </div>

        <PdfUpload />

        {/* Section A — Presets */}
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Scenario Presets (Select for A or B)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <div key={p.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span className="text-xl block mb-1">{p.icon}</span>
                  <p className="text-xs font-semibold leading-tight text-white">{p.label}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">
                    {p.parameter}: {p.delta > 0 ? "+" : ""}{p.delta}%
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => setPresetA(p)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${presetA?.label === p.label ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
                  >
                    Set A
                  </button>
                  <button 
                    onClick={() => setPresetB(p)}
                    className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${presetB?.label === p.label ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}`}
                  >
                    Set B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B — Side-by-side simulator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SimPanel label="Simulation A" preset={presetA} robots={robots} onResult={setResultA} />
          <SimPanel label="Simulation B" preset={presetB} robots={robots} onResult={setResultB} />
        </div>

        {/* Comparison summary */}
        {comparison && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
            <p className="text-sm text-center text-gray-300 font-semibold">
              📊 {comparison}
            </p>
          </div>
        )}

        {/* Section C — Risk Curve */}
        <RiskCurve />

        {/* Section D — At-risk robots */}
        <AtRiskRobots robots={robots} riskScore={maxRisk} />

        {/* Simulation history */}
        <SimHistory sims={sims} />
      </main>
    </div>
  );
}
