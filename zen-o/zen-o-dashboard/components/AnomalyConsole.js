// components/AnomalyConsole.js — Audit log viewer + anomaly injection + hash chain verification
"use client";

import { useState } from "react";
import { useAuditLog, useRobots, callReducer } from "../lib/spacetime";
import { ShieldAlert, Link as LinkIcon, ActivitySquare } from "lucide-react";

// ─── EVENT TYPE BADGE COLORS ──────────────────────────────────────────

const EVENT_COLORS = {
  ANOMALY_DETECTED: "bg-red-50 text-red-600 border-red-200",
  ANOMALY_INJECTED: "bg-red-50 text-red-600 border-red-200",
  ANOMALY_RESOLVED: "bg-green-50 text-green-600 border-green-200",
  PO_AUTO_GENERATED: "bg-blue-50 text-blue-600 border-blue-200",
  EMERGENCY_STOP: "bg-orange-50 text-orange-600 border-orange-200",
  ENERGY_ALERT: "bg-amber-50 text-amber-600 border-amber-200",
};

function EventBadge({ type }) {
  const color = EVENT_COLORS[type] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium whitespace-nowrap ${color}`}>
      {type}
    </span>
  );
}

function formatTime(ts) {
  // SpacetimeDB timestamps are typically in microseconds, convert to MS
  const ms = ts > 2000000000000 ? ts / 1000 : ts;
  const d = new Date(ms);
  return (isNaN(d) ? "Inv Date" : d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
}

// ─── HASH FUNCTION (Matches Rust SHA256) ───────────

async function computeSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyHashChain(logs) {
  // Sort by id ascending for chain verification
  const sorted = [...logs].sort((a, b) => a.id - b.id);

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    // Rust: format!("{}{}{}{}", event_type, robot_id, payload, prev_hash)
    const data = `${entry.eventType}${entry.robotId}${entry.payload}${entry.prevHash}`;
    const computed = await computeSHA256(data);

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
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col h-full shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ActivitySquare className="w-4 h-4"/> Anomaly Console
      </h3>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT — Audit Log */}
        <div className="flex-1 min-w-0">
          <div className="max-h-[400px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No audit entries yet</p>
            ) : (
              auditLogs.map((log) => (
                <div key={`${log.id}-${log.timestamp}`} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap mt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <EventBadge type={log.eventType} />
                      {Number(log.robotId) > 0 && (
                        <span className="text-[9px] text-gray-500 font-mono">ARM-{String(log.robotId).padStart(2, "0")}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-medium truncate" title={log.payload}>
                      {log.payload.length > 60 ? log.payload.slice(0, 60) + "…" : log.payload}
                    </p>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">
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
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Inject Anomaly</p>
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 mb-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 mb-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {anomalyTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>

            <button
              onClick={handleInject}
              disabled={!selectedRobot || injecting}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {injecting ? "Injecting..." : <><ShieldAlert className="w-3.5 h-3.5"/> Inject</>}
            </button>
          </div>

          {/* Hash Chain Verify */}
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Hash Chain</p>
            <button
              onClick={handleVerify}
              disabled={verifying || auditLogs.length === 0}
              className="w-full py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-900 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex justify-center items-center gap-1.5"
            >
              {verifying ? "Verifying..." : <><LinkIcon className="w-3.5 h-3.5"/> Verify Chain</>}
            </button>

            {hashResult && (
              <div className={`mt-2 p-2 rounded-lg text-[10px] font-mono shadow-sm ${
                hashResult.valid
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {hashResult.valid
                  ? `✓ Chain Intact (${hashResult.total} verified)`
                  : `✗ Chain broken at #${hashResult.brokenAt}`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
