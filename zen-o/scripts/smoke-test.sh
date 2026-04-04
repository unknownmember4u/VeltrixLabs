#!/bin/bash
# Zen-O Integration Smoke Test
# Runs SpacetimeDB and Ollama+Flask tests, reports combined results.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== ZEN-O INTEGRATION SMOKE TEST ==="
echo ""

echo "--- SpacetimeDB ---"
node "$SCRIPT_DIR/test-spacetimedb.js"
STDB_EXIT=$?

echo ""
echo "--- Ollama + Flask ---"
python3 "$SCRIPT_DIR/test-ollama.py"
OLLAMA_EXIT=$?

echo ""
echo "=== SUMMARY ==="
if [ $STDB_EXIT -eq 0 ] && [ $OLLAMA_EXIT -eq 0 ]; then
  echo "✓ ALL SYSTEMS GO — Zen-O is ready for demo"
else
  [ $STDB_EXIT -ne 0 ] && echo "✕ FAIL: SpacetimeDB not working — check 'spacetime start' and module publish"
  [ $OLLAMA_EXIT -ne 0 ] && echo "✕ FAIL: Ollama/Flask not working — check 'ollama serve' and flask app"
fi
