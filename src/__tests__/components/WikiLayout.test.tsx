import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import WikiLayout from '@/components/WikiLayout';

describe('WikiLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders WikiLayout with children', () => {
    render(
      <WikiLayout>
        <div>Test Content</div>
      </WikiLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays Trading HQ branding', () => {
    render(
      <WikiLayout>
        <div>Test</div>
      </WikiLayout>
    );

    expect(screen.getAllByText('Trading HQ').length).toBeGreaterThan(0);
  });

  it('renders all navigation items', () => {
    render(
      <WikiLayout>
        <div>Test</div>
      </WikiLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trading Rules')).toBeInTheDocument();
    expect(screen.getByText('Psychology')).toBeInTheDocument();
    expect(screen.getByText('Aristotle')).toBeInTheDocument();
  });

  it('displays session window times', () => {
    render(
      <WikiLayout>
        <div>Test</div>
      </WikiLayout>
    );

    expect(screen.getByText('Signal check')).toBeInTheDocument();
    expect(screen.getByText('London open')).toBeInTheDocument();
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('renders Sign out button', () => {
    render(
      <WikiLayout>
        <div>Test</div>
      </WikiLayout>
    );

    expect(screen.getByText(/Sign out/)).toBeInTheDocument();
  });

  it('has correct navigation structure', () => {
    const { container } = render(
      <WikiLayout>
        <div>Test</div>
      </WikiLayout>
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
