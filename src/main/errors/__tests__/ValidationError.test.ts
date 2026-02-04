/**
 * Unit tests for ValidationError custom error classes
 * Tests validation error handling and user-friendly messages
 */

import { describe, it, expect } from 'vitest';
import { ValidationError, ValidationErrors } from '../ValidationError';

describe('ValidationError', () => {
  describe('ValidationError single error', () => {
    it('should create error with required fields', () => {
      const error = new ValidationError('Name is required', 'name', '');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Name is required');
      expect(error.field).toBe('name');
      expect(error.value).toBe('');
      expect(error.name).toBe('ValidationError');
    });

    it('should store constraint information', () => {
      const error = new ValidationError(
        'Invalid email',
        'email',
        'not-an-email',
        'Must be valid email format'
      );

      expect(error.constraint).toBe('Must be valid email format');
    });

    it('should have proper stack trace', () => {
      const error = new ValidationError('Test', 'field', 'value');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('toUserMessage', () => {
    it('should generate user-friendly message with constraint', () => {
      const error = new ValidationError(
        'Technical error',
        'password',
        'short',
        'Must be at least 8 characters'
      );

      expect(error.toUserMessage()).toBe('Invalid password: Must be at least 8 characters');
    });

    it('should generate user-friendly message without constraint', () => {
      const error = new ValidationError('Field is required', 'username', '');

      expect(error.toUserMessage()).toBe('Invalid username: Field is required');
    });

    it('should handle special characters in field names', () => {
      const error = new ValidationError(
        'Invalid',
        'user_email',
        'test',
        'Format error'
      );

      expect(error.toUserMessage()).toBe('Invalid user_email: Format error');
    });
  });

  describe('ValidationErrors batch validation', () => {
    it('should create batch validation error', () => {
      const error1 = new ValidationError('Required', 'name', '');
      const error2 = new ValidationError('Too short', 'password', 'abc');
      const errors = new ValidationErrors([error1, error2]);

      expect(errors).toBeInstanceOf(Error);
      expect(errors).toBeInstanceOf(ValidationErrors);
      expect(errors.message).toBe('Validation failed with 2 error(s)');
      expect(errors.errors).toEqual([error1, error2]);
      expect(errors.name).toBe('ValidationErrors');
    });

    it('should handle empty errors array', () => {
      const errors = new ValidationErrors([]);

      expect(errors.message).toBe('Validation failed with 0 error(s)');
      expect(errors.errors).toEqual([]);
    });
  });

  describe('getFields', () => {
    it('should return all field names', () => {
      const error1 = new ValidationError('Required', 'name', '');
      const error2 = new ValidationError('Invalid', 'email', 'bad');
      const error3 = new ValidationError('Too short', 'password', 'abc');
      const errors = new ValidationErrors([error1, error2, error3]);

      expect(errors.getFields()).toEqual(['name', 'email', 'password']);
    });

    it('should return empty array for no errors', () => {
      const errors = new ValidationErrors([]);

      expect(errors.getFields()).toEqual([]);
    });
  });

  describe('getFieldError', () => {
    it('should return error for specific field', () => {
      const nameError = new ValidationError('Required', 'name', '');
      const emailError = new ValidationError('Invalid', 'email', 'bad');
      const errors = new ValidationErrors([nameError, emailError]);

      expect(errors.getFieldError('name')).toBe(nameError);
      expect(errors.getFieldError('email')).toBe(emailError);
    });

    it('should return undefined for non-existent field', () => {
      const error1 = new ValidationError('Required', 'name', '');
      const errors = new ValidationErrors([error1]);

      expect(errors.getFieldError('email')).toBeUndefined();
    });

    it('should return first error if field has multiple', () => {
      const error1 = new ValidationError('Required', 'name', '');
      const error2 = new ValidationError('Too short', 'name', 'a');
      const errors = new ValidationErrors([error1, error2]);

      expect(errors.getFieldError('name')).toBe(error1);
    });
  });

  describe('toUserMessages', () => {
    it('should convert all errors to user messages', () => {
      const error1 = new ValidationError('Required', 'name', '', 'Cannot be empty');
      const error2 = new ValidationError('Invalid', 'email', 'bad', 'Must be valid email');
      const errors = new ValidationErrors([error1, error2]);

      expect(errors.toUserMessages()).toEqual([
        'Invalid name: Cannot be empty',
        'Invalid email: Must be valid email'
      ]);
    });

    it('should handle errors without constraints', () => {
      const error1 = new ValidationError('Field is required', 'username', '');
      const error2 = new ValidationError('Field is invalid', 'age', -1);
      const errors = new ValidationErrors([error1, error2]);

      expect(errors.toUserMessages()).toEqual([
        'Invalid username: Field is required',
        'Invalid age: Field is invalid'
      ]);
    });

    it('should return empty array for no errors', () => {
      const errors = new ValidationErrors([]);

      expect(errors.toUserMessages()).toEqual([]);
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper instanceof checks', () => {
      const singleError = new ValidationError('test', 'field', 'value');
      const batchErrors = new ValidationErrors([singleError]);

      expect(singleError instanceof Error).toBe(true);
      expect(singleError instanceof ValidationError).toBe(true);
      expect(batchErrors instanceof Error).toBe(true);
      expect(batchErrors instanceof ValidationErrors).toBe(true);

      // ValidationErrors is not a ValidationError
      expect(batchErrors instanceof ValidationError).toBe(false);
    });
  });

  describe('Value types', () => {
    it('should handle various value types', () => {
      const stringError = new ValidationError('Invalid', 'string', '');
      const numberError = new ValidationError('Invalid', 'number', 0);
      const booleanError = new ValidationError('Invalid', 'boolean', false);
      const nullError = new ValidationError('Invalid', 'null', null);
      const undefinedError = new ValidationError('Invalid', 'undefined', undefined);
      const objectError = new ValidationError('Invalid', 'object', { key: 'value' });
      const arrayError = new ValidationError('Invalid', 'array', [1, 2, 3]);

      // All should be ValidationError instances
      expect(stringError).toBeInstanceOf(ValidationError);
      expect(numberError).toBeInstanceOf(ValidationError);
      expect(booleanError).toBeInstanceOf(ValidationError);
      expect(nullError).toBeInstanceOf(ValidationError);
      expect(undefinedError).toBeInstanceOf(ValidationError);
      expect(objectError).toBeInstanceOf(ValidationError);
      expect(arrayError).toBeInstanceOf(ValidationError);

      // Check values are stored correctly
      expect(stringError.value).toBe('');
      expect(numberError.value).toBe(0);
      expect(booleanError.value).toBe(false);
      expect(nullError.value).toBe(null);
      expect(undefinedError.value).toBe(undefined);
      expect(objectError.value).toEqual({ key: 'value' });
      expect(arrayError.value).toEqual([1, 2, 3]);
    });
  });
});
