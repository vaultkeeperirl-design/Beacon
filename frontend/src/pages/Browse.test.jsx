import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Browse from './Browse';

vi.mock('axios');

const MOCK_STREAMS = [
  { id: 1, title: 'Building a P2P streaming app from scratch', streamer: 'JulesDev', viewers: 12500, tags: 'Coding, React, WebRTC', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600' },
  { id: 2, title: 'Late Night Valorant Ranked Grind', streamer: 'FPS_God', viewers: 8200, tags: 'FPS, Competitive', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600' },
  { id: 3, title: 'Cooking with reckless abandon', streamer: 'ChefChaos', viewers: 5100, tags: 'IRL, Cooking', thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=600' },
];

// Helper to render component with router context
const renderWithRouter = (initialEntries = ['/browse']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
       <Routes>
         <Route path="/browse" element={<Browse />} />
       </Routes>
    </MemoryRouter>
  );
};

describe('Browse Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    axios.get.mockResolvedValue({ data: MOCK_STREAMS });
  });

  it('renders all streams by default', async () => {
    renderWithRouter();

    expect(screen.getByText(/Live Channels/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Building a P2P streaming app from scratch/i)).toBeInTheDocument();
    });
  });

  it('filters streams based on search query', async () => {
    renderWithRouter(['/browse?q=Valorant']);

    // Should update title immediately
    expect(screen.getByText(/Search Results for "Valorant"/i)).toBeInTheDocument();

    // Wait for filtered result
    await waitFor(() => {
      expect(screen.getByText(/Late Night Valorant Ranked Grind/i)).toBeInTheDocument();
    });

    // Should NOT show non-matching streams
    expect(screen.queryByText(/Cooking with reckless abandon/i)).not.toBeInTheDocument();
  });

  it('filters streams based on tags', async () => {
     renderWithRouter(['/browse?q=Cooking']);
     await waitFor(() => {
       expect(screen.getByText(/Cooking with reckless abandon/i)).toBeInTheDocument();
     });
  });

  it('shows empty state when no results found', async () => {
    renderWithRouter(['/browse?q=NonExistentStream123']);

    await waitFor(() => {
      expect(screen.getByText(/No channels found/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/We couldn't find any channels matching "NonExistentStream123"/i)).toBeInTheDocument();

    // Check for clear search button
    const clearButton = screen.getByRole('button', { name: /Clear Search/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when "Clear Search" is clicked', async () => {
     renderWithRouter(['/browse?q=NonExistentStream123']);

     const clearButton = await screen.findByRole('button', { name: /Clear Search/i });
     fireEvent.click(clearButton);

     // After clicking clear, it should show "Live Channels" again and the default list
     expect(screen.getByText(/Live Channels/i)).toBeInTheDocument();
     expect(screen.queryByText(/Search Results for/i)).not.toBeInTheDocument();

     await waitFor(() => {
       expect(screen.getByText(/Building a P2P streaming app from scratch/i)).toBeInTheDocument();
     });
  });
});
