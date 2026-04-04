<p align="center">
  <img src="https://img.shields.io/badge/HackByte_4.0-VeltrixLabs-blue?style=for-the-badge&logo=hackthebox&logoColor=white" />
</p>

<h1 align="center">🏭 ZEN-O — Smart Factory Orchestrator</h1>

<p align="center">
  <b>Real-Time Industrial IoT Monitoring · AI-Powered Diagnostics · Autonomous Supply Chain</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/SpacetimeDB-1.0-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/Rust-WASM-orange?style=flat-square&logo=rust" />
  <img src="https://img.shields.io/badge/Ollama-RAG-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Python-Flask-yellow?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Three.js-3D_Models-blue?style=flat-square&logo=three.js" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the System](#running-the-system)
- [Dashboard Pages](#dashboard-pages)
- [API Endpoints](#api-endpoints)
- [SpacetimeDB Schema](#spacetimedb-schema)
- [Team](#team)

---

## Overview

**ZEN-O** is a full-stack industrial IoT orchestrator built for **HackByte 4.0**. It simulates a smart factory with 8 robotic arms across two production zones, providing real-time monitoring, AI-driven anomaly detection, predictive simulation, and autonomous supply chain management — all connected through a **SpacetimeDB** real-time database backbone.

The system demonstrates how modern factories can leverage **edge AI** (Ollama), **real-time databases** (SpacetimeDB), and **3D visualization** (Three.js) to achieve full observability and autonomous decision-making without cloud dependency.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ZEN-O ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    WebSocket     ┌──────────────────────────┐    │
│  │  Next.js 16  │◄───────────────►│    SpacetimeDB (Rust)     │    │
│  │  Dashboard   │    Real-time     │    WASM Module            │    │
│  │  Port: 3001  │    Sync          │    Port: 3000             │    │
│  └──────┬───────┘                  └─────────────┬────────────┘    │
│         │                                        │                  │
│         │ REST API                   CLI Calls    │                  │
│         ▼                                        ▼                  │
│  ┌──────────────┐                  ┌──────────────────────────┐    │
│  │ Flask AI     │                  │  Python Simulator        │    │
│  │ Service      │                  │  simulate_factory.py     │    │
│  │ Port: 5001   │                  │  Deterministic Physics   │    │
│  └──────┬───────┘                  └──────────────────────────┘    │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐    ┌──────────────────────────┐                  │
│  │ Ollama LLM   │    │  ChromaDB Vector Store    │                  │
│  │ Port: 11434  │◄──►│  RAG Document Retrieval   │                  │
│  │ (llama3.2)   │    │  PDF Manuals Ingestion    │                  │
│  └──────────────┘    └──────────────────────────┘                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 🤖 Real-Time IoT Dashboard
- **8 Robotic Arms** monitored across Zone-A and Zone-B
- **Live sensor data**: Temperature, Vibration (RMS), Energy consumption
- **3D robot arm models** rendered with Three.js + React Three Fiber
- **Auto-rotating OBJ models** with industrial lighting
- Values update in real-time via SpacetimeDB WebSocket subscriptions

### 🛢️ Oil Leakage Heatmap
- **4×2 transparent heatmap grid** below IoT cards
- Per-robot **leak simulation buttons**
- Visual red glow + animated alerts when leak is detected
- Click-to-simulate for hackathon demo

### 🧠 AI-Powered Diagnostics (Ollama RAG)
- **Local LLM** (llama3.2 via Ollama) — fully edge, no cloud dependency
- **RAG pipeline**: PDF maintenance manuals → ChromaDB vector store → context-aware diagnosis
- AI provides: root cause, part numbers, torque values, repair time estimates
- **Persistent ARM-08 fault** that only AI diagnosis can resolve

### ⚡ Energy Dashboard
- **Dynamic Zone Energy Map** with per-robot power allocation bars
- **Consumption Profiling** with sorted bar charts
- **Grid Load Balancer** — simulates 40kW constraint with priority-based power triage
- **AI Power Distribution Analysis** via real Ollama calls explaining which devices lost power and why

### 🧪 Simulation Lab
- **Live Robot Fleet**: 8 clickable 3D models with values refreshing every 4 seconds
- **Smooth inspection modal**: Click any robot → animated expand with full machine specs
  - Hardware specs (Model, Serial, Firmware, Motor RPM, Payload, Reach)
  - Maintenance history (Install date, service dates, bearing hours)
  - Network config (IP, protocol)
  - Fluid status (oil level, coolant type, bearing life bars)
- **A/B Simulation**: Side-by-side parameter stress testing
- **Risk Projection Curve** with Recharts visualization
- **PDF Upload** for RAG context enrichment

### 📦 Supply Chain Simulation
- Materials start at **100%** — fully client-side depletion
- Configurable **target material** and **depletion rate** slider
- Threshold notifications: **<20% Low Stock Warning**, **<10% Auto-Order Triggered**
- **Hash-chained purchase orders** with supplier codes
- SpacetimeDB purchase orders displayed alongside local simulation orders

### 🔐 Cryptographic Audit Trail
- Every anomaly injection, resolution, and purchase order is **hash-chained**
- SHA-256 linked audit log entries in SpacetimeDB
- Tamper-evident: breaking any entry invalidates the entire chain

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TailwindCSS 4 | Dashboard UI |
| **3D Rendering** | Three.js, React Three Fiber, Drei | Robot arm models |
| **Charts** | Recharts | Energy profiling, risk curves |
| **Icons** | Lucide React | Industrial-grade iconography |
| **Real-Time DB** | SpacetimeDB 1.0 (Rust WASM) | State management & sync |
| **AI Service** | Python Flask, Ollama (llama3.2) | Diagnostics & simulation |
| **RAG** | ChromaDB, PyMuPDF | PDF ingestion & retrieval |
| **Simulator** | Python 3 | Deterministic factory physics |
| **Crypto** | SHA-256 (sha2 crate) | Audit log hash chain |

---

## Project Structure

```
HackByte-4.0-VeltrixLabs/
├── README.md                          # This file
├── zen-o/                             # Main project
│   ├── .env.example                   # Environment variables template
│   │
│   ├── zen-o-dashboard/               # Next.js 16 Frontend
│   │   ├── app/
│   │   │   ├── page.js                # Main dashboard (robot grid + heatmap)
│   │   │   ├── energy/page.js         # Energy monitor + AI load balancer
│   │   │   ├── simulation/page.js     # Simulation lab + clickable 3D fleet
│   │   │   ├── supply/page.js         # Supply chain depletion sim
│   │   │   ├── layout.js              # Root layout with fonts
│   │   │   ├── globals.css            # Global styles
│   │   │   ├── error.js               # Error boundary
│   │   │   └── global-error.js        # Global error boundary
│   │   ├── components/
│   │   │   ├── RobotGrid.js           # Robot cards + oil leakage heatmap
│   │   │   ├── RobotModel.js          # Three.js 3D robot arm renderer
│   │   │   ├── NavBar.js              # Navigation with live status badges
│   │   │   ├── SupplyChain.js         # Material depletion simulation
│   │   │   ├── AnomalyConsole.js      # Anomaly injection/resolution panel
│   │   │   ├── HeatMap.js             # Temperature heatmap visualization
│   │   │   ├── SimulationPanel.js     # Simulation controls
│   │   │   └── DatabaseStream.js      # Real-time data stream viewer
│   │   ├── lib/
│   │   │   ├── spacetime.js           # SpacetimeDB WebSocket client + hooks
│   │   │   ├── spacetime_mock.js      # Fallback mock data
│   │   │   └── module_bindings/       # Auto-generated SpacetimeDB bindings
│   │   ├── public/
│   │   │   └── Rmk3.obj               # 3D robotic arm model (36MB OBJ)
│   │   └── package.json
│   │
│   ├── zen-o-module/                  # SpacetimeDB Rust Module
│   │   ├── src/lib.rs                 # Tables, reducers, audit log logic
│   │   ├── Cargo.toml                 # Rust dependencies
│   │   └── Cargo.lock
│   │
│   ├── flask-service/                 # Python AI Microservice
│   │   ├── app.py                     # Flask API (diagnose, simulate, RAG, PDF)
│   │   ├── generate_manual.py         # Maintenance manual PDF generator
│   │   ├── manuals/                   # Generated PDF manuals for RAG
│   │   │   └── zen_o_maintenance_manual.pdf
│   │   └── requirements.txt           # Python dependencies
│   │
│   └── scripts/                       # Automation Scripts
│       ├── simulate_factory.py        # Continuous sensor simulator (v2.1)
│       ├── test-spacetimedb.js        # SpacetimeDB connectivity test
│       ├── test-ollama.py             # Ollama RAG pipeline test
│       └── smoke-test.sh              # Full stack smoke test
│
└── Frontend/
    └── stellar-state/                 # Landing page / companion app
        └── src/app/page.js
```

---

## Getting Started

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| Python | ≥ 3.10 | [python.org](https://python.org) |
| Rust | latest stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| SpacetimeDB CLI | 1.0+ | `curl -sSf https://install.spacetimedb.com \| sh` |
| Ollama | latest | [ollama.com](https://ollama.com) |

### 1. Clone & Install

```bash
git clone https://github.com/VeltrixLabs/HackByte-4.0-VeltrixLabs.git
cd HackByte-4.0-VeltrixLabs
```

### 2. SpacetimeDB Module

```bash
cd zen-o/zen-o-module
spacetime build
spacetime start --listen-addr 0.0.0.0:3000    # Terminal 1
spacetime publish zen-o-authoritative --server local
```

### 3. Pull Ollama Model

```bash
ollama pull llama3.2
ollama serve    # Terminal 2
```

### 4. Flask AI Service

```bash
cd zen-o/flask-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_manual.py   # Generate RAG PDF
python app.py               # Terminal 3
```

### 5. Next.js Dashboard

```bash
cd zen-o/zen-o-dashboard
npm install
PORT=3001 npm run dev       # Terminal 4
```

### 6. Start Factory Simulator

```bash
python3 zen-o/scripts/simulate_factory.py    # Terminal 5
```

---

## Running the System

When all 5 services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | `http://localhost:3001` | Main UI |
| **SpacetimeDB** | `http://localhost:3000` | Real-time database |
| **Flask AI** | `http://localhost:5001` | Diagnostics API |
| **Ollama** | `http://localhost:11434` | Local LLM |
| **Simulator** | (background) | Pushes sensor data every 5s |

---

## Dashboard Pages

### `/` — Main Dashboard
Real-time robot fleet monitoring with IoT sensor cards and oil leakage heatmap simulation.

### `/energy` — Energy Monitor
Dynamic zone energy mapping, consumption profiling, grid load balancer with AI-powered analysis.

### `/simulation` — Simulation Lab
Live 3D robot fleet (click to inspect), A/B simulation testing, risk projection curves, PDF upload for RAG.

### `/supply` — Supply Chain
Material inventory depletion simulation with auto-ordering at thresholds, hash-chained purchase orders.

---

## API Endpoints

### Flask AI Service (`localhost:5001`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/diagnose` | AI anomaly diagnosis via Ollama RAG |
| `POST` | `/simulate` | Predictive factory simulation |
| `POST` | `/upload_pdf` | Upload PDF for RAG ingestion |
| `POST` | `/generate_config_pdf` | Generate machine config PDF |
| `GET`  | `/health` | Service health check |
| `POST` | `/visual_inspection` | Gemini Vision thermal analysis |

### SpacetimeDB Reducers

| Reducer | Parameters | Description |
|---------|-----------|-------------|
| `update_robot_sensor` | `robot_id, temp, vibration, energy_kw` | Push sensor readings |
| `inject_anomaly` | `robot_id, anomaly_type` | Trigger robot fault |
| `resolve_anomaly` | `robot_id, resolution_notes, resolved_by` | Fix anomaly |
| `consume_material` | `material_id, amount_percent` | Deplete material stock |
| `log_energy` | `robot_id, consumption_kw, shift` | Log energy per shift |
| `simulate_sensor_drift` | — | Trigger global drift cycle |

---

## SpacetimeDB Schema

### Tables

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| `Robot` | id, name, zone, status, temperature, vibration, energy_kw | Robot state |
| `SensorReading` | robot_id, timestamp, temp, vibration, energy | Historical readings |
| `AuditLog` | id, event_type, robot_id, payload, hash, prev_hash | Hash-chained log |
| `Material` | id, name, quantity_percent | Supply chain inventory |
| `PurchaseOrder` | id, material_name, quantity_kg, supplier_code, hash | Auto-generated POs |
| `EnergyLog` | id, robot_id, consumption_kw, shift | Energy tracking |
| `Simulation` | id, parameter, delta_percent, projected_output, risk_score | Sim results |

---

## Environment Variables

```env
SPACETIMEDB_HOST=http://localhost:3000
FLASK_HOST=http://localhost:5001
OLLAMA_HOST=http://localhost:11434
CHROMADB_PATH=./chromadb_data
GEMINI_API_KEY=<your-api-key>          # Optional: for visual inspection
NEXT_PUBLIC_SPACETIMEDB_URL=ws://localhost:3000
NEXT_PUBLIC_SPACETIMEDB_MODULE=zen-o-authoritative
NEXT_PUBLIC_FLASK_URL=http://localhost:5001
```

---

## Key Design Decisions

1. **SpacetimeDB over Firebase/Supabase**: Chosen for microsecond-latency real-time sync and Rust-native type safety. The WASM module runs server-side with zero cold starts.

2. **Ollama over Cloud LLMs**: Fully edge-deployable — no API keys, no latency, no data leaving the factory floor. Critical for industrial environments with air-gapped networks.

3. **Deterministic Physics Simulation**: The Python simulator uses sine-wave oscillations (not random noise) so sensor values are predictable and reproducible for demos.

4. **Hash-Chained Audit Trail**: Every factory event is SHA-256 linked to its predecessor, creating a blockchain-inspired tamper-evident log without the overhead of consensus.

5. **Client-Side Supply Chain**: Material depletion runs in the browser to avoid SpacetimeDB schema migration issues, while still displaying server-side purchase orders.

---

## Team

**VeltrixLabs** — HackByte 4.0

---

<p align="center">
  Built with ⚡ for <b>HackByte 4.0</b>
</p>
