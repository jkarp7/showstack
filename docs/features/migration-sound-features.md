# Sound Features Migration Guide
## Implementing Minotaur Parity in ShowStack

**Document Version:** 1.0
**Created:** December 29, 2025
**Purpose:** Technical implementation guide for adding sound features to ShowStack
**Target:** Full Minotaur Sound System Database feature parity

---

## 🎯 Overview

This document provides a comprehensive migration guide for implementing sound design and management features in ShowStack to achieve parity with Minotaur Sound System Database.

**Key Principles:**
- All sound features integrated into unified ShowStack application
- Sound features activated by Sound Edition license (or higher editions)
- Shared infrastructure with lighting features (database, UI framework)
- Role-based UI shows sound-specific views when sound features are active

---

## 📦 Implementation Phases

### Phase 1: Sound Equipment Foundation (Months 1-2)
### Phase 2: Cable Management (Months 3-4)
### Phase 3: Wireless Microphone System (Months 5-6)
### Phase 4: Audio Patching (Months 7-8)
### Phase 5: Speaker/Box Management (Months 9-10)
### Phase 6: Power Management (Month 11)
### Phase 7: Paperwork & Reports (Month 12)
### Phase 8: Console Integration (Months 13-14)
### Phase 9: Polish & Launch (Months 15-16)

---

## 🗄️ Database Schema Extensions

### New Tables Required

All tables should be added to the existing ShowStack SQLite database with proper foreign key relationships to the existing `projects` table.

#### 1. Sound Equipment Types

```sql
CREATE TABLE sound_equipment_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK(category IN (
    'microphone', 'speaker', 'processor', 'playback',
    'amplifier', 'cable', 'wireless', 'other'
  )),
  manufacturer TEXT,
  model TEXT,
  specifications TEXT, -- JSON string
  power_watts INTEGER,
  voltage INTEGER DEFAULT 120,
  weight_lbs REAL,
  default_library INTEGER DEFAULT 0, -- boolean: 1 = default library item
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_sound_equipment_types_project (project_id),
  INDEX idx_sound_equipment_types_category (category)
);

-- Trigger to update updated_at
CREATE TRIGGER update_sound_equipment_types_timestamp
AFTER UPDATE ON sound_equipment_types
BEGIN
  UPDATE sound_equipment_types
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 2. Sound Equipment Inventory

```sql
CREATE TABLE sound_equipment (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  equipment_type_id TEXT REFERENCES sound_equipment_types(id),

  -- Basic info
  position TEXT, -- Stage position or rack location
  unit_number TEXT,
  purpose TEXT,
  location TEXT, -- Physical location in venue

  -- Acquisition
  source TEXT, -- 'rental', 'owned', 'provided', etc.
  rental_house TEXT,
  cost_per_unit REAL,
  quantity INTEGER DEFAULT 1,

  -- Status
  status TEXT DEFAULT 'needed' CHECK(status IN (
    'needed', 'ordered', 'in-stock', 'installed',
    'tested', 'struck', 'returned'
  )),

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_sound_equipment_project (project_id),
  INDEX idx_sound_equipment_type (equipment_type_id),
  INDEX idx_sound_equipment_status (status)
);

CREATE TRIGGER update_sound_equipment_timestamp
AFTER UPDATE ON sound_equipment
BEGIN
  UPDATE sound_equipment
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 3. Wireless Microphones

