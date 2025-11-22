import { create } from 'zustand';
import { Project, ProjectStore } from '../types';

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,

  setCurrentProject: (project) =>
    set({ currentProject: project }),

  addProject: (project) =>
    set((state) => {
      const now = new Date().toISOString();
      const newProject: Project = {
        id: `project-${Date.now()}`,
        name: project.name || 'Untitled Project',
        createdDate: now,
        lastModifiedDate: now,
        showDates: [],
        prepStatus: 'not-started',
        status: 'planning',
        ...project,
      };
      return {
        projects: [...state.projects, newProject],
        currentProject: newProject,
      };
    }),

  updateProject: (id, updates) =>
    set((state) => {
      const updatedProjects = state.projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, lastModifiedDate: new Date().toISOString() }
          : p
      );
      return {
        projects: updatedProjects,
        currentProject:
          state.currentProject?.id === id
            ? { ...state.currentProject, ...updates, lastModifiedDate: new Date().toISOString() }
            : state.currentProject,
      };
    }),

  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),
}));
