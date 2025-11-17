import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  venue?: string;
  designer?: string;
  created_at: number;
  updated_at: number;
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  setCurrentProject: (projectId: string) => void;
}

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,

  loadProjects: async () => {
    if (!hasAPI()) {
      console.warn('API not available, using empty projects');
      return;
    }

    try {
      // TODO: Implement projects.getAll IPC handler
      // For now, get the default project
      const currentProject = await window.api.projects.getCurrent();
      set({ currentProject, projects: [currentProject] });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  },

  createProject: async (name: string, description?: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      throw new Error('API not available');
    }

    try {
      const project = await window.api.projects.create(name);
      set((state) => ({
        projects: [project, ...state.projects],
        currentProject: project,
      }));
      return project;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  setCurrentProject: (projectId: string) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (project) {
      set({ currentProject: project });
    }
  },
}));
