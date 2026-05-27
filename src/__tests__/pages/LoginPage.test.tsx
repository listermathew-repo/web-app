import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Trading Operations')).toBeInTheDocument();
    expect(screen.getByLabelText(/Access code/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter/ })).toBeInTheDocument();
  });

  it('displays restricted access message', () => {
    render(<LoginPage />);

    expect(screen.getByText(/Restricted access/)).toBeInTheDocument();
    expect(screen.getByText(/authorised only/)).toBeInTheDocument();
  });

  it('disables submit button when password is empty', () => {
    render(<LoginPage />);

    const button = screen.getByRole('button', { name: /Enter/ });
    expect(button).toBeDisabled();
  });

  it('enables submit button when password is entered', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'test-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    expect(button).not.toBeDisabled();
  });

  it('shows loading state when submitting', async () => {
    const user = userEvent.setup();
    // Mock fetch with a delay to see the loading state
    vi.mocked(global.fetch).mockImplementationOnce(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: false,
          } as Response);
        }, 100);
      })
    );

    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'test-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    await user.click(button);

    // Button should show loading text after click
    expect(screen.getByRole('button', { name: /Authenticating/ })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
    } as Response);

    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'correct-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    await user.click(button);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'wrong-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Incorrect password/)).toBeInTheDocument();
    });
  });

  it('clears password on failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'wrong-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    await user.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('handles connection errors', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    render(<LoginPage />);

    const input = screen.getByLabelText(/Access code/) as HTMLInputElement;
    await user.type(input, 'test-password');

    const button = screen.getByRole('button', { name: /Enter/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Connection error/)).toBeInTheDocument();
    });
  });

  it('displays footer text', () => {
    render(<LoginPage />);

    expect(screen.getByText(/Mathew Lister/)).toBeInTheDocument();
    expect(screen.getByText(/Trading Operations HQ/)).toBeInTheDocument();
  });
});
