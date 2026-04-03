import os
import time
import json
import base64
import fitz  # PyMuPDF
import requests
try:
    import chromadb
    CHROMADB_AVAILABLE = True
except Exception as e:
    print(f"⚠ ChromaDB import failed ({e}), using in-memory fallback")
    CHROMADB_AVAILABLE = False

import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# ─── CONFIG ────────────────────────────────────────────────────────────

load_dotenv()

FLASK_PORT = int(os.getenv("FLASK_PORT", "5001"))
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"
CHROMADB_PATH = os.getenv("CHROMADB_PATH", "./chromadb_data")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
SPACETIMEDB_HOST = os.getenv("SPACETIMEDB_HOST", "http://localhost:3000")
SPACETIMEDB_MODULE = os.getenv("SPACETIMEDB_MODULE", "stellar-state-k7z98")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

app = Flask(__name__)
CORS(app)

# ─── STARTUP: PDF INGESTION + CHROMADB ─────────────────────────────────

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ─── ChromaDB / In-Memory Fallback ─────────────────────────────────────

# In-memory store for when ChromaDB fails
_memory_store = {"documents": [], "embeddings": [], "ids": [], "metadatas": []}

if CHROMADB_AVAILABLE:
    try:
        chroma_client = chromadb.Client(chromadb.Settings(
            persist_directory=CHROMADB_PATH,
            anonymized_telemetry=False,
        ))
        collection = chroma_client.get_or_create_collection(name="factory_manuals")
        print("✓ ChromaDB initialized successfully")
    except Exception as e:
        print(f"⚠ ChromaDB Settings init failed ({e}), using in-memory fallback")
        CHROMADB_AVAILABLE = False
        collection = None
else:
    collection = None

import numpy as np


def _cosine_sim(a, b):
    """Cosine similarity between two vectors."""
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))


def memory_query(query_embedding, n_results=3):
    """In-memory fallback for ChromaDB query using cosine similarity."""
    if not _memory_store["embeddings"]:
        return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

    scores = [_cosine_sim(query_embedding, emb) for emb in _memory_store["embeddings"]]
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:n_results]

    return {
        "documents": [[_memory_store["documents"][i] for i in ranked]],
        "metadatas": [[_memory_store["metadatas"][i] for i in ranked]],
        "distances": [[1 - scores[i] for i in ranked]],
    }


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
    """Scan ./manuals/ for PDFs and load into ChromaDB or memory store."""
    if CHROMADB_AVAILABLE and collection is not None:
        existing = collection.count()
        if existing > 0:
            print(f"ChromaDB already has {existing} chunks — skipping re-ingestion.")
            return
    elif _memory_store["documents"]:
        print(f"Memory store already has {len(_memory_store['documents'])} chunks — skipping.")
        return

    manuals_dir = os.path.join(os.path.dirname(__file__), "manuals")
    if not os.path.isdir(manuals_dir):
        print("No manuals/ directory found — skipping PDF ingestion.")
        return

    all_chunks = []
    all_ids = []
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
                        chunk_id = f"{fname}_p{page_num}_c{ci}"
                        all_chunks.append(chunk)
                        all_ids.append(chunk_id)
                        all_metadatas.append({
                            "source": fname,
                            "page": page_num,
                            "chunk_index": ci,
                        })
                doc.close()
            except Exception as e:
                print(f"Error reading {fname}: {e}")

    if all_chunks:
        embeddings = embedding_model.encode(all_chunks).tolist()

        if CHROMADB_AVAILABLE and collection is not None:
            collection.add(
                documents=all_chunks,
                embeddings=embeddings,
                ids=all_ids,
                metadatas=all_metadatas,
            )
            try:
                chroma_client.persist()
            except Exception:
                pass  # persist() removed in newer chromadb versions
        else:
            _memory_store["documents"] = all_chunks
            _memory_store["embeddings"] = embeddings
            _memory_store["ids"] = all_ids
            _memory_store["metadatas"] = all_metadatas

    print(f"Loaded {pdf_count} PDFs, {len(all_chunks)} chunks into {'ChromaDB' if CHROMADB_AVAILABLE else 'memory store'}")


