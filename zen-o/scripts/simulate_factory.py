#!/usr/bin/env python3
"""
Zen-O Continuous Sensor Simulator
==================================
Continuously pushes realistic, drifting sensor data into SpacetimeDB
via the CLI, making the dashboard come alive with real-time updates.

Features:
  - 8 robots with different base profiles
  - Realistic random walks for temperature, vibration, energy
  - Periodic anomaly injection (vibration spikes, overheating)
  - Material consumption (triggers autonomous PO generation)
  - Energy logging per shift
  - Automatic fault→recovery cycles

Usage:
  python3 scripts/simulate_factory.py
  (Requires SpacetimeDB running on localhost:3000 with module published)
"""

import subprocess
import time
import math
import sys
import os

# ─── CONFIG ────────────────────────────────────────────────────────────

SPACETIME_CLI = os.path.expanduser("~/.local/bin/spacetime")
MODULE_NAME   = "zen-o-authoritative"
HOST          = "local"

# Simulation parameters
UPDATE_INTERVAL = 2        # seconds between sensor updates
ENERGY_LOG_EVERY = 5       # log energy every N ticks
RECOVERY_TICKS  = 12       # pause simulation for robot during fault

NUM_ROBOTS = 8
SHIFTS = ["morning", "afternoon", "night"]
import requests

# ─── ROBOT STATE ───────────────────────────────────────────────────────

class RobotState:
    def __init__(self, robot_id):
        self.id = robot_id
        self.zone = "Zone-A" if robot_id <= 4 else "Zone-B"
        self.name = f"ARM-{robot_id:02d}"
        
        # Completely Static Healthy Baseline
        self.base_temp = 65.0 + (robot_id * 0.5)
        self.base_vib  = 0.35 + (robot_id * 0.02)
        self.base_energy = 8.0 + (robot_id * 0.1)
        
        # Fault Values
        self.fault_temp = 92.5 + robot_id
        self.fault_vib = 0.91 + (robot_id * 0.01)
        self.fault_energy = 14.5
        
        # Current values
        self.temp = self.base_temp
        self.vibration = self.base_vib
        self.energy_kw = self.base_energy
        self.is_fault = False
        self.current_anomaly = None
        self.fault_ticks = 0
        self.needs_auto_resolve = False

    def update_physics(self, tick):
        """Deterministic physics engine with wider predictable oscillation."""
        if self.is_fault:
            self.fault_ticks += 1
            
            # Lock to specific error states depending on anomaly type
            if self.current_anomaly == "overheating":
                self.temp = 110.0 + math.sin(tick * 1.5) * 2.5
                self.vibration = 0.45 + math.cos(tick) * 0.04
                self.energy_kw = self.base_energy + 2.0
            elif self.current_anomaly == "vibration_fault":
                self.temp = 75.0 + math.sin(tick) * 1.5
                self.vibration = 0.96 + math.sin(tick * 2.0) * 0.03
                self.energy_kw = self.base_energy + 1.0
            elif self.current_anomaly == "bearing_wear":
                self.temp = 85.0 + math.sin(tick * 0.8) * 1.0
                self.vibration = 0.88 + math.cos(tick * 1.2) * 0.02
                self.energy_kw = self.base_energy + 1.5
            elif self.current_anomaly == "motor_fault":
                self.temp = 95.0 + math.sin(tick) * 2.0
                self.vibration = 0.82 + math.cos(tick) * 0.01
                self.energy_kw = 18.5 + math.sin(tick * 2.0) * 0.5
            else:
                # Generic fault
                self.temp = self.fault_temp + math.sin(tick) * 2.0
                self.vibration = self.fault_vib + math.sin(tick * 1.5) * 0.02
                self.energy_kw = self.fault_energy

            # Flag for auto resolution after 30s (approx 15 ticks)
            if self.fault_ticks >= 15:
                self.needs_auto_resolve = True

        else:
            # Locked to active baseline with wider predictable steps
            self.temp = self.base_temp + math.sin(tick * 0.5 + self.id) * 2.5
            self.vibration = self.base_vib + math.cos(tick * 0.8 + self.id) * 0.06
            self.energy_kw = self.base_energy + math.sin(tick * 0.3 + self.id) * 0.4

    def trigger_anomaly(self, anomaly_type="vibration_fault"):
        """Manually push to fault state."""
        self.is_fault = True
        self.current_anomaly = anomaly_type
        self.fault_ticks = 0
        self.needs_auto_resolve = False
        self.update_physics(0)

    def resolve_anomaly(self):
        """Restore healthy baseline."""
        self.is_fault = False
        self.current_anomaly = None
        self.fault_ticks = 0
        self.needs_auto_resolve = False
        self.update_physics(0)


