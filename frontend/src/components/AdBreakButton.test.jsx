import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import AdBreakButton from './AdBreakButton';
import { useP2PSettings } from '../context/P2PContext';

vi.mock('axios');
vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
}));

describe('AdBreakButton', () => {
  const username = 'test-streamer';
  const token = 'mock-token';

  beforeEach(() => {
    vi.clearAllMocks();
    useP2PSettings.mockReturnValue({ username, token });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly in initial state', () => {
    render(<AdBreakButton />);
    const button = screen.getByRole('button', { name: /Trigger 60 second ad break/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(screen.getByText('Ad Break (60s)')).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    let resolvePost;
    const postPromise = new Promise(resolve => {
      resolvePost = resolve;
    });
    axios.post.mockReturnValue(postPromise);

    render(<AdBreakButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(screen.getByText('Triggering...')).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-label', 'Triggering ad break');

    // Clean up
    await act(async () => {
      resolvePost({ data: { success: true } });
    });
  });

  it('enters cooldown state after successful trigger', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<AdBreakButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await act(async () => {
       // axios call should resolve
    });

    expect(screen.getByText(/Ad Break \(60s\)/)).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button.getAttribute('aria-label')).toMatch(/Ad break on cooldown: 60 seconds remaining/i);

    // Fast forward 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText(/Ad Break \(50s\)/)).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/Ad break on cooldown: 50 seconds remaining/i);
  });

  it('shows error state when trigger fails', async () => {
    const consoleError = console.error;
    console.error = vi.fn();

    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<AdBreakButton />);
    const button = screen.getByRole('button');

    fireEvent.click(button);

    await act(async () => {
      // axios call should reject
    });

    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toBe('Ad break trigger failed');

    // Fast forward 4 seconds (error resets after 3s)
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText('Ad Break (60s)')).toBeInTheDocument();
    console.error = consoleError;
  });

  it('is disabled if username or token is missing', () => {
    useP2PSettings.mockReturnValue({ username: null, token: null });
    render(<AdBreakButton />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
