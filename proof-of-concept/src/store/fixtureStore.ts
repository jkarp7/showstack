import { create } from 'zustand';
import { Fixture, FixtureStore } from '../types';

// Generate mock fixtures for testing
function generateMockFixtures(count: number): Fixture[] {
  const types = ['Source Four 26°', 'Source Four 36°', 'Source Four 50°', 'Rogue R2 Wash', 'Chauvet Strike'];
  const locations = ['FOH', '1st Electric', '2nd Electric', 'Side Light', 'Back Light'];
  const colors = ['R02', 'R80', 'R119', 'L201', 'R33'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `fixture-${i + 1}`,
    position: String(i + 1),
    unit: i + 1,
    type: types[i % types.length],
    purpose: i % 3 === 0 ? 'Wash' : i % 3 === 1 ? 'Special' : 'Key Light',
    channel: String(101 + i),
    dimmer: `${Math.floor(i / 6) + 1}/${(i % 6) + 1}`,
    circuit: `C-${i + 1}`,
    color: i % 2 === 0 ? colors[i % colors.length] : '',
    location: locations[i % locations.length],
    wattage: types[i % types.length].includes('Source') ? 750 : 575,
    notes: i % 5 === 0 ? 'Check focus' : '',
  }));
}

export const useFixtureStore = create<FixtureStore>((set) => ({
  fixtures: generateMockFixtures(1000), // Start with 1,000 fixtures for testing
  
  addFixture: (fixture) =>
    set((state) => ({
      fixtures: [
        ...state.fixtures,
        {
          id: `fixture-${Date.now()}`,
          position: '',
          type: '',
          ...fixture,
        } as Fixture,
      ],
    })),
  
  updateFixture: (id, updates) =>
    set((state) => ({
      fixtures: state.fixtures.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),
  
  deleteFixture: (id) =>
    set((state) => ({
      fixtures: state.fixtures.filter((f) => f.id !== id),
    })),
  
  deleteMultiple: (ids) =>
    set((state) => ({
      fixtures: state.fixtures.filter((f) => !ids.includes(f.id)),
    })),
}));
