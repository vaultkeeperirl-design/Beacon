import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import TipButton from './TipButton';
import { useP2PSettings } from '../context/P2PContext';

vi.mock('axios');
vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
}));

describe('TipButton', () => {
  const streamId = 'test-stream';

  beforeEach(() => {
    vi.clearAllMocks();
    useP2PSettings.mockReturnValue({ token: 'mock-token' });
  });

  it('renders correctly and opens dropdown on click', async () => {
    render(<TipButton streamId={streamId} />);

    const tipButton = screen.getByRole('button', { name: 'Tip Streamer' });
    expect(tipButton).toBeInTheDocument();

    await userEvent.click(tipButton);

    expect(screen.getByText(`Support ${streamId}`)).toBeInTheDocument();
    expect(screen.getByText('10 CR')).toBeInTheDocument(); // default value
  });

  it('shows error when user is not logged in', async () => {
    useP2PSettings.mockReturnValue({ token: null });
    render(<TipButton streamId={streamId} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tip Streamer' }));

    const tipActionButton = screen.getByRole('button', { name: 'Tip 10 CR' });
    await userEvent.click(tipActionButton);

    expect(await screen.findByText('Please log in to tip')).toBeInTheDocument();
  });

  it('handles successful tip', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<TipButton streamId={streamId} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tip Streamer' }));

    // Select 50 CR
    await userEvent.click(screen.getByText('50 CR'));

    const tipActionButton = screen.getByRole('button', { name: 'Tip 50 CR' });
    await userEvent.click(tipActionButton);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/tip'),
      { streamId, amount: 50 },
      { headers: { Authorization: 'Bearer mock-token' } }
    );

    expect(await screen.findByText('Sent!')).toBeInTheDocument();
  });

  it('handles failed tip', async () => {
    const errorMessage = 'Insufficient credits';
    axios.post.mockRejectedValueOnce({ response: { data: { error: errorMessage } } });

    render(<TipButton streamId={streamId} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tip Streamer' }));

    const tipActionButton = screen.getByRole('button', { name: 'Tip 10 CR' });
    await userEvent.click(tipActionButton);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TipButton streamId={streamId} />
      </div>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tip Streamer' }));
    expect(screen.getByText(`Support ${streamId}`)).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByText(`Support ${streamId}`)).not.toBeInTheDocument();
    });
  });

  it('allows custom amount input', async () => {
    render(<TipButton streamId={streamId} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tip Streamer' }));

    const input = screen.getByPlaceholderText('Custom amount...');
    await userEvent.clear(input);
    await userEvent.type(input, '123');

    expect(screen.getByRole('button', { name: 'Tip 123 CR' })).toBeInTheDocument();
  });
});