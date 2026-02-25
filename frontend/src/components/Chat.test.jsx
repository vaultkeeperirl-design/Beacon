import { render, screen } from '@testing-library/react';
import Chat from './Chat';
import { P2PProvider } from '../context/P2PContext';
import { describe, it, expect, vi } from 'vitest';

// Mock useSocket
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    socket: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connected: true,
    },
    isConnected: true,
  }),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('Chat Component', () => {
  it('renders with default styling when not inline', () => {
    const { container } = render(
      <P2PProvider>
        <Chat streamId="test-stream" />
      </P2PProvider>,
    );

    const chatDiv = container.firstChild;
    expect(chatDiv).toHaveClass('fixed');
    expect(chatDiv).toHaveClass('right-0');
    expect(chatDiv).toHaveClass('w-80');
  });

  it('renders with inline styling when isInline is true', () => {
    const { container } = render(
      <P2PProvider>
        <Chat streamId="test-stream" isInline={true} />
      </P2PProvider>,
    );

    const chatDiv = container.firstChild;
    expect(chatDiv).not.toHaveClass('fixed');
    expect(chatDiv).toHaveClass('relative');
    expect(chatDiv).toHaveClass('w-full');
  });
});
