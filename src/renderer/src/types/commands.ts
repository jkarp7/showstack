/**
 * Command Pattern Implementation for Undo/Redo System
 *
 * Each command represents a reversible operation that can be executed and undone.
 * Commands are stored in undo/redo stacks and executed in sequence.
 */

export interface Command {
  /** Unique identifier for this command instance */
  id: string;

  /** Timestamp when command was created */
  timestamp: number;

  /** Type identifier (e.g., 'fixture:add', 'fixture:update', 'bulk:edit') */
  type: string;

  /** Human-readable description for UI display */
  description: string;

  /** Execute the command (perform the operation) */
  execute(): Promise<void>;

  /** Undo the command (reverse the operation) */
  undo(): Promise<void>;
}

/**
 * Composite command that executes multiple commands as a single operation.
 * Useful for bulk operations that should be undone together.
 */
export interface CompositeCommand extends Command {
  type: 'composite';
  commands: Command[];
}

/**
 * Command types for different operations
 */
export enum CommandType {
  // Fixture operations
  FIXTURE_ADD = 'fixture:add',
  FIXTURE_UPDATE = 'fixture:update',
  FIXTURE_DELETE = 'fixture:delete',
  FIXTURE_BULK_UPDATE = 'fixture:bulk-update',
  FIXTURE_BULK_DELETE = 'fixture:bulk-delete',

  // Infrastructure operations
  INFRASTRUCTURE_ADD = 'infrastructure:add',
  INFRASTRUCTURE_UPDATE = 'infrastructure:update',
  INFRASTRUCTURE_DELETE = 'infrastructure:delete',
  INFRASTRUCTURE_BULK_DELETE = 'infrastructure:bulk-delete',

  // Composite operations
  COMPOSITE = 'composite',
}
