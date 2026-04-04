// components/DatabaseStream.js — Continuous SpacetimeDB event logger
"use client";

import { useSpacetimeStream } from "../lib/spacetime";

export default function DatabaseStream() {
  const stream = useSpacetimeStream();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 h-full flex flex-col shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2 flex items-center justify-between">
        Live Database Stream
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
      </h3>
      <div className="flex-1 bg-slate-900 rounded-lg p-3 overflow-y-auto max-h-[300px] font-mono text-[10px] space-y-1 scrollbar-thin border border-slate-800 shadow-inner">
        {stream.length === 0 ? (
          <p className="text-gray-600">Waiting for SpacetimeDB events...</p>
        ) : (
          stream.map((log) => (
            <div key={log.id} className="text-green-400 flex gap-2">
              <span className="text-slate-500 shrink-0">
                [{new Date(log.ts).toLocaleTimeString("en-US", { hour12: false })}]
              </span>
              <span className={log.msg.includes("Inserted") ? "text-blue-300" : log.msg.includes("Updated record") ? "text-slate-400" : "text-green-400"}>
                {log.msg}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
