import { render, screen, act } from '@testing-library/react';
import { P2PProvider, useP2P } from './P2PContext';
import { describe, it, expect, vi } from 'vitest';

const TestComponent = () => {
  const { stats, settings, updateSettings, isSharing, setIsSharing } = useP2P();

  return (
    <div>
      <div data-testid="upload-speed">{stats.uploadSpeed}</div>
      <div data-testid="max-upload">{settings.maxUploadSpeed}</div>
      <div data-testid="quality">{settings.quality}</div>
      <div data-testid="show-stats">{settings.showStats.toString()}</div>
      <button onClick={() => updateSettings({ maxUploadSpeed: 10, quality: '720p', showStats: true })}>
        Update Settings
      </button>
      <button onClick={() => setIsSharing(!isSharing)}>Toggle Sharing</button>
    </div>
  );
};

describe('P2PContext', () => {
  it('provides default stats and settings', () => {
    render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    expect(screen.getByTestId('max-upload')).toHaveTextContent('50');
    expect(screen.getByTestId('quality')).toHaveTextContent('1080p60');
    expect(screen.getByTestId('show-stats')).toHaveTextContent('false');
  });

  it('updates settings', async () => {
    render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    const button = screen.getByText('Update Settings');
    act(() => {
        button.click();
    });

    expect(screen.getByTestId('max-upload')).toHaveTextContent('10');
    expect(screen.getByTestId('quality')).toHaveTextContent('720p');
    expect(screen.getByTestId('show-stats')).toHaveTextContent('true');
  });

  it('stops stats update when not sharing', async () => {
     vi.useFakeTimers();
     render(
      <P2PProvider>
        <TestComponent />
      </P2PProvider>
    );

    // Fast forward to generate some stats
    act(() => {
        vi.advanceTimersByTime(2000);
    });

    const button = screen.getByText('Toggle Sharing');
    act(() => {
        button.click();
    });

    act(() => {
        vi.runAllTimers();
    });

    // When sharing is off, upload speed resets to 0
    expect(screen.getByTestId('upload-speed')).toHaveTextContent('0');

    vi.useRealTimers();
  });
});
