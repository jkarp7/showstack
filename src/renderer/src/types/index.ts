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
}

export interface FixtureStore {
  fixtures: Fixture[];
  addFixture: (fixture: Partial<Fixture>) => void;
  updateFixture: (id: string, updates: Partial<Fixture>) => void;
  deleteFixture: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
}
