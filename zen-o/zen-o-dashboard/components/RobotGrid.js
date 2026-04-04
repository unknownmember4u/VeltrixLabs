// components/RobotGrid.js — Robot monitoring grid + oil leakage heatmap
"use client";

import { useState } from "react";
import { useRobots, callReducer } from "../lib/spacetime";
import { Zap, Bot, Check, Thermometer, Activity, MapPin, CheckCircle, PauseCircle, Droplets, AlertTriangle, ShieldAlert } from "lucide-react";
import RobotModel from "./RobotModel";

// ─── STATUS HELPERS ───────────────────────────────────────────────────

function StatusDot({ status }) {
  if (status === "active")
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />;
  if (status === "fault")
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" />;
}

function ZoneBadge({ zone }) {
  const color = zone === "Zone-A" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-purple-50 text-purple-600 border-purple-200";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${color} font-mono flex items-center gap-1`}>
      <MapPin className="w-3 h-3" />
      {zone}
    </span>
  );
}

// ─── GAUGE BARS ───────────────────────────────────────────────────────

function TempBar({ temp }) {
  const pct = Math.min(100, Math.max(0, ((temp - 40) / 60) * 100));
  const color = temp < 70 ? "bg-green-500" : temp <= 85 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-gray-900 font-semibold mix-blend-overlay">
        {temp.toFixed(1)}°C
      </span>
    </div>
  );
}

