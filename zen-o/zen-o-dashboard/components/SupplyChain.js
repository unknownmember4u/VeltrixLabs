// components/SupplyChain.js — Material inventory + auto-generated purchase orders
"use client";

import { useMaterials, usePurchaseOrders, callReducer } from "../lib/spacetime";

// ─── HELPERS ──────────────────────────────────────────────────────────

function formatDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const color = status === "FULFILLED"
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${color}`}>
      {status}
    </span>
  );
}

// ─── MATERIAL CARD ────────────────────────────────────────────────────

function MaterialCard({ material }) {
  const pct = Number(material.quantityPercent);
  const barColor = pct < 10 ? "bg-red-500" : pct <= 25 ? "bg-amber-500" : "bg-green-500";
  const textColor = pct < 10 ? "text-red-400" : pct <= 25 ? "text-amber-400" : "text-green-400";

  const handleConsume = async () => {
    await callReducer("consume_material", {
      material_id: material.id,
      amount_percent: 5.0,
    });
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-700 p-4">
      <p className="text-xs text-gray-400 mb-1">{material.name}</p>
      <p className={`text-2xl font-mono font-bold mb-2 ${textColor}`}>
        {isNaN(pct) ? "—" : pct.toFixed(0)}%
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {/* Low stock warning */}
      {pct < 10 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-red-400 text-xs">⚠</span>
          <span className="text-[10px] text-red-400 font-semibold">LOW STOCK</span>
        </div>
      )}

      <button
        onClick={handleConsume}
        className="w-full py-1.5 rounded-lg text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        Consume 5%
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function SupplyChain() {
  const materials = useMaterials();
  const purchaseOrders = usePurchaseOrders();

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Supply Chain
      </h3>

      {/* Material Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {materials.map((m) => (
          <MaterialCard key={m.id} material={m} />
        ))}
      </div>

      {/* Purchase Orders */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">
          Auto-Generated Purchase Orders
        </p>

        {purchaseOrders.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">
              No orders generated yet. Consume materials to trigger.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="bg-gray-900 rounded-lg px-3 py-2 flex items-center gap-3">
                <span className="text-xs text-white font-mono flex-shrink-0">{po.materialName}</span>
                <span className="text-[10px] text-gray-400 font-mono">{Number(po.quantityKg).toFixed(1)} kg</span>
                <StatusBadge status={po.status} />
                <span className="text-[10px] text-gray-500 font-mono ml-auto">{formatDateTime(Number(po.createdAt))}</span>
                <span className="text-[9px] text-gray-600 font-mono">{po.supplierCode}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
