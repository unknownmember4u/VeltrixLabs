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

import { 
  Zap, 
  Settings, 
  Thermometer, 
  Cpu, 
  FileText, 
  Play, 
  AlertTriangle, 
  History, 
  TrendingUp,
  Search,
  CheckCircle2,
  FileUp,
  FlaskConical
} from "lucide-react";

// ─── SCENARIO PRESETS ─────────────────────────────────────────────────────────

const PRESETS = [
  { label: "Zone A: +8hrs",          icon: <History className="w-5 h-5 text-blue-500" />,  parameter: "zone_a_shift",   delta: 15  },
  { label: "Zone A: Conveyor +20%",  icon: <Settings className="w-5 h-5 text-gray-500" />, parameter: "zone_a_conveyor", delta: 20  },
  { label: "Zone B: Temp −10°C",     icon: <Thermometer className="w-5 h-5 text-orange-500" />, parameter: "zone_b_temp",  delta: -10 },
  { label: "Zone B: Run Overclock",  icon: <Cpu className="w-5 h-5 text-purple-500" />,    parameter: "zone_b_clock",   delta: 12  },
];

// ─── RISK GAUGE ───────────────────────────────────────────────────────────────

function RiskGauge({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const color = score < 30 ? "bg-green-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const text  = score < 30 ? "text-green-600" : score <= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Risk Score</span>
        <span className={`text-xs font-mono font-bold ${text}`}>{score.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200/50">
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
        setMsg(`${data.chunks_added} chunks active.`);
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
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
      <div className="bg-blue-50 p-2 rounded-lg">
        <FileText className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-tight">Ollama RAG Context</h3>
        <p className="text-[10px] text-gray-500">Upload technical PDFs to refine AI diagnostic precision.</p>
      </div>
      <label className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm">
        {uploading ? "Processing..." : <><FileUp className="w-4 h-4" /> Upload PDF</>}
        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {msg && <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100">{msg}</span>}
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</p>
        <Settings className="w-3.5 h-3.5 text-gray-400" />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Simulation Parameter</label>
        <input
          type="text"
          value={parameter}
          onChange={(e) => setParameter(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner"
        />
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-[10px] text-gray-500 uppercase font-bold">Variance (%)</label>
          <span className={`text-xs font-mono font-bold ${deltaPercent > 0 ? "text-green-600" : deltaPercent < 0 ? "text-red-600" : "text-gray-400"}`}>
            {deltaPercent > 0 ? "+" : ""}{deltaPercent}%
          </span>
        </div>
        <input
          type="range" min={-50} max={50}
          value={deltaPercent}
          onChange={(e) => setDeltaPercent(parseInt(e.target.value))}
          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <button
        onClick={handleRun}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span> Running...</>
        ) : <><Play className="w-3.5 h-3.5" /> Run Simulation</>}
      </button>

      {result && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Projected Factory Output</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-mono font-bold ${result.projected_output >= 100 ? "text-green-600" : "text-red-600"}`}>
                {result.projected_output.toFixed(1)}%
              </span>
              <TrendingUp className={`w-4 h-4 ${result.projected_output >= 100 ? "text-green-600" : "text-red-600 rotate-180"}`} />
            </div>
          </div>
          <RiskGauge score={result.risk_score} />
          <div className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-100">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Fault Probability</span>
            <span className="text-xs font-mono font-bold text-gray-800">{(result.fault_probability * 100).toFixed(1)}%</span>
          </div>
          <div className={`rounded-lg p-2.5 text-[10px] leading-relaxed border font-medium ${recColor}`}>{result.recommendation}</div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── RISK CURVE CHART ─────────────────────────────────────────────────────────

function RiskCurve() {
  const data = Array.from({ length: 11 }, (_, i) => {
    const delta = -50 + i * 10;
    return { delta, projected_output: 100 + delta * 0.6, risk_score: Math.abs(delta) * 0.4 };
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Risk Projection Curve
        </h2>
        <span className="text-[10px] text-gray-500 font-mono">Simulated Load Range: ±50%</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="delta" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line dataKey="projected_output" stroke="#2563eb" strokeWidth={2} dot={false} />
          <Line dataKey="risk_score" stroke="#d97706" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── AT-RISK ROBOTS ───────────────────────────────────────────────────────────

function AtRiskRobots({ robots, riskScore }) {
  if (riskScore <= 60) return null;
  const atRisk = robots.filter((r) => Number(r.vibration) > 0.7);
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4 shadow-sm">
      <h2 className="text-sm font-bold text-red-700 uppercase tracking-widest mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Priority Resilience Check
      </h2>
      <p className="text-[10px] text-red-600/80 mb-4 font-medium">
        The following units are operating at critical thresholds and require immediate calibration before parameters are shifted.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {atRisk.map((r) => (
          <div key={r.id} className="bg-white border border-red-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-gray-900">{r.name}</p>
              <Zap className="w-3 h-3 text-red-500" />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">Vibration: <span className="text-red-600 font-bold">{Number(r.vibration).toFixed(2)}</span></p>
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
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
        <History className="w-4 h-4" /> Simulation Archive
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-gray-400 uppercase tracking-tighter border-b border-gray-100">
              <th className="text-left font-bold py-2">Parameter</th>
              <th className="text-center font-bold py-2">Delta</th>
              <th className="text-center font-bold py-2">Output</th>
              <th className="text-right font-bold py-2">Risk</th>
            </tr>
          </thead>
          <tbody className="font-mono pt-2">
            {sims.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700 font-bold">{s.parameter}</td>
                <td className={`py-2 text-center font-bold ${Number(s.deltaPercent) > 0 ? "text-green-600" : "text-red-600"}`}>
                  {Number(s.deltaPercent) > 0 ? "+" : ""}{Number(s.deltaPercent)}%
                </td>
                <td className="py-2 text-center text-gray-600 font-bold">{Number(s.projectedOutput).toFixed(0)}%</td>
                <td className={`py-2 text-right font-bold ${Number(s.riskScore) > 60 ? "text-red-600" : "text-amber-600"}`}>
                  {Number(s.riskScore).toFixed(1)}
                </td>
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
    if (resultA.risk_score < resultB.risk_score)       comparison = "Simulation A has lower operational risk";
    else if (resultB.risk_score < resultA.risk_score)  comparison = "Simulation B has lower operational risk";
    else comparison = "Both simulations show balanced risk factors";
  } else if (resultA || resultB) {
    const r = (resultA ?? resultB).risk_score;
    if (r <= 60) comparison = "Simulation profile remains within safety parameters";
    else comparison = "Parameters exceed baseline safety. Recalibration recommended.";
  }

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <NavBar />
      <div className="max-w-[1600px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-lg font-mono font-bold text-gray-900 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" /> Simulation Lab
            </h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">AI Forecasting & Stress Testing</p>
          </div>
          <div className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-bold text-blue-700 font-mono">FORECASTER ACTIVE</span>
          </div>
        </div>

        <PdfUpload />

        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Industry Scenario Presets
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRESETS.map((p) => (
              <div key={p.label} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-blue-400 transition-all cursor-pointer group">
                <div>
                  <div className="mb-3 bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg group-hover:bg-blue-50 transition-colors">
                    {p.icon}
                  </div>
                  <p className="text-xs font-bold leading-tight text-gray-900 mb-1">{p.label}</p>
                  <p className="text-[10px] text-gray-400 font-mono uppercase font-bold">
                    {p.parameter}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 mt-1">
                    Delta: {p.delta > 0 ? "+" : ""}{p.delta}%
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setPresetA(p)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all shadow-sm ${presetA?.label === p.label ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    SELECT A
                  </button>
                  <button 
                    onClick={() => setPresetB(p)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all shadow-sm ${presetB?.label === p.label ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    SELECT B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison summary */}
        {comparison && (
          <div className="bg-white border border-blue-200 rounded-xl px-5 py-3 shadow-sm flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <Search className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-800 font-bold tracking-tight">
              AI Analysis: {comparison}
            </p>
            <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
          </div>
        )}

        {/* Section B — Side-by-side simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SimPanel label="Simulation Slot A" preset={presetA} robots={robots} onResult={setResultA} />
          <SimPanel label="Simulation Slot B" preset={presetB} robots={robots} onResult={setResultB} />
        </div>

        {/* Section C — Risk Curve */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
           <div className="lg:col-span-2">
             <RiskCurve />
           </div>
           <div className="lg:col-span-1">
             <SimHistory sims={sims} />
           </div>
        </div>

        {/* Section D — At-risk robots */}
        <AtRiskRobots robots={robots} riskScore={maxRisk} />
      </div>
    </div>
  );
}
