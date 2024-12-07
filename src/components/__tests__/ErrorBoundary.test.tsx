import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div data-testid="test-content">Test content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resets error state when try again is clicked', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify we see the error state
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Click try again
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);

    // Rerender with no error
    rerender(
      <ErrorBoundary>
        <TestComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Wait for the success state
    await waitFor(() => {
      const content = screen.getByTestId('test-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Test content');
    }, { timeout: 2000 });
  })
})