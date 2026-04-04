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
import random
import math
import sys
import json
import os

# ─── CONFIG ────────────────────────────────────────────────────────────

SPACETIME_CLI = os.path.expanduser("~/.local/bin/spacetime")
MODULE_NAME   = "stellar-state-k7z98"
HOST          = "local"

# Simulation parameters
UPDATE_INTERVAL = 3        # seconds between sensor updates
ANOMALY_CHANCE  = 0.08     # 8% chance per tick per robot
CONSUME_CHANCE  = 0.15     # 15% chance per tick to consume material
ENERGY_LOG_EVERY = 5       # log energy every N ticks
RECOVERY_TICKS  = 8        # auto-recover faults after ~N ticks

NUM_ROBOTS = 8
SHIFTS = ["morning", "afternoon", "night"]

# ─── ROBOT STATE ───────────────────────────────────────────────────────

class RobotState:
    def __init__(self, robot_id):
        self.id = robot_id
        self.zone = "Zone-A" if robot_id <= 4 else "Zone-B"
        self.name = f"ARM-{robot_id:02d}"
        # Base values with some per-robot variance
        self.base_temp = 62.0 + random.uniform(-3, 5) + (robot_id * 0.8)
        self.base_vib  = 0.25 + random.uniform(0, 0.15)
        self.base_energy = 7.5 + random.uniform(-0.5, 1.5)
        # Current values
        self.temp = self.base_temp
        self.vibration = self.base_vib
        self.energy_kw = self.base_energy
        self.is_fault = False
        self.fault_ticks = 0

    def drift(self, tick):
        """Apply realistic random walk + sinusoidal patterns."""
        # Sinusoidal "shift warmup" pattern
        shift_factor = 0.5 * math.sin(tick * 0.03 + self.id * 0.5) + 0.5
        
        # Temperature: random walk with mean reversion
        t_noise = random.gauss(0, 0.8)
        self.temp += t_noise + 0.1 * (self.base_temp + shift_factor * 8 - self.temp)
        self.temp = max(55.0, min(95.0, self.temp))

        # Vibration: random walk
        v_noise = random.gauss(0, 0.015)
        self.vibration += v_noise + 0.05 * (self.base_vib - self.vibration)
        self.vibration = max(0.10, min(0.95, self.vibration))

        # Energy: correlated with temperature
        e_noise = random.gauss(0, 0.15)
        self.energy_kw += e_noise + 0.08 * (self.base_energy + shift_factor * 2 - self.energy_kw)
        self.energy_kw = max(5.0, min(16.0, self.energy_kw))

        # If fault, vibration and temp escalate
        if self.is_fault:
            self.vibration = min(0.95, self.vibration + random.uniform(0.01, 0.03))
            self.temp = min(92.0, self.temp + random.uniform(0.2, 0.8))
            self.energy_kw = min(15.5, self.energy_kw + random.uniform(0, 0.3))
            self.fault_ticks += 1

    def should_auto_recover(self):
        return self.is_fault and self.fault_ticks >= RECOVERY_TICKS

    def trigger_anomaly(self):
        """Spike vibration to trigger fault detection in SpacetimeDB."""
        self.vibration = 0.86 + random.uniform(0, 0.09)
        self.temp += random.uniform(3, 8)
        self.is_fault = True
        self.fault_ticks = 0

    def recover(self):
        """Bring values back toward normal."""
        self.vibration = self.base_vib + random.uniform(-0.05, 0.1)
        self.temp = self.base_temp + random.uniform(-2, 2)
        self.energy_kw = self.base_energy + random.uniform(-0.3, 0.3)
        self.is_fault = False
        self.fault_ticks = 0


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

            for robot in robots:
                # Apply drift
                robot.drift(tick)

                # Random anomaly injection
                if not robot.is_fault and random.random() < ANOMALY_CHANCE:
                    robot.trigger_anomaly()
                    anomaly_types = ["vibration_fault", "overheating", "bearing_wear", "motor_fault"]
                    atype = random.choice(anomaly_types)
                    call_reducer("inject_anomaly", [robot.id, atype])
                    anomalies_injected += 1
                    print(f"  🔴 {robot.name} — ANOMALY INJECTED ({atype})")

                # Auto-recovery
                if robot.should_auto_recover():
                    robot.recover()
                    call_reducer("resolve_anomaly", [
                        robot.id,
                        "Auto-recovery: sensors returned to normal range",
                        "auto-sim"
                    ])
                    print(f"  🟢 {robot.name} — AUTO-RECOVERED")

                # Push sensor update
                call_reducer("update_robot_sensor", [
                    robot.id,
                    round(robot.temp, 2),
                    round(robot.vibration, 4),
                    round(robot.energy_kw, 2),
                ])
                updates_sent += 1

                # Status line
                status = "🔴FAULT" if robot.is_fault else "🟢ok"
                print(f"  {robot.name} | {status:8s} | T={robot.temp:5.1f}°C | V={robot.vibration:.3f} | E={robot.energy_kw:5.2f}kW")

                # Energy logging
                if tick % ENERGY_LOG_EVERY == 0:
                    call_reducer("log_energy", [
                        robot.id,
                        round(robot.energy_kw, 2),
                        current_shift,
                    ])

            # Material consumption
            if random.random() < CONSUME_CHANCE:
                mat_id = random.randint(1, 4)
                amount = round(random.uniform(1.5, 4.0), 1)
                mat_names = {1: "Steel", 2: "Aluminum", 3: "Copper", 4: "Rubber"}
                call_reducer("consume_material", [mat_id, amount])
                print(f"  📦 Consumed {amount}% of {mat_names[mat_id]}")

            # Status summary
            faults = sum(1 for r in robots if r.is_fault)
            print(f"\n  📊 Updates: {updates_sent} | Anomalies: {anomalies_injected} | Active faults: {faults}")

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
