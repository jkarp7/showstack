import { useState, useEffect } from 'react';
import { InfrastructureEquipment, PortAssignment } from '../../types/infrastructure';
import { useProjectStore } from '../../store/projectStore';
import { useFixtureStore } from '../../store/fixtureStore';
import { useInfrastructureStore } from '../../store/infrastructureStore';
import { Link, AlertCircle } from 'lucide-react';

interface PortAssignmentEditorProps {
  equipmentId?: string; // ID of current equipment being edited
  portCount: number;
  onPortCountChange: (count: number) => void;
  portAssignments: PortAssignment[];
  onPortAssignmentsChange: (assignments: PortAssignment[]) => void;
}

export function PortAssignmentEditor({
  equipmentId,
  portCount,
  onPortCountChange,
  portAssignments,
  onPortAssignmentsChange,
}: PortAssignmentEditorProps) {
  const currentProject = useProjectStore((state) => state.currentProject);
  const fixtures = useFixtureStore((state) => state.fixtures);
  const allEquipment = useInfrastructureStore((state) => state.equipment);
  const [expandedPorts, setExpandedPorts] = useState<Set<number>>(new Set());
  const [linkValidation, setLinkValidation] = useState<
    Record<number, { valid: boolean; error?: string }>
  >({});

  // Initialize port assignments when port count changes
  const handlePortCountChange = (newCount: number) => {
    onPortCountChange(newCount);

    // Create/update port assignments array
    const newAssignments: PortAssignment[] = [];
    for (let i = 1; i <= newCount; i++) {
      const existing = portAssignments.find((p) => p.port === i);
      newAssignments.push(
        existing || {
          port: i,
          connected_to: '',
          type: 'ethernet',
          status: 'active',
        },
      );
    }
    onPortAssignmentsChange(newAssignments);
  };

  const updatePortAssignment = async (port: number, updates: Partial<PortAssignment>) => {
    const newAssignments = portAssignments.map((pa) =>
      pa.port === port ? { ...pa, ...updates } : pa,
    );
    onPortAssignmentsChange(newAssignments);

    // Validate if linking to equipment
    if (
      equipmentId &&
      currentProject &&
      (updates.linked_equipment_id || updates.linked_fixture_id)
    ) {
      const portAssignment = newAssignments.find((pa) => pa.port === port);
      if (portAssignment) {
        try {
          const validation = await window.api.infrastructure.validatePortAssignment(
            equipmentId,
            portAssignment,
            currentProject.id,
          );
          setLinkValidation((prev) => ({ ...prev, [port]: validation }));
        } catch (error) {
          console.error('Error validating port assignment:', error);
        }
      }
    }
  };

  const getLinkType = (pa: PortAssignment): 'none' | 'fixture' | 'equipment' | 'text' => {
    // Check for property existence (not truthiness) to detect link mode
    // Empty string "" means "mode selected but no item chosen yet"
    if (pa.linked_fixture_id !== undefined) return 'fixture';
    if (pa.linked_equipment_id !== undefined) return 'equipment';
    if (pa.connected_to !== undefined) return 'text';
    return 'none';
  };

  const handleLinkTypeChange = (
    port: number,
    linkType: 'none' | 'fixture' | 'equipment' | 'text',
  ) => {
    const updates: Partial<PortAssignment> = {
      linked_fixture_id: linkType === 'fixture' ? '' : undefined,
      linked_equipment_id: linkType === 'equipment' ? '' : undefined,
      linked_port: undefined,
      connected_to: linkType === 'text' ? '' : undefined,
    };
    updatePortAssignment(port, updates);
  };

  const getLinkedName = (pa: PortAssignment): string => {
    if (pa.linked_fixture_id) {
      const fixture = fixtures.find((f) => f.id === pa.linked_fixture_id);
      return fixture?.position || 'Unknown Fixture';
    }
    if (pa.linked_equipment_id) {
      const equipment = allEquipment.find((e) => e.id === pa.linked_equipment_id);
      return equipment?.name || 'Unknown Equipment';
    }
    return pa.connected_to || '';
  };

  const togglePortExpansion = (port: number) => {
    const newExpanded = new Set(expandedPorts);
    if (newExpanded.has(port)) {
      newExpanded.delete(port);
    } else {
      newExpanded.add(port);
    }
    setExpandedPorts(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Port Count Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Number of Ports
        </label>
        <input
          type="number"
          min="0"
          max="128"
          value={portCount}
          onChange={(e) => handlePortCountChange(parseInt(e.target.value) || 0)}
          className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Set to 0 if this equipment doesn't have configurable ports
        </p>
      </div>

      {/* Port Assignment List */}
      {portCount > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Port Assignments
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-md divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {portAssignments.map((pa) => (
              <div key={pa.port} className="bg-white dark:bg-gray-800">
                {/* Port Header - Collapsible */}
                <button
                  onClick={() => togglePortExpansion(pa.port)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Port {pa.port}
                    </span>
                    {getLinkType(pa) !== 'none' && (
                      <>
                        <Link className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          → {getLinkedName(pa)}
                        </span>
                      </>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        pa.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : pa.status === 'inactive'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {pa.status}
                    </span>
                    {linkValidation[pa.port] && !linkValidation[pa.port].valid && (
                      <AlertCircle
                        className="w-4 h-4 text-red-500"
                        title={linkValidation[pa.port].error}
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {expandedPorts.has(pa.port) ? '▼' : '▶'}
                  </span>
                </button>

                {/* Port Details - Expandable */}
                {expandedPorts.has(pa.port) && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 space-y-3">
                    {/* Link Type Selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Link Type
                      </label>
                      <select
                        value={getLinkType(pa)}
                        onChange={(e) => handleLinkTypeChange(pa.port, e.target.value as any)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="none">None</option>
                        <option value="fixture">Link to Fixture</option>
                        <option value="equipment">Link to Equipment</option>
                        <option value="text">Free Text</option>
                      </select>
                    </div>

                    {/* Link Details based on type */}
                    {getLinkType(pa) === 'fixture' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fixture
                        </label>
                        <select
                          value={pa.linked_fixture_id || ''}
                          onChange={(e) =>
                            updatePortAssignment(pa.port, {
                              linked_fixture_id: e.target.value || undefined,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select a fixture...</option>
                          {fixtures.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.position} {f.type ? `- ${f.type}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {getLinkType(pa) === 'equipment' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Equipment
                          </label>
                          <select
                            value={pa.linked_equipment_id || ''}
                            onChange={(e) =>
                              updatePortAssignment(pa.port, {
                                linked_equipment_id: e.target.value || undefined,
                              })
                            }
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select equipment...</option>
                            {allEquipment
                              .filter((e) => e.id !== equipmentId) // Can't link to self
                              .map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.name} {e.model ? `- ${e.model}` : ''}
                                </option>
                              ))}
                          </select>
                        </div>
                        {pa.linked_equipment_id && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Port on linked equipment
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={pa.linked_port || ''}
                              onChange={(e) =>
                                updatePortAssignment(pa.port, {
                                  linked_port: e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              placeholder="Port #"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {getLinkType(pa) === 'text' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Connected To
                        </label>
                        <input
                          type="text"
                          value={pa.connected_to || ''}
                          onChange={(e) =>
                            updatePortAssignment(pa.port, { connected_to: e.target.value })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Device or destination name"
                        />
                      </div>
                    )}

                    {/* Validation Error */}
                    {linkValidation[pa.port] && !linkValidation[pa.port].valid && (
                      <div className="col-span-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1.5 rounded">
                        <AlertCircle className="w-4 h-4" />
                        <span>{linkValidation[pa.port].error}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Port Type
                        </label>
                        <select
                          value={pa.type || 'ethernet'}
                          onChange={(e) =>
                            updatePortAssignment(pa.port, { type: e.target.value as any })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="ethernet">Ethernet</option>
                          <option value="dmx">DMX</option>
                          <option value="fiber">Fiber</option>
                          <option value="power">Power</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={pa.status || 'active'}
                          onChange={(e) =>
                            updatePortAssignment(pa.port, { status: e.target.value as any })
                          }
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="error">Error</option>
                        </select>
                      </div>

                      {(pa.type === 'ethernet' || pa.type === 'fiber') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            VLAN ID (optional)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="4094"
                            value={pa.vlan || ''}
                            onChange={(e) =>
                              updatePortAssignment(pa.port, {
                                vlan: e.target.value ? parseInt(e.target.value) : undefined,
                              })
                            }
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="e.g., 10"
                          />
                        </div>
                      )}

                      <div
                        className={
                          pa.type === 'ethernet' || pa.type === 'fiber' ? '' : 'col-span-2'
                        }
                      >
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          value={pa.notes || ''}
                          onChange={(e) => updatePortAssignment(pa.port, { notes: e.target.value })}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setExpandedPorts(new Set(portAssignments.map((pa) => pa.port)))}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedPorts(new Set())}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
