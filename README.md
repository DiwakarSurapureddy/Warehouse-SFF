# 📦 SmartFulfill AI — Intelligent Warehouse Decision Intelligence Platform

> **Detect → Decide → Explain → Act → Monitor**  
> **Exception → Decision → Resolution → Audit Ledger**

SmartFulfill AI is an enterprise-grade **Warehouse Decision Intelligence & Fulfillment Operations Platform**. Unlike traditional CRUD dashboards, SmartFulfill AI continuously analyzes live warehouse queues, scarce inventory conflicts, SLA expirations, station throughput bottlenecks, and physical walking distances to formulate explainable decisions and automate operational recovery.

---

## 🌟 Primary Hackathon Differentiators

| Engine / Module | Core Capability | Operational Value |
| :--- | :--- | :--- |
| 🧠 **Smart Decision Engine** | Multi-factor weighted priority scoring & scarce stock arbitration | Protects urgent orders from SLA breaches |
| 🔍 **Decision Explainability** | Transparent *What? Why? Expected Impact? Alternative Action?* breakdown | Zero "black-box AI" — 100% human-auditable |
| 🚨 **Crisis & Exception Center** | Automatic exception detection across damaged, missing, shortage, and QC failures | Immediate AI resolution with 1-click inventory recovery |
| 🗺️ **Smart Picking Optimizer** | Heuristic TSP / S-Shape shortest-path bin route sequencing | Reduces walking distance by 35% |
| ⚡ **Bottleneck Telemetry** | Cycle time variance analysis across Pick, Pack, QC, and Dispatch gates | Reallocates idle labor from underloaded zones |
| 🔮 **What-If Scenario Sandbox** | Real-time stress simulator for demand spikes, labor deficits, and supplier delays | Proactive mitigation before operational breakdown |
| 🤖 **Grounded AI Copilot** | Natural language operations assistant grounded in live SQLite database | Answers queries using actual application facts |

---

## 🚀 Quick Start & Launch Instructions

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js v18+** (Tested on Node v24)
- **npm v9+**

### 1-Click Launch (Windows)
Double-click `start.bat` or run:
```cmd
start.bat
```
This automatically seeds the database, launches the Python Flask backend on port `5000`, and starts the React Vite frontend on port `3000`.

### Manual Launch

#### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed/seed_data.py
python run.py
```
Backend API will be live at `http://127.0.0.1:5000/api/health`.

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:3000`.

---

## 🎭 Hackathon Demo Scenario (Pre-Configured for Judges)

SmartFulfill AI includes a seeded demo scenario illustrating intelligent scarce inventory arbitration:

### 1. The Operational Crisis
- **Product**: Sony WH-1000XM5 Wireless Noise-Canceling Headphones (`SKU-ELEC-101`)
- **Warehouse A Available Stock**: Exactly **7 units**
- **Order #ORD-2026-0001**: 10 units requested, **Critical Priority**, **SLA in 2 hours**, Customer: *Apex Global Tech (VIP Enterprise)*
- **Order #ORD-2026-0002**: 5 units requested, **Normal Priority**, **SLA in 12 hours**, Customer: *Horizon Retail Direct (Standard)*

### 2. The Decision Engine Behavior
1. Open the **Executive Control Tower** (`/`) to view active SLA Risk alerts.
2. Navigate to **Smart Allocation** (`/allocation`).
3. The system detects an inventory conflict (**15 units demanded vs. 7 units available**).
4. **Decision Output**:
   - **Recommended Action**: Allocate all 7 available units to Order `ORD-2026-0001` immediately (Partial Allocation).
   - **Reasoning**: Critical priority weight + SLA expiry in 2 hours + VIP customer contract.
   - **Controlled Backorder**: 3 units placed on backorder with automated restock PO.
   - **Order B**: Placed on hold pending replenishment.
5. Click **"Authorize Decision & Lock Stock"** to commit the allocation and reserve inventory in Bin A01.

### 3. Step-by-Step Order Lifecycle Progression
- **Smart Picking** (`/picking`): View optimized TSP route ($A01 \to A03$). Click **"Confirm Pick"** or report a missing/damaged unit.
- **Packing Station** (`/packing`): View volumetric container sizing (Box-M), input scale weight, and seal carton.
- **Quality Check** (`/qc`): Perform 5-point checklist verification (SKU match, condition, label barcode) and click **"Pass QC"**.
- **Dispatch**: Return to **Orders** (`/orders`) and click **"Dispatch"** for a celebratory confetti carrier handover!

---

## 🏗️ Technical Architecture

```text
smartfulfill-ai/
├── backend/
│   ├── app/
│   │   ├── config.py              # Application settings & JWT keys
│   │   ├── models/                # SQLAlchemy relational models
│   │   │   └── models.py          # User, Warehouse, Product, Inventory, Order, Tasks, Exceptions, Audits
│   │   ├── decision_engine/       # Independent modular intelligence engines
│   │   │   ├── priority_engine.py       # Dynamic weighted priority scoring
│   │   │   ├── allocation_engine.py     # Multi-order scarce stock arbitration
│   │   │   ├── picking_optimizer.py     # Heuristic TSP / S-shape route optimizer
│   │   │   ├── replenishment_engine.py  # Statistical safety stock & lead-time PO sizing
│   │   │   ├── bottleneck_detector.py   # Station queue cycle delay diagnostics
│   │   │   ├── exception_resolver.py    # Crisis decision tree & automated recovery
│   │   │   └── demand_forecaster.py     # Statistical regression & stockout radar
│   │   ├── ai/
│   │   │   └── copilot_service.py # Live DB grounded natural language assistant
│   │   ├── routes/                # Clean REST API endpoints
│   │   └── __init__.py
│   ├── seed/
│   │   └── seed_data.py           # 3 Warehouses, 50+ Products, 120+ Inventory, 54 Orders
│   ├── tests/
│   │   ├── test_smartfulfill.py   # Unit test suite for all decision engines
│   │   └── test_api_endpoints.py  # Integration test suite for REST endpoints
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/            # UI Design System, MetricCard, DecisionCard, StatusBadge, Timeline
│   │   ├── pages/                 # ControlTower, Orders, Allocation, Picking, Packing, QC, Exceptions, etc.
│   │   ├── context/               # Auth, Warehouse, Toast state management
│   │   ├── services/api.js        # Axios API client with JWT interceptor
│   │   ├── index.css              # Custom Tailwind theme tokens & glassmorphism
│   │   └── App.jsx                # React Router v6 navigation
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── start.bat                      # Windows 1-click launcher
└── README.md
```

---

## 👥 Role-Based Access Personas

The top navbar includes an instant **Demo Persona Switcher**:
- **Admin**: Full access across facilities, system logs, and configuration.
- **Warehouse Manager**: Executive control tower, allocation arbitration, scenario simulator, analytics.
- **Picker**: Zone-specific picking workspace, TSP route checklist, missing/damage reporting.
- **Packer**: Packing station, carton volumetric calibration, parcel sealing.
- **Inventory Manager**: Stock health radar, cycle count adjustment, replenishment PO approvals.

---

## 🧪 Automated Testing

To run the backend unit and integration test suite:
```bash
cd backend
python -m unittest tests/test_smartfulfill.py
python -m unittest tests/test_api_endpoints.py
```
All 15 tests verify mathematical formulas ($Available = Total - Reserved - Damaged - Missing$), allocation conflict resolution, route optimization, and live API endpoints.