# ─── SPACETIMEDB CALLER ───────────────────────────────────────────────

def call_reducer(reducer_name, args_list):
    """Call a SpacetimeDB reducer via the CLI.
    args_list: list of primitive values to pass as positional arguments.
    """
    cmd = [
        SPACETIME_CLI, "call",
        MODULE_NAME, reducer_name,
    ] + [str(a) for a in args_list] + [
        "--server", HOST,
        "--anonymous",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            stderr = result.stderr.strip()
            if stderr and "Error" in stderr:
                print(f"  ⚠ {reducer_name}: {stderr[:120]}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"  ⚠ {reducer_name} timed out")
        return False
    except FileNotFoundError:
        print(f"  ✗ spacetime CLI not found at {SPACETIME_CLI}")
        sys.exit(1)

def sync_cloud_state(robots):
    """Query the SpacetimeDB and sync manual UI faults/resolutions to local Python mock."""
    
    # 1. Fetch latest anomaly injections to know TYPE
    injections = {}
    try:
        res_audit = subprocess.run([SPACETIME_CLI, "sql", MODULE_NAME, "SELECT robot_id, payload, event_type FROM audit_log", "--server", HOST], capture_output=True, text=True, timeout=5)
        if res_audit.returncode == 0:
            for line in res_audit.stdout.splitlines():
                if "ANOMALY_INJECTED" in line:
                    parts = [p.strip().strip('"') for p in line.split("|")]
                    if len(parts) >= 3:
                        try:
                            # Schema: id | event_type | robot_id | payload
                            r_id = int(parts[2])
                            payload = parts[3]
                            injections[r_id] = payload
                        except ValueError:
                            pass
    except Exception:
        pass

    # 2. Fetch ground truth robot status
    cmd = [SPACETIME_CLI, "sql", MODULE_NAME, "SELECT id, status FROM robot", "--server", HOST]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            for line in res.stdout.splitlines():
                if "|" in line and "status" not in line and "id" not in line:
                    parts = line.split("|")
                    if len(parts) >= 2:
                        try:
                            rid = int(parts[0].strip())
                            db_status = parts[1].strip().strip('"')
                            robot = next((r for r in robots if r.id == rid), None)
                            
                            if robot:
                                if db_status == "fault" and not robot.is_fault:
                                    atype = injections.get(robot.id, "vibration_fault")
                                    robot.trigger_anomaly(atype)
                                    print(f"  ⚡ {robot.name} — OVERRIDE: Injection '{atype}' Synced to DB")
                                elif db_status == "active" and robot.is_fault:
                                    robot.resolve_anomaly()
                                    print(f"  ✨ {robot.name} — OVERRIDE: AI Resolution Synced to DB! Active baseline restored.")
                        except ValueError:
                            pass
    except Exception:
        pass


# ─── MAIN LOOP ─────────────────────────────────────────────────────────

def main():
    print("═══════════════════════════════════════════════════════")
    print("  ZEN-O FACTORY SIMULATOR")
    print("  Continuously pushing sensor data to SpacetimeDB")
    print(f"  Module: {MODULE_NAME} → {HOST}")
    print(f"  Interval: {UPDATE_INTERVAL}s | Robots: {NUM_ROBOTS}")
    print("═══════════════════════════════════════════════════════\n")

    # Check SpacetimeDB is reachable
    print("Testing connection...")
    if not call_reducer("simulate_sensor_drift", []):
        print("✗ Cannot reach SpacetimeDB. Is it running?")
        print(f"  Try: spacetime start --listen-addr 0.0.0.0:3000")
        sys.exit(1)
    print("✓ SpacetimeDB connected.\n")

    robots = [RobotState(i) for i in range(1, NUM_ROBOTS + 1)]
    tick = 0
    current_shift_idx = 0
    anomalies_injected = 0
    updates_sent = 0

    try:
        while True:
            tick += 1
            current_shift = SHIFTS[current_shift_idx % len(SHIFTS)]

            # Rotate shift every 60 ticks (~3 minutes)
            if tick % 60 == 0:
                current_shift_idx += 1
                print(f"\n🔄 Shift change → {SHIFTS[current_shift_idx % len(SHIFTS)]}")

            print(f"\n── Tick {tick} ({current_shift}) {'─' * 40}")

            # Pull external dashboard actions
            sync_cloud_state(robots)

            for robot in robots:
                # Update fixed physics with predictable wobble
                robot.update_physics(tick)

                # Push deterministic sensor update
                call_reducer("update_robot_sensor", [
                    robot.id,
                    round(robot.temp, 2),
                    round(robot.vibration, 4),
                    round(robot.energy_kw, 2),
                ])
                updates_sent += 1

                # Evaluate 30-second Auto Resolution
                if robot.needs_auto_resolve:
                    print(f"  🕚 {robot.name} — 30s fault duration elapsed! Auto-resolving anomaly.")
                    call_reducer("resolve_anomaly", [robot.id, "Auto-recovered via timer", "system_timer"])
                    robot.resolve_anomaly()

                # Status line
                status = f"🔴{robot.current_anomaly[:8]}" if robot.is_fault else "🟢ok"
                print(f"  {robot.name} | {status:8s} | T={robot.temp:5.1f}°C | V={robot.vibration:.3f} | E={robot.energy_kw:5.2f}kW")

                # Energy logging (fixed schedule)
                if tick % ENERGY_LOG_EVERY == 0:
                    call_reducer("log_energy", [
                        robot.id,
                        round(robot.energy_kw, 2),
                        current_shift,
                    ])

            # Material consumption (fixed schedule)
            if tick % 20 == 0:
                mat_id = (tick // 20) % 4 + 1
                amount = 5.0
                mat_names = {1: "Steel", 2: "Aluminum", 3: "Copper", 4: "Rubber"}
                call_reducer("consume_material", [mat_id, amount])
                print(f"  📦 Consumed fixed {amount}% of {mat_names[mat_id]} for baseline demo")

            faults = sum(1 for r in robots if r.is_fault)

            # Random background anomaly occasionally if everything is completely healthy (every ~14s)
            if tick % 7 == 0 and faults == 0:
                import random
                arm = random.choice(robots)
                atype = random.choice(["vibration_fault", "overheating", "bearing_wear", "motor_fault"])
                arm.trigger_anomaly(atype)
                call_reducer("inject_anomaly", [arm.id, atype])
                print(f"\n  🎲 DELIBERATE BACKGROUND FAULT TRIGGERED ON {arm.name} ({atype})")
                faults += 1

            # Status summary
            print(f"\n  📊 Updates: {updates_sent} | Active faults: {faults}")

            time.sleep(UPDATE_INTERVAL)

    except KeyboardInterrupt:
        print(f"\n\n════════════════════════════════════════")
        print(f"  Simulator stopped after {tick} ticks")
        print(f"  Total sensor updates: {updates_sent}")
        print(f"  Anomalies injected:   {anomalies_injected}")
        print(f"════════════════════════════════════════")
        sys.exit(0)


if __name__ == "__main__":
    main()
