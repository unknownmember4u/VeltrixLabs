#!/usr/bin/env python3
"""
Zen-O Continuous Sensor Simulator v2.1
=======================================
Slowed-down simulation with functional anomaly injection.
ARM-08 starts with persistent fault. AI diagnosis resolves it properly.
Re-injection happens on much longer cooldown.
"""

import subprocess
import time
import math
import sys
import os
import random

# ─── CONFIG ──────

SPACETIME_CLI = os.path.expanduser("~/.local/bin/spacetime")
MODULE_NAME   = "zen-o-authoritative"
HOST          = "local"

# Simulation parameters — SLOWED DOWN
UPDATE_INTERVAL = 5        # seconds between sensor updates (was 2)
ENERGY_LOG_EVERY = 6       # log energy every N ticks
NUM_ROBOTS = 8
SHIFTS = ["morning", "afternoon", "night"]

# Anomaly timing — MUCH SLOWER
BACKGROUND_ANOMALY_EVERY = 30   # ticks between random anomalies (~2.5 min)
ARM8_REINJECT_COOLDOWN   = 60   # ticks before ARM-08 re-faults after AI fix (~5 min)
AUTO_RESOLVE_TICKS       = 20   # ticks before non-ARM-08 faults auto-resolve (~1.5 min)

# ─── ROBOT STATE ──────────────────────────────────

class RobotState:
    def __init__(self, robot_id):
        self.id = robot_id
        self.zone = "Zone-A" if robot_id <= 4 else "Zone-B"
        self.name = f"ARM-{robot_id:02d}"
        
        # Healthy Baseline
        self.base_temp = 65.0 + (robot_id * 0.5)
        self.base_vib  = 0.35 + (robot_id * 0.02)
        self.base_energy = 8.0 + (robot_id * 0.1)
        
        # Current values
        self.temp = self.base_temp
        self.vibration = self.base_vib
        self.energy_kw = self.base_energy
        self.is_fault = False
        self.current_anomaly = None
        self.fault_ticks = 0
        self.resolved_at_tick = 0  # track when ARM-08 was last resolved
        
        # ARM-08 persistent fault at startup
        if self.id == 8:
            self.is_fault = True
            self.current_anomaly = "vibration_fault"

    def update_physics(self, tick):
        """Gentle physics — values change slowly."""
        if self.is_fault:
            self.fault_ticks += 1
            
            if self.current_anomaly == "overheating":
                self.temp = 92.0 + math.sin(tick * 0.3) * 1.5
                self.vibration = 0.45 + math.cos(tick * 0.2) * 0.02
                self.energy_kw = self.base_energy + 2.0
            elif self.current_anomaly == "vibration_fault":
                self.temp = 75.0 + math.sin(tick * 0.2) * 1.0
                self.vibration = 0.92 + math.sin(tick * 0.3) * 0.02
                self.energy_kw = self.base_energy + 1.0
            elif self.current_anomaly == "bearing_wear":
                self.temp = 82.0 + math.sin(tick * 0.15) * 0.8
                self.vibration = 0.88 + math.cos(tick * 0.2) * 0.01
                self.energy_kw = self.base_energy + 1.5
            elif self.current_anomaly == "motor_fault":
                self.temp = 90.0 + math.sin(tick * 0.2) * 1.5
                self.vibration = 0.82 + math.cos(tick * 0.15) * 0.01
                self.energy_kw = 15.5 + math.sin(tick * 0.3) * 0.3
            else:
                self.temp = 88.0 + math.sin(tick * 0.2) * 1.5
                self.vibration = 0.90 + math.sin(tick * 0.25) * 0.02
                self.energy_kw = 13.0
        else:
            # Gentle baseline oscillation — very slow changes
            self.temp = self.base_temp + math.sin(tick * 0.1 + self.id) * 1.5
            self.vibration = self.base_vib + math.cos(tick * 0.15 + self.id) * 0.03
            self.energy_kw = self.base_energy + math.sin(tick * 0.08 + self.id) * 0.2

    def trigger_anomaly(self, anomaly_type="vibration_fault"):
        self.is_fault = True
        self.current_anomaly = anomaly_type
        self.fault_ticks = 0

    def resolve_anomaly(self, tick=0):
        self.is_fault = False
        self.current_anomaly = None
        self.fault_ticks = 0
        self.resolved_at_tick = tick


# ─── SPACETIMEDB CALLER ─────────────────────────────

def call_reducer(reducer_name, args_list):
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

def sync_cloud_state(robots, tick):
    """Sync dashboard actions (inject/resolve) back to local robot state."""
    
    injections = {}
    try:
        res_audit = subprocess.run(
            [SPACETIME_CLI, "sql", MODULE_NAME, 
             "SELECT robot_id, payload, event_type FROM audit_log", 
             "--server", HOST],
            capture_output=True, text=True, timeout=5
        )
        if res_audit.returncode == 0:
            for line in res_audit.stdout.splitlines():
                if "ANOMALY_INJECTED" in line:
                    parts = [p.strip().strip('"') for p in line.split("|")]
                    if len(parts) >= 4:
                        try:
                            r_id = int(parts[2])
                            payload = parts[3]
                            injections[r_id] = payload
                        except ValueError:
                            pass
    except Exception:
        pass

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
                                    print(f"  ⚡ {robot.name} — Synced: fault '{atype}' from dashboard")
                                elif db_status == "active" and robot.is_fault:
                                    robot.resolve_anomaly(tick)
                                    print(f"  ✨ {robot.name} — Synced: AI Resolution from dashboard (healthy baseline restored)")
                        except ValueError:
                            pass
    except Exception:
        pass


