import os
import time
import json
import base64
import fitz  # PyMuPDF
import requests
import numpy as np

import hashlib
import threading
import cv2

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

# ─── CONFIG ────────────────────────────────────────────────────────────

load_dotenv()

FLASK_PORT        = int(os.getenv("FLASK_PORT", "5001"))
DEBUG_MODE        = os.getenv("DEBUG", "false").lower() == "true"
OLLAMA_HOST       = os.getenv("OLLAMA_HOST", "http://localhost:11434")
SPACETIMEDB_HOST  = os.getenv("SPACETIMEDB_HOST", "http://localhost:3000")
SPACETIMEDB_MODULE = os.getenv("SPACETIMEDB_MODULE", "zen-o-authoritative")
GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY", "")

app = Flask(__name__)
CORS(app)

# ─── LIGHTWEIGHT RAG STORE (no PyTorch needed) ─────────────────────────
# Uses Ollama's /api/embed endpoint for embeddings instead of SentenceTransformer

_rag_store = {"documents": [], "embeddings": [], "metadatas": []}


def _cosine_sim(a, b):
    """Cosine similarity between two numpy vectors."""
    a, b = np.array(a, dtype=np.float32), np.array(b, dtype=np.float32)
    dot = np.dot(a, b)
    return float(dot / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


def _ollama_embed(texts):
    """Get embeddings from Ollama's /api/embed endpoint using nomic-embed-text or mistral."""
    try:
        # First try dedicated embedding model
        resp = requests.post(f"{OLLAMA_HOST}/api/embed", json={
            "model": "nomic-embed-text",
            "input": texts if isinstance(texts, list) else [texts],
        }, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("embeddings", [])
    except Exception:
        pass

    # Fallback: use mistral's embeddings endpoint
    try:
        resp = requests.post(f"{OLLAMA_HOST}/api/embed", json={
            "model": "mistral",
            "input": texts if isinstance(texts, list) else [texts],
        }, timeout=60)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("embeddings", [])
    except Exception as e:
        print(f"⚠ Ollama embed failed: {e}")

    return []


def chunk_text(text, max_chars=300):
    """Split text into ~300-char chunks, avoiding mid-sentence splits."""
    lines = text.split("\n")
    chunks = []
    current = ""
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if len(current) + len(line) + 1 > max_chars and current:
            chunks.append(current.strip())
            current = line
        else:
            current = current + " " + line if current else line
    if current.strip():
        chunks.append(current.strip())
    return chunks


def ingest_pdfs():
    """Scan ./manuals/ for PDFs and load into in-memory RAG store."""
    if _rag_store["documents"]:
        print(f"RAG store already has {len(_rag_store['documents'])} chunks — skipping.")
        return

    manuals_dir = os.path.join(os.path.dirname(__file__), "manuals")
    if not os.path.isdir(manuals_dir):
        print("No manuals/ directory found — skipping PDF ingestion.")
        return

    all_chunks = []
    all_metadatas = []
    pdf_count = 0

    for root, _dirs, files in os.walk(manuals_dir):
        for fname in files:
            if not fname.lower().endswith(".pdf"):
                continue
            pdf_path = os.path.join(root, fname)
            pdf_count += 1
            try:
                doc = fitz.open(pdf_path)
                for page_num in range(len(doc)):
                    page_text = doc[page_num].get_text()
                    if not page_text.strip():
                        continue
                    page_chunks = chunk_text(page_text, 300)
                    for ci, chunk in enumerate(page_chunks):
                        all_chunks.append(chunk)
                        all_metadatas.append({
                            "source": fname,
                            "page": page_num,
                            "chunk_id": f"{fname}_p{page_num}_c{ci}",
                        })
                doc.close()
            except Exception as e:
                print(f"Error reading {fname}: {e}")

    if all_chunks:
        print(f"Extracted {len(all_chunks)} chunks from {pdf_count} PDFs. Embedding via Ollama...")
        # Embed in batches
        batch_size = 20
        all_embeddings = []
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i+batch_size]
            embs = _ollama_embed(batch)
            if embs:
                all_embeddings.extend(embs)
            else:
                print(f"  ⚠ Batch {i//batch_size} embedding failed, using zero vectors")
                all_embeddings.extend([[0.0] * 4096] * len(batch))

        _rag_store["documents"] = all_chunks
        _rag_store["embeddings"] = all_embeddings
        _rag_store["metadatas"] = all_metadatas
        print(f"✓ RAG store loaded: {len(all_chunks)} chunks from {pdf_count} PDFs")
    else:
        print(f"No text extracted from {pdf_count} PDFs.")


def rag_query(query_text, n_results=3):
    """Query the RAG store for relevant manual sections."""
    if not _rag_store["embeddings"]:
        return [], []

    query_embs = _ollama_embed([query_text])
    if not query_embs:
        return [], []

    q = query_embs[0]
    scores = [_cosine_sim(q, emb) for emb in _rag_store["embeddings"]]
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n_results]

    docs = [_rag_store["documents"][i] for i in ranked]
    sources = [_rag_store["metadatas"][i]["chunk_id"] for i in ranked]
    return docs, sources