```sql
CREATE TABLE wireless_mics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Assignment
  role TEXT, -- Character/performer name
  actor TEXT,
  track_number INTEGER, -- For musicals with ensemble tracks

  -- Equipment
  mic_type TEXT CHECK(mic_type IN ('handheld', 'lavalier', 'headset', 'instrument')),
  transmitter_model TEXT,
  transmitter_serial TEXT,
  receiver_model TEXT,
  receiver_serial TEXT,
  bodypack_location TEXT, -- 'belt', 'bra', 'ankle', etc.

  -- Frequency
  frequency_mhz REAL,
  frequency_group TEXT, -- Manufacturer frequency group
  frequency_channel TEXT, -- Manufacturer channel number
  tv_channel TEXT, -- TV channel for interference checking

  -- Placement
  antenna_location TEXT,
  receiver_rack TEXT,
  receiver_position TEXT,

  -- Status
  status TEXT DEFAULT 'assigned' CHECK(status IN (
    'assigned', 'tested', 'ready', 'in-use', 'issue', 'dark'
  )),

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_wireless_mics_project (project_id),
  INDEX idx_wireless_mics_frequency (frequency_mhz),
  INDEX idx_wireless_mics_role (role)
);

CREATE TRIGGER update_wireless_mics_timestamp
AFTER UPDATE ON wireless_mics
BEGIN
  UPDATE wireless_mics
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 4. Frequency Coordination

```sql
CREATE TABLE frequency_coordination (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  wireless_mic_id TEXT REFERENCES wireless_mics(id) ON DELETE CASCADE,

  -- Frequency details
  frequency_mhz REAL NOT NULL,
  tv_channel TEXT,
  bandwidth_khz REAL DEFAULT 200, -- Typically 200kHz for wireless mics

  -- Coordination
  ias_compatible INTEGER DEFAULT 1, -- boolean: IAS verified
  conflict_detected INTEGER DEFAULT 0, -- boolean
  conflict_with TEXT REFERENCES wireless_mics(id), -- Other mic causing conflict
  intermod_risk TEXT CHECK(intermod_risk IN ('low', 'medium', 'high')),

  -- Location-specific
  venue_location TEXT, -- City/venue for IAS import
  frequency_reserve INTEGER DEFAULT 0, -- boolean: spare/backup frequency

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_frequency_coordination_project (project_id),
  INDEX idx_frequency_coordination_frequency (frequency_mhz),
  INDEX idx_frequency_coordination_conflict (conflict_detected)
);

CREATE TRIGGER update_frequency_coordination_timestamp
AFTER UPDATE ON frequency_coordination
BEGIN
  UPDATE frequency_coordination
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 5. Audio Cables

```sql
CREATE TABLE audio_cables (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Cable info
  cable_name TEXT NOT NULL,
  cable_type TEXT CHECK(cable_type IN (
    'snake', 'fiber', 'cat6', 'cat5e', 'single-xlr',
    'single-trs', 'single-ts', 'split', 'mult', 'other'
  )),
  pair_count INTEGER, -- Number of channels in snake
  length_feet REAL,

  -- Connectors
  connector_a TEXT, -- 'XLR-M', 'XLR-F', 'TRS', 'TS', 'RJ45', 'etherCON', etc.
  connector_b TEXT,
  connector_a_gender TEXT CHECK(connector_a_gender IN ('male', 'female', 'n/a')),
  connector_b_gender TEXT CHECK(connector_b_gender IN ('male', 'female', 'n/a')),

  -- Organization
  bundle TEXT, -- Cable bundle/group name
  color TEXT, -- Cable jacket color or tape color
  location TEXT, -- Physical routing location

  -- Acquisition
  source TEXT, -- 'rental', 'owned', 'provided'
  rental_house TEXT,

  -- Testing
  tested INTEGER DEFAULT 0, -- boolean
  test_date TEXT, -- ISO date
  test_result TEXT CHECK(test_result IN ('pass', 'fail', 'partial', 'not-tested')),
  condition TEXT CHECK(condition IN ('excellent', 'good', 'fair', 'poor', 'needs-repair')),
  failed_pairs TEXT, -- JSON array of failed channel numbers

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_audio_cables_project (project_id),
  INDEX idx_audio_cables_type (cable_type),
  INDEX idx_audio_cables_bundle (bundle)
);

CREATE TRIGGER update_audio_cables_timestamp
AFTER UPDATE ON audio_cables
BEGIN
  UPDATE audio_cables
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 6. Cable Pin Assignments

```sql
CREATE TABLE cable_pin_assignments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cable_id TEXT NOT NULL REFERENCES audio_cables(id) ON DELETE CASCADE,

  -- Pin info
  pin_number INTEGER NOT NULL, -- Channel number in snake
  pin_label TEXT, -- Custom label for this pin

  -- Source (From)
  from_device TEXT,
  from_output TEXT,
  from_channel_number TEXT,

  -- Destination (To)
  to_device TEXT,
  to_input TEXT,
  to_channel_number TEXT,

  -- Signal
  signal_type TEXT CHECK(signal_type IN ('mic', 'line', 'speaker', 'digital', 'other')),
  signal_level TEXT CHECK(signal_level IN ('mic', 'line', 'speaker', 'instrument')),

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  UNIQUE(cable_id, pin_number),
  INDEX idx_cable_pin_assignments_cable (cable_id)
);

CREATE TRIGGER update_cable_pin_assignments_timestamp
AFTER UPDATE ON cable_pin_assignments
BEGIN
  UPDATE cable_pin_assignments
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 7. Speakers/Boxes

