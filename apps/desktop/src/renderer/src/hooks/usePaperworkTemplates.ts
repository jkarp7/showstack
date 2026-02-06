import { useState, useEffect, useCallback } from 'react';
import type { PaperworkTemplate, PaperworkTemplateInput } from '../types/paperworkTemplate';
import type { ReportType } from '../types/paperwork';

/**
 * Paperwork Templates Hook
 *
 * Provides template CRUD operations using the IPC bridge to main process
 * database queries.
 *
 * Operations:
 * - Load all templates or filter by report type
 * - Create new template
 * - Update existing template
 * - Delete template
 * - Duplicate template
 */

// Type guard for window.api
const hasAPI = (): boolean => {
  return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
};

interface UsePaperworkTemplatesOptions {
  reportType?: ReportType; // Optional filter by report type
  autoLoad?: boolean; // Auto-load on mount (default: true)
}

export function usePaperworkTemplates(options: UsePaperworkTemplatesOptions = {}) {
  const { reportType, autoLoad = true } = options;

  const [templates, setTemplates] = useState<PaperworkTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load templates from database
   */
  const loadTemplates = useCallback(async (filterReportType?: ReportType) => {
    if (!hasAPI()) {
      console.warn('API not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await window.api.paperworkTemplates.getAll(filterReportType);
      setTemplates(loaded);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates';
      setError(message);
      console.error('Failed to load paperwork templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get a single template by ID
   */
  const getTemplate = useCallback(async (id: string): Promise<PaperworkTemplate | null> => {
    if (!hasAPI()) {
      console.warn('API not available');
      return null;
    }

    try {
      return await window.api.paperworkTemplates.getById(id);
    } catch (err) {
      console.error('Failed to get template:', err);
      return null;
    }
  }, []);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(
    async (input: PaperworkTemplateInput): Promise<PaperworkTemplate | null> => {
      if (!hasAPI()) {
        console.warn('API not available');
        return null;
      }

      setError(null);

      try {
        const created = await window.api.paperworkTemplates.create(input);

        // Add to local state
        setTemplates((prev) => [...prev, created]);

        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create template';
        setError(message);
        console.error('Failed to create template:', err);
        return null;
      }
    },
    [],
  );

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(
    async (
      id: string,
      updates: Partial<PaperworkTemplateInput>,
    ): Promise<PaperworkTemplate | null> => {
      if (!hasAPI()) {
        console.warn('API not available');
        return null;
      }

      setError(null);

      try {
        const updated = await window.api.paperworkTemplates.update(id, updates);

        // Update in local state
        setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));

        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update template';
        setError(message);
        console.error('Failed to update template:', err);
        return null;
      }
    },
    [],
  );

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    if (!hasAPI()) {
      console.warn('API not available');
      return false;
    }

    setError(null);

    try {
      await window.api.paperworkTemplates.delete(id);

      // Remove from local state
      setTemplates((prev) => prev.filter((t) => t.id !== id));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      setError(message);
      console.error('Failed to delete template:', err);
      return false;
    }
  }, []);

  /**
   * Duplicate a template (creates a custom copy)
   */
  const duplicateTemplate = useCallback(
    async (id: string, newName?: string): Promise<PaperworkTemplate | null> => {
      if (!hasAPI()) {
        console.warn('API not available');
        return null;
      }

      setError(null);

      try {
        const duplicated = await window.api.paperworkTemplates.duplicate(id, newName);

        // Add to local state
        setTemplates((prev) => [...prev, duplicated]);

        return duplicated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to duplicate template';
        setError(message);
        console.error('Failed to duplicate template:', err);
        return null;
      }
    },
    [],
  );

  /**
   * Get system templates only
   */
  const getSystemTemplates = useCallback(() => {
    return templates.filter((t) => t.isSystem);
  }, [templates]);

  /**
   * Get custom templates only
   */
  const getCustomTemplates = useCallback(() => {
    return templates.filter((t) => !t.isSystem);
  }, [templates]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadTemplates(reportType);
    }
  }, [autoLoad, reportType, loadTemplates]);

  return {
    // State
    templates,
    loading,
    error,

    // Operations
    loadTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,

    // Utilities
    getSystemTemplates,
    getCustomTemplates,
  };
}

/**
 * Hook for managing a single active template
 */
export function useActiveTemplate(initialTemplate?: PaperworkTemplate) {
  const [activeTemplate, setActiveTemplate] = useState<PaperworkTemplate | undefined>(
    initialTemplate,
  );
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Load a template as active
   */
  const loadTemplate = useCallback((template: PaperworkTemplate) => {
    setActiveTemplate(template);
    setIsDirty(false);
  }, []);

  /**
   * Update the active template (marks as dirty)
   */
  const updateActiveTemplate = useCallback((updates: Partial<PaperworkTemplate>) => {
    setActiveTemplate((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  /**
   * Clear the active template
   */
  const clearTemplate = useCallback(() => {
    setActiveTemplate(undefined);
    setIsDirty(false);
  }, []);

  /**
   * Reset dirty flag (after save)
   */
  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    activeTemplate,
    isDirty,
    loadTemplate,
    updateActiveTemplate,
    clearTemplate,
    markClean,
  };
}
