import { render, screen, fireEvent, act } from '@testing-library/react';
import Broadcast from './Broadcast';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useP2PSettings
const mockSetCurrentStreamId = vi.fn();
vi.mock('../context/P2PContext', () => ({
  useP2PSettings: () => ({
    setCurrentStreamId: mockSetCurrentStreamId,
    username: 'TestUser',
  }),
}));

// Mock Chat component
vi.mock('../components/Chat', () => ({
  default: ({ streamId, isInline }) => (
    <div data-testid="mock-chat">
      Chat for {streamId} {isInline ? '(Inline)' : ''}
    </div>
  ),
}));

// Mock getUserMedia
const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
  getVideoTracks: () => [{ enabled: true }],
  getAudioTracks: () => [{ enabled: true }],
});

global.navigator.mediaDevices = {
  getUserMedia: mockGetUserMedia,
};

describe('Broadcast Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders broadcast studio', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Broadcast />
        </BrowserRouter>,
      );
    });

    expect(screen.getByText('Broadcast Studio')).toBeInTheDocument();
  });

  it('toggles live status and shows chat', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Broadcast />
        </BrowserRouter>,
      );
    });

    const goLiveBtn = screen.getByText('Go Live');

    await act(async () => {
      fireEvent.click(goLiveBtn);
    });

    expect(screen.getByText('End Stream')).toBeInTheDocument();
    expect(mockSetCurrentStreamId).toHaveBeenCalledWith('TestUser');
    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();
    expect(screen.getByText('Chat for TestUser (Inline)')).toBeInTheDocument();

    const endStreamBtn = screen.getByText('End Stream');
    await act(async () => {
      fireEvent.click(endStreamBtn);
    });

    expect(screen.getByText('Go Live')).toBeInTheDocument();
    expect(mockSetCurrentStreamId).toHaveBeenCalledWith(null);
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
  });
});
