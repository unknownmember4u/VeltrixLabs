"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Suppress SpacetimeDB SenderErrors silently
    const isSenderError =
      error?.message?.includes("Robot not found") ||
      error?.message?.includes("SenderError") ||
      error?.name === "SenderError";

    if (isSenderError) {
      console.warn("[Zen-O] Suppressed SenderError:", error.message);
      // Auto-recover
      reset();
    }
  }, [error, reset]);

  const isSenderError =
    error?.message?.includes("Robot not found") ||
    error?.message?.includes("SenderError") ||
    error?.name === "SenderError";

  if (isSenderError) return null;

  return (
    <div className="bg-gray-50 text-gray-900 flex items-center justify-center min-h-screen">
      <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-xl max-w-md text-center space-y-5">
        <div className="flex justify-center">
          <div className="bg-red-50 p-4 rounded-full">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-xl font-mono font-bold text-gray-900">System Interruption</h2>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">{error?.message || "An unexpected error occurred in the factory orchestrator."}</p>
        <button
          onClick={() => reset()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
        >
          Attempt Service Recovery
        </button>
      </div>
    </div>
  );
}
