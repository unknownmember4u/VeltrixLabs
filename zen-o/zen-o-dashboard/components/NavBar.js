// components/NavBar.js — Shared navigation bar across all pages
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConnectionStatus, useRobots } from "../lib/spacetime";
import { LayoutDashboard, BatteryMedium, FlaskConical, Truck, Eye } from "lucide-react";

const NAV_LINKS = [
  { href: "/",           label: "Dashboard", icon: LayoutDashboard },
  { href: "/energy",     label: "Energy", icon: BatteryMedium },
  { href: "/simulation", label: "Simulation Lab", icon: FlaskConical },
  { href: "/supply",     label: "Supply Chain", icon: Truck },
  { href: "/vision",     label: "Vision Monitoring", icon: Eye },
];

export default function NavBar() {
  const pathname = usePathname();
  const { status, latencyMs } = useConnectionStatus();
  const robots = useRobots();

  const activeCount = robots.filter((r) => r.status === "active").length;
  const faultCount  = robots.filter((r) => r.status === "fault").length;
  const isLive = status === "connected";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">

        {/* Left — Logo + links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono font-bold text-gray-900 tracking-tight">ZEN-O</span>
            <span className="hidden sm:block text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
              Smart Factory
            </span>
          </div>

          <div className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-transparent hover:border-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
            <span className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              {activeCount} active
            </span>
          )}

          {/* Fault badge */}
          {faultCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full shadow-sm animate-pulse">
              {faultCount} FAULT{faultCount > 1 ? "S" : ""}
            </span>
          )}

          {/* Latency */}
          {isLive && (
            <span className="text-[10px] font-mono text-gray-500 font-medium bg-gray-50 border border-gray-200 px-2 py-1 rounded shadow-sm">
              {latencyMs}ms
            </span>
          )}

          {/* Connection dot */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full shadow-sm">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`} />
            <span className={`text-[10px] font-mono font-bold tracking-wider ${isLive ? "text-green-600" : "text-red-600"}`}>
              {isLive ? "LIVE SYNC" : status === "connecting" ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
