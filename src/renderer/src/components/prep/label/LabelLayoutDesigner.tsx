/**
 * Label Layout Designer - Wrapper for Unified Visual Editor
 *
 * Configures LayoutDesigner for label-specific constraints:
 * - Dynamic grid based on Avery template dimensions
 * - Background color picker
 * - Label-appropriate element types
 */

import React, { useState, useEffect } from 'react';
import { LayoutDesigner } from '../layout/LayoutDesigner';
import {
  calculateLabelGrid,
  getAveryTemplate,
  type LabelGridConfig
} from '../../../utils/prep/labelGridCalculator';
import type { PageLayoutTemplate, LayoutElement, PrintSectionType } from '../../../types/prep';

interface LabelLayoutDesignerProps {
  projectId: string; // Project identifier
  templateCode: string; // Avery template code (e.g., '5160')
  initialTemplate?: PageLayoutTemplate;
  onSave: (templateId: string) => void;
  onCancel: () => void;
}

export default function LabelLayoutDesigner({
  projectId,
  templateCode,
  initialTemplate,
  onSave,
  onCancel
}: LabelLayoutDesignerProps): JSX.Element {
  const [template, setTemplate] = useState<PageLayoutTemplate | null>(null);
  const [gridConfig, setGridConfig] = useState<LabelGridConfig | null>(null);

  useEffect(() => {
    // Get Avery template specifications
    const averySpec = getAveryTemplate(templateCode);

    if (!averySpec) {
      console.error('Invalid Avery template code:', templateCode);
      return;
    }

    // Calculate grid configuration
    const grid = calculateLabelGrid(averySpec.widthInches, averySpec.heightInches);
    setGridConfig(grid);

    // Create or use existing template
    if (initialTemplate) {
      setTemplate(initialTemplate);
    } else {
      // Create new template
      const newTemplate: PageLayoutTemplate = {
        id: `label_${templateCode}_${Date.now()}`,
        name: `${averySpec.name} (${templateCode})`,
        description: `${averySpec.widthInches}" × ${averySpec.heightInches}" label`,
        page_type: `label_${templateCode}` as PrintSectionType,
        grid_columns: grid.columns,
        grid_rows: grid.rows,
        grid_gap: grid.gridGap,
        page_width: grid.pageWidth,
        page_height: grid.pageHeight,
        elements: [],
        is_default: false,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      setTemplate(newTemplate);
    }
  }, [templateCode, initialTemplate]);

  const handleSave = async (savedTemplate: PageLayoutTemplate) => {
    // Save template to database
    try {
      if (!window.api?.prep?.layoutTemplates) {
        throw new Error('Layout templates API not available');
      }

      let savedId: string;

      if (initialTemplate) {
        // Update existing template
        await window.api.prep.layoutTemplates.update(savedTemplate.id, {
          name: savedTemplate.name,
          description: savedTemplate.description,
          grid_columns: savedTemplate.grid_columns,
          grid_rows: savedTemplate.grid_rows,
          grid_gap: savedTemplate.grid_gap,
          page_width: savedTemplate.page_width,
          page_height: savedTemplate.page_height
        });
        savedId = savedTemplate.id;
      } else {
        // Create new template
        savedId = await window.api.prep.layoutTemplates.create({
          user_id: savedTemplate.user_id,
          name: savedTemplate.name,
          description: savedTemplate.description,
          page_type: savedTemplate.page_type,
          grid_columns: savedTemplate.grid_columns,
          grid_rows: savedTemplate.grid_rows,
          grid_gap: savedTemplate.grid_gap,
          page_width: savedTemplate.page_width,
          page_height: savedTemplate.page_height,
          is_default: savedTemplate.is_default
        });
      }

      // Save elements
      await window.api.prep.layoutTemplates.saveElements(savedId, savedTemplate.elements);

      onSave(savedId);
    } catch (error) {
      console.error('Failed to save label template:', error);
      alert('Failed to save label template. Please try again.');
    }
  };

  if (!template || !gridConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-2">Loading label designer...</div>
          <div className="text-sm text-gray-400">{templateCode}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900">
      <LayoutDesigner
        projectId={projectId}
        pageType={template.page_type}
        initialTemplate={template}
        onSave={handleSave}
        onClose={onCancel}
      />
    </div>
  );
}
