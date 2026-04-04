"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DbConnection, SubscriptionBuilder } from "./module_bindings";

const SPACETIMEDB_URI = "ws://localhost:3000";
const MODULE_NAME = "stellar-state-k7z98";

let conn = null;
const store = {
  connectionStatus: "connecting",
  latencyMs: 0,
  _listeners: new Set(),
  _notifyTimer: null,
  notify() {
    // Debounce: coalesce rapid updates (e.g. 8 robots updated in one tick)
    if (this._notifyTimer) return;
    this._notifyTimer = setTimeout(() => {
      this._notifyTimer = null;
      this._listeners.forEach((fn) => fn());
    }, 50);
  },
  notifyImmediate() {
    this._listeners.forEach((fn) => fn());
  },
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
};

export const dbStream = [];
function pushLog(msg) {
  dbStream.unshift({ id: Math.random().toString(), ts: Date.now(), msg });
  if (dbStream.length > 50) dbStream.pop();
}

function initSpacetimeDB() {
  if (conn) return;
  console.log("Connecting to SpacetimeDB...", SPACETIMEDB_URI, MODULE_NAME);

  conn = DbConnection.builder()
    .withUri(SPACETIMEDB_URI)
    .withDatabaseName(MODULE_NAME)
    .onConnect((connection, identity, token) => {
      console.log("Connected to SpacetimeDB!", identity.toHexString());
      store.connectionStatus = "connected";
      store.notifyImmediate();

      // ─── REGISTER TABLE-LEVEL CHANGE CALLBACKS ───────────────────
      // These fire on EVERY row insert/update/delete, making the
      // dashboard truly live without needing a page refresh.
      const tables = [
        "robot",
        "material",
        "audit_log",
        "purchase_order",
        "simulation",
        "energy_log",
      ];

      for (const tableName of tables) {
        const table = connection.db[tableName];
        if (!table) {
          console.warn(`Table "${tableName}" not found on connection.db`);
          continue;
        }
        if (table.onInsert) {
          table.onInsert((ctx, row) => { 
            store.notify(); 
            pushLog(`[${tableName.toUpperCase()}] Inserted new record via ${ctx?.sender || 'backend'}`);
          });
        }
        if (table.onUpdate) {
          table.onUpdate((ctx, oldRow, newRow) => { 
            store.notify(); 
            // Optional: don't clog up screen with hundreds of sensor temp updates unless it's a big event, 
            // but user asked for "continuous logs", so we will log it.
            pushLog(`[${tableName.toUpperCase()}] Updated record`);
          });
        }
        if (table.onDelete) {
          table.onDelete(() => { store.notify(); pushLog(`[${tableName.toUpperCase()}] Deleted record`); });
        }
      }
      console.log("✓ Registered live update callbacks on", tables.length, "tables");

      // ─── SUBSCRIBE TO TABLES ─────────────────────────────────────
      const builder = connection.subscriptionBuilder();
      builder.onApplied(() => {
        console.log("Subscription applied — initial data loaded");
        store.notifyImmediate();
      });
      builder.subscribe([
        "SELECT * FROM robot",
        "SELECT * FROM material",
        "SELECT * FROM audit_log",
        "SELECT * FROM purchase_order",
        "SELECT * FROM simulation",
        "SELECT * FROM energy_log",
      ]);
    })
    .onConnectError((ctx, error) => {
      console.error("SpacetimeDB connect error", error);
      store.connectionStatus = "error";
      store.notifyImmediate();
    })
    .onDisconnect((ctx, error) => {
      console.log("Disconnected from SpacetimeDB", error);
      store.connectionStatus = "disconnected";
      store.notifyImmediate();
      conn = null;
    })
    .build();
}

function useStoreSelector(selector, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  useEffect(() => {
    initSpacetimeDB();

    // Read current value
    if (conn && conn.db) {
      try {
        setValue(selectorRef.current());
      } catch (e) {}
    }

    const unsub = store.subscribe(() => {
      if (conn && conn.db) {
        try {
          setValue(selectorRef.current());
        } catch (e) {}
      }
    });

    return unsub;
  }, []);

  return value;
}

export function useConnectionStatus() {
  const status = useStoreSelector(() => store.connectionStatus, "connecting");
  const latencyMs = useStoreSelector(() => store.latencyMs, 0);
  return { status, latencyMs };
}