```sql
CREATE TABLE speakers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Position
  position TEXT, -- 'FOH-L', 'FOH-R', 'Fill-1', 'Monitor-DSL', etc.
  speaker_model TEXT,
  manufacturer TEXT,
  quantity INTEGER DEFAULT 1,

  -- Rigging
  rigging_location TEXT,
  rigging_height_feet REAL,
  aim_direction TEXT, -- 'downstage', 'stage left', etc.
  aim_angle_degrees REAL,
  coverage TEXT, -- Coverage pattern

  -- Electrical
  power_watts INTEGER,
  impedance_ohms REAL,
  passive_active TEXT CHECK(passive_active IN ('passive', 'active', 'powered')),

  -- Signal
  amplifier TEXT,
  amplifier_channel TEXT,
  signal_source TEXT, -- Console output, matrix, etc.
  signal_processing TEXT, -- DSP, crossover, etc.

  -- Status
  status TEXT DEFAULT 'planned' CHECK(status IN (
    'planned', 'ordered', 'hung', 'aimed', 'tuned', 'show-ready'
  )),

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_speakers_project (project_id),
  INDEX idx_speakers_position (position)
);

CREATE TRIGGER update_speakers_timestamp
AFTER UPDATE ON speakers
BEGIN
  UPDATE speakers
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 8. Audio Patch (Input List)

```sql
CREATE TABLE audio_patch (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Input number
  input_number INTEGER,
  input_name TEXT,

  -- Input details
  input_type TEXT CHECK(input_type IN (
    'mic', 'di', 'line', 'playback', 'effects-return',
    'intercom', 'comm', 'other'
  )),
  mic_type TEXT, -- Specific mic model if applicable

  -- Source
  source_device TEXT, -- What's plugged in
  source_performer TEXT, -- Who's using it
  physical_location TEXT, -- Stage position

  -- Cable
  cable_id TEXT REFERENCES audio_cables(id),
  cable_pin INTEGER, -- Which pin in snake
  stage_box_number TEXT,

  -- Console
  console_channel TEXT,
  console_channel_name TEXT,
  phantom_power INTEGER DEFAULT 0, -- boolean
  pad INTEGER DEFAULT 0, -- boolean
  hpf INTEGER DEFAULT 0, -- boolean

  -- Processing
  compression INTEGER DEFAULT 0, -- boolean
  eq INTEGER DEFAULT 0, -- boolean
  effects_send TEXT, -- JSON array of effects sends

  -- Status
  status TEXT DEFAULT 'planned' CHECK(status IN (
    'planned', 'patched', 'tested', 'ready', 'issue'
  )),

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_audio_patch_project (project_id),
  INDEX idx_audio_patch_input_number (input_number)
);

CREATE TRIGGER update_audio_patch_timestamp
AFTER UPDATE ON audio_patch
BEGIN
  UPDATE audio_patch
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

#### 9. Audio Power Distribution

```sql
CREATE TABLE audio_power (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Device
  device_name TEXT NOT NULL,
  device_type TEXT CHECK(device_type IN (
    'amplifier', 'mixer', 'processor', 'playback',
    'wireless-receiver', 'monitor', 'effects', 'other'
  )),
  manufacturer TEXT,
  model TEXT,

  -- Power requirements
  power_watts INTEGER,
  voltage INTEGER DEFAULT 120,
  amperage REAL,
  power_consumption_type TEXT CHECK(power_consumption_type IN (
    'continuous', 'peak', 'average'
  )) DEFAULT 'continuous',

  -- Distribution
  circuit TEXT,
  panel TEXT,
  breaker_amps INTEGER,
  connector_type TEXT, -- 'Edison', 'PowerCon', 'L6-20', 'L5-20', etc.

  -- Sequencing
  sequencer TEXT, -- Power sequencer name
  sequencer_position TEXT, -- Outlet number or position
  sequence_order INTEGER, -- Turn-on order (1 = first)

  -- Backup
  ups_protected INTEGER DEFAULT 0, -- boolean
  ups_name TEXT,
  generator_circuit INTEGER DEFAULT 0, -- boolean

  -- Location
  rack TEXT,
  rack_position TEXT, -- RU position

  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  INDEX idx_audio_power_project (project_id),
  INDEX idx_audio_power_device_type (device_type)
);

CREATE TRIGGER update_audio_power_timestamp
AFTER UPDATE ON audio_power
BEGIN
  UPDATE audio_power
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
```

