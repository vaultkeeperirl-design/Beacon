import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Browse from './Browse';

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
  it('renders all streams by default', () => {
    renderWithRouter();
    // Assuming MOCK_STREAMS has "Building a P2P streaming app from scratch"
    expect(screen.getByText(/Building a P2P streaming app from scratch/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Channels/i)).toBeInTheDocument();
  });

  it('filters streams based on search query', () => {
    renderWithRouter(['/browse?q=Valorant']);

    // Should show the matching stream
    expect(screen.getByText(/Late Night Valorant Ranked Grind/i)).toBeInTheDocument();

    // Should NOT show non-matching streams
    expect(screen.queryByText(/Cooking with reckless abandon/i)).not.toBeInTheDocument();

    // Should update title
    expect(screen.getByText(/Search Results for "Valorant"/i)).toBeInTheDocument();
  });

  it('filters streams based on tags', () => {
     renderWithRouter(['/browse?q=Cooking']);
     expect(screen.getByText(/Cooking with reckless abandon/i)).toBeInTheDocument();
  });

  it('shows empty state when no results found', () => {
    renderWithRouter(['/browse?q=NonExistentStream123']);

    expect(screen.getByText(/No channels found/i)).toBeInTheDocument();
    expect(screen.getByText(/We couldn't find any channels matching "NonExistentStream123"/i)).toBeInTheDocument();

    // Check for clear search button
    const clearButton = screen.getByRole('button', { name: /Clear Search/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when "Clear Search" is clicked', () => {
     // To test this properly with MemoryRouter, we need to check if it navigates or updates state.
     // But since we can't easily access the current URL of MemoryRouter from outside without a custom wrapper,
     // we can check if the UI updates to show default state.

     // However, MemoryRouter's state update inside the component might not trigger a re-render
     // of the *test* environment's URL tracking in a way we can inspect easily,
     // but the component itself reacts to the router context.

     renderWithRouter(['/browse?q=NonExistentStream123']);

     const clearButton = screen.getByRole('button', { name: /Clear Search/i });
     fireEvent.click(clearButton);

     // After clicking clear, it should show "Live Channels" again and the default list
     expect(screen.getByText(/Live Channels/i)).toBeInTheDocument();
     expect(screen.queryByText(/Search Results for/i)).not.toBeInTheDocument();
  });
});
