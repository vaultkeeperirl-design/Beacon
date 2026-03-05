import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PollWidget from './PollWidget';
import * as usePollModule from '../hooks/usePoll';

// Mock the hook
vi.mock('../hooks/usePoll', () => ({
  usePoll: vi.fn(),
}));

describe('PollWidget', () => {
  const mockSubmitVote = vi.fn();

  beforeEach(() => {
    mockSubmitVote.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing if no active poll', () => {
    usePollModule.usePoll.mockReturnValue({
      activePoll: null,
      hasVoted: false,
      submitVote: mockSubmitVote,
    });

    const { container } = render(<PollWidget streamId="stream-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render active poll with options', () => {
    usePollModule.usePoll.mockReturnValue({
      activePoll: {
        id: 'poll-1',
        question: 'Best OS?',
        options: [
          { text: 'Linux', votes: 10 },
          { text: 'Windows', votes: 5 }
        ],
        totalVotes: 15,
        isActive: true
      },
      hasVoted: false,
      submitVote: mockSubmitVote,
    });

    render(<PollWidget streamId="stream-1" />);

    expect(screen.getByText('Best OS?')).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
    expect(screen.getByText('15 VOTES')).toBeInTheDocument();
  });

  it('should handle voting', () => {
    usePollModule.usePoll.mockReturnValue({
      activePoll: {
        id: 'poll-1',
        question: 'Vote?',
        options: [
          { text: 'Yes', votes: 0 },
          { text: 'No', votes: 0 }
        ],
        totalVotes: 0,
        isActive: true
      },
      hasVoted: false,
      submitVote: mockSubmitVote,
    });

    render(<PollWidget streamId="stream-1" />);

    // Find options. The text might be split, so we search by text match
    const optionYes = screen.getByText('Yes').closest('button');

    fireEvent.click(optionYes);

    expect(mockSubmitVote).toHaveBeenCalledWith(0);
  });

  it('should display results and disable voting if user has voted', () => {
    usePollModule.usePoll.mockReturnValue({
      activePoll: {
        id: 'poll-1',
        question: 'Done?',
        options: [
          { text: 'Yes', votes: 75 },
          { text: 'No', votes: 25 }
        ],
        totalVotes: 100,
        isActive: true
      },
      hasVoted: true,
      submitVote: mockSubmitVote,
    });

    render(<PollWidget streamId="stream-1" />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });
  it('should handle poll duration and disable voting when time expires', () => {
    vi.useFakeTimers();
    const now = Date.now();

    usePollModule.usePoll.mockReturnValue({
      activePoll: {
        id: now,
        question: 'Time Limited Poll',
        options: [
          { text: 'Option 1', votes: 0 },
          { text: 'Option 2', votes: 0 }
        ],
        totalVotes: 0,
        isActive: true,
        duration: 10 // 10 seconds
      },
      hasVoted: false,
      submitVote: mockSubmitVote,
    });

    render(<PollWidget streamId="stream-1" />);

    // Fast-forward past initial timeout
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Initially should be 10 seconds remaining
    expect(screen.getByText(/0:10 remaining/i)).toBeInTheDocument();

    const option1 = screen.getByText('Option 1').closest('button');
    expect(option1).not.toBeDisabled();

    // Fast-forward 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/0:05 remaining/i)).toBeInTheDocument();

    // Fast-forward another 5 seconds (time expires)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/0:00 remaining/i)).toBeInTheDocument();

    // The option should now be disabled
    expect(option1).toBeDisabled();

    // Clean up
    vi.useRealTimers();
  });
});
