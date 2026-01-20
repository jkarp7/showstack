# Console Integration Implementation Plan (ETC Eos + GrandMA)

**Feature:** Bidirectional communication with lighting consoles via OSC/network protocols
**Delivery:** Phased approach with 5 iterative milestones
**Timeline:** 10 weeks (2.5 months)
**Effort:** 1 developer full-time
**Status:** Planned (not yet implemented)
**Created:** January 2026
**Priority:** High (competitive gap with Lightwright, professional workflow integration)

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

## Architecture Decisions

### 1. Protocol Strategy
- **ETC Eos:** OSC (Open Sound Control) over UDP
  - Library: `osc` or `node-osc`
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

## Phase 1: ETC Eos - OSC Import (Weeks 1-2)

**Milestone:** Import patch from Eos console into ShowStack

### New Files to Create

```
src/main/console/
├── eos/
│   ├── eosOSCClient.ts                       (400 lines) - OSC client
│   ├── eosCommandBuilder.ts                  (300 lines) - Build OSC commands
│   ├── eosPatchParser.ts                     (350 lines) - Parse Eos patch data
│   └── __tests__/
│       ├── eosOSCClient.test.ts              (300 lines, 80%+ coverage)
│       ├── eosCommandBuilder.test.ts         (200 lines, 80%+ coverage)
│       └── eosPatchParser.test.ts            (250 lines, 80%+ coverage)

src/main/ipc/
├── console.ts                                (500 lines) - Console IPC handlers
└── __tests__/
    └── console.test.ts                       (350 lines, 70%+ coverage)

src/renderer/src/types/
└── console.ts                                (200 lines) - TypeScript interfaces
```

### Dependencies

```bash
npm install osc@2.4.4
npm install -D @types/osc
```

### ETC Eos OSC Implementation

#### 1. OSC Client

```typescript
// src/main/console/eos/eosOSCClient.ts

import { UDPPort } from 'osc';

export class EosOSCClient {
  private udpPort: UDPPort;
  private consoleIP: string;
  private consolePort: number = 3032; // Eos OSC RX port
  private connected: boolean = false;

  constructor(consoleIP: string) {
    this.consoleIP = consoleIP;

    this.udpPort = new UDPPort({
      localAddress: '0.0.0.0',
      localPort: 0, // Auto-assign
      remoteAddress: this.consoleIP,
      remotePort: this.consolePort,
      metadata: true
    });

    this.udpPort.on('ready', () => {
      this.connected = true;
      console.log('Connected to Eos console:', this.consoleIP);
    });

    this.udpPort.on('message', (message) => {
      this.handleMessage(message);
    });

    this.udpPort.on('error', (error) => {
      console.error('OSC error:', error);
      this.connected = false;
    });
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.udpPort.open();

      // Wait for ready event or timeout
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);

      this.udpPort.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  disconnect(): void {
    this.udpPort.close();
    this.connected = false;
  }

  /**
   * Send OSC command to Eos console
   */
  sendCommand(address: string, args: any[] = []): void {
    if (!this.connected) {
      throw new Error('Not connected to console');
    }

    this.udpPort.send({
      address,
      args
    });
  }

  /**
   * Get patch data from Eos
   */
  async getPatch(): Promise<EosPatchData> {
    // Request patch data from Eos
    // Eos OSC address: /eos/out/patch/[channel]
    this.sendCommand('/eos/get/patch');

    // Wait for response (collected via handleMessage)
    return new Promise((resolve) => {
      // Implement response collection logic
    });
  }

  /**
   * Patch fixture to Eos
   */
  patchFixture(channel: number, address: number, type: string, universe: number = 1): void {
    // Eos OSC command: /eos/newcmd
    // Command format: "Chan [channel] Patch [universe]/[address] Type [type]"
    const command = `Chan ${channel} Patch ${universe}/${address} Type ${type}`;
    this.sendCommand('/eos/newcmd', [command]);
  }

  /**
   * Update channel label
   */
  updateChannelLabel(channel: number, label: string): void {
    const command = `Chan ${channel} Label ${label}`;
    this.sendCommand('/eos/newcmd', [command]);
  }

  private handleMessage(message: any): void {
    // Parse incoming OSC messages from Eos
    console.log('Received OSC message:', message);
  }
}
```

