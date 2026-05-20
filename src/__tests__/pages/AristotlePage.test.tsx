import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AristotlePage from '@/app/aristotle/page';

// Mock WikiLayout
vi.mock('@/components/WikiLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wiki-layout">{children}</div>
  ),
}));

describe('AristotlePage Component', () => {
  it('renders the page title', () => {
    render(<AristotlePage />);

    expect(screen.getByText('Aristotle First Principles Deconstructor')).toBeInTheDocument();
  });

  it('displays strategic reasoning label', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/Strategic reasoning/)).toBeInTheDocument();
  });

  it('shows page description', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/Strip problems to irreducible truths/)).toBeInTheDocument();
  });

  it('renders Overview & Instructions section', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/Overview & Instructions/)).toBeInTheDocument();
  });

  it('contains first principles framework description', () => {
    render(<AristotlePage />);

    const text = screen.getByText(/high-leverage analytical framework/);
    expect(text).toBeInTheDocument();
  });

  it('renders The Prompt section', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/The Prompt/)).toBeInTheDocument();
  });

  it('displays complete prompt with all 5 phases', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/PHASE 1: ASSUMPTION AUTOPSY/)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 2: IRREDUCIBLE TRUTHS/)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 3: RECONSTRUCTION FROM ZERO/)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 4: ASSUMPTION VS. TRUTH MAP/)).toBeInTheDocument();
    expect(screen.getByText(/PHASE 5: THE ARISTOTELIAN MOVE/)).toBeInTheDocument();
  });

  it('includes role definition in prompt', () => {
    render(<AristotlePage />);

    expect(
      screen.getByText(/You are the Aristotle First Principles Deconstructor/)
    ).toBeInTheDocument();
  });

  it('includes usage instructions', () => {
    render(<AristotlePage />);

    expect(screen.getByText(/Copy and paste below/)).toBeInTheDocument();
    expect(screen.getByText(/Usage:/)).toBeInTheDocument();
  });

  it('renders within WikiLayout', () => {
    const { getByTestId } = render(<AristotlePage />);

    expect(getByTestId('wiki-layout')).toBeInTheDocument();
  });

  it('displays blue info box with usage hint', () => {
    const { container } = render(<AristotlePage />);

    const infoBox = container.querySelector('.bg-blue-50');
    expect(infoBox).toBeInTheDocument();
  });
});
