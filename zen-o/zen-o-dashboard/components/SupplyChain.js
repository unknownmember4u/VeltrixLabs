// components/SupplyChain.js — Material inventory with client-side depletion simulation
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMaterials, usePurchaseOrders } from "../lib/spacetime";
import { AlertTriangle, ShoppingBag, Play, Pause, RotateCcw, Bell, Truck, Hash, Package, TrendingDown } from "lucide-react";

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

function computeHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0").slice(0, 16);
}

// ─── DEFAULT MATERIALS (client-side starting point) ───────────────────

const DEFAULT_MATERIALS = [
  { id: 1, name: "Steel", level: 100.0 },
  { id: 2, name: "Aluminum", level: 100.0 },
  { id: 3, name: "Copper", level: 100.0 },
  { id: 4, name: "Rubber", level: 100.0 },
];

// ─── MATERIAL CARD ────────────────────────────────────────────────────

function MaterialCard({ material, isTarget }) {
  const pct = material.level;
  const barColor = pct < 10 ? "bg-red-500" : pct <= 20 ? "bg-amber-500" : pct <= 40 ? "bg-yellow-400" : "bg-green-500";
  const textColor = pct < 10 ? "text-red-600" : pct <= 20 ? "text-amber-600" : pct <= 40 ? "text-yellow-600" : "text-green-600";
  const borderColor = isTarget
    ? (pct < 10 ? "border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : pct <= 20 ? "border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "border-blue-400")
    : "border-gray-200";

  return (
    <div className={`bg-white rounded-xl border-2 p-4 shadow-sm transition-all duration-500 ${borderColor}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-700 font-bold truncate flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          {material.name}
        </p>
        {isTarget && (
          <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold animate-pulse">
            DEPLETING
          </span>
        )}
      </div>
      <p className={`text-3xl font-mono font-bold mb-2 ${textColor}`}>
        {pct.toFixed(1)}%
      </p>

      {/* Progress bar with threshold markers */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3 shadow-inner relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
        <div className="absolute top-0 left-[20%] w-px h-full bg-amber-500/50" title="20% threshold" />
        <div className="absolute top-0 left-[10%] w-px h-full bg-red-500/50" title="10% threshold" />
      </div>

      {/* Notifications */}
      {pct < 10 && (
        <div className="flex items-center justify-center gap-1.5 mb-2 bg-red-50 text-red-700 border border-red-200 rounded-lg py-1.5 px-2 animate-pulse">
          <Truck className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold tracking-wider">SUPPLIER CALLED — AUTO-ORDERING</span>
        </div>
      )}
      {pct >= 10 && pct < 20 && (
        <div className="flex items-center justify-center gap-1.5 mb-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg py-1.5 px-2">
          <Bell className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold tracking-wider">LOW STOCK WARNING</span>
        </div>
      )}

      {/* Hash chain if ordered */}
      {pct < 10 && (
        <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
          <div className="flex items-center gap-1 mb-0.5">
            <Hash className="w-3 h-3 text-gray-400" />
            <span className="text-[8px] text-gray-500 uppercase font-bold">Order Hash Chain</span>
          </div>
          <p className="text-[9px] font-mono text-gray-600 break-all">
            {computeHash(`AUTO_PO_${material.name}_${pct.toFixed(1)}_${material.id}`)}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATION LOG ─────────────────────────────────────────────────

function NotificationLog({ notifications }) {
  if (notifications.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" /> Supply Chain Notifications
      </h4>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
        {notifications.map((n, idx) => (
          <div key={idx} className={`rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] border ${
            n.type === "critical" ? "bg-red-50 border-red-200 text-red-700" :
            n.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-700" :
            "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            {n.type === "critical" ? <Truck className="w-3.5 h-3.5 flex-shrink-0" /> :
             n.type === "warning" ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> :
             <Bell className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="font-medium flex-1">{n.message}</span>
            <span className="text-[9px] font-mono text-gray-400 flex-shrink-0">{n.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────

export default function SupplyChain() {
  // SpacetimeDB data (for purchase orders display only)
  const dbMaterials = useMaterials();
  const purchaseOrders = usePurchaseOrders();

  // Client-side simulation state (independent of SpacetimeDB)
  const [simMaterials, setSimMaterials] = useState(DEFAULT_MATERIALS.map(m => ({ ...m })));
  const [simulating, setSimulating] = useState(false);
  const [targetMaterial, setTargetMaterial] = useState(2); // Aluminum
  const [depleteRate, setDepleteRate] = useState(3.0);
  const [notifications, setNotifications] = useState([]);
  const notified20Ref = useRef({});
  const notified10Ref = useRef({});
  const [localOrders, setLocalOrders] = useState([]);
  const intervalRef = useRef(null);

  const addNotification = useCallback((type, message) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setNotifications(prev => [{ type, message, time }, ...prev].slice(0, 30));
  }, []);

  // Reset all to 100%
  const handleReset = () => {
    setSimulating(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSimMaterials(DEFAULT_MATERIALS.map(m => ({ ...m })));
    setNotifications([]);
    setLocalOrders([]);
    notified20Ref.current = {};
    notified10Ref.current = {};
  };

  // Start simulation
  const handleStartSim = () => {
    // Reset first
    setSimMaterials(DEFAULT_MATERIALS.map(m => ({ ...m })));
    setNotifications([]);
    setLocalOrders([]);
    notified20Ref.current = {};
    notified10Ref.current = {};
    addNotification("info", `Simulation started — depleting ${DEFAULT_MATERIALS.find(m => m.id === targetMaterial)?.name} at ${depleteRate}%/tick`);
    setSimulating(true);
  };

  const handleStopSim = () => {
    setSimulating(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    addNotification("info", "Simulation paused");
  };

  // Simulation tick loop
  useEffect(() => {
    if (!simulating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSimMaterials(prev => {
        const next = prev.map(m => {
          if (m.id === targetMaterial) {
            const newLevel = Math.max(0, m.level - depleteRate);
            
            // Check thresholds
            if (newLevel < 20 && !notified20Ref.current[m.id]) {
              notified20Ref.current[m.id] = true;
              setTimeout(() => addNotification("warning", `⚠ ${m.name} dropped below 20% (${newLevel.toFixed(1)}%) — LOW STOCK WARNING`), 0);
            }
            if (newLevel < 10 && !notified10Ref.current[m.id]) {
              notified10Ref.current[m.id] = true;
              const hash = computeHash(`AUTO_PO_${m.name}_${newLevel.toFixed(1)}_${Date.now()}`);
              setTimeout(() => {
                addNotification("critical", `🚨 ${m.name} below 10% (${newLevel.toFixed(1)}%) — AUTO-ORDERED from supplier. Hash: ${hash}`);
                setLocalOrders(o => [{
                  id: Date.now(),
                  materialName: m.name,
                  quantityKg: m.id === 1 ? 2400 : m.id === 2 ? 1800 : m.id === 3 ? 600 : 400,
                  supplierCode: `SUP-00${m.id}`,
                  status: "PENDING",
                  createdAt: Date.now(),
                  hash,
                }, ...o]);
              }, 0);
            }

            return { ...m, level: newLevel };
          }
          return m;
        });
        return next;
      });
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simulating, targetMaterial, depleteRate, addNotification]);

  const materialNames = { 1: "Steel", 2: "Aluminum", 3: "Copper", 4: "Rubber" };

  // Merge local simulation orders with SpacetimeDB purchase orders
  const allOrders = [...localOrders, ...purchaseOrders];

  return (
    <div className="space-y-4">
      {/* Header + Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Supply Chain Simulation
          </h3>
          <div className="flex items-center gap-2">
            {simulating && (
              <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg font-mono font-bold animate-pulse flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> DEPLETING {materialNames[targetMaterial]}
              </span>
            )}
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            {/* Target Material */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">Target Material</label>
              <select
                value={targetMaterial}
                onChange={(e) => setTargetMaterial(Number(e.target.value))}
                disabled={simulating}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500 shadow-inner disabled:opacity-50"
              >
                <option value={1}>Steel</option>
                <option value={2}>Aluminum</option>
                <option value={3}>Copper</option>
                <option value={4}>Rubber</option>
              </select>
            </div>

            {/* Depletion Rate */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1.5">
                Depletion Rate: <span className="text-blue-600">{depleteRate.toFixed(1)}%</span>/tick
              </label>
              <input
                type="range" min={1} max={10} step={0.5}
                value={depleteRate}
                onChange={(e) => setDepleteRate(parseFloat(e.target.value))}
                disabled={simulating}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              {!simulating ? (
                <button
                  onClick={handleStartSim}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Start Simulation
                </button>
              ) : (
                <button
                  onClick={handleStopSim}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-lg transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset (100%)
              </button>
            </div>
          </div>

          {/* Threshold indicators */}
          <div className="flex items-center gap-6 text-[9px] text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> &gt;40% Normal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> 20-40% Moderate</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> &lt;20% Low Stock Alert</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt;10% Auto-Order Triggered</span>
          </div>
        </div>

        {/* Material Cards — using client-side simulated levels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {simMaterials.map((m) => (
            <MaterialCard key={m.id} material={m} isTarget={m.id === targetMaterial && simulating} />
          ))}
        </div>
      </div>

      {/* Notifications */}
      <NotificationLog notifications={notifications} />

      {/* Purchase Orders — merged local + SpacetimeDB */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> Auto-Generated Purchase Orders (Hash-Chained)
        </p>

        {allOrders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-center">
            <p className="text-xs text-gray-500 font-medium">
              No orders generated yet. Run simulation until material drops below 10%.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1">
            {allOrders.map((po, idx) => (
              <div key={po.id || idx} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 flex items-center gap-3">
                <span className="text-xs text-gray-900 font-mono font-bold flex-shrink-0">{po.materialName}</span>
                <span className="text-[10px] text-gray-600 font-mono">{Number(po.quantityKg).toFixed(0)} kg</span>
                <StatusBadge status={po.status} />
                <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                  <Hash className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-[8px] font-mono text-gray-500 truncate max-w-[100px]">{po.hash || "—"}</span>
                </div>
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
