import { describe, it, expect, beforeEach } from "vitest";
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WalletBalance from './WalletBalance';
import { useP2PStats } from '../context/P2PContext';
import { vi } from 'vitest';

// Mock the context hook
vi.mock('../context/P2PContext', () => ({
  useP2PStats: vi.fn(),
}));

describe('WalletBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <WalletBalance />
      </BrowserRouter>
    );
  };

  it('renders correctly with 0 credits', () => {
    useP2PStats.mockReturnValue({ credits: 0 });
    renderComponent();

    expect(screen.getByText('0 CR')).toBeInTheDocument();
  });

  it('renders correctly with formatted credits', () => {
    useP2PStats.mockReturnValue({ credits: 1234567 });
    renderComponent();

    // Depending on locale it might be 1,234,567 but toLocaleString format is checked
    expect(screen.getByText(/1,234,567 CR/)).toBeInTheDocument();
  });

  it('has correct link to wallet', () => {
    useP2PStats.mockReturnValue({ credits: 100 });
    renderComponent();

    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/wallet');
  });
});
