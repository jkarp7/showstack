import { HeaderLayoutConfig } from '../../types/paperwork';
import { HeaderRenderer } from './HeaderRenderer';

interface HeaderPreviewProps {
  layout: HeaderLayoutConfig;
}

// Mock project data for preview
const MOCK_PROJECT_DATA = {
  name: 'Sample Production',
  venue: 'Grand Theater',
  venue_city: 'New York',
  venue_state: 'NY',
  lighting_designer: 'Jane Designer',
  lighting_designer_email: 'jane@example.com',
  lighting_designer_phone: '(555) 123-4567',
  production_electrician: 'John Electrician',
  production_manager: 'Sarah Manager',
  general_manager: 'Mike GM',
  load_in_date: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  tech_date: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
  opening_date: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
  closing_date: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
  revision_number: 'Rev 3',
  revision_date: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
  logo_path: null // No logo in preview to avoid file path issues
};

const MOCK_REPORT_TEMPLATES = [
  {
    id: 'channel-hookup' as const,
    name: 'Channel Hookup',
    description: 'Complete fixture list',
    icon: '📊'
  }
];

export function HeaderPreview({ layout }: HeaderPreviewProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Preview
      </label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <div className="transform scale-90 origin-top">
          <HeaderRenderer
            layout={layout}
            reportType="channel-hookup"
            reportTemplates={MOCK_REPORT_TEMPLATES}
            projectData={MOCK_PROJECT_DATA}
            projectName="Sample Production"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Preview shows sample data - your actual report will use real project information
      </p>
    </div>
  );
}
