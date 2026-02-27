import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import StreamCard from './StreamCard';

describe('StreamCard Component', () => {
  const defaultProps = {
    id: 'stream-123',
    title: 'Awesome Stream',
    streamer: 'cool_streamer',
    viewers: 1500,
    thumbnail: 'https://example.com/thumb.jpg',
    tags: ['gaming', 'chatting'],
    isLive: true,
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <StreamCard {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it('renders stream details correctly', () => {
    renderComponent();

    expect(screen.getByText('Awesome Stream')).toBeInTheDocument();
    expect(screen.getByText('cool_streamer')).toBeInTheDocument();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('renders thumbnail with correct attributes', () => {
    renderComponent();

    const image = screen.getByAltText('Awesome Stream');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('renders "Live" badge when isLive is true', () => {
    renderComponent({ isLive: true });
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('does not render "Live" badge when isLive is false', () => {
    renderComponent({ isLive: false });
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('renders tags correctly', () => {
    renderComponent();
    expect(screen.getByText('gaming')).toBeInTheDocument();
    expect(screen.getByText('chatting')).toBeInTheDocument();
  });

  it('renders correct links', () => {
    renderComponent();

    // Check stream link
    screen.getAllByRole('link', { name: /Awesome Stream/i });
    // There might be multiple links pointing to the stream (thumbnail + title)
    // The component has one link for thumbnail and one for title.
    // Let's be more specific or check all relevant links.

    // Link wrapping the thumbnail
    // The component structure:
    // Link (to /watch/id) -> img
    // Link (to /channel/streamer) -> img (avatar)
    // Link (to /watch/id) -> title
    // Link (to /channel/streamer) -> streamer name

    const links = screen.getAllByRole('link');

    // Check for watch link
    const watchLink = links.find(link => link.getAttribute('href') === '/watch/stream-123');
    expect(watchLink).toBeInTheDocument();

    // Check for channel link
    const channelLink = links.find(link => link.getAttribute('href') === '/channel/cool_streamer');
    expect(channelLink).toBeInTheDocument();
  });
});
