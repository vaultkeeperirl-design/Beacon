import { render, screen, fireEvent } from '@testing-library/react';
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
});
