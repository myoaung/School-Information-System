import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// Component that throws on render
function ThrowingComponent() {
  throw new Error('Test error');
}

// Safe component that renders children normally
function SafeChild({ label }) {
  return <div>{label}</div>;
}

function Wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <Wrapper>
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      </Wrapper>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows fallback UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Wrapper>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </Wrapper>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Go Home')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('"Go Home" link navigates to /', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <Wrapper>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </Wrapper>
    );

    const homeLink = screen.getByText('Go Home');
    expect(homeLink).toHaveAttribute('href', '/');

    spy.mockRestore();
  });

  it('"Try Again" button resets error state and allows children to re-render', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function TestHarness() {
      const [shouldError, setShouldError] = useState(true);

      return (
        <Wrapper>
          <ErrorBoundary>
            {shouldError ? (
              <ThrowingComponent />
            ) : (
              <SafeChild label="Recovered child" />
            )}
          </ErrorBoundary>
          <button onClick={() => setShouldError(false)}>Fix Error</button>
        </Wrapper>
      );
    }

    render(<TestHarness />);

    // Initially throws, showing fallback
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // First click "Try Again" -- resets error state, ThrowingComponent throws again,
    // boundary catches it and re-shows fallback with a new "Try Again" button
    await user.click(screen.getByText('Try Again'));

    // Wait for the error boundary to re-enter error state and show Try Again again
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Fix the root cause first (switch to safe child)
    await user.click(screen.getByText('Fix Error'));

    // Now click Try Again -- the boundary resets and the safe child renders
    await user.click(screen.getByText('Try Again'));

    // The boundary should render the safe children now
    expect(screen.getByText('Recovered child')).toBeInTheDocument();
    // Fallback should no longer be shown
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    spy.mockRestore();
  });
});