#### 2. Command Builder

```typescript
// src/main/console/eos/eosCommandBuilder.ts

export class EosCommandBuilder {
  /**
   * Build Eos patch command from fixture data
   */
  buildPatchCommand(fixture: Fixture): string {
    const parts: string[] = [];

    // Channel
    if (fixture.channel) {
      parts.push(`Chan ${fixture.channel}`);
    }

    // Patch address
    if (fixture.universe && fixture.dmx_address) {
      parts.push(`Patch ${fixture.universe}/${fixture.dmx_address}`);
    }

    // Type
    if (fixture.type) {
      // Map ShowStack type to Eos profile
      const eosType = mapToEosProfile(fixture.type);
      parts.push(`Type ${eosType}`);
    }

    // Label (position + unit)
    const label = [fixture.position, fixture.unit_number].filter(Boolean).join(' ');
    if (label) {
      parts.push(`Label "${label}"`);
    }

    return parts.join(' ');
  }

  /**
   * Build batch patch commands for multiple fixtures
   */
  buildBatchPatchCommands(fixtures: Fixture[]): string[] {
    return fixtures.map(f => this.buildPatchCommand(f));
  }
}

/**
 * Map ShowStack fixture type to Eos profile name
 */
function mapToEosProfile(showstackType: string): string {
  // Map common fixture types to Eos profiles
  const mappings: Record<string, string> = {
    'ETC Source Four 19°': 'Source Four 19deg',
    'ETC Source Four 26°': 'Source Four 26deg',
    'MAC Aura': 'MAC Aura',
    'MAC Viper Profile': 'MAC Viper Profile',
    // ... extensive fixture type mappings
  };

  return mappings[showstackType] || showstackType;
}
```

#### 3. Patch Parser

```typescript
// src/main/console/eos/eosPatchParser.ts

export class EosPatchParser {
  /**
   * Parse Eos patch data into ShowStack fixture format
   */
  parsePatch(eosPatchData: EosPatchData): Partial<Fixture>[] {
    const fixtures: Partial<Fixture>[] = [];

    for (const channel of eosPatchData.channels) {
      fixtures.push({
        channel: String(channel.number),
        universe: channel.universe,
        dmx_address: channel.address,
        type: mapFromEosProfile(channel.profile),
        position: parseLabel(channel.label).position,
        unit_number: parseLabel(channel.label).unit,
        manufacturer: extractManufacturer(channel.profile),
        mode: channel.mode,
        // Eos-specific fields
        eos_channel: channel.number,
        eos_profile: channel.profile,
        import_source: 'eos',
        last_console_sync: Date.now()
      });
    }

    return fixtures;
  }
}

/**
 * Map Eos profile to ShowStack fixture type
 */
function mapFromEosProfile(eosProfile: string): string {
  const mappings: Record<string, string> = {
    'Source Four 19deg': 'ETC Source Four 19°',
    'Source Four 26deg': 'ETC Source Four 26°',
    'MAC Aura': 'MAC Aura',
    // ... extensive mappings
  };

  return mappings[eosProfile] || eosProfile;
}

/**
 * Parse Eos channel label into position and unit
 */
function parseLabel(label: string): { position: string; unit: number | null } {
  // Common formats:
  // "1st Electric 1"
  // "FOH L 12"
  // "Floor 3"

  const match = label.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return {
      position: match[1],
      unit: parseInt(match[2])
    };
  }

  return { position: label, unit: null };
}
```

### IPC Handlers

