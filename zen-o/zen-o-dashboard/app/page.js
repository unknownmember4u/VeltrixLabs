// app/page.js — Zen-O Smart Factory Dashboard main page
"use client";

import dynamic from "next/dynamic";
import { useConnectionStatus, callReducer, useRobots } from "../lib/spacetime";

// Dynamic imports to avoid SSR issues with SpacetimeDB
const RobotGrid = dynamic(() => import("../components/RobotGrid"), { ssr: false });
const AnomalyConsole = dynamic(() => import("../components/AnomalyConsole"), { ssr: false });
const SupplyChain = dynamic(() => import("../components/SupplyChain"), { ssr: false });
const SimulationPanel = dynamic(() => import("../components/SimulationPanel"), { ssr: false });

// ─── SKELETON LOADER ─────────────────────────────────────────────────

function Skeleton({ className = "" }) {
  return <div className={`bg-gray-800 rounded-xl animate-pulse ${className}`} />;
}

// ─── HEADER ──────────────────────────────────────────────────────────

function Header({ status, latencyMs, faultCount }) {
  const isLive = status === "connected";

  const handleEmergencyStop = async () => {
    if (confirm("⚠ Trigger EMERGENCY STOP for all zones?")) {
      await callReducer("emergency_stop", {
        zone: "all",
        reason: "Manual emergency stop",
        operator_id: "operator-1",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        {/* Left — Logo */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-mono font-bold text-white tracking-tight">ZEN-O</h1>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider hidden sm:block">
            Smart Factory Orchestrator
          </span>
        </div>

        {/* Center — Connection Status */}
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            isLive ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <span className={`text-xs font-mono font-semibold ${
            isLive ? "text-green-400" : "text-red-400"
          }`}>
            {isLive ? "LIVE" : status === "connecting" ? "CONNECTING" : "OFFLINE"}
          </span>
        </div>

        {/* Right — Latency + Faults + E-Stop */}
        <div className="flex items-center gap-3">
          {/* Latency */}
          {isLive && (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {latencyMs}ms
            </span>
          )}

          {/* Fault Count */}
          {faultCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-white bg-red-600 px-2 py-1 rounded-full">
              {faultCount} FAULT{faultCount > 1 ? "S" : ""}
            </span>
          )}

          {/* Emergency Stop */}
          <button
            onClick={handleEmergencyStop}
            className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider"
          >
            E-STOP
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── LIVE BADGE ──────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gray-900/90 backdrop-blur border border-gray-700 rounded-full px-3 py-1.5 shadow-lg">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-[10px] font-mono font-bold text-green-400">LIVE</span>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────

export default function Home() {
  const { status, latencyMs } = useConnectionStatus();
  const robots = useRobots();
  const isConnected = status === "connected";
  const faultCount = robots.filter((r) => r.status === "fault").length;

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Header status={status} latencyMs={latencyMs} faultCount={faultCount} />

      <main className="p-4 space-y-4 max-w-[1600px] mx-auto">
        {/* Row 1 — Robot Fleet */}
        {isConnected ? (
          <RobotGrid />
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          </div>
        )}

        {/* Row 2 — Console / Supply / Simulation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {isConnected ? (
            <>
              <AnomalyConsole />
              <SupplyChain />
              <SimulationPanel />
            </>
          ) : (
            <>
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
              <Skeleton className="h-96" />
            </>
          )}
        </div>
      </main>

      {/* Floating LIVE badge */}
      {isConnected && <LiveBadge />}
    </div>
  );
}
