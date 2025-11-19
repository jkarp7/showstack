import { create } from 'zustand';

export interface ShowDates {
  load_in?: string;
  tech?: string;
  previews?: string;
  opening?: string;
  closing?: string;
  load_out?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  logo_path?: string;

  // Design Team
  lighting_designer?: string;
  lighting_associates?: string[]; // JSON array
  audio_designer?: string;
  audio_associates?: string[]; // JSON array
  video_designer?: string;
  video_associates?: string[]; // JSON array

  // Production Staff
  electrician?: string;
  audio_tech?: string;
  video_tech?: string;
  production_manager?: string;
  production_manager_company?: string;
  general_manager?: string;
  general_manager_company?: string;

  // Venue & Dates
  venue?: string;
  show_dates?: ShowDates;

  enabled_modules?: string[]; // ['production', 'manager', 'design']
  created_at: number;
  updated_at: number;
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string, logoPath?: string, enabledModules?: string[]) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
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
      const allProjects = await window.api.projects.getAll();
      const currentProject = await window.api.projects.getCurrent();
      set({ currentProject, projects: allProjects });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  },

  createProject: async (name: string, description?: string, logoPath?: string, enabledModules?: string[]) => {
    if (!hasAPI()) {
      console.warn('API not available');
      throw new Error('API not available');
    }

    try {
      const project = await window.api.projects.create(name, description, logoPath, enabledModules);
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

  updateProject: async (projectId: string, updates: Partial<Project>) => {
    if (!hasAPI()) {
      console.warn('API not available');
      throw new Error('API not available');
    }

    try {
      await window.api.projects.update(projectId, updates);
      // Reload projects to get updated data
      const allProjects = await window.api.projects.getAll();
      const currentProject = get().currentProject;
      set({
        projects: allProjects,
        currentProject: currentProject?.id === projectId
          ? allProjects.find((p) => p.id === projectId) || null
          : currentProject
      });
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    if (!hasAPI()) {
      console.warn('API not available');
      throw new Error('API not available');
    }

    try {
      await window.api.projects.delete(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
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
