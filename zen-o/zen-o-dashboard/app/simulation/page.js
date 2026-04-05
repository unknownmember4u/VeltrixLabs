// app/simulation/page.js — Simulation Lab with live robot arm models
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRobots, useSimulations } from "../../lib/spacetime";
import NavBar from "../../components/NavBar";

const RobotModel = dynamic(() => import("../../components/RobotModel"), { ssr: false });

const LineChart        = dynamic(() => import("recharts").then((m) => m.LineChart),        { ssr: false });
const Line             = dynamic(() => import("recharts").then((m) => m.Line),              { ssr: false });
const XAxis            = dynamic(() => import("recharts").then((m) => m.XAxis),             { ssr: false });
const YAxis            = dynamic(() => import("recharts").then((m) => m.YAxis),             { ssr: false });
const Tooltip          = dynamic(() => import("recharts").then((m) => m.Tooltip),           { ssr: false });
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
  FlaskConical,
  X,
  Activity,
  Gauge,
  Clock,
  Shield,
  Wrench,
  CircuitBoard,
  Droplets,
  BarChart3,
} from "lucide-react";

// ─── HARDCODED MACHINE SPEC DATA ──────────────────────────────────────────────

const MACHINE_SPECS = {
  1: { model: "FANUC M-20iD/25", serialNo: "FA-2024-00812", firmware: "v8.30R-1", installDate: "2024-03-15", lastService: "2025-11-20", motorRPM: 3200, payload: "25 kg", reach: "1831 mm", repeatability: "±0.03 mm", ip: "192.168.10.101", protocol: "EtherNet/IP", coolantType: "Synthetic Ester", oilLevel: "92%", bearingHours: 4200, nextMaintenance: "2026-05-10" },
  2: { model: "FANUC M-20iD/25", serialNo: "FA-2024-00813", firmware: "v8.30R-1", installDate: "2024-03-15", lastService: "2025-12-05", motorRPM: 3200, payload: "25 kg", reach: "1831 mm", repeatability: "±0.03 mm", ip: "192.168.10.102", protocol: "EtherNet/IP", coolantType: "Synthetic Ester", oilLevel: "88%", bearingHours: 4350, nextMaintenance: "2026-04-28" },
  3: { model: "KUKA KR 60-3", serialNo: "KU-2024-01455", firmware: "v4.12.3", installDate: "2024-05-10", lastService: "2025-10-15", motorRPM: 2800, payload: "60 kg", reach: "2033 mm", repeatability: "±0.05 mm", ip: "192.168.10.103", protocol: "PROFINET", coolantType: "Mineral Oil ISO 46", oilLevel: "95%", bearingHours: 3100, nextMaintenance: "2026-06-15" },
  4: { model: "KUKA KR 60-3", serialNo: "KU-2024-01456", firmware: "v4.12.3", installDate: "2024-05-10", lastService: "2025-11-01", motorRPM: 2800, payload: "60 kg", reach: "2033 mm", repeatability: "±0.05 mm", ip: "192.168.10.104", protocol: "PROFINET", coolantType: "Mineral Oil ISO 46", oilLevel: "90%", bearingHours: 3400, nextMaintenance: "2026-06-01" },
  5: { model: "ABB IRB 4600-40/2.55", serialNo: "AB-2024-03221", firmware: "v7.1.2", installDate: "2024-06-20", lastService: "2025-09-30", motorRPM: 3500, payload: "40 kg", reach: "2550 mm", repeatability: "±0.05 mm", ip: "192.168.10.105", protocol: "EtherNet/IP", coolantType: "PAO Synthetic", oilLevel: "85%", bearingHours: 2800, nextMaintenance: "2026-04-20" },
  6: { model: "ABB IRB 4600-40/2.55", serialNo: "AB-2024-03222", firmware: "v7.1.2", installDate: "2024-06-20", lastService: "2025-10-20", motorRPM: 3500, payload: "40 kg", reach: "2550 mm", repeatability: "±0.05 mm", ip: "192.168.10.106", protocol: "EtherNet/IP", coolantType: "PAO Synthetic", oilLevel: "87%", bearingHours: 2950, nextMaintenance: "2026-05-15" },
  7: { model: "YASKAWA GP25-12", serialNo: "YA-2024-07891", firmware: "v3.8.0", installDate: "2024-07-01", lastService: "2025-08-25", motorRPM: 4000, payload: "25 kg", reach: "1730 mm", repeatability: "±0.02 mm", ip: "192.168.10.107", protocol: "MECHATROLINK", coolantType: "Synthetic Ester", oilLevel: "78%", bearingHours: 5100, nextMaintenance: "2026-04-15" },
  8: { model: "YASKAWA GP25-12", serialNo: "YA-2024-07892", firmware: "v3.8.0", installDate: "2024-07-01", lastService: "2025-07-10", motorRPM: 4000, payload: "25 kg", reach: "1730 mm", repeatability: "±0.02 mm", ip: "192.168.10.108", protocol: "MECHATROLINK", coolantType: "Synthetic Ester", oilLevel: "72%", bearingHours: 5600, nextMaintenance: "2026-04-05" },
};

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
        setMsg(`${data.chunks_added} chunks ingested into RAG.`);
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
        <p className="text-[10px] text-gray-500">Upload machine configuration PDF to refine AI diagnostic precision.</p>
      </div>
      <label className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm">
        {uploading ? "Processing..." : <><FileUp className="w-4 h-4" /> Upload PDF</>}
        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {msg && <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100">{msg}</span>}
    </div>
  );
}