# Run ingestion at startup
ingest_pdfs()

@app.route("/upload_pdf", methods=["POST"])
def upload_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file and file.filename.endswith('.pdf'):
            manuals_dir = os.path.join(os.path.dirname(__file__), "manuals")
            os.makedirs(manuals_dir, exist_ok=True)
            path = os.path.join(manuals_dir, file.filename)
            file.save(path)
            
            # Re-ingest
            doc = fitz.open(path)
            new_chunks = []
            for page_num in range(len(doc)):
                page_text = doc[page_num].get_text()
                if page_text.strip():
                    new_chunks.extend(chunk_text(page_text, 300))
            doc.close()
            
            if new_chunks:
                # Embed new chunks
                all_embeddings = []
                batch_size = 20
                for i in range(0, len(new_chunks), batch_size):
                    batch = new_chunks[i:i+batch_size]
                    embs = _ollama_embed(batch)
                    if embs:
                        all_embeddings.extend(embs)
                    else:
                        all_embeddings.extend([[0.0] * 4096] * len(batch))
                
                _rag_store["documents"].extend(new_chunks)
                _rag_store["embeddings"].extend(all_embeddings)
                for ci in range(len(new_chunks)):
                    _rag_store["metadatas"].append({
                         "source": file.filename,
                         "chunk_id": f"{file.filename}_up_c{ci}"
                    })
                
                return jsonify({"status": "success", "chunks_added": len(new_chunks), "total_chunks": len(_rag_store["documents"])})
            return jsonify({"status": "success", "chunks_added": 0})
        return jsonify({"error": "Invalid file"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Configure Gemini (optional)
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    print("⚠ google.generativeai not available — visual inspect endpoint will be limited")


# ─── HELPER: Call SpacetimeDB reducer ──────────────────────────────────

def call_spacetimedb(reducer_name, args):
    """Fire-and-forget call to a SpacetimeDB reducer."""
    try:
        url = f"{SPACETIMEDB_HOST}/database/call/{SPACETIMEDB_MODULE}/{reducer_name}"
        requests.post(url, json=args, timeout=5)
    except Exception as e:
        print(f"SpacetimeDB call to {reducer_name} failed: {e}")


# ─── ENDPOINT 1: POST /diagnose ───────────────────────────────────────

@app.route("/diagnose", methods=["POST"])
def diagnose():
    try:
        start = time.time()
        data = request.get_json()
        robot_id = data["robot_id"]
        robot_name = data.get("robot_name", f"Robot-{robot_id}")
        vibration = data["vibration"]
        temperature = data["temperature"]
        energy_kw = data["energy_kw"]
        anomaly_type = data.get("anomaly_type", "unknown")

        # Step 1: RAG — retrieve relevant manual sections
        query_text = f"{anomaly_type} maintenance repair troubleshooting"
        manual_sections, source_pages = rag_query(query_text, n_results=3)

        manual_context = "\n".join(manual_sections) if manual_sections else "No manual data available."

        # Step 2: Build prompt
        prompt = f"""You are a factory maintenance AI for the ZEN-O Factory. Robot {robot_name} has an anomaly.
Sensor readings: vibration={vibration}g RMS, temperature={temperature}°C, energy={energy_kw}kW, anomaly_type={anomaly_type}

Relevant sections from the ZEN-O Maintenance Manual:
{manual_context}

Based on the manual sections above, provide exactly 2 sentences:
(1) The specific corrective action with part numbers and torque values from the manual.
(2) Estimated repair time and priority level (P1-Critical/P2-High/P3-Medium)."""

        # Step 3: Call Ollama
        recommendation = ""
        try:
            resp = requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
                timeout=120,
            )
            resp.raise_for_status()
            recommendation = resp.json().get("response", "").strip()
        except Exception as e:
            recommendation = f"[Ollama unavailable] Manual inspection required — check vibration dampeners and bearing assembly (Part# ZEN-BRG-500). Priority: P1-Critical, estimated repair 2-4 hours."
            latency_ms = round((time.time() - start) * 1000, 2)
            return jsonify({
                "robot_id": robot_id,
                "recommendation": recommendation,
                "source_pages": source_pages,
                "model_used": "mistral",
                "latency_ms": latency_ms,
                "rag_chunks": len(manual_sections),
                "error": f"Ollama unavailable: {e}",
            })

        # Step 4: Return
        latency_ms = round((time.time() - start) * 1000, 2)
        return jsonify({
            "robot_id": robot_id,
            "recommendation": recommendation,
            "source_pages": source_pages,
            "model_used": "mistral",
            "latency_ms": latency_ms,
            "rag_chunks": len(manual_sections),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT 2: POST /visual_inspect ─────────────────────────────────

@app.route("/visual_inspect", methods=["POST"])
def visual_inspect():
    try:
        data = request.get_json()
        robot_id = data["robot_id"]
        image_base64 = data["image_base64"]
        zone = data.get("zone", "unknown")

        image_bytes = base64.b64decode(image_base64)

        prompt = f"""This is a thermal camera image from industrial robot zone {zone}.
Analyze for these specific issues only:
1. Overheating zones (unusually bright/hot areas)
2. Component wear patterns
3. Misalignment indicators
4. Liquid leaks or contamination

Respond in this exact JSON format (no markdown, no extra text):
{{"finding": "<one sentence description>", "severity": "<low|medium|high|critical>", "action": "<one sentence recommended action>", "confidence": "<0-100>"}}"""

        finding = "Visual inspection unavailable — manual check required"
        severity = "medium"
        action = "Schedule manual visual inspection"
        confidence = "0"

        if GEMINI_AVAILABLE and genai:
            try:
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content([
                    {"mime_type": "image/jpeg", "data": image_bytes},
                    prompt,
                ])
                response_text = response.text.strip()
                if response_text.startswith("```"):
                    lines = response_text.split("\n")
                    lines = [l for l in lines if not l.strip().startswith("```")]
                    response_text = "\n".join(lines).strip()

                result = json.loads(response_text)
                finding = result.get("finding", finding)
                severity = result.get("severity", severity)
                action = result.get("action", action)
                confidence = result.get("confidence", confidence)
            except Exception as e:
                print(f"Gemini Vision error: {e}")

        auto_flagged = severity in ("high", "critical")
        if auto_flagged:
            call_spacetimedb("inject_anomaly", {
                "robot_id": robot_id,
                "anomaly_type": finding,
            })

        return jsonify({
            "robot_id": robot_id,
            "finding": finding,
            "severity": severity,
            "action": action,
            "confidence": confidence,
            "model_used": "gemini-1.5-flash" if GEMINI_AVAILABLE else "unavailable",
            "auto_flagged": auto_flagged,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT 3: POST /simulate ───────────────────────────────────────

@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = request.get_json()
        parameter = data["parameter"]
        delta_percent = float(data["delta_percent"])
        current_state = data.get("current_state_json", [])

        fault_count = sum(1 for r in current_state if r.get("status") == "fault")
        vibrations = [r.get("vibration", 0) for r in current_state]
        avg_vibration = round(sum(vibrations) / len(vibrations), 4) if vibrations else 0.0

        # Ask Ollama to evaluate the risk of this simulation dynamically
        prompt = f"""You are a factory AI evaluator. 
Current factory state has {fault_count} faults and avg vibration {avg_vibration}g.
An operator wants to change parameter '{parameter}' by delta {delta_percent}%.
Based on industrial best practices, evaluate the risk and impact.
Respond strictly in JSON format:
{{"risk_score": <number 0-100, >60 is high risk>, "projected_output": <number around 100>, "recommendation": "<1 sentence reasoning>"}}"""

        try:
            resp = requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={"model": "mistral", "prompt": prompt, "format": "json", "stream": False},
                timeout=15
            )
            data_ai = resp.json().get("response", "{}")
            ai_eval = json.loads(data_ai)
            risk_score = float(ai_eval.get("risk_score", 45.0))
            projected_output = float(ai_eval.get("projected_output", 100 + delta_percent * 0.5))
            recommendation = ai_eval.get("recommendation", "Consider monitoring closely.")
        except Exception as e:
            # Fallback
            projected_output = round(100 + delta_percent * 0.6 - fault_count * 5, 2)
            risk_score = round(abs(delta_percent) * 0.4 + avg_vibration * 20, 2)
            recommendation = "AI calculation timed out. Assuming moderate risk."

        fault_probability = round(min(1.0, risk_score / 100.0), 4)

        return jsonify({
            "parameter": parameter,
            "delta_percent": delta_percent,
            "projected_output": projected_output,
            "risk_score": risk_score,
            "fault_probability": fault_probability,
            "recommendation": recommendation,
            "fault_count": fault_count,
            "avg_vibration": avg_vibration,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT 4: POST /generate_config_pdf ────────────────────────────

@app.route("/generate_config_pdf", methods=["POST"])
def generate_config_pdf():
    """Generate a machine configuration PDF from current robot state, ingest into RAG."""
    try:
        data = request.get_json() or {}
        robots = data.get("robots", [])

        import datetime
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Build configuration content
        sections = {}

        sections["Page 1 - Machine Configuration Overview"] = f"""
ZEN-O FACTORY — MACHINE CONFIGURATION REPORT
Generated: {timestamp}
Report Type: Automated Configuration Snapshot

SECTION 1: FACTORY OVERVIEW

Total Active Robots: {len(robots)}
Zone-A Units: {sum(1 for r in robots if r.get('zone') == 'Zone-A')}
Zone-B Units: {sum(1 for r in robots if r.get('zone') == 'Zone-B')}
Active Faults: {sum(1 for r in robots if r.get('status') == 'fault')}
Operational Units: {sum(1 for r in robots if r.get('status') == 'active')}

CONFIGURATION PARAMETERS:
- Vibration Safety Threshold: 0.85g RMS
- Temperature Safety Threshold: 85°C
- Energy Warning Threshold: 12 kW
- Energy Critical Threshold: 15 kW
- Maximum Grid Capacity: 100 kW (Normal) / 40 kW (Constrained)
- Priority Protocol: Zone-A > Zone-B during load shedding

MAINTENANCE SCHEDULE:
- Daily: Visual inspection of all cables and pneumatic lines
- Weekly: Joint bearing lubrication (ISO VG-68, 15ml/joint)
- Monthly: Full vibration spectral analysis
- Quarterly: Air filter replacement (Part# ZEN-AF-200, 25 Nm)
"""

        # Per-robot configuration
        robot_configs = []
        for r in robots:
            rid = r.get("id", "?")
            name = r.get("name", f"ARM-{rid}")
            zone = r.get("zone", "Unknown")
            status = r.get("status", "unknown")
            temp = float(r.get("temperature", 0))
            vib = float(r.get("vibration", 0))
            energy = float(r.get("energy_kw", 0))

            health = "NOMINAL"
            if status == "fault":
                health = "FAULT — REQUIRES IMMEDIATE ATTENTION"
            elif vib > 0.7:
                health = "WARNING — Elevated vibration detected"
            elif temp > 75:
                health = "CAUTION — Temperature above optimal range"

            config_text = f"""
Robot Unit: {name} (ID: {rid})
Zone Assignment: {zone}
Current Status: {status.upper()}
Health Assessment: {health}

Live Sensor Readings:
  Temperature: {temp:.1f}°C {"⚠ ABOVE THRESHOLD" if temp > 85 else "(within normal range)"}
  Vibration: {vib:.3f}g RMS {"⚠ ABOVE THRESHOLD" if vib > 0.85 else "(within normal range)"}
  Energy Draw: {energy:.2f} kW {"⚠ HIGH CONSUMPTION" if energy > 12 else "(nominal)"}

Recommended Maintenance:
  - {"URGENT: Replace main drive bearing (Part# ZEN-BRG-500, Torque: 45 Nm)" if vib > 0.85 else "Bearing condition: Good — next inspection in 2000 hrs"}
  - {"URGENT: Check coolant system (Part# ZEN-CP-150, Flow rate: 2.5 L/min min)" if temp > 85 else "Thermal management: Normal — thermal paste condition OK"}
  - {"INVESTIGATE: Check for mechanical resistance" if energy > 12 else "Energy profile: Nominal"}

Calibration Data:
  Joint 1-6 Torque Settings: 45 Nm (main), 35 Nm (coupling), 10 Nm (cover)
  Bearing Type: SKF 6205-2RS (Part# ZEN-BRG-500)
  Lubrication: Mobilux EP2, 5ml per bearing
  Encoder: Part# ZEN-ENC-200, Cable torque: 0.5 Nm
"""
            robot_configs.append(config_text)

        sections["Page 2 - Zone-A Robot Configurations"] = (
            "SECTION 2: ZONE-A ROBOT CONFIGURATIONS\n\n" +
            "\n---\n".join([c for i, c in enumerate(robot_configs) if i < 4])
        )

        sections["Page 3 - Zone-B Robot Configurations"] = (
            "SECTION 3: ZONE-B ROBOT CONFIGURATIONS\n\n" +
            "\n---\n".join([c for i, c in enumerate(robot_configs) if i >= 4])
        )

        # Fault analysis section
        faulted = [r for r in robots if r.get("status") == "fault"]
        if faulted:
            fault_text = "SECTION 4: ACTIVE FAULT ANALYSIS\n\n"
            for r in faulted:
                fault_text += f"""
FAULT REPORT — {r.get('name', 'Unknown')}
  Status: FAULT (requires AI diagnosis or manual intervention)
  Vibration: {float(r.get('vibration', 0)):.3f}g RMS
  Temperature: {float(r.get('temperature', 0)):.1f}°C
  Energy: {float(r.get('energy_kw', 0)):.2f} kW

  Probable Root Cause:
  Based on sensor readings, likely causes ranked by probability:
  1. Bearing wear (65%) — Replace Part# ZEN-BRG-500, Torque: 45 Nm
  2. Belt tension loss (20%) — Adjust to 4.5 kgf, Belt Part# ZEN-BLT-150
  3. Shaft misalignment (10%) — Laser align to <0.05mm offset
  4. Gear mesh degradation (5%) — Inspect gearbox Part# ZEN-GBX-400

  Resolution Protocol:
  1. Run AI Diagnosis from dashboard
  2. Apply recommended fix
  3. Verify vibration < 0.30g RMS post-repair
  4. Log maintenance action in audit trail
"""
            sections["Page 4 - Active Fault Analysis"] = fault_text
        else:
            sections["Page 4 - System Health Summary"] = """
SECTION 4: SYSTEM HEALTH SUMMARY

All robots are operating within normal parameters.
No active faults detected.
Continue with scheduled maintenance intervals as defined in Section 1.
Next recommended full inspection: Within 48 hours.
"""

        # Generate PDF using PyMuPDF
        doc = fitz.open()
        for title, content in sections.items():
            page = doc.new_page(width=595, height=842)
            page.insert_text((50, 50), title, fontsize=14, fontname="helv", color=(0.1, 0.2, 0.5))
            y = 80
            for line in content.strip().split("\n"):
                if y > 800:
                    page = doc.new_page(width=595, height=842)
                    y = 50
                page.insert_text((50, y), line.strip(), fontsize=9, fontname="helv")
                y += 14

        # Save to manuals directory
        manuals_dir = os.path.join(os.path.dirname(__file__), "manuals")
        os.makedirs(manuals_dir, exist_ok=True)
        pdf_filename = "zen_o_machine_config.pdf"
        pdf_path = os.path.join(manuals_dir, pdf_filename)
        doc.save(pdf_path)

        # Re-ingest into RAG store
        new_chunks = []
        new_metas = []
        for page_num in range(len(doc)):
            page_text = doc[page_num].get_text()
            if page_text.strip():
                page_chunks = chunk_text(page_text, 300)
                for ci, chunk in enumerate(page_chunks):
                    new_chunks.append(chunk)
                    new_metas.append({
                        "source": pdf_filename,
                        "page": page_num,
                        "chunk_id": f"{pdf_filename}_p{page_num}_c{ci}",
                    })
        doc.close()

        if new_chunks:
            all_embeddings = []
            batch_size = 20
            for i in range(0, len(new_chunks), batch_size):
                batch = new_chunks[i:i+batch_size]
                embs = _ollama_embed(batch)
                if embs:
                    all_embeddings.extend(embs)
                else:
                    all_embeddings.extend([[0.0] * 4096] * len(batch))

            _rag_store["documents"].extend(new_chunks)
            _rag_store["embeddings"].extend(all_embeddings)
            _rag_store["metadatas"].extend(new_metas)

        from flask import send_file
        return send_file(pdf_path, mimetype="application/pdf",
                        as_attachment=True, download_name=pdf_filename)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT 5: GET /health ──────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    try:
        # Ollama
        ollama_connected = False
        ollama_models = []
        try:
            resp = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=3)
            if resp.status_code == 200:
                ollama_connected = True
                ollama_models = [m["name"] for m in resp.json().get("models", [])]
        except Exception:
            pass

        # SpacetimeDB
        spacetimedb_connected = False
        try:
            resp = requests.get(SPACETIMEDB_HOST, timeout=3)
            spacetimedb_connected = True  # Any non-error response means it's running
        except Exception:
            pass

        # RAG status
        rag_chunks = len(_rag_store["documents"])

        return jsonify({
            "status": "ok",
            "ollama_connected": ollama_connected,
            "ollama_models": ollama_models,
            "spacetimedb_connected": spacetimedb_connected,
            "gemini_available": GEMINI_AVAILABLE,
            "rag_chunks": rag_chunks,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── ENDPOINT 6: VISION MONITORING (Helmet Detection) ─────────────────

# Globals for vision system
_vision_active = False
_vision_lock = threading.Lock()
_vision_violations = []  # List of violation dicts
_vision_model = None
_vision_cap = None
_latest_frame = None
_CLASS_NAMES = ['helmet', 'head', 'person']

ML_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ML", "output", "best.pt")

def _compute_violation_hash(data_str):
    return hashlib.sha256(data_str.encode()).hexdigest()[:16]

def _load_vision_model():
    global _vision_model
    if _vision_model is not None:
        return _vision_model
    try:
        from ultralytics import YOLO
        if os.path.exists(ML_MODEL_PATH):
            _vision_model = YOLO(ML_MODEL_PATH)
            print(f"✓ Vision model loaded from {ML_MODEL_PATH}")
        else:
            print(f"⚠ Vision model not found at {ML_MODEL_PATH}")
    except ImportError:
        print("⚠ ultralytics not installed — vision monitoring disabled")
    return _vision_model

def _vision_loop():
    """Background thread that reads camera frames, runs YOLO, and stores results."""
    global _vision_active, _vision_cap, _latest_frame, _vision_violations

    model = _load_vision_model()
    if model is None:
        _vision_active = False
        return

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        print("⚠ Could not open camera for vision monitoring")
        _vision_active = False
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    _vision_cap = cap
    prev_time = time.time()

    while _vision_active:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.05)
            continue

        results = model(frame, verbose=False)[0]
        helmet_count, head_count, person_count = 0, 0, 0

        for det in results.boxes.data.tolist():
            x1, y1, x2, y2, score, class_id = det
            class_id = int(class_id)
            if score < 0.45: continue

            if class_id == 0:
                helmet_count += 1
                color = (0, 200, 0)
            elif class_id == 1:
                head_count += 1
                color = (0, 0, 255)
            elif class_id == 2:
                person_count += 1
                color = (255, 180, 0)
            else:
                color = (255, 255, 255)

            label = _CLASS_NAMES[class_id] if class_id < len(_CLASS_NAMES) else f"cls_{class_id}"
            label_text = f"{label.upper()} {score:.2f}"
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
            font = cv2.FONT_HERSHEY_SIMPLEX
            (tw, th), _ = cv2.getTextSize(label_text, font, 0.6, 2)
            cv2.rectangle(frame, (int(x1), int(y1) - th - 8), (int(x1) + tw + 4, int(y1)), color, -1)
            cv2.putText(frame, label_text, (int(x1) + 2, int(y1) - 4), font, 0.6, (255, 255, 255), 2, cv2.LINE_AA)

        curr_time = time.time()
        fps = 1.0 / (curr_time - prev_time) if (curr_time - prev_time) > 0 else 0
        prev_time = curr_time

        h, w = frame.shape[:2]
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 60), (30, 30, 30), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        cv2.putText(frame, "ZEN-O SAFETY HELMET DETECTION", (10, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, f"FPS: {fps:.0f}", (w - 110, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, f"Helmets: {helmet_count}", (10, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 0), 2, cv2.LINE_AA)
        cv2.putText(frame, f"No Helmet: {head_count}", (180, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, f"Persons: {person_count}", (380, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 180, 0), 2, cv2.LINE_AA)

        if head_count > 0:
            banner_y = h - 40
            cv2.rectangle(frame, (0, banner_y), (w, h), (0, 0, 200), -1)
            warning_text = f"WARNING: {head_count} WORKER(S) WITHOUT HELMET!"
            (tw2, _), _ = cv2.getTextSize(warning_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.putText(frame, warning_text, ((w - tw2) // 2, banner_y + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

            ts = time.time()
            v_hash = _compute_violation_hash(f"VIOLATION_{head_count}_{ts}")
            with _vision_lock:
                should_log = True
                if _vision_violations:
                    last_ts = _vision_violations[0].get("timestamp", 0)
                    if ts - last_ts < 5: should_log = False
                if should_log:
                    _vision_violations.insert(0, {
                        "id": len(_vision_violations) + 1,
                        "timestamp": ts,
                        "time_str": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts)),
                        "head_count": head_count, "helmet_count": helmet_count, "person_count": person_count,
                        "hash": v_hash,
                        "severity": "critical" if head_count >= 3 else "high" if head_count >= 2 else "medium",
                    })
                    if len(_vision_violations) > 100: _vision_violations = _vision_violations[:100]

        _, jpeg = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        with _vision_lock: _latest_frame = jpeg.tobytes()
        time.sleep(0.03)

    cap.release()
    _vision_cap = None
    print("Vision monitoring stopped.")

def _generate_mjpeg():
    while _vision_active:
        with _vision_lock: frame = _latest_frame
        if frame is None:
            time.sleep(0.05)
            continue
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.033)

@app.route("/vision/start", methods=["POST"])
def vision_start():
    global _vision_active
    if _vision_active: return jsonify({"status": "already_running"})
    _vision_active = True
    threading.Thread(target=_vision_loop, daemon=True).start()
    return jsonify({"status": "started"})

@app.route("/vision/stop", methods=["POST"])
def vision_stop():
    global _vision_active
    _vision_active = False
    return jsonify({"status": "stopped"})

@app.route("/vision/feed")
def vision_feed():
    if not _vision_active: return "Monitoring not active", 503
    return Response(_generate_mjpeg(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/vision/violations")
def vision_violations():
    with _vision_lock:
        return jsonify({"active": _vision_active, "violations": _vision_violations[:50], "total": len(_vision_violations)})

@app.route("/vision/status")
def vision_status():
    return jsonify({
        "active": _vision_active,
        "model_exists": os.path.exists(ML_MODEL_PATH),
        "model_loaded": _vision_model is not None,
        "total_violations": len(_vision_violations),
    })

# ─── MAIN ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n╔══════════════════════════════════════════════╗")
    print(f"║  ZEN-O AI Service                            ║")
    print(f"║  Ollama: {OLLAMA_HOST:<30s}     ║")
    print(f"║  RAG chunks: {len(_rag_store['documents']):<26d}     ║")
    print(f"║  Port: {FLASK_PORT:<32d}     ║")
    print(f"╚══════════════════════════════════════════════╝\n")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=DEBUG_MODE)
