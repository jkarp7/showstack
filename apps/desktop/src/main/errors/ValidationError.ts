/**
 * Validation error for input validation failures
 * Used when Zod validation fails or manual validation detects issues
 */

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any,
    public readonly constraint?: string
  ) {
    super(message);
    this.name = 'ValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Convert to user-friendly error message
   */
  toUserMessage(): string {
    if (this.constraint) {
      return `Invalid ${this.field}: ${this.constraint}`;
    }
    return `Invalid ${this.field}: ${this.message}`;
  }
}

/**
 * Multiple validation errors for batch validation
 */
export class ValidationErrors extends Error {
  constructor(
    public readonly errors: ValidationError[]
  ) {
    super(`Validation failed with ${errors.length} error(s)`);
    this.name = 'ValidationErrors';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationErrors);
    }
  }

  /**
   * Get all field names with errors
   */
  getFields(): string[] {
    return this.errors.map(e => e.field);
  }

  /**
   * Get error for specific field
   */
  getFieldError(field: string): ValidationError | undefined {
    return this.errors.find(e => e.field === field);
  }

  /**
   * Convert to user-friendly error messages
   */
  toUserMessages(): string[] {
    return this.errors.map(e => e.toUserMessage());
  }
}
