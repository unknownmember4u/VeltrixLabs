use spacetimedb::{ReducerContext, Timestamp, Identity, Table};
use sha2::{Sha256, Digest};

// ─── TABLES ───────────────────────────────────────────────────────────

#[spacetimedb::table(name = robot, public)]
#[derive(Clone, Debug)]
pub struct Robot {
    #[primary_key]
    pub id: u32,
    pub name: String,
    pub zone: String,
    pub status: String,
    pub temperature: f32,
    pub vibration: f32,
    pub energy_kw: f32,
    pub last_updated: Timestamp,
}

#[spacetimedb::table(name = sensor_reading, public)]
#[derive(Clone, Debug)]
pub struct SensorReading {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub robot_id: u32,
    pub reading_type: String,
    pub value: f32,
    pub timestamp: Timestamp,
}

#[spacetimedb::table(name = audit_log, public)]
#[derive(Clone, Debug)]
pub struct AuditLog {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub event_type: String,
    pub robot_id: u32,
    pub payload: String,
    pub hash: String,
    pub prev_hash: String,
    pub operator_id: String,
    pub timestamp: Timestamp,
}

#[spacetimedb::table(name = material, public)]
#[derive(Clone, Debug)]
pub struct Material {
    #[primary_key]
    pub id: u32,
    pub name: String,
    pub quantity_percent: f32,
    pub consumption_rate_per_hour: f32,
    pub last_updated: Timestamp,
}

#[spacetimedb::table(name = purchase_order, public)]
#[derive(Clone, Debug)]
pub struct PurchaseOrder {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub material_name: String,
    pub quantity_kg: f32,
    pub supplier_code: String,
    pub status: String,
    pub created_at: Timestamp,
    pub hash: String,
}

#[spacetimedb::table(name = simulation, public)]
#[derive(Clone, Debug)]
pub struct Simulation {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub parameter: String,
    pub delta_percent: f32,
    pub projected_output: f32,
    pub risk_score: f32,
    pub fault_probability: f32,
    pub ran_by: String,
    pub ran_at: Timestamp,
}

#[spacetimedb::table(name = maintenance_action, public)]
#[derive(Clone, Debug)]
pub struct MaintenanceAction {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub robot_id: u32,
    pub action: String,
    pub manual_reference: String,
    pub torque_spec: String,
    pub estimated_minutes: u32,
    pub status: String,
    pub assigned_to: String,
}

#[spacetimedb::table(name = energy_log, public)]
#[derive(Clone, Debug)]
pub struct EnergyLog {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub robot_id: u32,
    pub zone: String,
    pub consumption_kw: f32,
    pub shift: String,
    pub timestamp: Timestamp,
}

#[spacetimedb::table(name = operator, public)]
#[derive(Clone, Debug)]
pub struct Operator {
    #[primary_key]
    pub identity: Identity,
    pub name: String,
    pub role: String,
    pub zone_access: String,
    pub last_active: Timestamp,
}

// ─── HELPERS ──────────────────────────────────────────────────────────

