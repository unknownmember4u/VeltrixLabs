#!/usr/bin/env node
/**
 * Zen-O SpacetimeDB Connection Test
 * Tests: SDK connection, Robot table subscription, inject_anomaly reducer, AuditLog subscription
 */

const TIMEOUT_MS = 10_000;
const WS_URL = "ws://localhost:3000";
const MODULE = "zen_o";

let exitCode = 1;

async function run() {
  console.log("=== ZEN-O SPACETIMEDB CONNECTION TEST ===\n");

  // Step 1: Try to import the SDK
  let DbConnection;
  try {
    const sdk = await import("spacetimedb");
    DbConnection = sdk.DbConnection || sdk.default?.DbConnection;
    if (!DbConnection) {
      // Try alternative import patterns
      const keys = Object.keys(sdk);
      console.log(`  SDK exports: ${keys.join(", ")}`);

      // Check if the SDK's connect method exists
      if (sdk.SpacetimeDBClient) {
        DbConnection = sdk.SpacetimeDBClient;
        console.log("  Found SpacetimeDBClient export");
      } else {
        console.log("  SPACETIMEDB TEST FAILED: SDK imported but DbConnection not found");
        console.log("  Available exports:", keys);
        process.exit(1);
      }
    }
    console.log("  ✓ SpacetimeDB SDK imported successfully");
  } catch (e) {
    console.log(`  SPACETIMEDB TEST FAILED: Cannot import SDK — ${e.message}`);
    console.log("  ACTION: Run 'npm install spacetimedb' in zen-o-dashboard/");
    process.exit(1);
  }

  // Step 2: Try to connect
  let connected = false;
  const timeout = setTimeout(() => {
    if (!connected) {
      console.log("\n  SPACETIMEDB TEST FAILED: Connection timeout (10s)");
      console.log("  ACTION: Ensure SpacetimeDB is running:");
      console.log("    1. Install: curl -sSf https://install.spacetimedb.com | sh");
      console.log("    2. Start:   spacetime start");
      console.log("    3. Publish: spacetime publish --project-path zen-o-module zen_o");
      process.exit(1);
    }
  }, TIMEOUT_MS);

  try {
    console.log(`  Connecting to ${WS_URL} module=${MODULE}...`);

    // Try the builder pattern (v1.0+)
    if (typeof DbConnection.builder === "function") {
      const conn = DbConnection.builder()
        .withUri(WS_URL)
        .withModuleName(MODULE)
        .onConnect((token, identity) => {
          connected = true;
          clearTimeout(timeout);
          console.log("  SpacetimeDB CONNECTED");
          console.log(`  Identity: ${identity?.toHexString?.()?.slice(0, 16) || "unknown"}...`);

          // Subscribe to Robot table
          conn.subscribe(["SELECT * FROM Robot"]);
          console.log("  Subscribed to Robot table");

          // After 5 seconds, call inject_anomaly
          setTimeout(() => {
            console.log("  Calling inject_anomaly(1, 'vibration_fault')...");
            try {
              conn.reducers.inject_anomaly(1, "vibration_fault");
            } catch (e) {
              console.log(`  Reducer call failed: ${e.message}`);
            }
          }, 5000);
        })
        .onError((e) => {
          console.log(`  SPACETIMEDB TEST FAILED: Connection error — ${e}`);
          process.exit(1);
        })
        .build();

      // Listen for Robot inserts
      if (conn.db?.Robot?.onInsert) {
        let firstRobot = true;
        conn.db.Robot.onInsert((row) => {
          if (firstRobot) {
            firstRobot = false;
            console.log(`  Robot table live — received row: ${row.name || row.id}`);
          }
        });
      }

      // Listen for AuditLog inserts
      if (conn.db?.AuditLog?.onInsert) {
        conn.db.AuditLog.onInsert((row) => {
          const hashPreview = (row.hash || "").slice(0, 8);
          console.log(`  AuditLog received — hash: ${hashPreview}`);
          console.log("\n  SPACETIMEDB TEST PASSED");
          exitCode = 0;
          process.exit(0);
        });
      }
    }
    // Try the legacy connect pattern
    else if (typeof DbConnection.connect === "function") {
      DbConnection.connect(WS_URL, MODULE, null, {
        onConnect: () => {
          connected = true;
          clearTimeout(timeout);
          console.log("  SpacetimeDB CONNECTED (legacy API)");
          exitCode = 0;
        },
        onError: (e) => {
          console.log(`  Connection error: ${e}`);
        },
      });
    }
    else {
      console.log("  SPACETIMEDB TEST FAILED: SDK has no connect/builder method");
      console.log("  The 'spacetimedb' npm package may need 'spacetime generate' to create bindings first");
      console.log("  ACTION: Install SpacetimeDB CLI and run:");
      console.log("    spacetime generate --lang typescript --out-dir zen-o-dashboard/src/module_bindings");
      process.exit(1);
    }
  } catch (e) {
    console.log(`  SPACETIMEDB TEST FAILED: ${e.message}`);
    clearTimeout(timeout);
    process.exit(1);
  }
}

run().catch((e) => {
  console.log(`  SPACETIMEDB TEST FAILED: ${e.message}`);
  process.exit(1);
});

// Fallback exit after 15s
setTimeout(() => {
  if (exitCode !== 0) {
    console.log("\n  SPACETIMEDB TEST FAILED: Timed out waiting for data");
  }
  process.exit(exitCode);
}, 15_000);