export function useRobots() {
  return useStoreSelector(() => {
    const rows = [...(conn?.db?.robot?.iter() ?? [])];
    // Convert SDK objects to plain objects so they serialize correctly
    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      zone: r.zone,
      status: r.status,
      temperature: Number(r.temperature),
      vibration: Number(r.vibration),
      energyKw: Number(r.energyKw),
      lastUpdated: Number(r.lastUpdated),
    }));
  }, []);
}

export function useAuditLog() {
  return useStoreSelector(() => {
    const logs = [...(conn?.db?.audit_log?.iter() ?? [])];
    return logs
      .map((l) => ({
        id: Number(l.id),
        eventType: l.eventType,
        robotId: Number(l.robotId),
        payload: l.payload,
        hash: l.hash,
        prevHash: l.prevHash,
        operatorId: l.operatorId,
        timestamp: Number(l.timestamp),
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  }, []);
}

export function useMaterials() {
  return useStoreSelector(() => {
    const rows = [...(conn?.db?.material?.iter() ?? [])];
    return rows.map((m) => ({
      id: Number(m.id),
      name: m.name,
      quantityPercent: Number(m.quantityPercent),
      consumptionRatePerHour: Number(m.consumptionRatePerHour),
      lastUpdated: Number(m.lastUpdated),
    }));
  }, []);
}

export function usePurchaseOrders() {
  return useStoreSelector(() => {
    const rows = [...(conn?.db?.purchase_order?.iter() ?? [])];
    return rows.map((po) => ({
      id: Number(po.id),
      materialName: po.materialName,
      quantityKg: Number(po.quantityKg),
      supplierCode: po.supplierCode,
      status: po.status,
      createdAt: Number(po.createdAt),
      hash: po.hash,
    }));
  }, []);
}

export function useSimulations() {
  return useStoreSelector(() => {
    const sims = [...(conn?.db?.simulation?.iter() ?? [])];
    return sims
      .map((s) => ({
        id: Number(s.id),
        parameter: s.parameter,
        deltaPercent: Number(s.deltaPercent),
        projectedOutput: Number(s.projectedOutput),
        riskScore: Number(s.riskScore),
        faultProbability: Number(s.faultProbability),
        ranBy: s.ranBy,
        ranAt: Number(s.ranAt),
      }))
      .sort((a, b) => b.ranAt - a.ranAt)
      .slice(0, 10);
  }, []);
}

export function useEnergyLogs() {
  return useStoreSelector(() => {
    const rows = [...(conn?.db?.energy_log?.iter() ?? [])];
    return rows.map((e) => ({
      id: Number(e.id),
      robotId: Number(e.robotId),
      zone: e.zone,
      consumptionKw: Number(e.consumptionKw),
      shift: e.shift,
      timestamp: Number(e.timestamp),
    }));
  }, []);
}

export function useSpacetimeStream() {
  return useStoreSelector(() => [...dbStream], []);
}

export async function callReducer(name, args) {
  if (!conn) return { ok: false, error: "Not connected to SpacetimeDB" };

  const safeCall = (fn) => {
    try { fn(); } catch (e) {
      console.warn(`[SpacetimeDB] Reducer ${name} call error (suppressed):`, e);
    }
  };

  try {
    switch (name) {
      case "consume_material":
        safeCall(() => conn.reducers.consumeMaterial(
          Number(args.material_id),
          Number(args.amount_percent)
        ));
        break;
      case "inject_anomaly":
        safeCall(() => conn.reducers.injectAnomaly(
          Number(args.robot_id),
          String(args.anomaly_type)
        ));
        break;
      case "emergency_stop":
        safeCall(() => conn.reducers.emergencyStop(
          String(args.zone),
          String(args.reason),
          String(args.operator_id || "operator-1")
        ));
        break;
      case "resolve_anomaly":
        safeCall(() => conn.reducers.resolveAnomaly(
          Number(args.robot_id),
          String(args.action_taken),
          String(args.operator_id || "operator-1")
        ));
        break;
      case "log_energy":
        safeCall(() => conn.reducers.logEnergy(
          Number(args.robot_id),
          Number(args.consumption_kw),
          String(args.shift)
        ));
        break;
      case "run_simulation":
        safeCall(() => conn.reducers.runSimulation(
          String(args.parameter),
          Number(args.delta_percent),
          String(args.operator_id || "flask-sim")
        ));
        break;
      default:
        console.warn(`[SpacetimeDB] Unknown reducer: ${name}`);
    }
    return { ok: true, reducer: name, args };
  } catch (err) {
    console.error("Reducer call failed", name, err);
    return { ok: false, error: err.toString() };
  }
}