```typescript
// src/main/ipc/console.ts

export function registerConsoleHandlers(): void {
  // Connect to console
  ipcMain.handle('console:connect', async (_event, consoleType: string, consoleIP: string) => {
    try {
      if (consoleType === 'eos') {
        const client = new EosOSCClient(consoleIP);
        await client.connect();
        // Store client instance
        return { success: true, connected: true };
      }
      return { success: false, error: 'Unknown console type' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Import patch from console
  ipcMain.handle('console:importPatch', async (_event, consoleType: string) => {
    try {
      if (consoleType === 'eos') {
        const client = getEosClient(); // Retrieve stored client
        const patchData = await client.getPatch();
        const parser = new EosPatchParser();
        const fixtures = parser.parsePatch(patchData);
        return { success: true, fixtures };
      }
      return { success: false, error: 'Unknown console type' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Send patch to console
  ipcMain.handle('console:exportPatch', async (
    _event,
    consoleType: string,
    fixtures: Fixture[]
  ) => {
    try {
      if (consoleType === 'eos') {
        const client = getEosClient();
        const builder = new EosCommandBuilder();
        const commands = builder.buildBatchPatchCommands(fixtures);

        for (const command of commands) {
          client.sendCommand('/eos/newcmd', [command]);
          await delay(100); // Rate limit to avoid overwhelming console
        }

        return { success: true, sent: commands.length };
      }
      return { success: false, error: 'Unknown console type' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Disconnect from console
  ipcMain.handle('console:disconnect', async (_event, consoleType: string) => {
    if (consoleType === 'eos') {
      const client = getEosClient();
      client.disconnect();
      return { success: true };
    }
    return { success: false, error: 'Unknown console type' };
  });
}
```

### Testing Strategy

**Key Tests:**
- OSC client connection/disconnection
- OSC command sending
- Patch data parsing
- Fixture type mapping (Eos ↔ ShowStack)
- Label parsing
- Command building
- Error handling (network timeout, invalid commands)

**Coverage Targets:**
- OSC Client: 80%+ (critical utility)
- Command Builder: 80%+ (critical utility)
- Patch Parser: 80%+ (critical utility)
- IPC Handlers: 70%+ (IPC handlers)

### Deliverables
- [x] ETC Eos OSC client with 80%+ coverage
- [x] Patch import from Eos
- [x] Command builder with fixture type mapping
- [x] IPC handlers with 70%+ coverage
- [x] Integration tests
- [x] Documentation: Eos setup guide, supported profiles

**Effort:** 2 weeks

---

## Phase 2: ETC Eos - OSC Export & Live Sync (Weeks 3-4)

**Milestone:** Send patch updates to Eos, real-time sync

### New Files to Create

```
src/renderer/src/components/console/
├── ConsoleConnectionDialog.tsx               (400 lines) - Connection UI
├── ConsoleSyncDialog.tsx                     (500 lines) - Sync UI with conflict resolution
├── ConsoleStatusIndicator.tsx                (150 lines) - Connection status
└── __tests__/
    ├── ConsoleConnectionDialog.test.tsx      (250 lines, 50%+ coverage)
    └── ConsoleSyncDialog.test.tsx            (300 lines, 50%+ coverage)

src/renderer/src/store/
├── consoleStore.ts                           (350 lines) - Console state
└── __tests__/
    └── consoleStore.test.ts                  (200 lines)
```

### Console Connection Dialog