---

## 📝 TypeScript Type Definitions

Create new file: `src/types/sound.ts`

```typescript
// Sound Equipment Types

export interface SoundEquipmentType {
  id: string;
  projectId: string;
  name: string;
  category: 'microphone' | 'speaker' | 'processor' | 'playback' |
           'amplifier' | 'cable' | 'wireless' | 'other';
  manufacturer?: string;
  model?: string;
  specifications?: Record<string, any>; // JSON object
  powerWatts?: number;
  voltage?: number;
  weightLbs?: number;
  defaultLibrary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoundEquipment {
  id: string;
  projectId: string;
  equipmentTypeId?: string;
  position?: string;
  unitNumber?: string;
  purpose?: string;
  location?: string;
  source?: string; // 'rental', 'owned', 'provided'
  rentalHouse?: string;
  costPerUnit?: number;
  quantity: number;
  status: 'needed' | 'ordered' | 'in-stock' | 'installed' |
          'tested' | 'struck' | 'returned';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Wireless Microphones

export interface WirelessMic {
  id: string;
  projectId: string;
  role: string; // Character/performer
  actor?: string;
  trackNumber?: number;
  micType: 'handheld' | 'lavalier' | 'headset' | 'instrument';
  transmitterModel?: string;
  transmitterSerial?: string;
  receiverModel?: string;
  receiverSerial?: string;
  bodypackLocation?: string;
  frequencyMhz?: number;
  frequencyGroup?: string;
  frequencyChannel?: string;
  tvChannel?: string;
  antennaLocation?: string;
  receiverRack?: string;
  receiverPosition?: string;
  status: 'assigned' | 'tested' | 'ready' | 'in-use' | 'issue' | 'dark';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FrequencyCoordination {
  id: string;
  projectId: string;
  wirelessMicId: string;
  frequencyMhz: number;
  tvChannel?: string;
  bandwidthKhz: number;
  iasCompatible: boolean;
  conflictDetected: boolean;
  conflictWith?: string; // Other wireless mic ID
  intermodRisk?: 'low' | 'medium' | 'high';
  venueLocation?: string;
  frequencyReserve: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Audio Cables

export interface AudioCable {
  id: string;
  projectId: string;
  cableName: string;
  cableType: 'snake' | 'fiber' | 'cat6' | 'cat5e' | 'single-xlr' |
             'single-trs' | 'single-ts' | 'split' | 'mult' | 'other';
  pairCount?: number;
  lengthFeet?: number;
  connectorA?: string;
  connectorB?: string;
  connectorAGender?: 'male' | 'female' | 'n/a';
  connectorBGender?: 'male' | 'female' | 'n/a';
  bundle?: string;
  color?: string;
  location?: string;
  source?: string;
  rentalHouse?: string;
  tested: boolean;
  testDate?: string;
  testResult?: 'pass' | 'fail' | 'partial' | 'not-tested';
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'needs-repair';
  failedPairs?: number[]; // Array of failed channel numbers
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CablePinAssignment {
  id: string;
  cableId: string;
  pinNumber: number;
  pinLabel?: string;
  fromDevice?: string;
  fromOutput?: string;
  fromChannelNumber?: string;
  toDevice?: string;
  toInput?: string;
  toChannelNumber?: string;
  signalType?: 'mic' | 'line' | 'speaker' | 'digital' | 'other';
  signalLevel?: 'mic' | 'line' | 'speaker' | 'instrument';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Speakers

export interface Speaker {
  id: string;
  projectId: string;
  position?: string;
  speakerModel?: string;
  manufacturer?: string;
  quantity: number;
  riggingLocation?: string;
  riggingHeightFeet?: number;
  aimDirection?: string;
  aimAngleDegrees?: number;
  coverage?: string;
  powerWatts?: number;
  impedanceOhms?: number;
  passiveActive?: 'passive' | 'active' | 'powered';
  amplifier?: string;
  amplifierChannel?: string;
  signalSource?: string;
  signalProcessing?: string;
  status: 'planned' | 'ordered' | 'hung' | 'aimed' | 'tuned' | 'show-ready';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Audio Patch

export interface AudioPatch {
  id: string;
  projectId: string;
  inputNumber?: number;
  inputName?: string;
  inputType?: 'mic' | 'di' | 'line' | 'playback' | 'effects-return' |
              'intercom' | 'comm' | 'other';
  micType?: string;
  sourceDevice?: string;
  sourcePerformer?: string;
  physicalLocation?: string;
  cableId?: string;
  cablePin?: number;
  stageBoxNumber?: string;
  consoleChannel?: string;
  consoleChannelName?: string;
  phantomPower: boolean;
  pad: boolean;
  hpf: boolean;
  compression: boolean;
  eq: boolean;
  effectsSend?: string[]; // Array of effect names
  status: 'planned' | 'patched' | 'tested' | 'ready' | 'issue';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Audio Power

export interface AudioPower {
  id: string;
  projectId: string;
  deviceName: string;
  deviceType: 'amplifier' | 'mixer' | 'processor' | 'playback' |
              'wireless-receiver' | 'monitor' | 'effects' | 'other';
  manufacturer?: string;
  model?: string;
  powerWatts?: number;
  voltage: number;
  amperage?: number;
  powerConsumptionType: 'continuous' | 'peak' | 'average';
  circuit?: string;
  panel?: string;
  breakerAmps?: number;
  connectorType?: string;
  sequencer?: string;
  sequencerPosition?: string;
  sequenceOrder?: number;
  upsProtected: boolean;
  upsName?: string;
  generatorCircuit: boolean;
  rack?: string;
  rackPosition?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Zustand Store Interface

export interface SoundStore {
  // Sound Equipment
  soundEquipment: SoundEquipment[];
  addSoundEquipment: (equipment: Partial<SoundEquipment>) => void;
  updateSoundEquipment: (id: string, updates: Partial<SoundEquipment>) => void;
  deleteSoundEquipment: (id: string) => void;

  // Wireless Mics
  wirelessMics: WirelessMic[];
  addWirelessMic: (mic: Partial<WirelessMic>) => void;
  updateWirelessMic: (id: string, updates: Partial<WirelessMic>) => void;
  deleteWirelessMic: (id: string) => void;

  // Frequency Coordination
  frequencyCoordination: FrequencyCoordination[];
  detectFrequencyConflicts: () => void;
  assignFrequencies: (mics: WirelessMic[], algorithm: 'auto' | 'manual') => void;

  // Audio Cables
  audioCables: AudioCable[];
  addAudioCable: (cable: Partial<AudioCable>) => void;
  updateAudioCable: (id: string, updates: Partial<AudioCable>) => void;
  deleteAudioCable: (id: string) => void;

  // Cable Pin Assignments
  cablePinAssignments: CablePinAssignment[];
  assignCablePin: (assignment: Partial<CablePinAssignment>) => void;
  updateCablePin: (id: string, updates: Partial<CablePinAssignment>) => void;

  // Speakers
  speakers: Speaker[];
  addSpeaker: (speaker: Partial<Speaker>) => void;
  updateSpeaker: (id: string, updates: Partial<Speaker>) => void;
  deleteSpeaker: (id: string) => void;

  // Audio Patch
  audioPatch: AudioPatch[];
  addAudioPatch: (patch: Partial<AudioPatch>) => void;
  updateAudioPatch: (id: string, updates: Partial<AudioPatch>) => void;
  deleteAudioPatch: (id: string) => void;

  // Audio Power
  audioPower: AudioPower[];
  addAudioPower: (power: Partial<AudioPower>) => void;
  updateAudioPower: (id: string, updates: Partial<AudioPower>) => void;
  deleteAudioPower: (id: string) => void;
}
```