// ─── LIVE ROBOT ARM GRID — values update every 4s ──────────────────────────

function LiveRobotGrid({ robots, onSelectRobot }) {
  const [tick, setTick] = useState(0);

  // Update tick every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate simulated live values per robot with gentle drift
  const liveData = useMemo(() => {
    return robots.map(r => {
      const id = r.id;
      const base_t = Number(r.temperature) || 68;
      const base_v = Number(r.vibration) || 0.38;
      const base_e = Number(r.energyKw) || 8.5;
      
      const t = base_t + Math.sin(tick * 0.4 + id) * 2.5;
      const v = base_v + Math.cos(tick * 0.35 + id * 0.7) * 0.04;
      const e = base_e + Math.sin(tick * 0.25 + id * 1.2) * 0.3;

      return {
        ...r,
        liveTemp: t.toFixed(1),
        liveVib: v.toFixed(3),
        liveEnergy: e.toFixed(2),
        isFault: r.status === "fault",
      };
    });
  }, [robots, tick]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" /> Live Robot Fleet — Click to Inspect
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-gray-500">REFRESH: 4s</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {liveData.map((r) => (
          <div
            key={r.id}
            onClick={() => onSelectRobot(r)}
            className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg group ${
              r.isFault
                ? "border-red-300 bg-red-50/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                : "border-gray-200 bg-white hover:border-blue-400"
            }`}
          >
            {/* 3D Model */}
            <div className="h-28 mb-2 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 group-hover:border-blue-200 transition-colors pointer-events-none">
              <RobotModel />
            </div>

            {/* Robot name + status */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-gray-900">{r.name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold border ${
                r.isFault ? "bg-red-100 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
              }`}>
                {r.isFault ? "FAULT" : "ACTIVE"}
              </span>
            </div>

            {/* Live values with transition animation */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Thermometer className="w-2.5 h-2.5" /> TEMP</span>
                <span className={`text-[10px] font-mono font-bold transition-all duration-700 ${Number(r.liveTemp) > 85 ? "text-red-600" : "text-gray-800"}`}>
                  {r.liveTemp}°C
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Activity className="w-2.5 h-2.5" /> VIB</span>
                <span className={`text-[10px] font-mono font-bold transition-all duration-700 ${Number(r.liveVib) > 0.7 ? "text-amber-600" : "text-gray-800"}`}>
                  {r.liveVib}g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-gray-400 flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> PWR</span>
                <span className="text-[10px] font-mono font-bold text-gray-800 transition-all duration-700">
                  {r.liveEnergy} kW
                </span>
              </div>
            </div>

            {/* Click hint */}
            <div className="absolute inset-0 rounded-xl bg-blue-600/0 group-hover:bg-blue-600/5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-[9px] font-bold text-blue-600 bg-white/90 px-2 py-1 rounded-lg shadow-sm border border-blue-200">
                CLICK TO INSPECT
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROBOT DETAIL MODAL — smooth maximize animation ──────────────────────────

function RobotDetailModal({ robot, onClose }) {
  const [visible, setVisible] = useState(false);
  const specs = MACHINE_SPECS[robot.id] || MACHINE_SPECS[1];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const temp = Number(robot.liveTemp || robot.temperature || 68);
  const vib = Number(robot.liveVib || robot.vibration || 0.38);
  const energy = Number(robot.liveEnergy || robot.energyKw || 8.5);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${visible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl shadow-2xl border border-gray-200 w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out ${
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
        <div className={`relative p-5 rounded-t-2xl ${robot.isFault ? "bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200" : "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200"}`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 border-gray-200 shadow-md pointer-events-none flex-shrink-0">
              <RobotModel />
            </div>
            <div>
              <h2 className="text-xl font-mono font-bold text-gray-900">{robot.name}</h2>
              <p className="text-xs text-gray-500 font-medium">{specs.model} · {robot.zone}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${robot.isFault ? "bg-red-100 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                  {robot.isFault ? "FAULT DETECTED" : "OPERATIONAL"}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">SN: {specs.serialNo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-5 space-y-5">
          {/* Live Sensor Readings */}
          <div>
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Live Sensor Readings
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl border p-4 text-center ${temp > 85 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
                <Thermometer className={`w-5 h-5 mx-auto mb-1.5 ${temp > 85 ? "text-red-500" : "text-blue-500"}`} />
                <p className="text-[9px] text-gray-400 uppercase font-bold">Temperature</p>
                <p className={`text-2xl font-mono font-bold ${temp > 85 ? "text-red-600" : "text-gray-900"}`}>{temp.toFixed(1)}°C</p>
                <p className="text-[8px] text-gray-400 mt-1">Threshold: 85°C</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${vib > 0.7 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                <Activity className={`w-5 h-5 mx-auto mb-1.5 ${vib > 0.7 ? "text-amber-500" : "text-blue-500"}`} />
                <p className="text-[9px] text-gray-400 uppercase font-bold">Vibration</p>
                <p className={`text-2xl font-mono font-bold ${vib > 0.7 ? "text-amber-600" : "text-gray-900"}`}>{vib.toFixed(3)}g</p>
                <p className="text-[8px] text-gray-400 mt-1">Threshold: 0.70g</p>
              </div>
              <div className="rounded-xl border bg-gray-50 border-gray-200 p-4 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
                <p className="text-[9px] text-gray-400 uppercase font-bold">Power Draw</p>
                <p className="text-2xl font-mono font-bold text-gray-900">{energy.toFixed(2)} kW</p>
                <p className="text-[8px] text-gray-400 mt-1">Nominal: {specs.payload === "60 kg" ? "9.0" : "8.5"} kW</p>
              </div>
            </div>
          </div>

          {/* Machine Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
                <CircuitBoard className="w-3.5 h-3.5" /> Hardware Specifications
              </h3>
              <div className="space-y-2">
                {[
                  ["Model", specs.model],
                  ["Serial Number", specs.serialNo],
                  ["Firmware", specs.firmware],
                  ["Motor RPM", `${specs.motorRPM} RPM`],
                  ["Payload Capacity", specs.payload],
                  ["Reach", specs.reach],
                  ["Repeatability", specs.repeatability],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                    <span className="text-[10px] text-gray-900 font-mono font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" /> Maintenance & Network
              </h3>
              <div className="space-y-2">
                {[
                  ["Install Date", specs.installDate],
                  ["Last Service", specs.lastService],
                  ["Next Maintenance", specs.nextMaintenance],
                  ["Bearing Hours", `${specs.bearingHours} hrs`],
                  ["Network IP", specs.ip],
                  ["Protocol", specs.protocol],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                    <span className="text-[10px] text-gray-900 font-mono font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fluid Status */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5" /> Fluid & Lubrication Status
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Coolant Type</p>
                <p className="text-xs font-mono font-bold text-gray-800">{specs.coolantType}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Oil Level</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${parseInt(specs.oilLevel) > 85 ? "bg-green-500" : parseInt(specs.oilLevel) > 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: specs.oilLevel }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-800">{specs.oilLevel}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Bearing Life</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${specs.bearingHours < 3000 ? "bg-green-500" : specs.bearingHours < 5000 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(100, (specs.bearingHours / 6000) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-800">{specs.bearingHours}h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  useMemo(() => {
    if (preset) {
      setParameter(preset.parameter);
      setDeltaPercent(preset.delta);
    }
  }, [preset]);

  // Deterministic fallback when AI is unavailable or times out
  const computeFallback = (delta, robotList) => {
    const absDelta = Math.abs(delta);
    const faultCount = robotList.filter(r => r.status === "fault").length;
    const vibs = robotList.map(r => Number(r.vibration || 0));
    const avgVib = vibs.length ? vibs.reduce((a,b) => a+b, 0) / vibs.length : 0;
    const baseRisk = Math.pow(absDelta, 1.6) * 0.06;
    const riskScore = Math.min(98, baseRisk + avgVib * 25 + faultCount * 12);
    const outputShift = delta * 0.55 - Math.pow(absDelta, 1.3) * 0.02;
    const projectedOutput = 100 + outputShift - faultCount * 4;
    let rec;
    if (absDelta > 35) rec = `High variance (${delta > 0 ? '+' : ''}${delta}%) exceeds safe envelope. Gradual ramp recommended.`;
    else if (absDelta > 20) rec = `Moderate variance (${delta > 0 ? '+' : ''}${delta}%) — monitor thermal and vibration systems.`;
    else rec = `Low variance (${delta > 0 ? '+' : ''}${delta}%) within acceptable limits. Standard monitoring sufficient.`;
    return {
      parameter, delta_percent: delta,
      projected_output: Math.round(projectedOutput * 100) / 100,
      risk_score: Math.round(riskScore * 100) / 100,
      fault_probability: Math.round(Math.min(1, riskScore / 100) * 10000) / 10000,
      recommendation: rec, fault_count: faultCount, avg_vibration: avgVib,
    };
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const robotsPlain = robots.map((r) => ({
        id: r.id, name: r.name, zone: r.zone, status: r.status,
        temperature: r.temperature, vibration: r.vibration, energy_kw: r.energyKw,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const res = await fetch(`${FLASK_URL}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameter, delta_percent: deltaPercent, current_state_json: robotsPlain }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      onResult(data);
    } catch (err) {
      const fallback = computeFallback(deltaPercent, robots);
      setResult(fallback);
      onResult(fallback);
      setError(err.name === "AbortError" ? "AI timed out — using physics projection" : "AI unavailable — using physics projection");
    } finally {
      setLoading(false);
    }
  };

  const recColor = result
    ? result.risk_score > 60 ? "bg-red-500/10 border-red-500/30 text-red-600"
    : result.risk_score > 30 ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
    : "bg-green-500/10 border-green-500/30 text-green-600"
    : "";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{label}</p>
        <Settings className="w-3.5 h-3.5 text-gray-400" />
      </div>

      <div>
        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Simulation Parameter</label>
        <input type="text" value={parameter} onChange={(e) => setParameter(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner" />
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <label className="text-[10px] text-gray-500 uppercase font-bold">Variance (%)</label>
          <span className={`text-xs font-mono font-bold ${deltaPercent > 0 ? "text-green-600" : deltaPercent < 0 ? "text-red-600" : "text-gray-400"}`}>
            {deltaPercent > 0 ? "+" : ""}{deltaPercent}%
          </span>
        </div>
        <input type="range" min={-50} max={50} value={deltaPercent}
          onChange={(e) => setDeltaPercent(parseInt(e.target.value))}
          className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600" />
      </div>

      <button onClick={handleRun} disabled={loading}
        className="w-full py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-all shadow-sm flex items-center justify-center gap-2">
        {loading ? (<><span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> Running...</>) : <><Play className="w-3.5 h-3.5" /> Run Simulation</>}
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

function RiskCurve({ resultA, resultB }) {
  const baseData = Array.from({ length: 11 }, (_, i) => {
    const delta = -50 + i * 10;
    return { 
      delta, 
      projected_output: 100 + delta * 0.6, 
      risk_score: Math.abs(delta) * 0.4 
    };
  });

  const data = baseData.map(point => {
    const entry = { ...point };
    if (resultA) {
      const rd = Math.round(resultA.delta_percent / 10) * 10;
      if (rd === point.delta) {
        entry.simA_output = resultA.projected_output;
        entry.simA_risk = resultA.risk_score;
      }
    }
    if (resultB) {
      const rd = Math.round(resultB.delta_percent / 10) * 10;
      if (rd === point.delta) {
        entry.simB_output = resultB.projected_output;
        entry.simB_risk = resultB.risk_score;
      }
    }
    return entry;
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
          <Line dataKey="projected_output" name="Theoretical Output" stroke="#2563eb" strokeWidth={2} dot={false} opacity={0.6} />
          <Line dataKey="risk_score" name="Theoretical Risk" stroke="#d97706" strokeWidth={2} dot={false} opacity={0.6} />
          {resultA && <Line dataKey="simA_output" name="Sim A Output" stroke="#2563eb" strokeWidth={0} activeDot={{ r: 8 }} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} connectNulls={false} />}
          {resultA && <Line dataKey="simA_risk" name="Sim A Risk" stroke="#d97706" strokeWidth={0} activeDot={{ r: 8 }} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} connectNulls={false} />}
          {resultB && <Line dataKey="simB_output" name="Sim B Output" stroke="#7c3aed" strokeWidth={0} activeDot={{ r: 8 }} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} connectNulls={false} />}
          {resultB && <Line dataKey="simB_risk" name="Sim B Risk" stroke="#db2777" strokeWidth={0} activeDot={{ r: 8 }} dot={{ r: 6, strokeWidth: 2, fill: '#fff' }} connectNulls={false} />}
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
        The following units are operating at critical thresholds and require immediate calibration.
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
  const [selectedRobot, setSelectedRobot] = useState(null);
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

        {/* LIVE ROBOT FLEET — values refresh every 4s */}
        <LiveRobotGrid robots={robots} onSelectRobot={setSelectedRobot} />

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
                  <p className="text-[10px] text-gray-400 font-mono uppercase font-bold">{p.parameter}</p>
                  <p className="text-[10px] font-bold text-blue-600 mt-1">Delta: {p.delta > 0 ? "+" : ""}{p.delta}%</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setPresetA(p)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all shadow-sm ${presetA?.label === p.label ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    SELECT A
                  </button>
                  <button onClick={() => setPresetB(p)}
                    className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all shadow-sm ${presetB?.label === p.label ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    SELECT B
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {comparison && (
          <div className="bg-white border border-blue-200 rounded-xl px-5 py-3 shadow-sm flex items-center justify-center gap-3">
            <Search className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-gray-800 font-bold tracking-tight">AI Analysis: {comparison}</p>
            <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SimPanel label="Simulation Slot A" preset={presetA} robots={robots} onResult={setResultA} />
          <SimPanel label="Simulation Slot B" preset={presetB} robots={robots} onResult={setResultB} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
           <div className="lg:col-span-2"><RiskCurve resultA={resultA} resultB={resultB} /></div>
           <div className="lg:col-span-1"><SimHistory sims={sims} /></div>
        </div>

        <AtRiskRobots robots={robots} riskScore={maxRisk} />
      </div>

      {/* Robot Detail Modal */}
      {selectedRobot && (
        <RobotDetailModal robot={selectedRobot} onClose={() => setSelectedRobot(null)} />
      )}
    </div>
  );
}
