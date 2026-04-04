// components/NavBar.js — Shared navigation bar across all pages
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConnectionStatus, useRobots } from "../lib/spacetime";

const NAV_LINKS = [
  { href: "/",           label: "Dashboard" },
  { href: "/energy",     label: "Energy" },
  { href: "/simulation", label: "Simulation Lab" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { status, latencyMs } = useConnectionStatus();
  const robots = useRobots();

  const activeCount = robots.filter((r) => r.status === "active").length;
  const faultCount  = robots.filter((r) => r.status === "fault").length;
  const isLive = status === "connected";

  return (
    <nav className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">

        {/* Left — Logo + links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-bold text-white tracking-tight">ZEN-O</span>
            <span className="hidden sm:block text-[10px] text-gray-500 uppercase tracking-wider">
              Smart Factory
            </span>
          </div>

          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right — Live stats */}
        <div className="flex items-center gap-3">
          {/* Active robots */}
          {isLive && activeCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {activeCount} active
            </span>
          )}

          {/* Fault badge */}
          {faultCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-white bg-red-600 px-2 py-1 rounded-full animate-pulse">
              {faultCount} FAULT{faultCount > 1 ? "S" : ""}
            </span>
          )}

          {/* Latency */}
          {isLive && (
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {latencyMs}ms
            </span>
          )}

          {/* Connection dot */}
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className={`text-xs font-mono font-semibold ${isLive ? "text-green-400" : "text-red-400"}`}>
              {isLive ? "LIVE" : status === "connecting" ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
