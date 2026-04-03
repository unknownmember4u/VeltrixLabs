// components/AnomalyConsole.js — Audit log viewer + anomaly injection + hash chain verification
"use client";

import { useState } from "react";
import { useAuditLog, useRobots, callReducer } from "../lib/spacetime";

// ─── EVENT TYPE BADGE COLORS ──────────────────────────────────────────

const EVENT_COLORS = {
  ANOMALY_DETECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  ANOMALY_INJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  ANOMALY_RESOLVED: "bg-green-500/20 text-green-400 border-green-500/30",
  PO_AUTO_GENERATED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  EMERGENCY_STOP: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ENERGY_ALERT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

function EventBadge({ type }) {
  const color = EVENT_COLORS[type] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono whitespace-nowrap ${color}`}>
      {type}
    </span>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── HASH FUNCTION (must match lib/spacetime.js simpleHash) ───────────

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0").slice(0, 64).padEnd(64, "0");
}

async function verifyHashChain(logs) {
  // Sort by id ascending for chain verification
  const sorted = [...logs].sort((a, b) => a.id - b.id);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const data = `${entry.event_type}${entry.robot_id}${entry.payload}${entry.prev_hash}`;
    const computed = simpleHash(data);

    if (computed !== entry.hash) {
      return { valid: false, brokenAt: i + 1, total: sorted.length };
    }
  }
  return { valid: true, total: sorted.length };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function AnomalyConsole() {
  const auditLogs = useAuditLog();
  const robots = useRobots();

  // Inject anomaly state
  const [selectedRobot, setSelectedRobot] = useState("");
  const [anomalyType, setAnomalyType] = useState("vibration_fault");
  const [injecting, setInjecting] = useState(false);

  // Hash verification state
  const [hashResult, setHashResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const anomalyTypes = ["vibration_fault", "overheating", "bearing_wear", "motor_fault"];

  const handleInject = async () => {
    if (!selectedRobot) return;
    setInjecting(true);
    await callReducer("inject_anomaly", {
      robot_id: parseInt(selectedRobot),
      anomaly_type: anomalyType,
    });
    setTimeout(() => setInjecting(false), 300);
  };

  const handleVerify = async () => {
    setVerifying(true);
    setHashResult(null);
    await new Promise((r) => setTimeout(r, 600));
    const result = await verifyHashChain(auditLogs);
    setHashResult(result);
    setVerifying(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Anomaly Console
      </h3>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT — Audit Log */}
        <div className="flex-1 min-w-0">
          <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No audit entries yet</p>
            ) : (
              auditLogs.map((log) => (
                <div key={`${log.id}-${log.timestamp}`} className="bg-gray-900 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap mt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <EventBadge type={log.event_type} />
                      {log.robot_id > 0 && (
                        <span className="text-[9px] text-gray-500 font-mono">ARM-{String(log.robot_id).padStart(2, "0")}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 truncate" title={log.payload}>
                      {log.payload.length > 60 ? log.payload.slice(0, 60) + "…" : log.payload}
                    </p>
                    <p className="text-[9px] text-gray-600 font-mono mt-0.5">
                      #{log.hash.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Controls */}
        <div className="lg:w-48 flex-shrink-0 space-y-4">
          {/* Inject Anomaly */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Inject Anomaly</p>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select robot...</option>
              {robots.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status})
                </option>
              ))}
            </select>

            <select
              value={anomalyType}
              onChange={(e) => setAnomalyType(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-blue-500"
            >
              {anomalyTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>

            <button
              onClick={handleInject}
              disabled={!selectedRobot || injecting}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {injecting ? "Injecting..." : "⚠ Inject"}
            </button>
          </div>

          {/* Hash Chain Verify */}
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Hash Chain</p>
            <button
              onClick={handleVerify}
              disabled={verifying || auditLogs.length === 0}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {verifying ? "Verifying..." : "🔗 Verify Chain"}
            </button>

            {hashResult && (
              <div className={`mt-2 p-2 rounded-lg text-xs font-mono ${
                hashResult.valid
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}>
                {hashResult.valid
                  ? `✓ Chain Intact (${hashResult.total} entries verified)`
                  : `✗ Chain broken at entry #${hashResult.brokenAt}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