---

## 🎨 UI Components to Create

### Sound Equipment Views

**File:** `src/components/sound/SoundEquipmentGrid.tsx`
- Reuse existing VirtualDataGrid component
- Columns: Position, Unit#, Type, Purpose, Location, Source, Cost, Status, Notes
- Filtering by equipment category (mics, speakers, processors, etc.)
- Sorting and searching

**File:** `src/components/sound/SoundEquipmentToolbar.tsx`
- Add/Delete equipment buttons
- Filter by category dropdown
- Import from CSV
- Export to PDF/CSV
- Equipment label printing

### Wireless Microphone Views

**File:** `src/components/sound/WirelessMicGrid.tsx`
- Columns: Role, Actor, Mic Type, Transmitter, Receiver, Frequency, Group, Channel, Status
- Color-coded by frequency conflicts
- Sort by role, actor, or frequency

**File:** `src/components/sound/FrequencyCoordination.tsx`
- Visual frequency spectrum display
- Conflict detection visualization
- IAS import button
- Auto-assign frequencies button
- Frequency plot generation

**File:** `src/components/sound/WirelessMicForm.tsx`
- Form for adding/editing wireless mics
- Frequency validation
- Conflict warnings

### Cable Management Views

**File:** `src/components/sound/AudioCableGrid.tsx`
- Columns: Cable Name, Type, Pairs, Length, Connectors, Bundle, Tested, Condition
- Filter by cable type
- Testing status indicators

