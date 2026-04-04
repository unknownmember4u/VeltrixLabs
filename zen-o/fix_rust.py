import sys, re

with open("zen-o-module/src/lib.rs", "r") as f:
    text = f.read()

text = text.replace("use spacetimedb::{spacetimedb, ReducerContext, Timestamp, Identity, SpacetimeType};", 
                    "use spacetimedb::{spacetimedb, ReducerContext, Timestamp, Identity, SpacetimeType, Table};")

# Reducers change signature (from `ctx: ReducerContext` or `_ctx: ReducerContext` to `ctx: &ReducerContext`)
text = re.sub(r"pub fn ([A-Za-z0-9_]+)\((_?ctx): ReducerContext,", r"pub fn \1(ctx: &ReducerContext,", text)
text = re.sub(r"pub fn ([A-Za-z0-9_]+)\((_?ctx): ReducerContext\)", r"pub fn \1(ctx: &ReducerContext)", text)

# check_material_levels
text = text.replace("fn check_material_levels(operator_id: &str)", "fn check_material_levels(ctx: &ReducerContext)")
text = text.replace("check_material_levels(&ctx.sender.to_hex().to_string());", "check_material_levels(ctx);")
text = text.replace("operator_id: operator_id.to_string(),", "operator_id: ctx.sender.to_hex().to_string(),")

# Replace Timestamp::now() -> ctx.timestamp
text = text.replace("Timestamp::now()", "ctx.timestamp")

# Ignore unused Results on insert() and update_by_id()
# Only when they are at the start of the line with spaces
text = re.sub(r"(\n\s+)([A-Za-z0-9_]+::(?:insert|update_by_id)\()", r"\1let _ = \2", text)

with open("zen-o-module/src/lib.rs", "w") as f:
    f.write(text)

print("Done")
