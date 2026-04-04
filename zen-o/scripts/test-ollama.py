#!/usr/bin/env python3
"""
Zen-O Ollama + Flask Integration Test
Tests: (1) Ollama connectivity, (2) Industrial prompt quality, (3) Flask /diagnose end-to-end
"""

import requests
import sys
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
FLASK_URL = "http://localhost:5001"

passed = 0
failed = 0
failures = []

def test(name, fn):
    global passed, failed, failures
    try:
        result = fn()
        if result:
            passed += 1
            return True
        else:
            failed += 1
            failures.append(name)
            return False
    except Exception as e:
        failed += 1
        failures.append(f"{name}: {e}")
        print(f"  TEST FAILED: {e}")
        return False

# ─── TEST 1: Basic Ollama Connectivity ───────────────────────────────

def test_1_ollama():
    print("\n--- TEST 1: Basic Ollama Connectivity ---")
    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": "mistral",
            "prompt": "Reply with only the word ONLINE",
            "stream": False,
        }, timeout=30)
        resp.raise_for_status()
        text = resp.json().get("response", "")
        if "online" in text.lower():
            print(f"  TEST 1 PASSED: Ollama is responding")
            return True
        else:
            print(f"  TEST 1 FAILED: Response didn't contain ONLINE. Got: {text[:100]}")
            return False
    except requests.exceptions.ConnectionError:
        print("  TEST 1 FAILED: Cannot connect to Ollama at localhost:11434")
        print("  ACTION: Run 'ollama serve' in a separate terminal")
        return False
    except Exception as e:
        print(f"  TEST 1 FAILED: {e}")
        return False

# ─── TEST 2: Industrial Prompt Quality ───────────────────────────────

def test_2_industrial():
    print("\n--- TEST 2: Industrial Prompt Quality ---")
    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": "mistral",
            "stream": False,
            "prompt": "A factory robot shows vibration=0.92 and temperature=87C. Give exactly one sentence of maintenance advice mentioning a specific action.",
        }, timeout=60)
        resp.raise_for_status()
        text = resp.json().get("response", "")
        
        keywords = ["bolt", "bearing", "lubrication", "inspect", "check", "tighten", "replace", "temperature", "vibration", "maintenance", "motor", "shaft"]
        has_keyword = any(kw in text.lower() for kw in keywords)
        
        if len(text) > 20 and has_keyword:
            print(f"  TEST 2 PASSED: {text[:100]}")
            return True
        else:
            print(f"  TEST 2 FAILED: response too vague or short ({len(text)} chars)")
            print(f"  Response: {text[:200]}")
            return False
    except requests.exceptions.ConnectionError:
        print("  TEST 2 FAILED: Ollama not reachable")
        return False
    except Exception as e:
        print(f"  TEST 2 FAILED: {e}")
        return False

# ─── TEST 3: Flask /diagnose End-to-End ──────────────────────────────

def test_3_flask():
    print("\n--- TEST 3: Flask /diagnose End-to-End ---")
    try:
        resp = requests.post(f"{FLASK_URL}/diagnose", json={
            "robot_id": 1,
            "robot_name": "ARM-01",
            "vibration": 0.92,
            "temperature": 87.0,
            "energy_kw": 4.2,
            "anomaly_type": "vibration_fault",
        }, timeout=90)
        resp.raise_for_status()
        data = resp.json()
        
        has_recommendation = "recommendation" in data and len(data.get("recommendation", "")) > 20
        has_robot_id = "robot_id" in data
        
        if has_recommendation and has_robot_id:
            print(f"  TEST 3 PASSED: Flask+Ollama pipeline working")
            print(f"  Recommendation: {data['recommendation']}")
            return True
        else:
            missing = []
            if not has_robot_id:
                missing.append("robot_id")
            if not has_recommendation:
                missing.append(f"recommendation (got {len(data.get('recommendation', ''))} chars)")
            print(f"  TEST 3 FAILED: Missing keys: {', '.join(missing)}")
            return False
    except requests.exceptions.ConnectionError:
        print("  TEST 3 FAILED: Cannot connect to Flask at localhost:5001")
        print("  ACTION: Run 'python3 app.py' in zen-o/flask-service/")
        return False
    except Exception as e:
        print(f"  TEST 3 FAILED: {e}")
        return False

# ─── RUN ALL ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== ZEN-O OLLAMA + FLASK TEST SUITE ===")
    
    test("Ollama Connectivity", test_1_ollama)
    test("Industrial Prompt Quality", test_2_industrial)
    test("Flask /diagnose E2E", test_3_flask)
    
    print(f"\n=== RESULTS: {passed}/3 tests passed ===")
    
    if passed == 3:
        print("ALL SYSTEMS OPERATIONAL — ready for demo")
        sys.exit(0)
    else:
        print(f"ACTION NEEDED: {', '.join(failures)}")
        sys.exit(1)
