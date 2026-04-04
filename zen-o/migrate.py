import re

with open("zen-o-module/src/lib.rs", "r") as f:
    code = f.read()

# Replace Table definitions
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct Robot", "#[spacetimedb::table(name = robot, public)]\n#[derive(Clone, Debug)]\npub struct Robot")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct SensorReading", "#[spacetimedb::table(name = sensor_reading, public)]\n#[derive(Clone, Debug)]\npub struct SensorReading")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct AuditLog", "#[spacetimedb::table(name = audit_log, public)]\n#[derive(Clone, Debug)]\npub struct AuditLog")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct Material", "#[spacetimedb::table(name = material, public)]\n#[derive(Clone, Debug)]\npub struct Material")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct PurchaseOrder", "#[spacetimedb::table(name = purchase_order, public)]\n#[derive(Clone, Debug)]\npub struct PurchaseOrder")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct Simulation", "#[spacetimedb::table(name = simulation, public)]\n#[derive(Clone, Debug)]\npub struct Simulation")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct MaintenanceAction", "#[spacetimedb::table(name = maintenance_action, public)]\n#[derive(Clone, Debug)]\npub struct MaintenanceAction")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct EnergyLog", "#[spacetimedb::table(name = energy_log, public)]\n#[derive(Clone, Debug)]\npub struct EnergyLog")
code = code.replace("#[spacetimedb(table)]\n#[derive(Clone, Debug)]\npub struct Operator", "#[spacetimedb::table(name = operator, public)]\n#[derive(Clone, Debug)]\npub struct Operator")

# Also replace old insert/iter calls with ctx.db versions:
# We need to ensure ctx is passed properly.
# We'll just define a Context var:
code = re.sub(r"(Robot)::insert", r"ctx.db.robot().insert", code)
code = re.sub(r"(SensorReading)::insert", r"ctx.db.sensor_reading().insert", code)
code = re.sub(r"(AuditLog)::insert", r"ctx.db.audit_log().insert", code)
code = re.sub(r"(Material)::insert", r"ctx.db.material().insert", code)
code = re.sub(r"(PurchaseOrder)::insert", r"ctx.db.purchase_order().insert", code)
code = re.sub(r"(Simulation)::insert", r"ctx.db.simulation().insert", code)
code = re.sub(r"(MaintenanceAction)::insert", r"ctx.db.maintenance_action().insert", code)
code = re.sub(r"(EnergyLog)::insert", r"ctx.db.energy_log().insert", code)
code = re.sub(r"(Operator)::insert", r"ctx.db.operator().insert", code)

code = re.sub(r"(Robot)::iter\(\)", r"ctx.db.robot().iter()", code)
code = re.sub(r"(AuditLog)::iter\(\)", r"ctx.db.audit_log().iter()", code)
code = re.sub(r"(Material)::iter\(\)", r"ctx.db.material().iter()", code)

# Robot::filter_by_id(&id)
code = code.replace("Robot::filter_by_id(&robot_id)", "ctx.db.robot().id().find(*&robot_id)")
code = code.replace("Material::filter_by_id(&material_id)", "ctx.db.material().id().find(*&material_id)")

# Robot::update_by_id(&id, struct)
code = code.replace("Robot::update_by_id(&robot_id, updated);", "ctx.db.robot().id().update(updated);")
code = code.replace("Robot::update_by_id(&robot_id, robot);", "ctx.db.robot().id().update(robot);")
code = code.replace("Material::update_by_id(&material_id, material);", "ctx.db.material().id().update(material);")

code = code.replace("fn get_latest_audit_hash()", "fn get_latest_audit_hash(ctx: &ReducerContext)")
code = code.replace("get_latest_audit_hash()", "get_latest_audit_hash(ctx)")

# We already added ctx: &ReducerContext to fn check_material_levels, let's fix its get_latest_audit_hash call
code = code.replace("get_latest_audit_hash(ctx);", "get_latest_audit_hash(ctx)") 
code = code.replace("let prev_hash = get_latest_audit_hash(ctx)", "let prev_hash = get_latest_audit_hash(ctx)") 

with open("zen-o-module/src/lib.rs", "w") as f:
    f.write(code)
print("done")
