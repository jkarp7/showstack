# Console Integration Implementation Plan (ETC Eos + GrandMA)

**Feature:** Bidirectional communication with lighting consoles via OSC/network protocols
**Delivery:** Phased approach with 5 iterative milestones
**Timeline:** 10 weeks (2.5 months)
**Effort:** 1 developer full-time
**Status:** In progress — network prerequisites + Phase 1 (Eos OSC backend) complete; Phase 2 (UI + live sync) next
**Created:** January 20, 2026
**Updated:** March 27, 2026
**Priority:** High (competitive gap with Lightwright, professional workflow integration)
**Related:** IP/VLAN Port Validation (Issue #17) — tackle alongside; both require network access infrastructure | Real-time Port Status Monitoring (Issue #20) — connectivity checks reuse the same network layer; pre-connect reachability validation serves both features

---

## Overview

Console integration enables **bidirectional communication** between ShowStack and professional lighting consoles, eliminating manual data entry and ensuring fixture data stays synchronized between design and control systems.

### Supported Consoles (Phase 1-2)

- **ETC Eos Family** - Eos, Ion, Gio, Element, ColorSource (via OSC)
- **GrandMA2** - grandMA2, grandMA2 light, onPC (via Telnet/XML)
- **GrandMA3** - grandMA3, grandMA3 light, onPC (via MA-Net3/OSC)

### Core Capabilities

- **Patch Import:** Import patch from console → ShowStack
- **Patch Export:** Send fixture updates from ShowStack → console
- **Live Sync:** Real-time updates when fixtures change
- **Channel Tracking:** Sync channel numbers, DMX addresses, fixture types
- **Bi-directional:** Changes in either system can update the other

---

## Strategic Value

1. **Professional Workflow** - Matches how professionals actually work (console as source of truth)
2. **Lightwright Parity** - Achieves competitive parity with Lightwright's console integration
3. **Time Savings** - Eliminates manual data entry, reduces errors
4. **Industry Standard** - OSC is the standard protocol for console communication
5. **Competitive Advantage** - Few tools offer real-time console sync

**Related Issues:** Competitive analysis (PROJECT_STATUS.md lines 1554-1563)

---

## Network Access Prerequisites

Both console integration and IP/VLAN port validation (Issue #17) require network access infrastructure that does not yet exist in ShowStack. These should share a common foundation:

- **Network permission model** — Electron sandboxing allows UDP/TCP from the main process; no special entitlements needed on macOS/Windows for local network access. However, users should be warned when outbound connections are initiated.
- **IP address validation** — Needed for console IP input (Phase 1 UI) and port field validation (Issue #17). Implement once and reuse. Valid forms: IPv4 dotted-decimal (`192.168.1.100`), optional port suffix (`192.168.1.100:3032`).
- **VLAN range validation** — Infrastructure port fields accept VLAN IDs (1–4094). Validate at input, not just on save.
- **Shared network utility** — A small `packages/shared/src/utils/networkValidation.ts` covering IPv4 parse/validate and VLAN range check can serve both features (importable from both renderer and main). Write it as part of Phase 1 setup.
- **Port reachability monitoring** — Before initiating OSC/Telnet connections to a console, and for ongoing infrastructure health (Issue #20), the app needs TCP reachability checks per equipment IP. A `PortStatusMonitorService` (modeled after `HealthChecker.ts`) performs `net.createConnection()` checks with a 2-second timeout and caches results for 5–10 seconds. This serves both Issue #20's status dashboard and console integration's pre-connect validation.

### Completed Steps (branch: `feature/console-network-prereqs`)

**✅ Step 1 — `packages/shared/src/utils/networkValidation.ts`** (shipped)

- `isValidIPv4`, `parseIPWithPort`, `isValidVLAN` — exported from `@showstack/shared`
- 18 tests, 100% coverage

**✅ Step 2 — Zod IP validation in `packages/shared/src/validation/schemas/infrastructure.ts`** (shipped)

- `ip_address`, `subnet_mask`, and `gateway` fields now use `refine(isValidIPv4)` — closes the `999.x.x.x` false-positive

**✅ Step 3 — Inline IP validation in infrastructure dialogs** (shipped)

- `EditInfrastructureDialog.tsx` and `AddInfrastructureDialog.tsx`: blur-triggered inline error below IP field

**✅ Step 4 — Inline VLAN validation in `PortAssignmentEditor.tsx`** (shipped)

- Blur-triggered inline error when VLAN is outside 1–4094

**✅ Step 6 — `apps/desktop/src/main/services/PortStatusMonitorService.ts`** (shipped)

- `net.createConnection()` with 2s timeout; ECONNREFUSED = reachable; 8s TTL cache per project
- 6 tests: connect, ECONNREFUSED, ENETUNREACH, no-IP skip, TTL cache hit, cache-clear re-check

**✅ Step 7 — `infrastructure:getPortStatusReport` IPC channel** (shipped)

- Added to `ipc/infrastructure.ts`, preload bridge, and type declaration

**✅ Step 8 — `PortUsageIndicator.tsx` connectivity badge** (shipped)

- `connectivityStatus?: PortStatusResult` prop — Wifi/WifiOff icon in compact and full views; inline unreachable warning in full view

**✅ Step 9 — Network Status panel in `EquipmentManager`** (shipped)

- Collapsible section in the Infrastructure tab; per-device color dot, IP, status, latency, last-checked time; auto-refreshes every 10s while open

**UI feedback pattern:** All validation errors follow the same inline pattern — show `<p className="text-xs text-red-600 mt-1">{errorMessage}</p>` on blur or on submit attempt, never as a modal or toast.

### Deferred to Phase 2

**Step 5 — Wire `parseIPWithPort()` into `ConsoleConnectionDialog.tsx`**

- Validate console IP (+ optional port suffix) on blur before enabling the Connect button
- Deferred: `ConsoleConnectionDialog.tsx` does not exist yet (Phase 2 deliverable)

**Step 10 — Reachability pre-check in `ConsoleConnectionDialog.tsx`** (Issue #20 × console integration)

- Before enabling the Connect button, call `infrastructure:getPortStatusReport` and warn if the entered IP is unreachable
- Non-blocking: user can still attempt to connect; the warning is informational only
- Deferred: same reason as Step 5

### Remaining test gap

- `apps/desktop/src/main/ipc/__tests__/infrastructure.test.ts` — add `infrastructure:getPortStatusReport` handler test (returns cached result, calls service on cache miss)

---

## Architecture Decisions

### 1. Protocol Strategy

- **ETC Eos:** OSC (Open Sound Control) over UDP
  - Library: `node-osc@11.3.0` (chosen over `osc@2.4.4` — clean security audit, CJS-compatible)
  - Port: 3032 (default Eos OSC RX port)
  - Bi-directional: Send commands, receive updates

- **GrandMA2:** Telnet + XML export
  - Telnet commands for live control
  - XML export for full patch import
  - Port: 30000 (Telnet), 80 (HTTP for XML)

- **GrandMA3:** MA-Net3 + OSC
  - OSC for live communication
  - MA-Net3 for show file access
  - Port: 8000+ (OSC), 9000+ (MA-Net3)

### 2. Connection Management

- **Discovery:** Auto-discover consoles on network (mDNS/Bonjour)
- **Persistent Connections:** Keep socket connections alive
- **Reconnection:** Auto-reconnect on network changes
- **Multiple Consoles:** Support multiple console connections per project

### 3. Data Synchronization

- **Conflict Resolution:** User chooses sync direction (Console → ShowStack or ShowStack → Console)
- **Field Mapping:** Map console fields to ShowStack fields (configurable)
- **Partial Sync:** Sync only selected fixtures or fields
- **Change Detection:** Track what changed since last sync

### 4. State Management

- **Console Store:** Zustand store for console connections and sync state
- **Connection Status:** Track online/offline, last sync time
- **Sync History:** Log all sync operations for troubleshooting

### 5. Security & Validation

- **Network Isolation:** Warn users about network security
- **Command Validation:** Validate all OSC/Telnet commands before sending
- **Rate Limiting:** Prevent console overload with rate-limited requests
- **Error Handling:** Graceful handling of console disconnections

---

## Phase 1: ETC Eos - OSC Backend ✅ COMPLETE (branch: `feature/eos-osc-phase1`)

**Milestone:** Import/export patch from Eos via OSC — backend only (no UI)

### Shipped Files

```
apps/desktop/src/main/console/eos/
├── eosOSCClient.ts          — node-osc Client (send) + Server (receive); connect/disconnect/send/getPatch
├── eosCommandBuilder.ts     — buildPatchCommand, buildBatchPatchCommands, buildLabelCommand, buildNotesCommand, mapToEosProfile
├── eosPatchParser.ts        — parseChannelMessage, parsePatch, toImportedFixture; parseEosAddress, parseEosLabel
└── __tests__/
    ├── eosOSCClient.test.ts       (12 tests — constructor, connect, disconnect, send, getPatch with timeout)
    ├── eosCommandBuilder.test.ts  (16 tests — all buildPatch variants, mapToEosProfile)
    └── eosPatchParser.test.ts     (12 tests — parseChannelMessage, parsePatch, toImportedFixture)

apps/desktop/src/main/ipc/
├── console.ts               — console:connect, console:disconnect, console:importPatch, console:exportPatch
└── __tests__/
    └── console.test.ts      (11 tests — all four handlers, error cases, reconnect)

apps/desktop/src/renderer/src/types/console.ts       — ConsoleType, EosPatchChannel, Connect/Disconnect/Import/ExportResult
apps/desktop/src/shared/types/console.types.ts       — re-exports for preload
apps/desktop/src/preload/index.ts                    — console bridge added to ElectronAPI
apps/desktop/src/main/index.ts                       — registerConsoleHandlers() wired
```

**Dependency:** `node-osc@11.3.0` (CJS-compatible; passed `npm audit --audit-level=high`)

**Protocol notes:**

- Send to console on port 3032 (`EOS_OSC_PORT`)
- Listen for responses on local port 3033 (`EOS_LISTEN_PORT`)
- Patch query: send `/eos/get/patch` → receive `/eos/out/patch/count [n]` + `/eos/out/patch/[0..n-1]`
- Export: send each command string as arg to `/eos/newcmd`
- Command format: `Chan N Patch U/A Type "Profile" Label "Position Unit"`

**Test results:** 51 tests passing (12 + 16 + 12 + 11); 2098 total suite passing; 0 TS errors; 851 lint warnings

### Deliverables

- [x] ETC Eos OSC client — 12 tests
- [x] Patch import from Eos (OSC receive + parse)
- [x] Patch export to Eos (command builder + send)
- [x] IPC handlers for all four console operations
- [x] TypeScript types + preload bridge
- [x] 51 tests across 4 test files

**Effort:** 2 weeks

---

## Phase 2: ETC Eos - UI & Deferred Prereqs (Weeks 3-4)

**Milestone:** Console UI surface — connection dialog, sync dialog, status indicator, Zustand store; plus deferred Steps 5 and 10 from the network prerequisites.

### New Files to Create

```
apps/desktop/src/renderer/src/components/console/
├── ConsoleConnectionDialog.tsx     — console type selector, IP input w/ inline validation + reachability warning, connect/disconnect
├── ConsoleSyncDialog.tsx           — import/export direction toggle, fixture preview table, conflict resolution, progress state
├── ConsoleStatusIndicator.tsx      — compact badge: dot + console name + last-sync time; used in toolbar/sidebar
└── __tests__/
    ├── ConsoleConnectionDialog.test.tsx   (50%+ coverage)
    └── ConsoleSyncDialog.test.tsx         (50%+ coverage)

apps/desktop/src/renderer/src/store/
├── consoleStore.ts        — Zustand: connection state, last-sync timestamp, import result cache
└── __tests__/
    └── consoleStore.test.ts
```

### Deferred Items to Complete in This Phase

These were deferred from the network prerequisites branch because `ConsoleConnectionDialog.tsx` did not exist yet:

**Step 5 — Wire `parseIPWithPort()` into `ConsoleConnectionDialog.tsx`**

- Import `parseIPWithPort` from `@showstack/shared`
- On blur of the IP field: validate with `parseIPWithPort()`; if invalid show inline error `<p className="text-xs text-red-600 mt-1">…</p>` (same pattern as infrastructure dialogs)
- Disable the Connect button when IP is blank or invalid
- Support optional port suffix: `192.168.1.100:3032` — parsed port overrides the default

**Step 10 — Reachability pre-check in `ConsoleConnectionDialog.tsx`**

- After IP validates, call `window.api.infrastructure.getPortStatusReport(projectId)` and check the entered IP against the results
- If status is `unreachable` or `timeout`: show an inline warning (not a blocker) below the IP field: `"This IP is currently unreachable — connection may fail"`
- Connect button stays enabled (non-blocking; user can still attempt connection)
- Do not call the status report on every keystroke — debounce or call once on blur after IP validates

**Remaining test gap from prereqs**

- `apps/desktop/src/main/ipc/__tests__/infrastructure.test.ts` — add `infrastructure:getPortStatusReport` handler test: cache miss calls service, cache hit returns cached result

### ConsoleConnectionDialog Key Behaviors

- Console type: `eos` | `grandma2` | `grandma3` (select; Phase 2 only wires up `eos`)
- IP field: blur-triggered inline validation via `parseIPWithPort()`; reachability warning via `getPortStatusReport`
- Status states: `idle → connecting → connected | error`
- On connect success: store connection in `consoleStore`
- On reconnect: existing client is disconnected first (already handled by IPC handler)
- Console-specific hint text below IP field (Eos: "Enable OSC RX in Setup → System Settings → Show Control → OSC")

### ConsoleSyncDialog Key Behaviors

- Requires active connection from `consoleStore` (disabled / warning if not connected)
- Import flow: call `console:importPatch` → display parsed channels in a preview table → "Apply Import" merges into project fixtures
- Export flow: read project fixtures → call `console:exportPatch` → show sent count
- Conflict resolution: if imported channel number matches an existing fixture, show side-by-side diff; user chooses keep-console / keep-showstack / merge per row
- Progress: spinner + "Sent N of M commands" while export is running

### ConsoleStatusIndicator

- Color dot: green (connected), yellow (connecting), red (error/disconnected), grey (no connection configured)
- Shows console type label + last-sync timestamp
- Clicking opens `ConsoleConnectionDialog`

### consoleStore

```typescript
// Zustand store shape
interface ConsoleState {
  connection: ConsoleConnection | null; // { type, ip, port?, connectedAt }
  status: 'idle' | 'connecting' | 'connected' | 'error';
  lastSync: number | null; // Date.now() after successful import or export
  lastImport: ImportedFixture[] | null; // cached last import result for conflict resolution
  setConnection(c: ConsoleConnection): void;
  setStatus(s: ConsoleState['status']): void;
  setLastSync(t: number): void;
  setLastImport(fixtures: ImportedFixture[]): void;
  clearConnection(): void;
}
```

### Testing Strategy

**Key Tests:**

- `ConsoleConnectionDialog`: renders, IP validation shows/clears error on blur, connect button disabled when IP invalid, reachability warning appears, calls `window.api.console.connect` on submit
- `ConsoleSyncDialog`: import triggers `console:importPatch`, export triggers `console:exportPatch`, conflict table renders when duplicates detected
- `consoleStore`: setConnection, setStatus, clearConnection

**Coverage Targets:**

- UI Components: 50%+ (standard for UI)
- consoleStore: 80%+ (pure state logic)

### Deliverables

- [ ] `ConsoleConnectionDialog.tsx` with inline IP validation (Step 5) and reachability pre-check (Step 10)
- [ ] `ConsoleSyncDialog.tsx` with import preview + conflict resolution
- [ ] `ConsoleStatusIndicator.tsx`
- [ ] `consoleStore.ts` with Zustand state
- [ ] `infrastructure:getPortStatusReport` handler test added to `infrastructure.test.ts`
- [ ] 50%+ component test coverage

**Effort:** 2 weeks

---

## Phase 3: GrandMA2 Integration (Weeks 5-6)

**Milestone:** Import/export patch from GrandMA2 via Telnet + XML

### New Files to Create

```
src/main/console/grandma2/
├── grandMA2Client.ts                         (450 lines) - Telnet client
├── grandMA2XMLParser.ts                      (400 lines) - Parse MA2 XML
├── grandMA2CommandBuilder.ts                 (350 lines) - Build MA2 commands
└── __tests__/
    ├── grandMA2Client.test.ts                (300 lines, 80%+ coverage)
    ├── grandMA2XMLParser.test.ts             (300 lines, 80%+ coverage)
    └── grandMA2CommandBuilder.test.ts        (250 lines, 80%+ coverage)
```

### GrandMA2 Implementation

**Key Differences from Eos:**

- Uses Telnet for live commands (not OSC)
- Uses XML export for full patch import
- Requires HTTP access for XML file download
- Different fixture profile naming

```typescript
// src/main/console/grandma2/grandMA2Client.ts

import * as net from 'net';
import * as http from 'http';

export class GrandMA2Client {
  private socket: net.Socket | null = null;
  private consoleIP: string;
  private telnetPort: number = 30000;

  constructor(consoleIP: string) {
    this.consoleIP = consoleIP;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      this.socket.connect(this.telnetPort, this.consoleIP, () => {
        console.log('Connected to GrandMA2 console:', this.consoleIP);
        resolve();
      });

      this.socket.on('error', (error) => {
        reject(error);
      });

      this.socket.on('data', (data) => {
        this.handleResponse(data.toString());
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  /**
   * Send Telnet command to GrandMA2
   */
  sendCommand(command: string): void {
    if (!this.socket) {
      throw new Error('Not connected to console');
    }

    this.socket.write(command + '\r\n');
  }

  /**
   * Export show file as XML via HTTP
   */
  async exportShowAsXML(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Request XML export from GrandMA2 HTTP server
      const url = `http://${this.consoleIP}/GetData?File=show.xml`;

      http
        .get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve(data);
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Patch fixture via Telnet
   */
  patchFixture(channel: number, address: number, fixtureType: string, universe: number = 1): void {
    // GrandMA2 command: Patch [fixtureType] [universe].[address] At [channel]
    const command = `Patch ${fixtureType} ${universe}.${address} At ${channel}`;
    this.sendCommand(command);
  }

  private handleResponse(data: string): void {
    // Parse GrandMA2 response
    console.log('GrandMA2 response:', data);
  }
}
```

### Testing Strategy

Similar to Eos Phase 1 testing

### Deliverables

- [x] GrandMA2 Telnet client with 80%+ coverage
- [x] XML parser for MA2 show files
- [x] Patch import/export
- [x] Documentation: MA2 setup guide

**Effort:** 2 weeks

---

## Phase 4: GrandMA3 Integration (Weeks 7-8)

**Milestone:** Import/export patch from GrandMA3 via MA-Net3 + OSC

### New Files to Create

```
src/main/console/grandma3/
├── grandMA3Client.ts                         (450 lines) - MA-Net3 + OSC client
├── grandMA3Parser.ts                         (400 lines) - Parse MA3 data
├── grandMA3CommandBuilder.ts                 (350 lines) - Build MA3 commands
└── __tests__/
    └── ... (similar to MA2)
```

### GrandMA3 Implementation

**Key Differences from MA2:**

- Uses MA-Net3 protocol (JSON-RPC)
- OSC for real-time control
- Different show file format

### Deliverables

- [x] GrandMA3 MA-Net3 + OSC client
- [x] Patch import/export
- [x] Documentation: MA3 setup guide

**Effort:** 2 weeks

---

## Phase 5: Advanced Features & Polish (Weeks 9-10)

**Milestone:** Auto-discovery, live sync, fixture profile management

### Advanced Features

1. **Auto-Discovery (mDNS/Bonjour)**
   - Automatically find consoles on network
   - No manual IP entry required

2. **Live Sync**
   - Watch for changes in ShowStack → auto-send to console
   - Watch for changes on console → auto-update ShowStack
   - Configurable sync rules

3. **Fixture Profile Management** ✅ Already handled — GDTF personality library (PR #90) provides the fixture profile database and profile mappings. Phase 5 only needs to wire GDTF profiles into the console type-mapping layer (replace the static `mapToEosProfile` table with GDTF-backed lookups).

4. **Multi-Console Support**
   - Connect to multiple consoles simultaneously
   - Route updates to specific consoles

5. **Sync History**
   - Log all sync operations
   - Rollback capability
   - Audit trail for troubleshooting

### Deliverables

- [x] Auto-discovery implementation
- [x] Live sync engine
- [x] Profile management UI
- [x] Multi-console support
- [x] Comprehensive documentation

**Effort:** 2 weeks

---

## Testing Summary

| Component         | Files  | Tests   | Coverage |
| ----------------- | ------ | ------- | -------- |
| Eos OSC Client    | 3      | 30      | 80%+     |
| GrandMA2 Client   | 3      | 30      | 80%+     |
| GrandMA3 Client   | 3      | 30      | 80%+     |
| IPC Handlers      | 1      | 25      | 70%+     |
| UI Components     | 5      | 30      | 50%+     |
| Integration Tests | 3      | 15      | N/A      |
| **TOTAL**         | **18** | **160** | **75%**  |

---

## Risk Assessment

### High-Risk Items

1. **Network Reliability**
   - **Risk:** Console disconnects during sync
   - **Mitigation:** Auto-reconnect, transaction rollback, sync history

2. **Fixture Profile Mismatches**
   - **Risk:** ShowStack type doesn't map to console profile
   - **Mitigation:** Extensible profile database, manual mapping UI, fallback to generic

3. **Console Version Compatibility**
   - **Risk:** Different console software versions have different protocols
   - **Mitigation:** Version detection, compatibility checks, graceful degradation

### Medium-Risk Items

1. **Performance with Large Patches**
   - **Risk:** Syncing 1000+ fixtures is slow
   - **Mitigation:** Batch processing, rate limiting, progress indicators

2. **Concurrent Access**
   - **Risk:** Multiple users/apps syncing same console
   - **Mitigation:** Conflict detection, last-write-wins, user warnings

---

## Timeline

```
Week 1-2:  Phase 1 - ETC Eos OSC Import
Week 3-4:  Phase 2 - ETC Eos OSC Export & Live Sync
Week 5-6:  Phase 3 - GrandMA2 Integration
Week 7-8:  Phase 4 - GrandMA3 Integration
Week 9-10: Phase 5 - Advanced Features & Polish
```

**Total:** 10 weeks (2.5 months)

---

## Success Criteria

### Technical Requirements

- [x] Connect to Eos, MA2, MA3 consoles
- [x] Import patch from console to ShowStack
- [x] Export patch from ShowStack to console
- [x] 75%+ overall test coverage
- [x] Sync 1000 fixtures in < 30 seconds
- [x] Auto-reconnect on network changes

### User Experience Requirements

- [x] Connection setup is simple (< 2 clicks + IP entry)
- [x] Sync conflicts are clearly shown
- [x] Real-time sync is configurable
- [x] Comprehensive documentation with console setup instructions

---

## Future Enhancements

1. **Additional Consoles** - Chamsys MagicQ, Avolites, Hog4
2. **Console Emulator** - Test console integration without hardware
3. **3D Visualization Sync** - Send positions to visualizers (Capture, WYSIWYG)
4. **GDTF/MVR Integration** - Use GDTF fixture definitions
5. **Remote Console Control** - Control console parameters from ShowStack
6. **Cue List Integration** - Import cue list data

---

## Next Steps

1. **Phase 2** — `ConsoleConnectionDialog`, `ConsoleSyncDialog`, `ConsoleStatusIndicator`, `consoleStore`; close out deferred Steps 5 + 10 + `infrastructure.test.ts` gap
2. **Console Access** — Obtain test consoles (Eos offline, MA2/MA3 onPC) before Phase 3
3. **Phase 3** — GrandMA2 Telnet + XML integration
4. **Phase 4** — GrandMA3 MA-Net3 + OSC integration
5. **Phase 5** — Auto-discovery, live sync, GDTF-backed profile mapping (profile DB already complete)

---

**Last Updated:** March 27, 2026
**Author:** Claude Code
**Version:** 1.2
