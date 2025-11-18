// Fixture interface with full LightWright parity
export interface Fixture {
  id: string;
  project_id?: string;

  // Position & Identification (LightWright: Position, Unit #, Instrument Type, Mark)
  position: string;
  unit?: number;           // Alias for unit_number
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
  mode?: string;
  console_level?: string;

  // Power (LightWright: Dimmer, Circuit Name, Circuit #, Load, Dimmer Phase)
  dimmer?: string;
  circuit?: string;        // Circuit name
  circuit_number?: string; // Circuit #
  phase?: string;
  wattage?: number;        // Load
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

  // Focus (LightWright: Focus L/R, U/D, Note, Cut submenu, Status)
  focus_lr?: string;
  focus_ud?: string;
  focus_note?: string;
  focus_cut_us?: string;
  focus_cut_ds?: string;
  focus_cut_sr?: string;
  focus_cut_sl?: string;
  focus_cut_top?: string;
  focus_cut_bottom?: string;
  focus_status?: string;

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
  loadFixtures: () => Promise<void>;
  addFixture: (fixture: Partial<Fixture>) => Promise<void>;
  addMultipleFixtures: (fixtures: Partial<Fixture>[]) => Promise<void>;
  updateFixture: (id: string, updates: Partial<Fixture>) => Promise<void>;
  deleteFixture: (id: string) => Promise<void>;
  deleteMultiple: (ids: string[]) => Promise<void>;
}
