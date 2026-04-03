// lib/spacetime.js — SpacetimeDB integration layer for Zen-O Dashboard
// Uses mock data until `spacetime generate` produces real table bindings.
// All hooks follow the same interface so swapping to real SDK is a one-file change.

"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

// ─── CONFIGURATION ────────────────────────────────────────────────────
const SPACETIMEDB_URI = "ws://localhost:3000";
const MODULE_NAME = "stellar-state-k7z98";

// ─── SHA-256 HELPER (matches Rust module: event_type + robot_id + payload + prev_hash) ──
async function computeHash(eventType, robotId, payload, prevHash) {
  const data = `${eventType}${robotId}${payload}${prevHash}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Synchronous hash for initial data (simple deterministic fallback)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0").slice(0, 64).padEnd(64, "0");
}

// ─── REACTIVE STORE ──────────────────────────────────────────────────
// Central mutable store with subscriber notification (like a mini Zustand)

const store = {
  robots: [],
  materials: [],
  auditLog: [],
  purchaseOrders: [],
  simulations: [],
  energyLogs: [],
  connectionStatus: "connecting",
  latencyMs: 0,
  _listeners: new Set(),
  _initialized: false,

  notify() {
    this._listeners.forEach((fn) => fn());
  },

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

// ─── INITIALIZE MOCK DATA ────────────────────────────────────────────

function initMockData() {
  if (store._initialized) return;
  store._initialized = true;

  // 8 Robots (mirrors Rust init)
  store.robots = Array.from({ length: 8 }, (_, i) => {
    const id = i + 1;
    const isFault = id === 3 || id === 7;
    return {
      id,
      name: `ARM-${String(id).padStart(2, "0")}`,
      zone: id <= 4 ? "Zone-A" : "Zone-B",
      status: isFault ? "fault" : id === 5 ? "idle" : "active",
      temperature: isFault ? 88.5 : +(60 + Math.random() * 15).toFixed(1),
      vibration: isFault ? 0.92 : +(0.2 + Math.random() * 0.4).toFixed(2),
      energy_kw: +(6 + Math.random() * 6).toFixed(1),
      last_updated: Date.now(),
    };
  });

  // 4 Materials
  store.materials = [
    { id: 1, name: "Steel", quantity_percent: 72.0, consumption_rate_per_hour: 2.1, last_updated: Date.now() },
    { id: 2, name: "Aluminum", quantity_percent: 45.0, consumption_rate_per_hour: 1.4, last_updated: Date.now() },
    { id: 3, name: "Copper", quantity_percent: 18.0, consumption_rate_per_hour: 0.8, last_updated: Date.now() },
    { id: 4, name: "Rubber", quantity_percent: 8.0, consumption_rate_per_hour: 0.5, last_updated: Date.now() },
  ];

  // Audit log with proper hash chain
  const genesisHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const logEntries = [
    { event_type: "ANOMALY_DETECTED", robot_id: 3, payload: "vibration=0.92,temp=88.5", operator_id: "system", ts: Date.now() - 120000 },
    { event_type: "PO_AUTO_GENERATED", robot_id: 0, payload: "PO generated for Rubber", operator_id: "system", ts: Date.now() - 90000 },
    { event_type: "ENERGY_ALERT", robot_id: 7, payload: "consumption_kw=15.3", operator_id: "system", ts: Date.now() - 60000 },
    { event_type: "ANOMALY_RESOLVED", robot_id: 2, payload: "Bearing replaced per manual section 4.2", operator_id: "operator-1", ts: Date.now() - 30000 },
    { event_type: "EMERGENCY_STOP", robot_id: 0, payload: "Manual emergency stop Zone-A", operator_id: "operator-1", ts: Date.now() - 10000 },
  ];

  let prevHash = genesisHash;
  store.auditLog = logEntries.map((entry, i) => {
    const hash = simpleHash(`${entry.event_type}${entry.robot_id}${entry.payload}${prevHash}`);
    const log = {
      id: i + 1,
      event_type: entry.event_type,
      robot_id: entry.robot_id,
      payload: entry.payload,
      hash,
      prev_hash: prevHash,
      operator_id: entry.operator_id,
      timestamp: entry.ts,
    };
    prevHash = hash;
    return log;
  });

  // Purchase orders
  store.purchaseOrders = [
    { id: 1, material_name: "Rubber", quantity_kg: 2400.0, supplier_code: "SUP-001", status: "PENDING", created_at: Date.now() - 90000, hash: simpleHash("PO-Rubber") },
  ];

  // Simulations
  store.simulations = [
    { id: 1, parameter: "conveyor speed", delta_percent: 15, projected_output: 109.0, risk_score: 6.0, fault_probability: 0.15, ran_by: "operator-1", ran_at: Date.now() - 300000 },
    { id: 2, parameter: "pressure", delta_percent: -20, projected_output: 88.0, risk_score: 8.0, fault_probability: 0.2, ran_by: "operator-1", ran_at: Date.now() - 180000 },
  ];

  // Energy logs
  store.energyLogs = store.robots.map((r, i) => ({
    id: i + 1,
    robot_id: r.id,
    zone: r.zone,
    consumption_kw: r.energy_kw,
    shift: "day",
    timestamp: Date.now(),
  }));
}

// ─── START SIMULATION TIMERS ──────────────────────────────────────────

let _timersStarted = false;

function startTimers() {
  if (_timersStarted) return;
  _timersStarted = true;

  // Connection: connecting → connected after 1.5s
  setTimeout(() => {
    store.connectionStatus = "connected";
    store.latencyMs = 4;
    store.notify();
  }, 1500);

  // Sensor drift every 3s
  setInterval(() => {
    store.robots = store.robots.map((r) => {
      if (r.status === "idle") return { ...r, last_updated: Date.now() };
      return {
        ...r,
        temperature: +Math.min(95, Math.max(55, r.temperature + (Math.random() - 0.5) * 0.6)).toFixed(1),
        vibration: +Math.min(0.99, Math.max(0.1, r.vibration + (Math.random() - 0.5) * 0.03)).toFixed(2),
        energy_kw: +Math.min(15, Math.max(5, r.energy_kw + (Math.random() - 0.5) * 0.3)).toFixed(1),
        last_updated: Date.now(),
      };
    });
    store.notify();
  }, 3000);

  // Latency measurement every 10s
  setInterval(() => {
    if (store.connectionStatus === "connected") {
      store.latencyMs = Math.max(1, Math.floor(3 + Math.random() * 5));
      store.notify();
    }
  }, 10000);
}

// ─── HOOKS ────────────────────────────────────────────────────────────

function useStoreSelector(selector, defaultValue) {
  // IMPORTANT: Always start with defaultValue to prevent SSR/client hydration mismatch.
  // Data is only populated after mount via useEffect.
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    initMockData();
    startTimers();
    // Sync with store after mount
    setValue(selector(store));
    // Subscribe for live updates
    const unsub = store.subscribe(() => {
      setValue(selector(store));
    });
    return unsub;
  }, []);

  return value;
}

/** Connection status + latency */
export function useConnectionStatus() {
  const status = useStoreSelector((s) => s.connectionStatus, "connecting");
  const latencyMs = useStoreSelector((s) => s.latencyMs, 0);
  return { status, latencyMs };
}

/** Subscribe to Robot table */
export function useRobots() {
  return useStoreSelector((s) => s.robots, []);
}

/** Subscribe to AuditLog table (newest first, limit 50) */
export function useAuditLog() {
  return useStoreSelector(
    (s) => [...s.auditLog].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50),
    []
  );
}

/** Subscribe to Material table */
export function useMaterials() {
  return useStoreSelector((s) => s.materials, []);
}

/** Subscribe to PurchaseOrder table */
export function usePurchaseOrders() {
  return useStoreSelector((s) => s.purchaseOrders, []);
}

/** Subscribe to Simulation table (last 5) */
export function useSimulations() {
  return useStoreSelector(
    (s) => [...s.simulations].sort((a, b) => b.ran_at - a.ran_at).slice(0, 5),
    []
  );
}

/** Subscribe to EnergyLog table */
export function useEnergyLogs() {
  return useStoreSelector((s) => s.energyLogs, []);
}

// ─── REDUCER HELPER (with local state side-effects) ──────────────────

/**
 * Call a SpacetimeDB reducer. Simulates side-effects locally for demo.
 * When real SDK is connected, this becomes: connection.reducers[name](...args)
 */
export async function callReducer(name, args) {
  console.log(`[SpacetimeDB] callReducer("${name}",`, args, ")");

  switch (name) {
    case "consume_material": {
      const { material_id, amount_percent } = args;
      store.materials = store.materials.map((m) => {
        if (m.id === material_id) {
          const newPct = Math.max(0, m.quantity_percent - amount_percent);
          return { ...m, quantity_percent: +newPct.toFixed(1), last_updated: Date.now() };
        }
        return m;
      });

      // Auto-generate PO if < 5%
      const consumed = store.materials.find((m) => m.id === material_id);
      if (consumed && consumed.quantity_percent < 5) {
        const prevHash = store.auditLog.length > 0
          ? store.auditLog[store.auditLog.length - 1].hash
          : "0000000000000000000000000000000000000000000000000000000000000000";
        const payload = `PO generated for ${consumed.name}`;
        const hash = simpleHash(`PO_AUTO_GENERATED0${payload}${prevHash}`);

        store.purchaseOrders = [...store.purchaseOrders, {
          id: store.purchaseOrders.length + 1,
          material_name: consumed.name,
          quantity_kg: 2400.0,
          supplier_code: "SUP-001",
          status: "PENDING",
          created_at: Date.now(),
          hash,
        }];

        store.auditLog = [...store.auditLog, {
          id: store.auditLog.length + 1,
          event_type: "PO_AUTO_GENERATED",
          robot_id: 0,
          payload,
          hash,
          prev_hash: prevHash,
          operator_id: "system",
          timestamp: Date.now(),
        }];
      }

      store.notify();
      break;
    }

    case "inject_anomaly": {
      const { robot_id, anomaly_type } = args;
      store.robots = store.robots.map((r) => {
        if (r.id === robot_id) {
          return { ...r, status: "fault", vibration: +(0.85 + Math.random() * 0.1).toFixed(2) };
        }
        return r;
      });

      const prevHash = store.auditLog.length > 0
        ? store.auditLog[store.auditLog.length - 1].hash
        : "0000000000000000000000000000000000000000000000000000000000000000";
      const hash = simpleHash(`ANOMALY_INJECTED${robot_id}${anomaly_type}${prevHash}`);

      store.auditLog = [...store.auditLog, {
        id: store.auditLog.length + 1,
        event_type: "ANOMALY_INJECTED",
        robot_id,
        payload: anomaly_type,
        hash,
        prev_hash: prevHash,
        operator_id: "operator-1",
        timestamp: Date.now(),
      }];

      store.notify();
      break;
    }

    case "emergency_stop": {
      const { zone, reason, operator_id } = args;
      store.robots = store.robots.map((r) => {
        if (zone === "all" || r.zone === zone) {
          return { ...r, status: "idle" };
        }
        return r;
      });

      const prevHash = store.auditLog.length > 0
        ? store.auditLog[store.auditLog.length - 1].hash
        : "0000000000000000000000000000000000000000000000000000000000000000";
      const hash = simpleHash(`EMERGENCY_STOP0${reason}${prevHash}`);

      store.auditLog = [...store.auditLog, {
        id: store.auditLog.length + 1,
        event_type: "EMERGENCY_STOP",
        robot_id: 0,
        payload: reason,
        hash,
        prev_hash: prevHash,
        operator_id: operator_id || "operator-1",
        timestamp: Date.now(),
      }];

      store.notify();
      break;
    }

    case "resolve_anomaly": {
      const { robot_id: rid, action_taken, operator_id: oid } = args;
      store.robots = store.robots.map((r) => {
        if (r.id === rid) {
          return { ...r, status: "active", vibration: +(0.2 + Math.random() * 0.3).toFixed(2) };
        }
        return r;
      });

      const prevHash = store.auditLog.length > 0
        ? store.auditLog[store.auditLog.length - 1].hash
        : "0000000000000000000000000000000000000000000000000000000000000000";
      const hash = simpleHash(`ANOMALY_RESOLVED${rid}${action_taken}${prevHash}`);

      store.auditLog = [...store.auditLog, {
        id: store.auditLog.length + 1,
        event_type: "ANOMALY_RESOLVED",
        robot_id: rid,
        payload: action_taken,
        hash,
        prev_hash: prevHash,
        operator_id: oid || "operator-1",
        timestamp: Date.now(),
      }];

      store.notify();
      break;
    }

    default:
      console.warn(`[SpacetimeDB] Unknown reducer: ${name}`);
  }

  return { ok: true, reducer: name, args };
}