function VibrationBar({ value }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const color = value < 0.6 ? "bg-green-500" : value <= 0.8 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-gray-900 font-semibold mix-blend-overlay">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

// ─── ROBOT DETAIL / DIAGNOSIS MODAL ───────────────────────────────────

function RobotModal({ robot, onClose }) {
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);
  const isFault = robot.status === "fault";

  const getDiagnosis = async () => {
    setLoading(true);
    setError(null);
    setDiagnosis(null);
    try {
      const res = await fetch("http://localhost:5001/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robot_id: robot.id,
          robot_name: robot.name,
          vibration: Number(robot.vibration),
          temperature: Number(robot.temperature),
          energy_kw: Number(robot.energyKw),
          anomaly_type: "vibration_fault",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDiagnosis(data);
    } catch (err) {
      setError(err.message || "Failed to reach AI service");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    await callReducer("resolve_anomaly", {
      robot_id: robot.id,
      action_taken: diagnosis?.recommendation || "Manual resolution",
      operator_id: "operator-1",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-mono font-bold text-gray-900">{robot.name}</h3>
            <ZoneBadge zone={robot.zone} />
            <StatusDot status={robot.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl leading-none">&times;</button>
        </div>

        {/* Robot details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase flex items-center justify-center gap-1"><Thermometer className="w-3 h-3" /> Temp</p>
            <p className={`text-lg font-mono font-bold ${Number(robot.temperature) > 85 ? "text-red-500" : Number(robot.temperature) > 70 ? "text-amber-500" : "text-green-600"}`}>
              {Number(robot.temperature).toFixed(1)}°C
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase flex items-center justify-center gap-1"><Activity className="w-3 h-3" /> Vibrate</p>
            <p className={`text-lg font-mono font-bold ${Number(robot.vibration) > 0.8 ? "text-red-500" : Number(robot.vibration) > 0.6 ? "text-amber-500" : "text-green-600"}`}>
              {Number(robot.vibration).toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
            <p className="text-[10px] text-gray-500 uppercase flex items-center justify-center gap-1">Energy</p>
            <p className="text-lg font-mono font-bold text-gray-900 flex items-center justify-center gap-1"><Zap className="w-4 h-4 text-amber-500" /> {Number(robot.energyKw).toFixed(1)} kW</p>
          </div>
        </div>

        {/* Fault diagnosis section */}
        {isFault && (
          <>
            <button
              onClick={getDiagnosis}
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-blue-600 hover:bg-blue-700 shadow flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white mb-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </span>
              ) : <><Bot className="w-4 h-4" /> Get AI Diagnosis</>}
            </button>

            {diagnosis && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-3">
                <p className="text-sm text-green-700 font-semibold mb-1">AI Recommendation</p>
                <p className="text-sm text-gray-600">{diagnosis.recommendation}</p>
                {diagnosis.source_pages?.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-2">Sources: {diagnosis.source_pages.join(", ")}</p>
                )}
                {diagnosis.latency_ms && (
                  <p className="text-[10px] text-gray-500">Response time: {diagnosis.latency_ms}ms</p>
                )}
                {/* Resolve button after getting diagnosis */}
                <button
                  onClick={handleResolve}
                  className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 flex justify-center items-center gap-1.5 text-white shadow transition-colors"
                >
                  <Check className="w-4 h-4" /> Apply Fix & Resolve Anomaly
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-3">
                <p className="text-sm text-red-600 font-semibold mb-1">AI Service Unavailable</p>
                <p className="text-sm text-gray-600">{error}</p>
                <button
                  onClick={handleResolve}
                  className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                >
                  Manual Resolve
                </button>
              </div>
            )}
          </>
        )}

        {/* Info for non-fault robots */}
        {!isFault && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center flex flex-col items-center">
            <p className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2">
              {robot.status === "active" ? <><CheckCircle className="w-4 h-4 text-green-500" /> Operating normally</> : <><PauseCircle className="w-4 h-4 text-gray-500" /> Robot is idle</>}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Last updated: {new Date(Number(robot.lastUpdated)).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPACT ROBOT CARD (No 3D model — IoT data only) ─────────────────

function RobotCard({ robot, onClick }) {
  const isFault = robot.status === "fault";

  let heatGradient = "bg-white border-gray-200 hover:border-gray-300";
  if (isFault) {
    heatGradient = "bg-gradient-to-br from-red-50 to-orange-50 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.25)]";
  } else if (Number(robot.temperature) > 75 || Number(robot.vibration) > 0.6) {
    heatGradient = "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400";
  } else {
    heatGradient = "bg-gradient-to-br from-white to-blue-50/40 border-gray-200 hover:border-blue-200";
  }

  return (
    <div
      className={`rounded-2xl border p-4 shadow-md transition-all cursor-pointer ${heatGradient}`}
      onClick={() => onClick(robot)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-gray-900 text-sm">{robot.name}</span>
        <ZoneBadge zone={robot.zone} />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-3">
        <StatusDot status={robot.status} />
        <span className="text-xs text-gray-500 font-medium capitalize">{robot.status}</span>
      </div>

      {/* Temperature */}
      <div className="mb-2 w-full">
        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temperature</p>
        <TempBar temp={Number(robot.temperature)} />
      </div>

      {/* Vibration */}
      <div className="mb-2 w-full">
        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Vibration</p>
        <VibrationBar value={Number(robot.vibration)} />
      </div>

      {/* Energy */}
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-200/50">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-mono text-sm font-semibold text-gray-800">{Number(robot.energyKw).toFixed(1)}</span>
        <span className="text-[10px] text-gray-500">kW</span>
      </div>
    </div>
  );
}

// ─── OIL LEAKAGE HEATMAP (4×2 grid with 3D models) ───────────────────

function OilLeakageHeatmap({ robots, onRobotClick }) {
  const [leakedArms, setLeakedArms] = useState(new Set());

  const toggleLeak = (robotId) => {
    setLeakedArms(prev => {
      const next = new Set(prev);
      if (next.has(robotId)) {
        next.delete(robotId);
      } else {
        next.add(robotId);
      }
      return next;
    });
  };

  const sorted = [...robots].sort((a, b) => a.id - b.id);

  return (
    <div className="relative rounded-2xl border border-gray-200/60 p-5 mt-4 shadow-sm" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(240,248,255,0.6) 50%, rgba(255,255,255,0.75) 100%)", backdropFilter: "blur(6px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Oil Leakage Simulation</h3>
            <p className="text-[10px] text-gray-500 font-mono">Factory Floor — 4×2 ARM Layout • Click leak buttons to simulate</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {leakedArms.size > 0 && (
            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              {leakedArms.size} LEAK{leakedArms.size > 1 ? "S" : ""} DETECTED
            </span>
          )}
          <button 
            onClick={() => setLeakedArms(new Set())}
            className="text-[10px] font-mono font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            RESET ALL
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[10px] text-gray-500 font-medium">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[10px] text-gray-500 font-medium">Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-gray-500 font-medium">Oil Leak Detected</span>
        </div>
      </div>

      {/* 4×2 Grid of robot arms */}
      <div className="grid grid-cols-4 gap-3">
        {sorted.map(robot => {
          const hasLeak = leakedArms.has(robot.id);
          const isFault = robot.status === "fault";

          let cellBg = "bg-white/50 border-gray-200/80";
          let glowEffect = "";
          if (hasLeak) {
            cellBg = "bg-gradient-to-br from-red-100/80 to-red-200/60 border-red-400";
            glowEffect = "shadow-[0_0_20px_rgba(239,68,68,0.35)]";
          } else if (isFault) {
            cellBg = "bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-300";
          }

          return (
            <div key={robot.id} className={`relative rounded-xl border p-2 transition-all duration-500 ${cellBg} ${glowEffect}`}>
              {/* Leak overlay effect */}
              {hasLeak && (
                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none z-10">
                  <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-red-500/30 to-transparent animate-pulse" />
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                    <AlertTriangle className="w-2.5 h-2.5" /> LEAK
                  </div>
                </div>
              )}

              {/* Robot name & status */}
              <div className="flex items-center justify-between mb-1 relative z-20">
                <span className={`text-[10px] font-mono font-bold ${hasLeak ? "text-red-700" : "text-gray-700"}`}>{robot.name}</span>
                <StatusDot status={hasLeak ? "fault" : robot.status} />
              </div>

              {/* 3D Model */}
              <div className={`w-full h-32 rounded-lg overflow-hidden relative ${hasLeak ? "border border-red-300" : "border border-gray-100"}`} 
                   style={{ filter: hasLeak ? "hue-rotate(-30deg) saturate(2.5) brightness(0.85)" : "none" }}
                   onClick={() => onRobotClick(robot)}
              >
                <RobotModel seed={Number(robot.id)} />
              </div>

              {/* Quick stats */}
              <div className="flex items-center justify-between mt-1.5 relative z-20">
                <span className="text-[9px] font-mono text-gray-500">{Number(robot.temperature).toFixed(0)}°C</span>
                <span className="text-[9px] font-mono text-gray-500">{Number(robot.vibration).toFixed(2)}g</span>
              </div>

              {/* Leak toggle button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLeak(robot.id); }}
                className={`w-full mt-1.5 py-1 rounded-lg text-[9px] font-bold transition-all relative z-20 ${
                  hasLeak 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                    : "bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {hasLeak ? "⚠ LEAK ACTIVE" : "Simulate Leak"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN GRID ────────────────────────────────────────────────────────

export default function RobotGrid() {
  const robots = useRobots().sort((a, b) => a.id - b.id);
  const [modalRobot, setModalRobot] = useState(null);

  if (robots.length === 0) return null;

  // Keep modal robot data fresh (live updates)
  const liveModalRobot = modalRobot ? robots.find((r) => r.id === modalRobot.id) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2"><Bot className="w-4 h-4" /> Robot Fleet / Heat Map</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono font-medium">{robots.length} units Active</span>
          {robots.filter((r) => r.status === "fault").length > 0 && (
            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded shadow-sm">
              {robots.filter((r) => r.status === "fault").length} fault{robots.filter((r) => r.status === "fault").length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* IoT Data Cards (compact, no 3D models) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {robots.map((robot) => (
          <RobotCard key={robot.id} robot={robot} onClick={setModalRobot} />
        ))}
      </div>

      {/* Oil Leakage Heatmap (4×2 grid with 3D models) */}
      <OilLeakageHeatmap robots={robots} onRobotClick={setModalRobot} />

      {liveModalRobot && (
        <RobotModal robot={liveModalRobot} onClose={() => setModalRobot(null)} />
      )}
    </div>
  );
}
