// Fixture interface with full LightWright parity
export interface Fixture {
  id: string;
  project_id?: string;

  // Position & Identification (LightWright: Position, Unit #, Instrument Type, Mark)
  position: string;
  unit?: number; // Alias for unit_number
  unit_number?: number;
  type: string;
  manufacturer?: string;
  model?: string;
  purpose?: string;
  mark?: string;

  // Control (LightWright: Address, Channel, Universe, DMX #, Console Level)
  channel?: string;
  universe?: number;
  dmx_address?: number;
  dmx_footprint?: number;
  mode?: string;
  console_level?: string;

  // Power (LightWright: Dimmer, Circuit Name, Circuit #, Load, Dimmer Phase)
  dimmer?: string;
  circuit?: string; // Circuit name
  circuit_number?: string; // Circuit #
  phase?: string;
  wattage?: number; // Load
  amperage?: number;

  // Color & Accessories (LightWright: Color, Gobo, Gobo Size, Accessory, Color Frame)
  color?: string;
  color_frame?: string;
  gobo?: string;
  gobo_size?: string;
  template_size?: string;
  accessories?: string[];

  // Cables (LightWright: Cable, Data Cable)
  cable?: string;
  data_cable?: string;

  // Location (LightWright: Position, Location)
  location?: string;
  position_x?: number;
  position_y?: number;
  position_z?: number;

  // System & Scenery (LightWright: System, Scenery)
  system?: string;
  scenery?: string;

  // Vectorworks Integration (LightWright: Vectorworks submenu)
  vw_layer?: string;
  vw_label_legend?: string;
  vw_class?: string;
  vw_x_coordinate?: number;
  vw_y_coordinate?: number;
  vw_z_coordinate?: number;
  vw_symbol_rotation?: number;
  vw_focus_point?: string;
  on_light_plot?: boolean;
  vw_uid?: string;
  vw_symbol?: string;

  // ShowStack ID (LightWright: Lightwright ID)
  showstack_id?: string;

  // Status & Notes
  status?: string;
  notes?: string;
  work_note_status?: string;
  hidden?: boolean; // Hide fixture from normal view

  // Color Flag - Designation that appears on labels
  color_flag?: 'hot' | 'spare' | 'special' | 'dimmer_doubles' | 'two_fer' | null;

  // Custom fields (JSON) - LightWright: User Columns (24)
  custom_fields?: Record<string, any>;

  // Audit Trail (LightWright: When, What, and Who Changed)
  changed_at?: number;
  changed_what?: string;
  changed_who?: string;

  // Metadata
  created_at?: number;
  updated_at?: number;

  // Computed/Virtual fields (not in database)
  address?: string; // Computed from universe/dmx_address as "universe/dmx_address"
}

export interface FixtureStore {
  fixtures: Fixture[];
  currentProjectId: string | null;
  setCurrentProjectId: (projectId: string | null) => void;
  loadFixtures: (projectId?: string) => Promise<void>;
  addFixture: (fixture: Partial<Fixture>) => Promise<void>;
  addMultipleFixtures: (fixtures: Partial<Fixture>[]) => Promise<void>;
  updateFixture: (id: string, updates: Partial<Fixture>) => Promise<void>;
  bulkUpdate: (fixtureIds: string[], updates: Partial<Fixture>) => Promise<void>;
  deleteFixture: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
}
