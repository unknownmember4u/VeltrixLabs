"use client";

export default function GlobalError({ error, reset }) {
  // Suppress SpacetimeDB SenderErrors from crashing the entire app
  const isSenderError =
    error?.message?.includes("Robot not found") ||
    error?.message?.includes("SenderError") ||
    error?.name === "SenderError";

  if (isSenderError) {
    console.warn("[Zen-O] Suppressed SenderError:", error.message);
    // Auto-reset after suppressing
    if (typeof reset === "function") {
      setTimeout(() => reset(), 100);
    }
    return null;
  }

  return (
    <html>
      <body className="bg-gray-950 text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-mono font-bold text-red-400">Something went wrong</h2>
          <p className="text-sm text-gray-400">{error?.message}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
