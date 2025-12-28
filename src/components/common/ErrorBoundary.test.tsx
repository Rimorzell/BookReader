import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Normal content</div>;
};

// Suppress console.error during tests since we're testing error handling
const originalConsoleError = console.error;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should show Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should show Reload App button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Reload App')).toBeInTheDocument();
  });

  it('should reset error state when Try Again is clicked', async () => {
    // Use a stateful component to control throwing
    let throwRef = { current: true };

    const ConditionalThrow = () => {
      if (throwRef.current) {
        throw new Error('Test error');
      }
      return <div>Normal content</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>
    );

    // Error should be shown
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Update the ref to not throw
    throwRef.current = false;

    // Click Try Again - this resets ErrorBoundary's internal state
    fireEvent.click(screen.getByText('Try Again'));

    // The component should now render without error
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should handle escape key to retry', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Trigger escape key
    fireEvent.keyDown(window, { key: 'Escape' });

    // ErrorBoundary should attempt to reset (though component still throws)
  });

  it('should log error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('should catch errors in nested components', () => {
    const NestedComponent = () => {
      throw new Error('Nested error');
    };

    render(
      <ErrorBoundary>
        <div>
          <div>
            <NestedComponent />
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Nested error')).toBeInTheDocument();
  });

  it('should handle errors without message', () => {
    const ThrowEmptyError = () => {
      throw new Error();
    };

    render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render multiple children correctly', () => {
    render(
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });
});
