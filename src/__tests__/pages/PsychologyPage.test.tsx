import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PsychologyPage from '@/app/psychology/page';

// Mock WikiLayout
vi.mock('@/components/WikiLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wiki-layout">{children}</div>
  ),
}));

describe('PsychologyPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page within WikiLayout', () => {
    render(<PsychologyPage />);
    expect(screen.getByTestId('wiki-layout')).toBeInTheDocument();
  });

  it('displays page title and description', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Psychology')).toBeInTheDocument();
    expect(screen.getByText(/Mental game/)).toBeInTheDocument();
  });

  // Core Principle Tests
  it('displays core trading principle', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Process score of 7\/7 is the win/)).toBeInTheDocument();
  });

  it('displays principle about P&L and process', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/P&L follows from the process/)).toBeInTheDocument();
  });

  it('displays principle about control', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/You cannot control whether a trade profits/)).toBeInTheDocument();
  });

  // Score Guide Tests
  it('displays Psychology Score Guide section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Psychology Score Guide')).toBeInTheDocument();
  });

  it('displays score guide checkpoints', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Rate at 3 checkpoints/)).toBeInTheDocument();
  });

  it('displays all psychology scores', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays score labels', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Calm / Focused')).toBeInTheDocument();
    expect(screen.getByText('Settled')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Elevated stress')).toBeInTheDocument();
    expect(screen.getByText('Stressed')).toBeInTheDocument();
  });

  it('displays score descriptions', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Fully present/)).toBeInTheDocument();
    expect(screen.getByText(/Minor background noise/)).toBeInTheDocument();
    expect(screen.getByText(/Default acceptable state/)).toBeInTheDocument();
    expect(screen.getByText(/Noticeable emotional pull/)).toBeInTheDocument();
    expect(screen.getByText(/Do NOT enter/)).toBeInTheDocument();
  });

  it('displays hard rule about score 1', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Hard rule:/)).toBeInTheDocument();
    expect(screen.getByText(/Pre-session score of 1 = do not enter/)).toBeInTheDocument();
  });

  // Post-Session Log Tests
  it('displays Post-Session Log section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Post-Session Log')).toBeInTheDocument();
  });

  it('displays post-session completion time', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Complete within 10 min/)).toBeInTheDocument();
  });

  it('displays Field 1 — Process Score', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Field 1 — Process Score')).toBeInTheDocument();
  });

  it('displays all process score fields', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Scenario confirmed?')).toBeInTheDocument();
    expect(screen.getByText(/All 4 conditions met/)).toBeInTheDocument();
    expect(screen.getByText(/Tier chosen BEFORE entry/)).toBeInTheDocument();
    expect(screen.getByText(/News checked/)).toBeInTheDocument();
    expect(screen.getByText(/Spread checked/)).toBeInTheDocument();
    expect(screen.getByText(/BE rule at correct R/)).toBeInTheDocument();
    expect(screen.getByText(/Exited at target or SL/)).toBeInTheDocument();
  });

  it('displays process score total format', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/\/ 7/)).toBeInTheDocument();
  });

  it('displays Field 2 — Emotional State', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Field 2 — Emotional State')).toBeInTheDocument();
  });

  it('displays emotional state checkpoints', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Pre-session (15:00–15:30)')).toBeInTheDocument();
    expect(screen.getByText('During trade')).toBeInTheDocument();
    expect(screen.getByText('At exit')).toBeInTheDocument();
  });

  it('displays psychology reflection fields', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Overall psych score/)).toBeInTheDocument();
    expect(screen.getByText(/Followed process/)).toBeInTheDocument();
    expect(screen.getByText(/Pressure to enter/)).toBeInTheDocument();
    expect(screen.getByText(/Revenge traded/)).toBeInTheDocument();
  });

  it('displays Field 3 — One Lesson', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Field 3 — One Lesson')).toBeInTheDocument();
  });

  it('displays REPEAT lesson section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('REPEAT:')).toBeInTheDocument();
    expect(screen.getByText(/What worked today/)).toBeInTheDocument();
  });

  it('displays AVOID lesson section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('AVOID:')).toBeInTheDocument();
    expect(screen.getByText(/What cost me discipline/)).toBeInTheDocument();
  });

  // Psychological Traps Tests
  it('displays Common Psychological Traps section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Common Psychological Traps')).toBeInTheDocument();
  });

  it('displays all psychological traps', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Revenge trading')).toBeInTheDocument();
    expect(screen.getByText('Pressure to enter')).toBeInTheDocument();
    expect(screen.getByText('Overriding invalidation')).toBeInTheDocument();
    expect(screen.getByText('Widening the SL')).toBeInTheDocument();
    expect(screen.getByText('Moving targets early')).toBeInTheDocument();
    expect(screen.getByText('FOMO entry')).toBeInTheDocument();
  });

  it('displays trap triggers', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Loss followed by urge/)).toBeInTheDocument();
    expect(screen.getByText(/I haven't traded all week/)).toBeInTheDocument();
    expect(screen.getByText(/Price hits written level/)).toBeInTheDocument();
    expect(screen.getByText(/Just give it a bit more room/)).toBeInTheDocument();
    expect(screen.getByText(/Fear of giving back open profit/)).toBeInTheDocument();
    expect(screen.getByText(/Price running without you/)).toBeInTheDocument();
  });

  it('displays trap rules', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/2-loss rule: after 2 losses/)).toBeInTheDocument();
    expect(screen.getByText(/The trade either exists or it doesn't/)).toBeInTheDocument();
    expect(screen.getByText(/The written line is the authority/)).toBeInTheDocument();
    expect(screen.getByText(/SL is set before entry/)).toBeInTheDocument();
    expect(screen.getByText(/Exit at target or SL/)).toBeInTheDocument();
    expect(screen.getByText(/Past the entry window/)).toBeInTheDocument();
  });

  // Mental Models Tests
  it('displays Mental Models section', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Mental Models')).toBeInTheDocument();
  });

  it('displays all mental models', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('The trade either exists or it doesn't')).toBeInTheDocument();
    expect(screen.getByText('Outcome vs process')).toBeInTheDocument();
    expect(screen.getByText('The 2-loss rule is your firewall')).toBeInTheDocument();
  });

  it('displays mental model about opportunity creation', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/You are not creating opportunity by watching harder/)).toBeInTheDocument();
  });

  it('displays mental model about inaction', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Inaction on a bad setup is a win/)).toBeInTheDocument();
  });

  it('displays mental model about profitable bad trades', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/A profitable trade following bad process/)).toBeInTheDocument();
  });

  it('displays mental model about losing good trades', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/A losing trade following perfect process/)).toBeInTheDocument();
  });

  it('displays mental model about 2-loss firewall', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Two losses back-to-back is data/)).toBeInTheDocument();
  });

  it('displays mental model about discretion and danger', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/The rule removes discretion from a moment/)).toBeInTheDocument();
  });

  // Navigation and Structure Tests
  it('has Mental game label', () => {
    render(<PsychologyPage />);
    expect(screen.getByText('Mental game')).toBeInTheDocument();
  });

  it('displays description subtitle', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Emotional state/)).toBeInTheDocument();
    expect(screen.getByText(/Session log/)).toBeInTheDocument();
    expect(screen.getByText(/Common traps/)).toBeInTheDocument();
  });

  it('renders 3 main sections', () => {
    const { container } = render(<PsychologyPage />);
    const mainSections = container.querySelectorAll('[class*="rounded-xl"][class*="p-6"]');
    expect(mainSections.length).toBeGreaterThanOrEqual(3);
  });

  it('has correct score ratings (1-5)', () => {
    render(<PsychologyPage />);
    // All 5 scores should be present
    const scoreElements = ['Calm / Focused', 'Settled', 'Neutral', 'Elevated stress', 'Stressed'];
    scoreElements.forEach(score => {
      expect(screen.getByText(new RegExp(score.split('/')[0]))).toBeInTheDocument();
    });
  });

  it('displays target state for psychology', () => {
    render(<PsychologyPage />);
    expect(screen.getByText(/Target state/)).toBeInTheDocument();
  });
});