**File:** `src/components/sound/CablePinAssignment.tsx`
- Snake cable pin-to-pin assignment interface
- Visual representation of snake (left = stage box, right = mix position)
- Drag-and-drop assignment
- Bulk assignment tools

**File:** `src/components/sound/CableTestingLog.tsx`
- Cable testing interface
- Mark channels as pass/fail
- Test date tracking
- Condition notes

### Audio Patch Views

**File:** `src/components/sound/AudioPatchGrid.tsx`
- Input list view
- Columns: Input#, Name, Type, Source, Mic, Location, Cable, Pin, Console Channel
- Filter by input type
- Sort by input number or console channel

**File:** `src/components/sound/PatchForm.tsx`
- Form for adding/editing patch points
- Cable/pin selection dropdown
- Console channel assignment

### Speaker Management Views

**File:** `src/components/sound/SpeakerGrid.tsx`
- Columns: Position, Model, Qty, Location, Amplifier, Channel, Signal Source, Status
- Filter by speaker type or location
- Visual hang plot (optional Phase 2)

**File:** `src/components/sound/SpeakerForm.tsx`
- Form for adding/editing speakers
- Amplifier assignment
- Rigging calculation helpers

### Power Distribution Views

**File:** `src/components/sound/AudioPowerGrid.tsx`
- Columns: Device, Type, Watts, Voltage, Amps, Circuit, Sequencer, UPS, Status
- Load calculation summary
- Power distribution visualization

---

## 🔧 Utility Functions & Algorithms

### Frequency Conflict Detection

**File:** `src/utils/sound/frequencyConflicts.ts`

```typescript
interface FrequencyRange {
  frequencyMhz: number;
  bandwidthKhz: number;
}

export function detectConflicts(
  frequencies: FrequencyRange[]
): Map<number, number[]> {
  const conflicts = new Map<number, number[]>();

  for (let i = 0; i < frequencies.length; i++) {
    for (let j = i + 1; j < frequencies.length; j++) {
      const freq1 = frequencies[i];
      const freq2 = frequencies[j];

      const diff = Math.abs(freq1.frequencyMhz - freq2.frequencyMhz) * 1000; // Convert to kHz
      const minSeparation = (freq1.bandwidthKhz + freq2.bandwidthKhz) / 2;

      if (diff < minSeparation) {
        if (!conflicts.has(i)) conflicts.set(i, []);
        if (!conflicts.has(j)) conflicts.set(j, []);
        conflicts.get(i)!.push(j);
        conflicts.get(j)!.push(i);
      }
    }
  }

  return conflicts;
}

export function calculateIntermodulation(
  freq1: number,
  freq2: number,
  freq3: number
): number[] {
  // Calculate 3rd order intermodulation products
  const im1 = 2 * freq1 - freq2;
  const im2 = 2 * freq2 - freq1;
  const im3 = freq1 + freq2 - freq3;
  const im4 = freq1 - freq2 + freq3;

  return [im1, im2, im3, im4].filter(f => f > 0);
}
```

### IAS Frequency Import

**File:** `src/utils/sound/iasImport.ts`

```typescript
export interface IASFrequency {
  frequency: number;
  channel: number;
  group: string;
  tvChannel?: string;
}

export async function importIASFile(file: File): Promise<IASFrequency[]> {
  const text = await file.text();
  const lines = text.split('\n');
  const frequencies: IASFrequency[] = [];

  // Parse IAS CSV format
  for (let i = 1; i < lines.length; i++) { // Skip header
    const [freq, channel, group, tv] = lines[i].split(',');
    if (freq && channel && group) {
      frequencies.push({
        frequency: parseFloat(freq),
        channel: parseInt(channel),
        group: group.trim(),
        tvChannel: tv?.trim()
      });
    }
  }

  return frequencies;
}
```

### Cable Load Calculation

**File:** `src/utils/sound/cableCalculations.ts`

```typescript
export function calculateCableCapacity(
  lengthFeet: number,
  gaugeAWG: number
): number {
  // Simplified calculation - real-world would be more complex
  const resistancePerFoot: Record<number, number> = {
    12: 0.00162,
    14: 0.00258,
    16: 0.00409,
    18: 0.00651
  };

  const resistance = resistancePerFoot[gaugeAWG] * lengthFeet;
  const maxAmps = 120 / (resistance + 1); // Simplified

  return maxAmps;
}
```

