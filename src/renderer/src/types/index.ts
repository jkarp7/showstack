export interface Fixture {
  id: string;
  position: string;
  unit?: number;
  type: string;
  purpose?: string;
  channel?: string;
  dimmer?: string;
  circuit?: string;
  color?: string;
  gobo?: string;
  location?: string;
  wattage?: number;
  notes?: string;
  status?: string;
  created_at?: number;
  updated_at?: number;
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
