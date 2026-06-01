import { createSafeActionClient } from 'next-safe-action';

export const safeActionClient = createSafeActionClient({
  defaultValidationErrorsShape: 'flattened',
  handleServerError: (error) => error.message,
});
