// components/SupplyChain.js — Material inventory + auto-generated purchase orders
"use client";

import { useMaterials, usePurchaseOrders, callReducer } from "../lib/spacetime";
import { AlertTriangle, ShoppingBag, ArrowDownToLine } from "lucide-react";

// ─── HELPERS ──────────────────────────────────────────────────────────

function formatDateTime(ts) {
  const ms = ts > 2000000000000 ? ts / 1000 : ts;
  const d = new Date(ms);
  if (isNaN(d)) return "Invalid Date";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const color = status === "FULFILLED"
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium ${color}`}>
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
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs text-gray-500 font-medium mb-1 truncate">{material.name}</p>
      <p className={`text-2xl font-mono font-bold mb-2 ${textColor}`}>
        {isNaN(pct) ? "—" : pct.toFixed(0)}%
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {/* Low stock warning */}
      {pct < 10 && (
        <div className="flex items-center justify-center gap-1.5 mb-2 bg-red-50 text-red-600 border border-red-200 rounded py-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold tracking-wider">LOW STOCK</span>
        </div>
      )}

      <button
        onClick={handleConsume}
        className="w-full py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <ArrowDownToLine className="w-3.5 h-3.5"/> Consume 5%
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function SupplyChain() {
  const materials = useMaterials();
  const purchaseOrders = usePurchaseOrders();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 h-full flex flex-col shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4"/> Supply Chain
      </h3>

      {/* Material Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {materials.map((m) => (
          <MaterialCard key={m.id} material={m} />
        ))}
      </div>

      {/* Purchase Orders */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">
          Auto-Generated Purchase Orders
        </p>

        {purchaseOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-500 font-medium">
              No orders generated yet. Consume materials to trigger.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin pr-1">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-900 font-mono font-medium flex-shrink-0">{po.materialName}</span>
                <span className="text-[10px] text-gray-600 font-mono">{Number(po.quantityKg).toFixed(1)} kg</span>
                <StatusBadge status={po.status} />
                <span className="text-[10px] text-gray-500 font-mono ml-auto">{formatDateTime(Number(po.createdAt))}</span>
                <span className="text-[9px] text-gray-400 font-mono">{po.supplierCode}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