# Run ingestion at startup
ingest_pdfs()

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


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

        # Step 1: Query ChromaDB / memory store
        query_text = f"{anomaly_type} maintenance repair troubleshooting"
        source_pages = []
        manual_sections = ""

        has_data = False
        if CHROMADB_AVAILABLE and collection is not None:
            has_data = collection.count() > 0
        else:
            has_data = len(_memory_store["documents"]) > 0

        if has_data:
            query_embedding = embedding_model.encode([query_text]).tolist()
            if CHROMADB_AVAILABLE and collection is not None:
                results = collection.query(
                    query_embeddings=query_embedding,
                    n_results=3,
                )
            else:
                results = memory_query(query_embedding[0], n_results=3)
            if results and results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    manual_sections += f"\n{doc}\n"
                source_pages = results.get("ids", [[]])[0] if "ids" in results else []
        else:
            manual_sections = "No manual data available."

        # Step 2: Build prompt
        prompt = f"""You are a factory maintenance AI. Robot {robot_name} has an anomaly.
Sensor readings: vibration={vibration}, temperature={temperature}°C, energy={energy_kw}kW, anomaly_type={anomaly_type}

Relevant manual sections:
{manual_sections}

Provide exactly 2 sentences: (1) the specific corrective action with any torque values or part references from the manual, (2) estimated time and priority level."""

        # Step 3: Call Ollama
        recommendation = ""
        try:
            resp = requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
                timeout=30,
            )
            resp.raise_for_status()
            recommendation = resp.json().get("response", "").strip()
        except Exception:
            recommendation = "Manual inspection required. Check vibration dampeners and bearing assembly."
            latency_ms = round((time.time() - start) * 1000, 2)
            return jsonify({
                "robot_id": robot_id,
                "recommendation": recommendation,
                "source_pages": source_pages,
                "model_used": "mistral",
                "latency_ms": latency_ms,
                "error": "Ollama unavailable",
            })

        # Step 4: Call SpacetimeDB resolve_anomaly
        call_spacetimedb("resolve_anomaly", {
            "robot_id": robot_id,
            "action_taken": recommendation,
            "operator_id": "ai-agent",
        })

        # Step 5: Return
        latency_ms = round((time.time() - start) * 1000, 2)
        return jsonify({
            "robot_id": robot_id,
            "recommendation": recommendation,
            "source_pages": source_pages,
            "model_used": "mistral",
            "latency_ms": latency_ms,
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

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content([
                {"mime_type": "image/jpeg", "data": image_bytes},
                prompt,
            ])

            response_text = response.text.strip()
            # Strip markdown fences if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                response_text = "\n".join(lines).strip()

            result = json.loads(response_text)
            finding = result.get("finding", "Unknown finding")
            severity = result.get("severity", "medium")
            action = result.get("action", "Manual check recommended")
            confidence = result.get("confidence", "50")

        except Exception as e:
            print(f"Gemini Vision error: {e}")
            finding = "Visual inspection unavailable — manual check required"
            severity = "medium"
            action = "Schedule manual visual inspection"
            confidence = "0"

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
            "model_used": "gemini-1.5-flash",
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

        projected_output = round(100 + delta_percent * 0.6 - fault_count * 5, 2)
        risk_score = round(abs(delta_percent) * 0.4 + avg_vibration * 20, 2)
        fault_probability = round(avg_vibration + abs(delta_percent) * 0.01, 4)

        if risk_score > 60:
            recommendation = "High risk. Reduce delta or resolve active faults first."
        elif risk_score > 30:
            recommendation = "Moderate risk. Monitor Zone-A robots closely."
        else:
            recommendation = "Low risk. Proceed with parameter change."

        # Fire-and-forget to SpacetimeDB
        call_spacetimedb("run_simulation", {
            "parameter": parameter,
            "delta_percent": delta_percent,
            "operator_id": "flask-sim",
        })

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


# ─── ENDPOINT 4: GET /health ──────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    try:
        # Ollama
        ollama_connected = False
        try:
            resp = requests.get(OLLAMA_HOST, timeout=3)
            ollama_connected = resp.status_code == 200
        except Exception:
            pass

        # SpacetimeDB
        spacetimedb_connected = False
        try:
            resp = requests.get(SPACETIMEDB_HOST, timeout=3)
            spacetimedb_connected = resp.status_code == 200
        except Exception:
            pass

        # Gemini
        gemini_connected = False
        try:
            test_model = genai.GenerativeModel("gemini-1.5-flash")
            test_model.generate_content("ping")
            gemini_connected = True
        except Exception:
            pass

        # ChromaDB
        chromadb_chunks = 0
        try:
            if CHROMADB_AVAILABLE and collection is not None:
                chromadb_chunks = collection.count()
            else:
                chromadb_chunks = len(_memory_store["documents"])
        except Exception:
            pass

        return jsonify({
            "status": "ok",
            "ollama_connected": ollama_connected,
            "spacetimedb_connected": spacetimedb_connected,
            "gemini_connected": gemini_connected,
            "chromadb_chunks": chromadb_chunks,
            "models_available": ["mistral", "gemini-1.5-flash"],
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── MAIN ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=DEBUG_MODE)
