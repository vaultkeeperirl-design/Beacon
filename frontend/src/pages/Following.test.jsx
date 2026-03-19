import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Following from './Following';
import * as FollowingContext from '../context/FollowingContext';
import axios from 'axios';

vi.mock('axios');

vi.mock('../context/FollowingContext', () => ({
  useFollowing: vi.fn(),
}));

describe('Following Page - Offline Channels Sorting', () => {
  const mockFollowedChannels = [
    { id: 'userC', name: 'UserC', avatar: null, title: 'Stream C', isLive: false },
    { id: 'userA', name: 'UserA', avatar: null, title: 'Stream A', isLive: false },
    { id: 'userB', name: 'UserB', avatar: null, title: 'Stream B', isLive: false },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    FollowingContext.useFollowing.mockReturnValue({
      followedChannels: mockFollowedChannels,
    });
    // Return empty live streams to ensure all mocks are offline
    axios.get.mockResolvedValue({ data: [] });
  });

  const renderComponent = () => {
    render(
      <MemoryRouter>
        <Following />
      </MemoryRouter>
    );
  };

  it('renders offline channel skeletons while loading', async () => {
    // Return a promise that does not resolve immediately to keep it in loading state
    axios.get.mockReturnValue(new Promise(() => {}));

    renderComponent();

    // In loading state, we expect skeletons (the pulse animation elements)
    const skeletons = screen.getAllByTestId('offline-channel-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders offline channels in default (recently-live) order', async () => {
    renderComponent();

    // Wait for the channels to be rendered
    await waitFor(() => {
      expect(screen.getByText('UserC')).toBeInTheDocument();
    });

    const channelNames = screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent).filter(name => name !== 'No live channels' && name !== 'No offline channels');

    // We expect them in the exact order they were provided
    expect(channelNames).toEqual(['UserC', 'UserA', 'UserB']);
  });

  it('sorts offline channels alphabetically when Alphabetical is selected', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('UserC')).toBeInTheDocument();
    });

    // Open dropdown
    const sortButton = screen.getByRole('button', { name: /Sort by:/i });
    fireEvent.click(sortButton);

    // Click Alphabetical (A-Z)
    const alphaOption = screen.getByRole('button', { name: 'Alphabetical (A-Z)' });
    fireEvent.click(alphaOption);

    // Verify order is now Alphabetical
    const channelNames = screen.getAllByRole('heading', { level: 3 }).map(el => el.textContent).filter(name => name !== 'No live channels' && name !== 'No offline channels');
    expect(channelNames).toEqual(['UserA', 'UserB', 'UserC']);
  });
});
