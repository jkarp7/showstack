import { HeaderLayoutConfig, ReportType, ReportTemplate } from '../../types/paperwork';

interface HeaderRendererProps {
  layout: HeaderLayoutConfig;
  reportType: ReportType;
  reportTemplates: ReportTemplate[];
  projectData: any;
  projectName: string;
}

export function HeaderRenderer({
  layout,
  reportType,
  reportTemplates,
  projectData,
  projectName,
}: HeaderRendererProps) {
  if (!projectData) return null;

  const { preset, fields } = layout;

  // Determine title to display
  const reportTitle =
    fields.customTitle ||
    `${reportTemplates.find((t) => t.id === reportType)?.name || 'Report'} - ${projectName}`;

  // Build venue string
  const venueStr = [projectData.venue, projectData.venue_city, projectData.venue_state]
    .filter(Boolean)
    .join(', ');

  // Build production staff list
  const productionStaff = [
    projectData.production_electrician &&
      `Production Electrician: ${projectData.production_electrician}`,
    projectData.production_manager && `Production Manager: ${projectData.production_manager}`,
    projectData.general_manager && `General Manager: ${projectData.general_manager}`,
  ].filter(Boolean);

  // Build dates string
  const datesStr = [
    projectData.load_in_date &&
      `Load-in: ${new Date(projectData.load_in_date).toLocaleDateString()}`,
    projectData.tech_date && `Tech: ${new Date(projectData.tech_date).toLocaleDateString()}`,
    projectData.opening_date &&
      `Opening: ${new Date(projectData.opening_date).toLocaleDateString()}`,
    projectData.closing_date &&
      `Closing: ${new Date(projectData.closing_date).toLocaleDateString()}`,
  ]
    .filter(Boolean)
    .join(' | ');

  // Render based on preset
  switch (preset) {
    case 'minimal':
      return (
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 print:bg-white print:border-black print:mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black">
            {reportTitle}
          </h1>
        </div>
      );

    case 'logo-focused':
      return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 print:bg-white print:border-black print:mb-6">
          <div className="flex flex-col items-center text-center">
            {/* Large Logo */}
            {fields.showLogo && projectData.logo_path && (
              <div className="mb-4">
                <img
                  src={`file://${projectData.logo_path}`}
                  alt="Company Logo"
                  className="max-h-32 max-w-64 object-contain print:max-h-28"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Title */}
            {fields.showTitle && (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 print:text-black">
                {reportTitle}
              </h1>
            )}

            {/* Project Name */}
            {fields.showProjectName && projectName && (
              <p className="text-lg text-gray-700 dark:text-gray-300 print:text-gray-800 mb-4">
                {projectName}
              </p>
            )}

            {/* Generated Date */}
            {fields.showGeneratedDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
                Generated:{' '}
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      );

    case 'detailed':
      return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 print:bg-white print:border-black print:mb-6">
          <div className="flex items-start justify-between mb-4">
            {/* Title Section */}
            <div className="flex-1">
              {fields.showTitle && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 print:text-black">
                  {reportTitle}
                </h1>
              )}
              {fields.showProjectName && projectName && (
                <p className="text-lg text-gray-700 dark:text-gray-300 print:text-gray-800">
                  {projectName}
                </p>
              )}
            </div>

            {/* Logo Section */}
            {fields.showLogo && projectData.logo_path && (
              <div className="ml-6">
                <img
                  src={`file://${projectData.logo_path}`}
                  alt="Company Logo"
                  className="max-h-24 max-w-48 object-contain print:max-h-20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-4 print:border-gray-400">
            {/* Venue Information */}
            {fields.showVenue && venueStr && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Venue:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {venueStr}
                </span>
              </div>
            )}

            {/* Lighting Designer */}
            {fields.showDesigner && projectData.lighting_designer && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Lighting Designer:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {projectData.lighting_designer}
                </span>
                {projectData.lighting_designer_email && (
                  <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                    {projectData.lighting_designer_email}
                  </div>
                )}
                {projectData.lighting_designer_phone && (
                  <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                    {projectData.lighting_designer_phone}
                  </div>
                )}
              </div>
            )}

            {/* Production Staff */}
            {fields.showProductionStaff && productionStaff.length > 0 && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Production Staff:
                </span>
                <div className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {productionStaff.map((staff, idx) => (
                    <div key={idx}>{staff}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            {fields.showDates && datesStr && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Schedule:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {datesStr}
                </span>
              </div>
            )}

            {/* Revision Info */}
            {fields.showRevision && (projectData.revision_number || projectData.revision_date) && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Revision:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {projectData.revision_number || 'N/A'}
                  {projectData.revision_date &&
                    ` (${new Date(projectData.revision_date).toLocaleDateString()})`}
                </span>
              </div>
            )}

            {/* Generated Date */}
            {fields.showGeneratedDate && (
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                  Generated:
                </span>
                <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      );

    case 'standard':
    case 'custom':
    default:
      // Standard layout (same as current implementation but customizable)
      return (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 print:bg-white print:border-black print:mb-6">
          <div className="flex items-start justify-between mb-4">
            {/* Title Section */}
            <div className="flex-1">
              {fields.showTitle && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 print:text-black">
                  {reportTitle}
                </h1>
              )}
              {fields.showProjectName && projectName && (
                <p className="text-lg text-gray-700 dark:text-gray-300 print:text-gray-800">
                  {projectName}
                </p>
              )}
            </div>

            {/* Logo Section */}
            {fields.showLogo && projectData.logo_path && (
              <div className="ml-6">
                <img
                  src={`file://${projectData.logo_path}`}
                  alt="Company Logo"
                  className="max-h-24 max-w-48 object-contain print:max-h-20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Metadata Grid - Only show if any fields are enabled */}
          {(fields.showVenue ||
            fields.showDesigner ||
            fields.showProductionStaff ||
            fields.showDates ||
            fields.showRevision ||
            fields.showGeneratedDate) && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-4 print:border-gray-400">
              {/* Venue Information */}
              {fields.showVenue && venueStr && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                    Venue:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                    {venueStr}
                  </span>
                </div>
              )}

              {/* Lighting Designer */}
              {fields.showDesigner && projectData.lighting_designer && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                    Lighting Designer:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                    {projectData.lighting_designer}
                  </span>
                  {projectData.lighting_designer_email && (
                    <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                      {projectData.lighting_designer_email}
                    </div>
                  )}
                  {projectData.lighting_designer_phone && (
                    <div className="ml-2 text-xs text-gray-600 dark:text-gray-400 print:text-gray-700">
                      {projectData.lighting_designer_phone}
                    </div>
                  )}
                </div>
              )}

              {/* Production Staff */}
              {fields.showProductionStaff && productionStaff.length > 0 && (
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                    Production Staff:
                  </span>
                  <div className="ml-2 text-gray-900 dark:text-white print:text-black">
                    {productionStaff.map((staff, idx) => (
                      <div key={idx}>{staff}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              {fields.showDates && datesStr && (
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                    Schedule:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                    {datesStr}
                  </span>
                </div>
              )}

              {/* Revision Info */}
              {fields.showRevision &&
                (projectData.revision_number || projectData.revision_date) && (
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                      Revision:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                      {projectData.revision_number || 'N/A'}
                      {projectData.revision_date &&
                        ` (${new Date(projectData.revision_date).toLocaleDateString()})`}
                    </span>
                  </div>
                )}

              {/* Generated Date */}
              {fields.showGeneratedDate && (
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 print:text-black">
                    Generated:
                  </span>
                  <span className="ml-2 text-gray-900 dark:text-white print:text-black">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
  }
}
