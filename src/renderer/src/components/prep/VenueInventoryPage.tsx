import React from 'react';
import { usePrepStore } from '../../store/prepStore';
import type { PrepEquipmentItem } from '../../types/prep';
import { calculateTotalQuantity, calculateRentalQuantity } from '../../utils/revisionUtils';

interface VenueInventoryPageProps {
  projectId: string;
}

/**
 * VenueInventoryPage - Shows venue-owned equipment inventory
 *
 * Lists all items with venue_qty > 0 and shows allocation breakdown
 * Can be printed as a standalone report
 */
export function VenueInventoryPage({ projectId }: VenueInventoryPageProps) {
  const { currentProject, sections, items } = usePrepStore();

  if (!currentProject) {
    return (
      <div className="p-8 text-center text-gray-500">
        No project loaded
      </div>
    );
  }

  // Filter items with venue quantity > 0
  const venueItems = items.filter((item) => (item.venue_qty || 0) > 0);

  // Group by section
  const sortedSections = [...sections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((section) =>
      venueItems.some((item) => item.section_id === section.id)
    );

  if (venueItems.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No venue-owned equipment in this project
      </div>
    );
  }

  const handlePrint = async () => {
    try {
      await window.api.prep.print.venueInventory(projectId);
    } catch (error) {
      console.error('Error printing venue inventory:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Venue Inventory
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {currentProject.production_name} • {venueItems.length} items
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Print Report
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Summary Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Venue Inventory Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Total Items:</span>
                <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">
                  {venueItems.length}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Total Venue Qty:</span>
                <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">
                  {venueItems.reduce((sum, item) => sum + (item.venue_qty || 0), 0)}
                </span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Sections:</span>
                <span className="ml-2 font-semibold text-blue-900 dark:text-blue-100">
                  {sortedSections.length}
                </span>
              </div>
            </div>
          </div>

          {/* Items by Section */}
          {sortedSections.map((section) => {
            const sectionItems = venueItems
              .filter((item) => item.section_id === section.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <div key={section.id} className="mb-8">
                {/* Section Header */}
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b-2 border-gray-300 dark:border-gray-600">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white uppercase">
                    {section.name}
                  </h3>
                </div>

                {/* Items Table */}
                <div className="overflow-hidden rounded-b-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Venue Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rental Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          % Venue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {sectionItems.map((item) => {
                        const total = calculateTotalQuantity(item);
                        const rental = calculateRentalQuantity(item);
                        const venueQty = item.venue_qty || 0;
                        const venuePercent = total > 0 ? ((venueQty / total) * 100).toFixed(0) : '0';

                        return (
                          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                              {venueQty}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                              {total}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                              {rental}
                            </td>
                            <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                              {venuePercent}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-800">
                      <tr className="font-semibold">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          Section Total
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">
                          {sectionItems.reduce((sum, item) => sum + (item.venue_qty || 0), 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                          {sectionItems.reduce((sum, item) => sum + calculateTotalQuantity(item), 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                          {sectionItems.reduce((sum, item) => sum + calculateRentalQuantity(item), 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-gray-400">
                          {/* Empty */}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