fn compute_hash(event_type: &str, robot_id: u32, payload: &str, prev_hash: &str) -> String {
    let mut hasher = Sha256::new();
    let data = format!("{}{}{}{}", event_type, robot_id, payload, prev_hash);
    hasher.update(data.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn get_latest_audit_hash(ctx: &ReducerContext) -> String {
    let mut max_id: u64 = 0;
    let mut latest_hash = "0000000000000000".to_string();
    let mut found = false;

    for log in ctx.db.audit_log().iter() {
        if !found || log.id >= max_id {
            max_id = log.id;
            latest_hash = log.hash.clone();
            found = true;
        }
    }
    latest_hash
}

fn check_material_levels(ctx: &ReducerContext) {
    for material in ctx.db.material().iter() {
        if material.quantity_percent < 5.0 {
            let prev_hash = get_latest_audit_hash(ctx);
            let payload = format!("PO generated for {}", material.name);
            let hash = compute_hash("PO_AUTO_GENERATED", 0, &payload, &prev_hash);

            let _ = ctx.db.purchase_order().insert(PurchaseOrder {
                id: 0,
                material_name: material.name.clone(),
                quantity_kg: 2400.0,
                supplier_code: "SUP-001".to_string(),
                status: "PENDING".to_string(),
                created_at: ctx.timestamp,
                hash: hash.clone(),
            });

            let _ = ctx.db.audit_log().insert(AuditLog {
                id: 0,
                event_type: "PO_AUTO_GENERATED".to_string(),
                robot_id: 0,
                payload,
                hash,
                prev_hash,
                operator_id: ctx.sender.to_string(),
                timestamp: ctx.timestamp,
            });
        }
    }
}

// ─── REDUCERS ─────────────────────────────────────────────────────────

#[spacetimedb::reducer]
pub fn update_robot_sensor(ctx: &ReducerContext, robot_id: u32, temp: f32, vibration: f32, energy_kw: f32) -> Result<(), String> {
    let mut robot = ctx.db.robot().id().find(*&robot_id).ok_or("Robot not found")?;

    robot.temperature = temp;
    robot.vibration = vibration;
    robot.energy_kw = energy_kw;
    robot.last_updated = ctx.timestamp;

    let is_fault = vibration > 0.85;
    robot.status = if is_fault { "fault".to_string() } else { "active".to_string() };

    let _ = ctx.db.robot().id().update(robot);

    let _ = ctx.db.sensor_reading().insert(SensorReading {
        id: 0,
        robot_id,
        reading_type: "temperature".to_string(),
        value: temp,
        timestamp: ctx.timestamp,
    });

    let _ = ctx.db.sensor_reading().insert(SensorReading {
        id: 0,
        robot_id,
        reading_type: "vibration".to_string(),
        value: vibration,
        timestamp: ctx.timestamp,
    });

    let _ = ctx.db.sensor_reading().insert(SensorReading {
        id: 0,
        robot_id,
        reading_type: "energy_kw".to_string(),
        value: energy_kw,
        timestamp: ctx.timestamp,
    });

    if is_fault {
        let prev_hash = get_latest_audit_hash(ctx);
        let payload = format!("vibration={},temp={}", vibration, temp);
        let hash = compute_hash("ANOMALY_DETECTED", robot_id, &payload, &prev_hash);

        let _ = ctx.db.audit_log().insert(AuditLog {
            id: 0,
            event_type: "ANOMALY_DETECTED".to_string(),
            robot_id,
            payload,
            hash,
            prev_hash,
            operator_id: ctx.sender.to_string(),
            timestamp: ctx.timestamp,
        });
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn inject_anomaly(ctx: &ReducerContext, robot_id: u32, anomaly_type: String) -> Result<(), String> {
    let mut robot = ctx.db.robot().id().find(*&robot_id).ok_or("Robot not found")?;
    robot.status = "fault".to_string();
    let _ = ctx.db.robot().id().update(robot);

    let prev_hash = get_latest_audit_hash(ctx);
    let hash = compute_hash("ANOMALY_INJECTED", robot_id, &anomaly_type, &prev_hash);

    let _ = ctx.db.audit_log().insert(AuditLog {
        id: 0,
        event_type: "ANOMALY_INJECTED".to_string(),
        robot_id,
        payload: anomaly_type,
        hash,
        prev_hash,
        operator_id: ctx.sender.to_string(),
        timestamp: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn resolve_anomaly(ctx: &ReducerContext, robot_id: u32, action_taken: String, operator_id: String) -> Result<(), String> {
    let mut robot = ctx.db.robot().id().find(*&robot_id).ok_or("Robot not found")?;
    robot.status = "active".to_string();
    let _ = ctx.db.robot().id().update(robot);

    let _ = ctx.db.maintenance_action().insert(MaintenanceAction {
        id: 0,
        robot_id,
        action: "resolution".to_string(),
        manual_reference: "".to_string(),
        torque_spec: "".to_string(),
        estimated_minutes: 0,
        status: "completed".to_string(),
        assigned_to: operator_id.clone(),
    });

    let prev_hash = get_latest_audit_hash(ctx);
    let hash = compute_hash("ANOMALY_RESOLVED", robot_id, &action_taken, &prev_hash);

    let _ = ctx.db.audit_log().insert(AuditLog {
        id: 0,
        event_type: "ANOMALY_RESOLVED".to_string(),
        robot_id,
        payload: action_taken,
        hash,
        prev_hash,
        operator_id,
        timestamp: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn consume_material(ctx: &ReducerContext, material_id: u32, amount_percent: f32) -> Result<(), String> {
    let mut material = ctx.db.material().id().find(*&material_id).ok_or("Material not found")?;

    material.quantity_percent -= amount_percent;
    if material.quantity_percent < 0.0 {
        material.quantity_percent = 0.0;
    }
    material.last_updated = ctx.timestamp;
    let _ = ctx.db.material().id().update(material);

    // Inline check_material_levels (SpacetimeDB does not allow reducer-calls-reducer)
    check_material_levels(ctx);

    Ok(())
}

#[spacetimedb::reducer]
pub fn run_simulation(ctx: &ReducerContext, parameter: String, delta_percent: f32, operator_id: String) -> Result<(), String> {
    let projected_output = 100.0 + delta_percent * 0.6;
    let risk_score = delta_percent.abs() * 0.4;
    let fault_probability = risk_score / 100.0;

    let _ = ctx.db.simulation().insert(Simulation {
        id: 0,
        parameter,
        delta_percent,
        projected_output,
        risk_score,
        fault_probability,
        ran_by: operator_id,
        ran_at: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn log_energy(ctx: &ReducerContext, robot_id: u32, consumption_kw: f32, shift: String) -> Result<(), String> {
    let robot = ctx.db.robot().id().find(*&robot_id).ok_or("Robot not found")?;

    let _ = ctx.db.energy_log().insert(EnergyLog {
        id: 0,
        robot_id,
        zone: robot.zone.clone(),
        consumption_kw,
        shift,
        timestamp: ctx.timestamp,
    });

    if consumption_kw > 15.0 {
        let prev_hash = get_latest_audit_hash(ctx);
        let payload = format!("consumption_kw={}", consumption_kw);
        let hash = compute_hash("ENERGY_ALERT", robot_id, &payload, &prev_hash);

        let _ = ctx.db.audit_log().insert(AuditLog {
            id: 0,
            event_type: "ENERGY_ALERT".to_string(),
            robot_id,
            payload,
            hash,
            prev_hash,
            operator_id: ctx.sender.to_string(),
            timestamp: ctx.timestamp,
        });
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn emergency_stop(ctx: &ReducerContext, zone: String, reason: String, operator_id: String) -> Result<(), String> {
    for robot in ctx.db.robot().iter() {
        if robot.zone == zone {
            let mut updated = robot;
            updated.status = "idle".to_string();
            let robot_id = updated.id;
            let _ = ctx.db.robot().id().update(updated);
        }
    }

    let prev_hash = get_latest_audit_hash(ctx);
    let hash = compute_hash("EMERGENCY_STOP", 0, &reason, &prev_hash);

    let _ = ctx.db.audit_log().insert(AuditLog {
        id: 0,
        event_type: "EMERGENCY_STOP".to_string(),
        robot_id: 0,
        payload: reason,
        hash,
        prev_hash,
        operator_id,
        timestamp: ctx.timestamp,
    });

    Ok(())
}

// ─── INIT ─────────────────────────────────────────────────────────────

#[spacetimedb::reducer(init)]
pub fn init(ctx: &ReducerContext) {
    for id in 1u32..=8 {
        let zone = if id <= 4 { "Zone-A" } else { "Zone-B" }.to_string();
        let _ = ctx.db.robot().insert(Robot {
            id,
            name: format!("ARM-{:02}", id),
            zone,
            status: "active".to_string(),
            temperature: 65.0,
            vibration: 0.3,
            energy_kw: 8.5,
            last_updated: ctx.timestamp,
        });
    }

    let _ = ctx.db.material().insert(Material {
        id: 1,
        name: "Steel".to_string(),
        quantity_percent: 72.0,
        consumption_rate_per_hour: 2.1,
        last_updated: ctx.timestamp,
    });
    let _ = ctx.db.material().insert(Material {
        id: 2,
        name: "Aluminum".to_string(),
        quantity_percent: 45.0,
        consumption_rate_per_hour: 1.4,
        last_updated: ctx.timestamp,
    });
    let _ = ctx.db.material().insert(Material {
        id: 3,
        name: "Copper".to_string(),
        quantity_percent: 18.0,
        consumption_rate_per_hour: 0.8,
        last_updated: ctx.timestamp,
    });
    let _ = ctx.db.material().insert(Material {
        id: 4,
        name: "Rubber".to_string(),
        quantity_percent: 8.0,
        consumption_rate_per_hour: 0.5,
        last_updated: ctx.timestamp,
    });
}

// ─── SENSOR DRIFT SIMULATOR ──────────────────────────────────────────

#[spacetimedb::reducer]
pub fn simulate_sensor_drift(ctx: &ReducerContext) {
    for robot in ctx.db.robot().iter() {
        let mut updated = robot;

        let t_drift = (updated.id % 3) as f32 * 0.1 - 0.15;
        updated.temperature = (updated.temperature + t_drift).clamp(60.0, 95.0);

        let v_drift = (updated.id % 5) as f32 * 0.02 - 0.04;
        updated.vibration = (updated.vibration + v_drift).clamp(0.1, 0.95);

        let e_drift = (updated.id % 4) as f32 * 0.05 - 0.1;
        updated.energy_kw = (updated.energy_kw + e_drift).clamp(5.0, 15.0);

        updated.last_updated = ctx.timestamp;

        let robot_id = updated.id;
        let _ = ctx.db.robot().id().update(updated);
    }
}
