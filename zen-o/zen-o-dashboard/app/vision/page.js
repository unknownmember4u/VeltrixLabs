// app/vision/page.js — Vision Monitoring: Real-time helmet detection with violation hash ledger
"use client";

import { useState, useEffect, useRef } from "react";
import NavBar from "../../components/NavBar";
import { Eye, ShieldAlert, Hash, Clock, HardHat, Play, Square, ShieldCheck, Camera, Video } from "lucide-react";

const FLASK_URL = "http://localhost:5001";

function SeverityBadge({ severity }) {
  const map = {
    critical: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border font-black tracking-widest ${map[severity] || map.medium}`}>
      {severity}
    </span>
  );
}

export default function VisionPage() {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [totalViolations, setTotalViolations] = useState(0);
  const pollRef = useRef(null);

  useEffect(() => {
    fetch(`${FLASK_URL}/vision/status`)
      .then((r) => r.json())
      .then((data) => setActive(data.active))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    const poll = () => {
      fetch(`${FLASK_URL}/vision/violations`)
        .then((r) => r.json())
        .then((data) => {
          setViolations(data.violations || []);
          setTotalViolations(data.total || 0);
        })
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [active]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${FLASK_URL}/vision/start`, { method: "POST" });
      const data = await res.json();
      if (data.status === "started" || data.status === "already_running") setActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await fetch(`${FLASK_URL}/vision/stop`, { method: "POST" });
      setActive(false);
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = violations.filter((v) => v.severity === "critical").length;
  const highCount = violations.filter((v) => v.severity === "high").length;

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900">
      <NavBar />
      <div className="max-w-[1600px] mx-auto p-4 space-y-5">
        <div className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-lg font-mono font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" /> Vision Monitoring
            </h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
              AI-Powered Helmet Safety Detection · Real-Time Camera Feed
            </p>
          </div>
          <div className="flex items-center gap-3">
            {active && (
              <div className="bg-red-50 px-3 py-1.5 rounded-full border border-red-100 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-red-700 font-mono">REC · LIVE</span>
              </div>
            )}
            {!active ? (
              <button onClick={handleStart} disabled={loading} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50">
                {loading ? <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : <><Play className="w-4 h-4" /> Start Camera</>}
              </button>
            ) : (
              <button onClick={handleStop} disabled={loading} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all shadow-sm disabled:opacity-50">
                <Square className="w-3.5 h-3.5" /> Stop Camera
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Live Camera Feed</span>
                </div>
                {active && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-mono font-bold text-gray-500">YOLO v8 · best.pt</span>
                  </div>
                )}
              </div>

              <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                {active ? (
                  <img src={`${FLASK_URL}/vision/feed`} alt="Live helmet detection feed" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                      <Video className="w-10 h-10 text-gray-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-400">Camera Inactive</p>
                      <p className="text-[10px] text-gray-600 mt-1">Press "Start Camera" to begin real-time helmet detection</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                <ShieldAlert className="w-4 h-4 text-gray-400" /> Detection Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                  <p className="text-3xl font-mono font-black text-red-600">{totalViolations}</p>
                  <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1">Total Violations</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-center">
                  <p className="text-3xl font-mono font-black text-orange-600">{criticalCount}</p>
                  <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest mt-1">Critical</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                  <p className="text-3xl font-mono font-black text-amber-600">{highCount}</p>
                  <p className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mt-1">High Severity</p>
                </div>
                <div className={`rounded-xl p-4 border text-center ${active ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-200"}`}>
                  <p className={`text-3xl font-mono font-black ${active ? "text-emerald-600" : "text-gray-400"}`}>
                    {active ? "ON" : "OFF"}
                  </p>
                  <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${active ? "text-emerald-500" : "text-gray-400"}`}>
                    Camera Status
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2 mb-4">
                <HardHat className="w-4 h-4 text-gray-400" /> Model Configuration
              </h3>
              <div className="space-y-3">
                {[
                  ["Architecture", "YOLOv8"],
                  ["Weights", "best.pt (custom)"],
                  ["Classes", "helmet · head · person"],
                  ["Confidence", "≥ 0.45"],
                  ["Resolution", "1280 × 720"],
                  ["Hash Algo", "SHA-256 (16-char)"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center group">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-900 transition-colors">{label}</span>
                    <span className="text-[10px] text-gray-800 font-mono font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-bold text-gray-700 mb-3">Detection Legend</p>
              <div className="space-y-2 text-xs text-gray-600">
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500" /> Helmet detected — compliant</p>
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-500" /> Head (no helmet) — violation</p>
                <p className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-orange-400" /> Person detected</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4 text-gray-400" /> Safety Violation Ledger
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">Immutable hash-chain log of every no-helmet detection event.</p>
            </div>
            <div className="flex items-center gap-3">
              {violations.length > 0 && <span className="text-[9px] bg-red-50 text-red-600 px-3 py-1.5 rounded-full border border-red-200 font-bold tracking-widest">{totalViolations} RECORDED</span>}
              <div className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Hash Secured</span>
              </div>
            </div>
          </div>

          {violations.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No Violations Recorded</p>
              <p className="text-[10px] text-gray-400 mt-1 max-w-xs">Start the camera feed and the system will automatically detect and log any helmet safety violations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-100">
                    <th className="pb-3 px-2">#</th>
                    <th className="pb-3 px-2">Timestamp</th>
                    <th className="pb-3 px-2 text-center">No Helmet</th>
                    <th className="pb-3 px-2 text-center">Helmets</th>
                    <th className="pb-3 px-2 text-center">Persons</th>
                    <th className="pb-3 px-2">Severity</th>
                    <th className="pb-3 px-2 text-right">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {violations.map((v, idx) => (
                    <tr key={v.id || idx} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors group ${idx === 0 ? "bg-red-50/30" : ""}`}>
                      <td className="py-4 px-2 text-gray-400 font-mono font-bold text-[10px]">{v.id}</td>
                      <td className="py-4 px-2 text-gray-500 font-mono text-[10px]"><div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-gray-300" />{v.time_str}</div></td>
                      <td className="py-4 px-2 text-center"><span className="font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">{v.head_count}</span></td>
                      <td className="py-4 px-2 text-center"><span className="font-mono font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded">{v.helmet_count}</span></td>
                      <td className="py-4 px-2 text-center font-mono text-gray-600 font-medium">{v.person_count}</td>
                      <td className="py-4 px-2"><SeverityBadge severity={v.severity} /></td>
                      <td className="py-4 px-2 text-right"><div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded text-gray-500 px-2 py-1 font-mono text-[10px] group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:text-blue-600 transition-colors"><Hash className="w-2.5 h-2.5" />{v.hash}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