---

## 📄 Report Templates

### Sound-Specific Reports

**File:** `src/templates/sound/InputList.tsx`

Report: Audio Input List
- Input number
- Input name
- Source/performer
- Mic type
- Physical location
- Cable/pin assignment
- Console channel
- Phantom power / Pad / HPF indicators

**File:** `src/templates/sound/OutputList.tsx`

Report: Audio Output List
- Output number
- Output name
- Destination (speaker position)
- Signal processing
- Amplifier assignment

**File:** `src/templates/sound/WirelessFrequencyPlot.tsx`

Report: Wireless Microphone Frequency Plot
- Visual frequency spectrum
- Color-coded by role/actor
- TV channel interference markers
- Conflict warnings

**File:** `src/templates/sound/CableSchedule.tsx`

Report: Audio Cable Schedule
- Cable name
- Type and length
- Connectors
- Routing/bundle
- Testing status

**File:** `src/templates/sound/SpeakerHangPlot.tsx`

Report: Speaker Hang Plot
- Position diagram
- Speaker models and quantities
- Amplifier assignments
- Rigging information

**File:** `src/templates/sound/EquipmentList.tsx`

Report: Sound Equipment List
- Categorized by type
- Quantities and sources
- Cost estimates
- Rental house information

---

## 🔌 Integration Points

### QLab Integration

**File:** `src/integrations/qlab/qlabConnector.ts`

```typescript
export interface QLab Cue {
  number: string;
  name: string;
  type: 'audio' | 'video' | 'fade' | 'network' | 'other';
  duration?: number;
  outputs?: number[];
}

export async function importQLab Workspace(
  filePath: string
): Promise<QLab Cue[]> {
  // Parse QLab .cues file (JSON format)
  const data = await readFile(filePath);
  const workspace = JSON.parse(data);

  return workspace.cues.map((cue: any) => ({
    number: cue.number,
    name: cue.name,
    type: cue.type,
    duration: cue.duration,
    outputs: cue.outputs
  }));
}
```

### Console Integration (Yamaha)

**File:** `src/integrations/consoles/yamahaImport.ts`

```typescript
export interface ConsolePatch {
  channelNumber: number;
  channelName: string;
  inputType: string;
  phantomPower: boolean;
  pad: boolean;
  gain: number;
}

export async function importYamahaPatch(
  filePath: string
): Promise<ConsolePatch[]> {
  // Parse Yamaha patch file format
  // Format varies by console model (CL/QL series use different formats)
  // Implementation would need to handle multiple formats

  return [];
}
```

---

## ✅ Testing Requirements

### Unit Tests

**File:** `src/__tests__/sound/frequencyConflicts.test.ts`
- Test conflict detection algorithm
- Test intermodulation calculation
- Test IAS import parsing

**File:** `src/__tests__/sound/cableAssignments.test.ts`
- Test pin assignment validation
- Test cable capacity calculations

### Integration Tests

**File:** `src/__tests__/sound/soundEquipment.test.ts`
- Test CRUD operations for sound equipment
- Test equipment library loading
- Test cost calculations

**File:** `src/__tests__/sound/wirelessMics.test.ts`
- Test wireless mic assignment
- Test frequency coordination
- Test conflict detection integration

### End-to-End Tests

**File:** `cypress/e2e/sound/wireless-workflow.cy.ts`
- Create wireless mic
- Assign frequency
- Detect conflicts
- Generate frequency plot

**File:** `cypress/e2e/sound/cable-patching.cy.ts`
- Create snake cable
- Assign pins
- Generate cable schedule

---

## 📦 Default Sound Equipment Library

Create default library with 1,000+ sound equipment items:

**File:** `src/data/defaultSoundLibrary.json`

Categories to include:
- Microphones (100+ models)
  - Shure SM58, SM57, SM81, Beta 87, KSM9, etc.
  - Sennheiser MD421, e835, e906, etc.
  - Audio-Technica AT2020, AT4050, etc.
  - Neumann KM184, U87, etc.
  - DPA d:vote, d:screet, etc.

- Wireless Systems (50+ models)
  - Shure QLX-D, ULX-D, Axient Digital
  - Sennheiser EW-D, 2000 series, 6000 series
  - Audio-Technica System 10, 3000 series
  - Line 6 XD-V series

