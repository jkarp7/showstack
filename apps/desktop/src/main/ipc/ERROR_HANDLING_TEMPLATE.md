# IPC Handler Error Handling Template

This template shows how to update IPC handlers with proper error handling using the new error handling infrastructure.

## Pattern

```typescript
import { errorHandler } from '../errors';
import { DatabaseError, ValidationError } from '../errors';

ipcMain.handle('domain:operation', async (_event, ...args) => {
  try {
    // 1. Basic validation (if needed)
    if (!requiredField) {
      throw new ValidationError('Field is required', 'fieldName', actualValue);
    }

    // 2. Wrap operation with retry logic
    return await errorHandler.executeWithRetry(
      async () => actualOperation(...args),
      'domain:operation', // operation name for logging
    );
  } catch (error) {
    // 3. Structured logging
    console.error('Failed to perform operation:', {
      operation: 'domain:operation',
      args: sanitizedArgs, // Be careful not to log sensitive data
      error: error instanceof Error ? error.message : error,
    });

    // 4. User-friendly error messages
    if (error instanceof ValidationError) {
      throw new Error(error.toUserMessage());
    }
    if (error instanceof DatabaseError) {
      throw new Error(`Unable to perform operation: ${error.message}`);
    }
    throw error;
  }
});
```

## Handlers to Update

Remaining IPC handlers that need error handling updates:

- [ ] src/main/ipc/projects.ts
- [ ] src/main/ipc/prep.ts (1337 lines - also needs refactoring)
- [ ] src/main/ipc/infrastructure.ts
- [ ] src/main/ipc/dimmerRacks.ts
- [ ] src/main/ipc/dimmerRackModules.ts
- [ ] src/main/ipc/pdRacks.ts
- [ ] src/main/ipc/phaseTemplates.ts
- [ ] src/main/ipc/dialogs.ts
- [ ] src/main/ipc/preferences.ts
- [ ] src/main/ipc/settings.ts
- [ ] src/main/ipc/files.ts
- [ ] src/main/ipc/paperwork.ts
- [ ] src/main/ipc/labelPrinter.ts
- [ ] src/main/ipc/licenses.ts
- [ ] src/main/ipc/admin.ts
- [ ] src/main/ipc/menu.ts
- [ ] src/main/ipc/shell.ts
- [ ] src/main/ipc/window.ts
- [ ] ...and others

## Example: fixtures.ts

See `src/main/ipc/fixtures.ts` for a complete working example.

## Notes

- Use `errorHandler.executeWithRetry()` for database operations
- Add validation before operations when appropriate
- Log with structured data (operation name, args, error)
- Return user-friendly error messages, not technical stack traces
- Distinguish between ValidationError and DatabaseError for better UX
