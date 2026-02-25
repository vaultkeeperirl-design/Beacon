import { render, screen, fireEvent } from '@testing-library/react';
import StreamSettings from './StreamSettings';
import { P2PProvider } from '../context/P2PContext';
import { describe, it, expect, vi } from 'vitest';

describe('StreamSettings', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <P2PProvider>
        <StreamSettings isOpen={false} onClose={() => {}} />
      </P2PProvider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders settings when open', () => {
    render(
      <P2PProvider>
        <StreamSettings isOpen={true} onClose={() => {}} />
      </P2PProvider>
    );
    expect(screen.getByText('Stream Configuration')).toBeInTheDocument();
    expect(screen.getByText('Max Upload Speed')).toBeInTheDocument();
    expect(screen.getByText('Stats for Nerds')).toBeInTheDocument();
  });

  it('updates settings on interaction', () => {
    render(
      <P2PProvider>
        <StreamSettings isOpen={true} onClose={() => {}} />
      </P2PProvider>
    );

    // Click 720p60
    const qualityBtn = screen.getByText('720p60');
    fireEvent.click(qualityBtn);
    expect(qualityBtn).toHaveClass('bg-beacon-600');

    // Toggle Stats for Nerds
    const statsText = screen.getByText('Stats for Nerds');
    // The button is in the parent container's sibling or similar structure.
    // Structure: flex -> (div -> (icon, div -> (text)), button)
    const row = statsText.closest('.flex.items-center.justify-between');
    const statsSwitch = row.querySelector('button');

    fireEvent.click(statsSwitch);
    expect(statsSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <P2PProvider>
        <StreamSettings isOpen={true} onClose={onClose} />
      </P2PProvider>
    );

    const closeBtn = screen.getByLabelText('Close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