- Speakers (100+ models)
  - Meyer Sound (UPA, USW, M'elodie, LYON, LEO, etc.)
  - d&b audiotechnik (Q, Y, V, SL series)
  - L-Acoustics (KARA, ARCS, X series)
  - JBL VTX, VRX series
  - EAW Anya, Anna, Otto

- Amplifiers (50+ models)
  - Crown XTi, XLS, I-Tech series
  - QSC DCA, GX, PLD series
  - Lab.gruppen PLM, C series

- Consoles (30+ models)
  - Yamaha CL/QL series, TF series, Rivage PM
  - Allen & Heath dLive, SQ, Avantis
  - DiGiCo SD series
  - Avid S6L, VENUE

- Signal Processing (100+ models)
  - BSS Soundweb, Omnidrive
  - dbx DriveRack, 266xs, 286s
  - Lexicon reverbs
  - TC Electronic reverbs

- Playback (20+ models)
  - Apple Mac Mini, MacBook Pro (for QLab)
  - Denon CD players
  - 360 Systems Instant Replay

---

## 🎯 Implementation Priority

### Phase 1 (Months 1-2): HIGHEST PRIORITY
1. Sound equipment database schema ✅
2. Sound equipment CRUD operations
3. Equipment library loading
4. Basic sound equipment grid view
5. Equipment labels

### Phase 2 (Months 3-4): HIGH PRIORITY
6. Audio cables database schema ✅
7. Cable management grid
8. Pin assignment interface
9. Cable testing log

### Phase 3 (Months 5-6): HIGH PRIORITY
10. Wireless mics database schema ✅
11. Wireless mic grid
12. Frequency coordination algorithm
13. Conflict detection
14. IAS import
15. Frequency plot generation

### Phase 4 (Months 7-8): MEDIUM PRIORITY
16. Audio patch database schema ✅
17. Input list interface
18. Patch form
19. Console channel assignment

### Phase 5 (Months 9-10): MEDIUM PRIORITY
20. Speakers database schema ✅
21. Speaker grid
22. Amplifier assignment
23. Speaker hang report

### Phase 6 (Month 11): MEDIUM PRIORITY
24. Audio power database schema ✅
25. Power distribution grid
26. Load calculations
27. Power reports

### Phase 7 (Month 12): MEDIUM PRIORITY
28. All sound report templates
29. PDF generation for sound reports
30. Label templates for sound equipment

### Phase 8 (Months 13-14): LOW PRIORITY
31. QLab integration
32. Yamaha console import
33. DiGiCo console import
34. Allen & Heath console import

### Phase 9 (Months 15-16): POLISH
35. Performance optimization
36. Beta testing
37. Bug fixes
38. Documentation

---

## 🚀 Getting Started

### Step 1: Database Migration

Run database migration to create sound tables:

```bash
npm run migrate:sound-tables
```

### Step 2: Load Default Library

Import default sound equipment library:

```bash
npm run seed:sound-library
```

### Step 3: Create Basic UI

Start with sound equipment grid (reuse existing virtual grid):

```bash
# Copy and modify lighting grid component
cp src/components/lighting/FixtureGrid.tsx src/components/sound/SoundEquipmentGrid.tsx
```

### Step 4: Implement CRUD Operations

Create Zustand store for sound features:

```bash
# Create sound store
touch src/store/soundStore.ts
```

---

## 📝 Success Criteria

### Phase 1 Complete When:
- ✅ Can add, edit, delete sound equipment
- ✅ Equipment library loaded with 1,000+ items
- ✅ Basic equipment grid renders smoothly
- ✅ Equipment labels can be generated

### Full Minotaur Parity Achieved When:
- ✅ All database schemas implemented
- ✅ Equipment management complete
- ✅ Multi-pair cable tracking works
- ✅ Wireless frequency coordination functional
- ✅ IAS import working
- ✅ Audio patch management complete
- ✅ Speaker/amplifier tracking works
- ✅ Power distribution calculated
- ✅ All sound reports generate properly
- ✅ QLab integration functional
- ✅ Beta testers confirm feature parity

---

**Document Status:** Ready for Implementation
**Next Step:** Begin Phase 1 database schema implementation
**Estimated Completion:** 16 months from start

---

**See Also:**
- `docs/minotaur-parity-analysis.md` - Detailed feature comparison
- `docs/project-status.md` - Overall project roadmap
- `docs/unified-vs-modular-analysis.md` - Architecture rationale
