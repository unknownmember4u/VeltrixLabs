// components/SimulationPanel.js — What-if simulation + history
"use client";

import { useState } from "react";
import { useRobots, useSimulations } from "../lib/spacetime";

// ─── HELPERS ──────────────────────────────────────────────────────────

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function RiskGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = score < 30 ? "bg-green-500" : score <= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor = score < 30 ? "text-green-400" : score <= 60 ? "text-amber-400" : "text-red-400";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase">Risk Score</span>
        <span className={`text-xs font-mono font-bold ${textColor}`}>{score.toFixed(1)}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function SimulationPanel() {
  const robots = useRobots();
  const simHistory = useSimulations();

  const [parameter, setParameter] = useState("conveyor speed");
  const [deltaPercent, setDeltaPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const robotsPlain = robots.map((r) => ({
        id: r.id,
        name: r.name,
        zone: r.zone,
        status: r.status,
        temperature: r.temperature,
        vibration: r.vibration,
        energy_kw: r.energyKw,
      }));
      const res = await fetch("http://localhost:5001/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameter,
          delta_percent: deltaPercent,
          current_state_json: robotsPlain,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        What-If Simulation
      </h3>

      {/* Input Section */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-[10px] text-gray-500 uppercase block mb-1">Parameter</label>
          <input
            type="text"
            value={parameter}
            onChange={(e) => setParameter(e.target.value)}
            placeholder="e.g. conveyor speed"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-gray-500 uppercase">Delta (%)</label>
            <span className={`text-xs font-mono font-bold ${
              deltaPercent > 0 ? "text-green-400" : deltaPercent < 0 ? "text-red-400" : "text-gray-400"
            }`}>
              {deltaPercent > 0 ? "+" : ""}{deltaPercent}%
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={50}
            value={deltaPercent}
            onChange={(e) => setDeltaPercent(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
            <span>-50%</span>
            <span>0</span>
            <span>+50%</span>
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
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gray-900 rounded-lg p-3 space-y-3 mb-4 border border-gray-700">
          {/* Projected Output */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase">Projected Output</span>
            <div className="flex items-center gap-1">
              <span className={`text-lg font-mono font-bold ${
                Number(result.projected_output) >= 100 ? "text-green-400" : "text-red-400"
              }`}>
                {Number(result.projected_output).toFixed(1)}
              </span>
              <span className={`text-sm ${Number(result.projected_output) >= 100 ? "text-green-400" : "text-red-400"}`}>
                {Number(result.projected_output) >= 100 ? "↑" : "↓"}
              </span>
            </div>
          </div>

          {/* Risk */}
          <RiskGauge score={Number(result.risk_score)} />

          {/* Fault Probability */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 uppercase">Fault Probability</span>
            <span className="text-xs font-mono text-white">{(Number(result.fault_probability) * 100).toFixed(1)}%</span>
          </div>

          {/* Recommendation */}
          <div className={`rounded-lg p-2 text-xs border ${
            Number(result.risk_score) > 60
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : Number(result.risk_score) > 30
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-green-500/10 border-green-500/30 text-green-300"
          }`}>
            {result.recommendation}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* History Table */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Recent Simulations</p>
        {simHistory.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-3">No simulations yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="text-gray-500 uppercase">
                  <th className="text-left py-1 px-1">Param</th>
                  <th className="text-right py-1 px-1">Δ%</th>
                  <th className="text-right py-1 px-1">Output</th>
                  <th className="text-right py-1 px-1">Risk</th>
                  <th className="text-right py-1 px-1">Time</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 font-mono">
                {simHistory.map((s) => (
                  <tr key={s.id} className="border-t border-gray-700/50">
                    <td className="py-1 px-1 truncate max-w-[80px]">{s.parameter}</td>
                    <td className={`py-1 px-1 text-right ${Number(s.deltaPercent) > 0 ? "text-green-400" : "text-red-400"}`}>
                      {Number(s.deltaPercent) > 0 ? "+" : ""}{Number(s.deltaPercent)}
                    </td>
                    <td className="py-1 px-1 text-right">{Number(s.projectedOutput).toFixed(0)}</td>
                    <td className="py-1 px-1 text-right">{Number(s.riskScore).toFixed(0)}</td>
                    <td className="py-1 px-1 text-right text-gray-500">{formatTime(s.ranAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
