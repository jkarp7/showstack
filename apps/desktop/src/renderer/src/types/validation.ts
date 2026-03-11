export type ValidationSeverity = 'error' | 'warning';

/** Which sidebar nav item owns this issue (for badge placement). */
export type ValidationSidebarItem = 'fixtures' | 'infrastructure' | 'racks';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  sidebarItem: ValidationSidebarItem;
  /** Short label shown in the badge tooltip and Show Health panel. */
  type: string;
  message: string;
  /** IDs of the affected rows (fixture ids, infrastructure equipment ids, etc.) */
  entityIds: string[];
}
