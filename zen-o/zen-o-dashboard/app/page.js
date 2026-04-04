// app/page.js — Zen-O Smart Factory Dashboard main page
"use client";

import dynamic from "next/dynamic";
import { useConnectionStatus, callReducer, useRobots } from "../lib/spacetime";
import NavBar from "../components/NavBar";

// Dynamic imports to avoid SSR issues with SpacetimeDB
const RobotGrid = dynamic(() => import("../components/RobotGrid"), { ssr: false });
const AnomalyConsole = dynamic(() => import("../components/AnomalyConsole"), { ssr: false });
const DatabaseStream = dynamic(() => import("../components/DatabaseStream"), { ssr: false });

// ─── SKELETON LOADER ─────────────────────────────────────────────────

function Skeleton({ className = "" }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}



// ─── LIVE BADGE ──────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur border border-green-200 rounded-full px-3 py-1.5 shadow-lg">
      <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
      <span className="text-[10px] font-mono font-bold text-green-700 tracking-wider">LIVE SYNC</span>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────

import { AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Home() {
  const { status, latencyMs } = useConnectionStatus();
  const robots = useRobots();
  const isConnected = status === "connected";
  const faultCount = robots.filter((r) => r.status === "fault").length;

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <NavBar />
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm relative z-30">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600 font-mono font-medium flex items-center gap-2">
              {faultCount > 0 ? <><AlertCircle className="w-4 h-4 text-red-500"/> <span className="text-red-600">{faultCount} fault{faultCount > 1 ? 's' : ''} detected</span></> : <><CheckCircle2 className="w-4 h-4 text-green-500"/> All systems nominal</>}
            </span>
            <span className="text-[10px] text-green-700 font-mono font-medium border border-green-200 bg-green-50/80 px-2.5 py-0.5 rounded-full">
              Edge AI (No Cloud): Local Ollama RAG active.
            </span>
          </div>
          <button
            onClick={() => { if (confirm('Trigger EMERGENCY STOP for all zones?')) callReducer('emergency_stop', { zone: 'all', reason: 'Manual emergency stop', operator_id: 'operator-1' }); }}
            className="flex items-center gap-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 hover:text-red-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider whitespace-nowrap shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> E-STOP ALL ZONES
          </button>
        </div>
      </div>

      <main className="p-4 space-y-4 max-w-[1600px] mx-auto">
        {/* Row 1 — Robot Fleet */}
        {isConnected ? (
          <RobotGrid />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          </div>
        )}

        {/* Row 2 — Console & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {isConnected ? (
              <AnomalyConsole />
            ) : (
              <Skeleton className="h-96" />
            )}
          </div>
          <div className="lg:col-span-1">
            {isConnected ? (
              <DatabaseStream />
            ) : (
              <Skeleton className="h-96" />
            )}
          </div>
        </div>
      </main>

      {/* Floating LIVE badge */}
      {isConnected && <LiveBadge />}
    </div>
  );
}
