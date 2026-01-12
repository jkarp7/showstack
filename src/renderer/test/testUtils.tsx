import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Zustand store for testing
 * Usage: const mockStore = createMockStore({ fixtures: [...] })
 */
export function createMockStore<T>(initialState: Partial<T>): T {
  return initialState as T;
}

/**
 * Wait for async updates to complete
 * Usage: await waitForAsync()
 */
export function waitForAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
