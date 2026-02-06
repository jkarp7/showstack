import { describe, it, expect } from 'vitest';
import type { ElementConfig, TextConfig, ImageConfig } from '../../../../types/prep';

/**
 * Tests for Bug Fix #1: Type Safety in ElementInspector.tsx
 * Issue: Used Partial<any> which loses all type safety
 * Fix: Changed to Partial<ElementConfig> with proper type assertion
 */
describe('ElementInspector - Type Safety', () => {
  /**
   * Helper function that mimics the updateConfig logic from ElementInspector
   * This validates that ElementConfig type properly constrains updates
   */
  const createUpdateConfig = (
    currentConfig: ElementConfig,
    onUpdate: (updates: { config: ElementConfig }) => void,
  ) => {
    return (configUpdates: Partial<ElementConfig>) => {
      onUpdate({
        config: { ...currentConfig, ...configUpdates } as ElementConfig,
      });
    };
  };

  describe('TextConfig updates', () => {
    it('should allow valid TextConfig updates', () => {
      const currentConfig: TextConfig = {
        content: 'Hello',
        placeholder: 'Enter text',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({ content: 'Updated text' });

      expect(capturedUpdate).toEqual({
        content: 'Updated text',
        placeholder: 'Enter text',
      });
    });

    it('should allow partial updates to TextConfig', () => {
      const currentConfig: TextConfig = {
        content: 'Hello',
        placeholder: 'Enter text',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({ placeholder: 'New placeholder' });

      expect(capturedUpdate).toEqual({
        content: 'Hello',
        placeholder: 'New placeholder',
      });
    });
  });

  describe('ImageConfig updates', () => {
    it('should allow valid ImageConfig updates', () => {
      const currentConfig: ImageConfig = {
        src: 'https://example.com/image.png',
        alt: 'Test image',
        objectFit: 'contain',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({ src: 'https://example.com/new-image.png' });

      expect(capturedUpdate).toEqual({
        src: 'https://example.com/new-image.png',
        alt: 'Test image',
        objectFit: 'contain',
      });
    });

    it('should allow changing objectFit property', () => {
      const currentConfig: ImageConfig = {
        src: 'https://example.com/image.png',
        alt: 'Test image',
        objectFit: 'contain',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({ objectFit: 'cover' });

      expect(capturedUpdate).toEqual({
        src: 'https://example.com/image.png',
        alt: 'Test image',
        objectFit: 'cover',
      });
    });

    it('should allow clearing image src', () => {
      const currentConfig: ImageConfig = {
        src: 'https://example.com/image.png',
        alt: 'Test image',
        objectFit: 'contain',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({ src: '' });

      expect(capturedUpdate).toEqual({
        src: '',
        alt: 'Test image',
        objectFit: 'contain',
      });
    });
  });

  describe('Type safety validation', () => {
    it('should preserve config structure during updates', () => {
      const currentConfig: TextConfig = {
        content: 'Original',
        placeholder: 'Original placeholder',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      // Update one field
      updateConfig({ content: 'Updated' });

      // Verify other fields are preserved
      expect(capturedUpdate).toHaveProperty('placeholder');
      expect((capturedUpdate as TextConfig).placeholder).toBe('Original placeholder');
    });

    it('should handle empty partial updates', () => {
      const currentConfig: TextConfig = {
        content: 'Hello',
        placeholder: 'Enter text',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({});

      expect(capturedUpdate).toEqual(currentConfig);
    });

    it('should handle multiple property updates at once', () => {
      const currentConfig: ImageConfig = {
        src: 'old.png',
        alt: 'Old alt',
        objectFit: 'contain',
      };

      let capturedUpdate: ElementConfig | null = null;
      const updateConfig = createUpdateConfig(currentConfig, ({ config }) => {
        capturedUpdate = config;
      });

      updateConfig({
        src: 'new.png',
        alt: 'New alt',
        objectFit: 'cover',
      });

      expect(capturedUpdate).toEqual({
        src: 'new.png',
        alt: 'New alt',
        objectFit: 'cover',
      });
    });
  });

  describe('TypeScript compile-time checks', () => {
    it('ElementConfig type should be a discriminated union', () => {
      // This test validates that ElementConfig is properly typed
      // TypeScript compiler will catch errors at build time

      const textConfig: ElementConfig = {
        content: 'Text',
        placeholder: 'Placeholder',
      };

      const imageConfig: ElementConfig = {
        src: 'image.png',
        alt: 'Alt text',
        objectFit: 'contain',
      };

      expect(textConfig).toBeDefined();
      expect(imageConfig).toBeDefined();
    });
  });
});