# ─── MAIN LOOP ─────────────────────────────────────────────────────────

def main():
    print("═══════════════════════════════════════════════════════")
    print("  ZEN-O FACTORY SIMULATOR v2.1 (Slow Mode)")
    print("  Continuously pushing sensor data to SpacetimeDB")
    print(f"  Module: {MODULE_NAME} → {HOST}")
    print(f"  Interval: {UPDATE_INTERVAL}s | Robots: {NUM_ROBOTS}")
    print(f"  ARM-08: Persistent fault (AI diagnosis resolves)")
    print(f"  Background anomaly every ~{BACKGROUND_ANOMALY_EVERY * UPDATE_INTERVAL}s")
    print(f"  ARM-08 re-inject cooldown: ~{ARM8_REINJECT_COOLDOWN * UPDATE_INTERVAL}s")
    print("═══════════════════════════════════════════════════════\n")

    # Check SpacetimeDB
    print("Testing connection...")
    if not call_reducer("simulate_sensor_drift", []):
        print("✗ Cannot reach SpacetimeDB. Is it running?")
        sys.exit(1)
    print("✓ SpacetimeDB connected.\n")

    robots = [RobotState(i) for i in range(1, NUM_ROBOTS + 1)]
    tick = 0
    current_shift_idx = 0
    updates_sent = 0

    # Inject ARM-08 fault at startup
    call_reducer("inject_anomaly", [8, "vibration_fault"])
    print("  🔴 ARM-08 — PERSISTENT FAULT INJECTED (vibration_fault)\n")

    try:
        while True:
            tick += 1
            current_shift = SHIFTS[current_shift_idx % len(SHIFTS)]

            # Rotate shift every 120 ticks (~10 minutes)
            if tick % 120 == 0:
                current_shift_idx += 1
                print(f"\n🔄 Shift change → {SHIFTS[current_shift_idx % len(SHIFTS)]}")

            print(f"\n── Tick {tick} ({current_shift}) {'─' * 40}")

            # Sync dashboard actions
            sync_cloud_state(robots, tick)
            
            # ARM-08 re-injection with LONG cooldown
            arm8 = robots[7]
            if not arm8.is_fault:
                ticks_since_resolve = tick - arm8.resolved_at_tick
                if ticks_since_resolve >= ARM8_REINJECT_COOLDOWN:
                    arm8.trigger_anomaly("vibration_fault")
                    call_reducer("inject_anomaly", [8, "vibration_fault"])
                    print(f"  🔴 ARM-08 — Re-injected after {ticks_since_resolve * UPDATE_INTERVAL}s cooldown")

            for robot in robots:
                robot.update_physics(tick)

                # Push sensor update
                call_reducer("update_robot_sensor", [
                    robot.id,
                    round(robot.temp, 2),
                    round(robot.vibration, 4),
                    round(robot.energy_kw, 2),
                ])
                updates_sent += 1

                # Auto-resolve non-ARM-08 faults after cooldown
                if robot.is_fault and robot.id != 8 and robot.fault_ticks >= AUTO_RESOLVE_TICKS:
                    print(f"  🕚 {robot.name} — Auto-resolving after {robot.fault_ticks * UPDATE_INTERVAL}s")
                    call_reducer("resolve_anomaly", [robot.id, "Auto-recovered via timer", "system_timer"])
                    robot.resolve_anomaly(tick)

                # Status line
                status = f"🔴{robot.current_anomaly[:8] if robot.current_anomaly else 'fault'}" if robot.is_fault else "🟢ok"
                print(f"  {robot.name} | {status:14s} | T={robot.temp:5.1f}°C | V={robot.vibration:.3f} | E={robot.energy_kw:5.2f}kW")

                # Energy logging
                if tick % ENERGY_LOG_EVERY == 0:
                    call_reducer("log_energy", [
                        robot.id,
                        round(robot.energy_kw, 2),
                        current_shift,
                    ])

            # Slow material consumption  
            if tick % 40 == 0:
                mat_id = (tick // 40) % 4 + 1
                mat_names = {1: "Steel", 2: "Aluminum", 3: "Copper", 4: "Rubber"}
                call_reducer("consume_material", [mat_id, 3.0])
                print(f"  📦 Consumed 3% of {mat_names[mat_id]}")

            faults = sum(1 for r in robots if r.is_fault)

            # Background anomaly — MUCH less frequent
            if tick % BACKGROUND_ANOMALY_EVERY == 0 and faults <= 1:
                eligible = [r for r in robots if not r.is_fault and r.id != 8]
                if eligible:
                    arm = random.choice(eligible)
                    atype = random.choice(["vibration_fault", "overheating", "bearing_wear", "motor_fault"])
                    arm.trigger_anomaly(atype)
                    call_reducer("inject_anomaly", [arm.id, atype])
                    print(f"\n  🎲 BACKGROUND FAULT on {arm.name} ({atype})")

            print(f"\n  📊 Updates: {updates_sent} | Faults: {faults} | Next anomaly in ~{(BACKGROUND_ANOMALY_EVERY - (tick % BACKGROUND_ANOMALY_EVERY)) * UPDATE_INTERVAL}s")

            time.sleep(UPDATE_INTERVAL)

    except KeyboardInterrupt:
        print(f"\n\n════════════════════════════════════════")
        print(f"  Stopped after {tick} ticks ({tick * UPDATE_INTERVAL}s)")
        print(f"  Total updates: {updates_sent}")
        print(f"════════════════════════════════════════")
        sys.exit(0)


if __name__ == "__main__":
    main()
