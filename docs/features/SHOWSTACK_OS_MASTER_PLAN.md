# ShowStack OS: Strategic Master Plan

**Date:** February 3, 2026
**Objective:** Transition ShowStack from a Lighting App to a Production Operating System.

---

## Executive Summary
To transform ShowStack from a "lighting tool" into a "Production Operating System," the architecture must stop treating Sound, Video, and Production as separate silos. Instead, they must be viewed as different *views* of the same underlying reality: **Resources** (Equipment/People) interacting across **Time** (Schedule) and **Space** (Venues).

This document outlines the architectural pivot required to support this scaling, moving from a single-discipline utility to a multi-discipline platform.

---

## Part 1: The Foundation (Criticality: High)
*Goal: Stabilize the current codebase to support future complexity.*

### 1. Data Integrity & Persistence
* **Action:** Migrate from `sql.js` (in-memory) to `better-sqlite3` (native filesystem WAL mode) immediately.
* **Reasoning:** Prevents data loss during crashes and enables handling large datasets (10k+ items) without Out-Of-Memory (OOM) errors. This is the prerequisite for any "Pro" feature.

### 2. Type Safety & Validation (The "Contract")
* **Action:** Implement **Zod** schemas for all core entities (`Fixture`, `Project`).
* **Action:** Create a `packages/shared` workspace to share these schemas between the Electron App and the future Cloud Backend.
* **Reasoning:** As modules are added, data shape becomes complex. Zod ensures that a "Speaker" object from the Cloud doesn't crash the "Budget" calculator in the Desktop app.

### 3. Service Layer Abstraction
* **Action:** Extract logic from IPC handlers into discrete Services (`FixtureService`, `InventoryService`).
* **Reasoning:** Allows swapping the data source (Local DB vs. Cloud DB) without rewriting the UI or business logic.

---

## Part 2: The "Operating System" Architecture
*Goal: Build the shared engines that power all modules.*

### 4. Unified Resource Model (URM)
* **Concept:** A single "Truth" for physical assets.
* **Implementation:**
    * **Core Table:** `Assets` (ID, Weight, Cost, UUID, ModuleType).
    * **Detail Tables:** `Fixtures` (linked to AssetID), `AudioDevices`, `VideoSurfaces`.
* **Benefit:** The **Touring Module** can instantly calculate "Total Truck Weight" by summing the `Assets` table, without needing to process DMX addresses or Audio frequencies.

### 5. The Signal Graph Engine
* **Concept:** A universal way to connect things.
* **Implementation:** A `Connections` table that tracks flow between UUIDs.
    * *Lighting:* Dimmer -> Fixture
    * *Sound:* Console -> Amp -> Speaker
    * *Video:* Server -> Processor -> Wall
* **Benefit:** Enables a "System Status" dashboard that shows health across all disciplines in one view.

### 6. The Context Engine (Time & Space)
* **Spatial:** Define `Locations` (e.g., "FOH Truss") as objects. If "FOH Truss" moves, all Lights, Speakers, and Projectors attached to it update their coordinates.
* **Temporal:** A `ProductionSchedule` service. If "Load In" shifts by 2 hours, the **Labor Module** automatically recalculates overtime costs for all departments.

---

## Part 3: Future Module Strategy

### Sound Module
* **Focus:** Frequency Coordination (RF) and Signal Flow.
* **OS Integration:** Uses the **Signal Graph** for patching and **URM** for rack weights.

### Video Module
* **Focus:** Bandwidth calculation and Pixel Mapping.
* **OS Integration:** Uses the **URM** for power draw (LED walls are hungry) and **Spatial Engine** for projection throw distances.

### Production Management Module
* **Focus:** Scheduling, Labor, Logistics.
* **OS Integration:** Read-only access to all other modules to aggregate data (Headcounts, budgets, schedules). **This is the "Dashboard" of the OS.**

### Touring Module
* **Focus:** Manifests (Carnets), Travel, Venues.
* **OS Integration:** Generates Truck Packs based on the **URM** dimensions/weights.

### Producing Module
* **Focus:** High-level financials, ROI, Rights.
* **OS Integration:** Aggregates real-time costs from the **Production Module** vs. Budget.

---

## Part 4: Implementation Roadmap (Next 6 Months)

### Phase 1: Stabilization (Days 1–30)
* **Week 1:** Replace `sql.js` with `better-sqlite3`. Fix data persistence.
* **Week 2:** Implement Zod Schemas and refactor IPC handlers into Services.
* **Week 3:** Setup Monorepo (`apps/desktop`, `packages/shared`).
* **Week 4:** Implement "Red Mode" UI and Command Palette (Quick wins for UX).

### Phase 2: The OS Core (Months 2–3)
* **Month 2:** Deploy Cloud Backend (Postgres/Prisma). Implement Basic Auth.
* **Month 3:** Build the **Unified Resource Model** in the database. Migrate existing `fixtures` data into this new structure.

### Phase 3: Connectivity (Months 4–5)
* **Month 4:** Build the **Signal Graph Engine**. Refactor Lighting Power to use this engine.
* **Month 5:** Release **Real-Time Collaboration** (Sync).

### Phase 4: Expansion (Month 6+)
* **Month 6:** Launch **Production Module** (Beta). Since the URM is built, this module simply aggregates existing data into Budgets and Schedules.
* **Month 7:** Launch **Sound Module**.

---

## Criticality Matrix

| Recommendation | Criticality | Justification |
| :--- | :--- | :--- |
| **Migrate off sql.js** | **CRITICAL** | Production data safety is non-negotiable. |
| **Zod / Type Safety** | **HIGH** | Essential for preventing sync corruption. |
| **Unified Resource Model** | **HIGH** | The foundation for Multi-Discipline scaling. |
| **Red Mode / UI** | **MEDIUM** | High user value, but not structurally critical. |
| **Signal Graph** | **MEDIUM** | Required for Sound/Video, can wait for Phase 3. |
