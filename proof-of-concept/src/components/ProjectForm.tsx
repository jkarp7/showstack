import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Project, Venue } from '../types';

export const ProjectForm: React.FC = () => {
  const { currentProject, updateProject, addProject } = useProjectStore();

  const [formData, setFormData] = useState<Partial<Project>>(
    currentProject || {
      name: '',
      client: '',
      designer: '',
      status: 'planning',
      prepStatus: 'not-started',
      showDates: [],
    }
  );

  const [venue, setVenue] = useState<Partial<Venue>>(
    currentProject?.venue || {
      name: '',
      city: '',
      state: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectData = {
      ...formData,
      venue: venue,
    };

    if (currentProject) {
      updateProject(currentProject.id, projectData);
    } else {
      addProject(projectData);
    }
  };

  const handleAddShowDate = () => {
    const newDate = prompt('Enter show date (YYYY-MM-DD):');
    if (newDate) {
      setFormData({
        ...formData,
        showDates: [...(formData.showDates || []), newDate],
      });
    }
  };

  const handleRemoveShowDate = (index: number) => {
    const newDates = [...(formData.showDates || [])];
    newDates.splice(index, 1);
    setFormData({ ...formData, showDates: newDates });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-6">
          {currentProject ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Project Info */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold mb-4">Project Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <input
                  type="text"
                  value={formData.client || ''}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designer
                </label>
                <input
                  type="text"
                  value={formData.designer || ''}
                  onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status || 'planning'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="planning">Planning</option>
                  <option value="prep">Prep</option>
                  <option value="load-in">Load-in</option>
                  <option value="tech">Tech</option>
                  <option value="running">Running</option>
                  <option value="strike">Strike</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Status
                </label>
                <select
                  value={formData.prepStatus || 'not-started'}
                  onChange={(e) => setFormData({ ...formData, prepStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Venue Information - THIS ADDRESSES ISSUE #1 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold mb-4">Venue Information</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Venue city/state fields are now linked to the Prep module.
                Changes here will be reflected in all prep-related features.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venue.name || ''}
                  onChange={(e) => setVenue({ ...venue, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={venue.address || ''}
                  onChange={(e) => setVenue({ ...venue, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={venue.city || ''}
                  onChange={(e) => setVenue({ ...venue, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={venue.state || ''}
                  onChange={(e) => setVenue({ ...venue, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={venue.zipCode || ''}
                  onChange={(e) => setVenue({ ...venue, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={venue.contactName || ''}
                  onChange={(e) => setVenue({ ...venue, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={venue.contactPhone || ''}
                  onChange={(e) => setVenue({ ...venue, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={venue.contactEmail || ''}
                  onChange={(e) => setVenue({ ...venue, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Schedule/Dates - THIS ADDRESSES ISSUE #2 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold mb-4">Schedule & Dates</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Note:</strong> All dates are now linked between the project record and Prep module.
                These dates will automatically populate in the Prep module timeline.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Load-In Date
                </label>
                <input
                  type="date"
                  value={formData.loadInDate || ''}
                  onChange={(e) => setFormData({ ...formData, loadInDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Focus Date
                </label>
                <input
                  type="date"
                  value={formData.focusDate || ''}
                  onChange={(e) => setFormData({ ...formData, focusDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tech Rehearsal Date
                </label>
                <input
                  type="date"
                  value={formData.techRehearsalDate || ''}
                  onChange={(e) => setFormData({ ...formData, techRehearsalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dress Rehearsal Date
                </label>
                <input
                  type="date"
                  value={formData.dressRehearsalDate || ''}
                  onChange={(e) => setFormData({ ...formData, dressRehearsalDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Date
                </label>
                <input
                  type="date"
                  value={formData.openingDate || ''}
                  onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Date
                </label>
                <input
                  type="date"
                  value={formData.closingDate || ''}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strike Date
                </label>
                <input
                  type="date"
                  value={formData.strikeDate || ''}
                  onChange={(e) => setFormData({ ...formData, strikeDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Show Dates
                </label>
                <div className="space-y-2">
                  {formData.showDates?.map((date, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          const newDates = [...(formData.showDates || [])];
                          newDates[index] = e.target.value;
                          setFormData({ ...formData, showDates: newDates });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveShowDate(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddShowDate}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    + Add Show Date
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
