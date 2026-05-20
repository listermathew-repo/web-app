import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/page';

// Mock WikiLayout
vi.mock('@/components/WikiLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wiki-layout">{children}</div>
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('DashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard page within WikiLayout', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('wiki-layout')).toBeInTheDocument();
  });

  it('displays page title with date', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/Trading Operations Dashboard/)).toBeInTheDocument();
  });

  it('displays quick stats section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Account balance')).toBeInTheDocument();
    expect(screen.getByText('Daily loss limit')).toBeInTheDocument();
    expect(screen.getByText('Prop Firm daily hard stop')).toBeInTheDocument();
    expect(screen.getByText('Prop Firm max drawdown')).toBeInTheDocument();
  });

  it('displays correct quick stats values', () => {
    render(<DashboardPage />);

    expect(screen.getByText('$80,000')).toBeInTheDocument();
    expect(screen.getByText('$1,600')).toBeInTheDocument();
    expect(screen.getByText('$4,000')).toBeInTheDocument();
    expect(screen.getByText('$8,000')).toBeInTheDocument();
  });

  it('displays daily agenda checklist items', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Watch morning video/)).toBeInTheDocument();
    expect(screen.getByText(/Write bias invalidation line/)).toBeInTheDocument();
    expect(screen.getByText(/Check economic calendar/)).toBeInTheDocument();
    expect(screen.getByText(/Wednesday check/)).toBeInTheDocument();
    expect(screen.getByText(/15:00 check — run signal check/)).toBeInTheDocument();
    expect(screen.getByText(/Post-session log/)).toBeInTheDocument();
    expect(screen.getByText(/Update Prop Firm shadow tracker/)).toBeInTheDocument();
  });

  it('displays non-negotiable rules section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Non-Negotiable Rules')).toBeInTheDocument();
    expect(screen.getByText(/Entry ONLY between 15:30–17:00 ACST/)).toBeInTheDocument();
    expect(screen.getByText(/All 5 conditions must be met/)).toBeInTheDocument();
    expect(screen.getByText(/Max 2 losses per session/)).toBeInTheDocument();
  });

  it('displays 5-condition entry gate', () => {
    render(<DashboardPage />);

    expect(screen.getByText('5-Condition Entry Gate')).toBeInTheDocument();
    expect(screen.getByText('VWAP bounce')).toBeInTheDocument();
    expect(screen.getByText('RSI 40–60')).toBeInTheDocument();
    expect(screen.getByText('EMA10 > EMA21')).toBeInTheDocument();
    expect(screen.getByText('Price > EMA20')).toBeInTheDocument();
    expect(screen.getByText('Scenario 1 confirmed')).toBeInTheDocument();
  });

  it('displays entry gate details for each condition', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Price reclaiming VWAP from below/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum zone — not overbought/)).toBeInTheDocument();
    expect(screen.getByText(/Short-term trend aligned/)).toBeInTheDocument();
    expect(screen.getByText(/Above 20-period moving average/)).toBeInTheDocument();
    expect(screen.getByText(/Morning video bias active/)).toBeInTheDocument();
  });

  it('displays entry gate warning about all 5 conditions', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/ALL 5 must be met/)).toBeInTheDocument();
    expect(screen.getByText(/One missing = no trade/)).toBeInTheDocument();
  });

  it('displays Prop Firm shadow tracker section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Prop Firm Shadow Tracker')).toBeInTheDocument();
    expect(screen.getByText(/IN PROGRESS/)).toBeInTheDocument();
  });

  it('displays Prop Firm shadow tracker stats', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Shadow P&L')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText('Days Traded')).toBeInTheDocument();
  });

  it('displays Prop Firm scale factor explanation', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Scale factor:/)).toBeInTheDocument();
    expect(screen.getByText(/1.25×/)).toBeInTheDocument();
    expect(screen.getByText(/Real P&L × 1.25 = Shadow P&L/)).toBeInTheDocument();
  });

  it('displays quick links section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Trading Rules')).toBeInTheDocument();
    expect(screen.getByText('Prop Firm Plan')).toBeInTheDocument();
    expect(screen.getByText('Psychology')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
  });

  it('quick links have correct href attributes', () => {
    const { container } = render(<DashboardPage />);

    const rulesLink = container.querySelector('a[href="/rules"]');
    const ftmoLink = container.querySelector('a[href="/ftmo"]');
    const psychologyLink = container.querySelector('a[href="/psychology"]');
    const goalsLink = container.querySelector('a[href="/goals"]');

    expect(rulesLink).toBeInTheDocument();
    expect(ftmoLink).toBeInTheDocument();
    expect(psychologyLink).toBeInTheDocument();
    expect(goalsLink).toBeInTheDocument();
  });

  it('displays daily agenda header with instruction', () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Today's Daily Agenda/)).toBeInTheDocument();
    expect(screen.getByText(/Complete in order/)).toBeInTheDocument();
  });

  it('renders numbered checklist items correctly', () => {
    const { container } = render(<DashboardPage />);

    // Should have 7 numbered items
    const numbers = container.querySelectorAll('[class*="text-mono"]');
    expect(numbers.length).toBeGreaterThan(0);
  });

  it('displays account balance sub-text', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Capital.com')).toBeInTheDocument();
  });

  it('displays loss limit sub-text', () => {
    render(<DashboardPage />);
    expect(screen.getByText('2% personal stop')).toBeInTheDocument();
  });

  it('displays Prop Firm limits sub-text', () => {
    render(<DashboardPage />);
    expect(screen.getByText('5% — terminal halt')).toBeInTheDocument();
    expect(screen.getByText('10% — challenge over')).toBeInTheDocument();
  });

  it('displays Prop Firm target and limit', () => {
    render(<DashboardPage />);
    expect(screen.getByText('of $10,000 target')).toBeInTheDocument();
    expect(screen.getByText('limit: $10,000')).toBeInTheDocument();
  });

  it('displays minimum trading days requirement', () => {
    render(<DashboardPage />);
    expect(screen.getByText('minimum: 4')).toBeInTheDocument();
  });

  it('has correct page structure with WikiLayout wrapper', () => {
    const { container } = render(<DashboardPage />);

    const wikiLayout = container.querySelector('[data-testid="wiki-layout"]');
    expect(wikiLayout).toBeInTheDocument();
    expect(wikiLayout?.children.length).toBeGreaterThan(0);
  });
});