```typescript
// src/renderer/src/components/console/ConsoleConnectionDialog.tsx

export function ConsoleConnectionDialog({ onClose }: Props) {
  const [consoleType, setConsoleType] = useState<'eos' | 'grandma2' | 'grandma3'>('eos');
  const [consoleIP, setConsoleIP] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  const handleConnect = async () => {
    setStatus('connecting');

    const result = await window.api.console.connect(consoleType, consoleIP);

    if (result.success) {
      setStatus('connected');
      // Save connection to console store
      useConsoleStore.getState().setConnection({
        type: consoleType,
        ip: consoleIP,
        connected: true,
        lastSync: null
      });
    } else {
      setStatus('error');
      alert(`Connection failed: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[500px] p-6">
        <h2 className="text-2xl font-bold mb-4">Connect to Console</h2>

        <div className="space-y-4">
          {/* Console Type */}
          <div className="form-group">
            <label>Console Type</label>
            <select
              value={consoleType}
              onChange={(e) => setConsoleType(e.target.value as any)}
              className="form-select"
            >
              <option value="eos">ETC Eos Family</option>
              <option value="grandma2">GrandMA2</option>
              <option value="grandma3">GrandMA3</option>
            </select>
          </div>

          {/* IP Address */}
          <div className="form-group">
            <label>Console IP Address</label>
            <input
              type="text"
              value={consoleIP}
              onChange={(e) => setConsoleIP(e.target.value)}
              placeholder="192.168.1.100"
              className="form-input"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {consoleType === 'eos' && 'Ensure OSC RX is enabled on Eos (Setup → System Settings → Show Control → OSC)'}
              {consoleType === 'grandma2' && 'Ensure Telnet is enabled on GrandMA2 (Setup → Network → Telnet)'}
              {consoleType === 'grandma3' && 'Ensure MA-Net3 is configured on GrandMA3'}
            </p>
          </div>

          {/* Status */}
          {status !== 'idle' && (
            <div className={`p-3 rounded ${
              status === 'connected' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
              status === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
              'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
            }`}>
              {status === 'connecting' && 'Connecting...'}
              {status === 'connected' && '✓ Connected successfully'}
              {status === 'error' && '✗ Connection failed'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            {status === 'connected' ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleConnect}
            disabled={!consoleIP || status === 'connecting' || status === 'connected'}
            className="btn-primary"
          >
            {status === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Console Sync Dialog

```typescript
// src/renderer/src/components/console/ConsoleSyncDialog.tsx

export function ConsoleSyncDialog({ onClose }: Props) {
  const [syncDirection, setSyncDirection] = useState<'import' | 'export'>('import');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const connection = useConsoleStore(state => state.connection);

  const handleImport = async () => {
    setSyncing(true);

    const result = await window.api.console.importPatch(connection.type);

    if (result.success) {
      // Show fixtures to import with conflict resolution
      setResult({
        fixtures: result.fixtures,
        conflicts: detectConflicts(result.fixtures)
      });
    }

    setSyncing(false);
  };

  const handleExport = async () => {
    setSyncing(true);

    const fixtures = useFixtureStore.getState().fixtures;
    const result = await window.api.console.exportPatch(connection.type, fixtures);

    if (result.success) {
      setResult({ sent: result.sent, errors: [] });
    }

    setSyncing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Sync with {connection.type.toUpperCase()}</h2>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Sync Direction */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Sync Direction</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSyncDirection('import')}
                className={`px-4 py-2 rounded ${
                  syncDirection === 'import' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Import from Console → ShowStack
              </button>
              <button
                onClick={() => setSyncDirection('export')}
                className={`px-4 py-2 rounded ${
                  syncDirection === 'export' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                Export from ShowStack → Console
              </button>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div>
              {/* Show import result with conflicts */}
              {/* Show export result with success count */}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            onClick={syncDirection === 'import' ? handleImport : handleExport}
            disabled={syncing}
            className="btn-primary"
          >
            {syncing ? 'Syncing...' : syncDirection === 'import' ? 'Import Patch' : 'Export Patch'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Testing Strategy

**Key Tests:**
- Connection dialog UI
- Sync dialog with import/export
- Status indicator updates
- Error handling (connection timeout, sync failures)
- Conflict detection and resolution

**Coverage Targets:**
- UI Components: 50%+ (standard for UI)

### Deliverables
- [x] Console connection dialog
- [x] Sync dialog with conflict resolution
- [x] Export patch to Eos
- [x] Status indicator
- [x] 50%+ component test coverage
- [x] Documentation: Export guide, sync workflows

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

      http.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (error) => {
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

3. **Fixture Profile Management**
   - Downloadable fixture profile database
   - User-editable profile mappings
   - Profile import from manufacturers

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

| Component | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| Eos OSC Client | 3 | 30 | 80%+ |
| GrandMA2 Client | 3 | 30 | 80%+ |
| GrandMA3 Client | 3 | 30 | 80%+ |
| IPC Handlers | 1 | 25 | 70%+ |
| UI Components | 5 | 30 | 50%+ |
| Integration Tests | 3 | 15 | N/A |
| **TOTAL** | **18** | **160** | **75%** |

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

1. **Team Review** - Review plan with stakeholders
2. **Console Access** - Obtain test consoles (Eos offline, MA2/MA3 onPC)
3. **Network Setup** - Set up test network environment
4. **Protocol Research** - Detailed protocol documentation review
5. **Begin Phase 1** - Start with ETC Eos OSC implementation

---

**Last Updated:** January 20, 2026
**Author:** Claude Code
**Version:** 1.0
