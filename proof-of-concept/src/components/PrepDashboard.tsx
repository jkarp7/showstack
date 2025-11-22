import React, { useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { usePrepStore } from '../store/prepStore';

export const PrepDashboard: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { tasks, checklists, shopOrders, addTask, addChecklist, addShopOrder } = usePrepStore();

  const [activeTab, setActiveTab] = useState<'tasks' | 'checklists' | 'orders'>('tasks');

  // Filter items for current project
  const projectTasks = tasks.filter(t => t.projectId === currentProject?.id);
  const projectChecklists = checklists.filter(c => c.projectId === currentProject?.id);
  const projectOrders = shopOrders.filter(o => o.projectId === currentProject?.id);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <p className="text-lg">No project selected</p>
          <p className="text-sm mt-2">Please select or create a project to access the Prep module</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Project Header with Venue & Dates */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Prep: {currentProject.name}</h1>

        <div className="grid grid-cols-3 gap-6">
          {/* Venue Info - Demonstrates linkage */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Venue</h3>
            {currentProject.venue ? (
              <div className="space-y-1">
                <p className="font-medium">{currentProject.venue.name}</p>
                <p className="text-sm text-gray-600">
                  {currentProject.venue.city}, {currentProject.venue.state}
                </p>
                {currentProject.venue.contactName && (
                  <p className="text-sm text-gray-600">
                    Contact: {currentProject.venue.contactName}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No venue information</p>
            )}
          </div>

          {/* Key Dates - Demonstrates linkage */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Key Dates</h3>
            <div className="space-y-1 text-sm">
              {currentProject.loadInDate && (
                <div>
                  <span className="text-gray-600">Load-in:</span>{' '}
                  <span className="font-medium">{new Date(currentProject.loadInDate).toLocaleDateString()}</span>
                </div>
              )}
              {currentProject.focusDate && (
                <div>
                  <span className="text-gray-600">Focus:</span>{' '}
                  <span className="font-medium">{new Date(currentProject.focusDate).toLocaleDateString()}</span>
                </div>
              )}
              {currentProject.techRehearsalDate && (
                <div>
                  <span className="text-gray-600">Tech:</span>{' '}
                  <span className="font-medium">{new Date(currentProject.techRehearsalDate).toLocaleDateString()}</span>
                </div>
              )}
              {currentProject.openingDate && (
                <div>
                  <span className="text-gray-600">Opening:</span>{' '}
                  <span className="font-medium">{new Date(currentProject.openingDate).toLocaleDateString()}</span>
                </div>
              )}
              {(!currentProject.loadInDate && !currentProject.focusDate && !currentProject.techRehearsalDate && !currentProject.openingDate) && (
                <p className="text-gray-500 italic">No dates set</p>
              )}
            </div>
          </div>

          {/* Prep Status */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Prep Status</h3>
            <div className="space-y-1">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                currentProject.prepStatus === 'completed' ? 'bg-green-100 text-green-800' :
                currentProject.prepStatus === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentProject.prepStatus.replace('-', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <div>{projectTasks.length} tasks</div>
                <div>{projectChecklists.length} checklists</div>
                <div>{projectOrders.length} shop orders</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tasks ({projectTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('checklists')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'checklists'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Checklists ({projectChecklists.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shop Orders ({projectOrders.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Prep Tasks</h2>
                <button
                  onClick={() => addTask({
                    projectId: currentProject.id,
                    title: 'New Task',
                    category: 'equipment',
                    priority: 'medium',
                    status: 'pending',
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add Task
                </button>
              </div>
              {projectTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No tasks yet. Click "Add Task" to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectTasks.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">{task.category}</span>
                            <span className={`px-2 py-1 rounded ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              task.status === 'completed' ? 'bg-green-100 text-green-700' :
                              task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checklists Tab */}
          {activeTab === 'checklists' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Checklists</h2>
                <button
                  onClick={() => addChecklist({
                    projectId: currentProject.id,
                    name: 'New Checklist',
                    items: [],
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Add Checklist
                </button>
              </div>
              {projectChecklists.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No checklists yet. Click "Add Checklist" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {projectChecklists.map(checklist => (
                    <div key={checklist.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium mb-2">{checklist.name}</h3>
                      <p className="text-sm text-gray-600">
                        {checklist.items.filter(i => i.completed).length} of {checklist.items.length} completed
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shop Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Shop Orders</h2>
                <button
                  onClick={() => addShopOrder({
                    projectId: currentProject.id,
                    status: 'draft',
                    items: [],
                  })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + New Shop Order
                </button>
              </div>
              {projectOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No shop orders yet. Click "New Shop Order" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {projectOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {order.orderNumber || `Order #${order.id.slice(-6)}`}
                          </h3>
                          {order.vendor && (
                            <p className="text-sm text-gray-600">Vendor: {order.vendor}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {order.items.length} items • {new Date(order.orderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'received' ? 'bg-green-100 text-green-700' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
