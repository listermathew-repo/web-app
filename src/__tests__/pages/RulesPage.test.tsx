import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RulesPage from '@/app/rules/page';

// Mock WikiLayout
vi.mock('@/components/WikiLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="wiki-layout">{children}</div>
  ),
}));

describe('RulesPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page within WikiLayout', () => {
    render(<RulesPage />);
    expect(screen.getByTestId('wiki-layout')).toBeInTheDocument();
  });

  it('displays page title and description', () => {
    render(<RulesPage />);
    expect(screen.getByText('Trading Rules')).toBeInTheDocument();
    expect(screen.getByText(/MAF system/)).toBeInTheDocument();
  });

  // MAF System Tests
  it('displays MAF System section', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Market Analysis Framework/)).toBeInTheDocument();
  });

  it('displays all MAF system steps', () => {
    render(<RulesPage />);
    expect(screen.getByText('Morning Video')).toBeInTheDocument();
    expect(screen.getByText('Signal Check')).toBeInTheDocument();
    expect(screen.getByText('London Entry')).toBeInTheDocument();
  });

  it('displays MAF step details', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Watch MAF video before 14:00 ACST/)).toBeInTheDocument();
    expect(screen.getByText(/15:00 ACST sharp/)).toBeInTheDocument();
    expect(screen.getByText(/Entry only 15:30–17:00 ACST/)).toBeInTheDocument();
  });

  it('displays bias invalidation format instructions', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Bias invalidation format:/)).toBeInTheDocument();
    expect(screen.getByText(/Scenario 1 is OFF if/)).toBeInTheDocument();
  });

  // 5-Condition Gate Tests
  it('displays 5-Condition Entry Gate section', () => {
    render(<RulesPage />);
    expect(screen.getByText('5-Condition Entry Gate')).toBeInTheDocument();
    expect(screen.getByText(/ALL conditions required/)).toBeInTheDocument();
  });

  it('displays all 5 conditions', () => {
    render(<RulesPage />);
    expect(screen.getByText('VWAP bounce')).toBeInTheDocument();
    expect(screen.getByText('RSI 40–60')).toBeInTheDocument();
    expect(screen.getByText('EMA10 > EMA21')).toBeInTheDocument();
    expect(screen.getByText('Price > EMA20')).toBeInTheDocument();
    expect(screen.getByText('Scenario 1 confirmed')).toBeInTheDocument();
  });

  it('displays condition details', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Price reclaiming VWAP from below/)).toBeInTheDocument();
    expect(screen.getByText(/Momentum zone/)).toBeInTheDocument();
    expect(screen.getByText(/Short-term trend aligned bullish/)).toBeInTheDocument();
    expect(screen.getByText(/Price trading above the 20-period EMA/)).toBeInTheDocument();
    expect(screen.getByText(/Morning video has identified/)).toBeInTheDocument();
  });

  it('displays gate purposes', () => {
    render(<RulesPage />);
    expect(screen.getByText('Filters noise')).toBeInTheDocument();
    expect(screen.getByText('Avoids chasing')).toBeInTheDocument();
    expect(screen.getByText('Trend confirmation')).toBeInTheDocument();
    expect(screen.getByText('Structure filter')).toBeInTheDocument();
    expect(screen.getByText('Direction authority')).toBeInTheDocument();
  });

  it('displays spread warning', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Gate 6 — Spread:/)).toBeInTheDocument();
    expect(screen.getByText(/Factor spread into SL/)).toBeInTheDocument();
  });

  // Tier Sizing Tests
  it('displays Tier Sizing System section', () => {
    render(<RulesPage />);
    expect(screen.getByText('Tier Sizing System')).toBeInTheDocument();
    expect(screen.getByText(/Tier chosen BEFORE entry/)).toBeInTheDocument();
  });

  it('displays all trading tiers', () => {
    render(<RulesPage />);
    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.getByText('T4')).toBeInTheDocument();
  });

  it('displays tier risk amounts', () => {
    render(<RulesPage />);
    expect(screen.getByText('$200')).toBeInTheDocument(); // T1
    expect(screen.getByText('$400')).toBeInTheDocument(); // T2
    expect(screen.getByText('$600')).toBeInTheDocument(); // T3
    expect(screen.getByText('$800')).toBeInTheDocument(); // T4
  });

  it('displays tier lot sizes', () => {
    render(<RulesPage />);
    expect(screen.getByText(/0.2 lots GOLD/)).toBeInTheDocument();
    expect(screen.getByText(/0.4 lots GOLD/)).toBeInTheDocument();
    expect(screen.getByText(/0.6 lots GOLD/)).toBeInTheDocument();
    expect(screen.getByText(/0.8 lots GOLD/)).toBeInTheDocument();
  });

  it('displays tier contexts', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Low confidence/)).toBeInTheDocument();
    expect(screen.getByText(/Standard A-grade setup/)).toBeInTheDocument();
    expect(screen.getByText(/High-conviction A\+ setup/)).toBeInTheDocument();
    expect(screen.getByText(/Exceptional/)).toBeInTheDocument();
  });

  it('displays Wednesday tier restriction', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Wednesday:/)).toBeInTheDocument();
    expect(screen.getByText(/T2 maximum/)).toBeInTheDocument();
    expect(screen.getByText(/A\+ setup required/)).toBeInTheDocument();
  });

  // Risk Rules Tests
  it('displays Risk Rules section', () => {
    render(<RulesPage />);
    expect(screen.getByText('Risk Rules')).toBeInTheDocument();
  });

  it('displays all risk rules', () => {
    render(<RulesPage />);
    expect(screen.getByText('Personal daily limit')).toBeInTheDocument();
    expect(screen.getByText('FTMO daily hard stop')).toBeInTheDocument();
    expect(screen.getByText('FTMO max drawdown')).toBeInTheDocument();
    expect(screen.getByText('2-loss rule')).toBeInTheDocument();
    expect(screen.getByText('Wednesday max tier')).toBeInTheDocument();
    expect(screen.getByText('BE rule')).toBeInTheDocument();
    expect(screen.getByText('Exit discipline')).toBeInTheDocument();
  });

  it('displays risk rule values and notes', () => {
    render(<RulesPage />);
    expect(screen.getByText('$1,600 (2% of $80k)')).toBeInTheDocument();
    expect(screen.getByText('$4,000 (5% shadow)')).toBeInTheDocument();
    expect(screen.getByText('$8,000 (10% shadow)')).toBeInTheDocument();
    expect(screen.getByText('2 losses in one session')).toBeInTheDocument();
    expect(screen.getByText(/Move SL to BE at \+1R/)).toBeInTheDocument();
  });

  it('displays risk rule actions', () => {
    render(<RulesPage />);
    expect(screen.getByText(/stop. Platform closes/)).toBeInTheDocument();
    expect(screen.getByText(/Terminal halt/)).toBeInTheDocument();
    expect(screen.getByText(/Challenge over if breached/)).toBeInTheDocument();
    expect(screen.getByText(/Close platform immediately/)).toBeInTheDocument();
  });

  // Instruments Tests
  it('displays Instruments & Margin Reference section', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Instruments & Margin Reference/)).toBeInTheDocument();
  });

  it('displays margin explanation', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Margin is collateral locked/)).toBeInTheDocument();
  });

  it('displays all trading instruments', () => {
    render(<RulesPage />);
    expect(screen.getByText('XAUUSD (Gold)')).toBeInTheDocument();
    expect(screen.getByText('AUDUSD')).toBeInTheDocument();
    expect(screen.getByText('EURUSD')).toBeInTheDocument();
  });

  it('displays instrument stop loss levels', () => {
    render(<RulesPage />);
    expect(screen.getByText('15–25 pts')).toBeInTheDocument();
    expect(screen.getByText('10–15 pips')).toBeInTheDocument();
  });

  it('displays instrument leverage', () => {
    render(<RulesPage />);
    expect(screen.getByText('1:20')).toBeInTheDocument();
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('displays instrument margin requirements', () => {
    render(<RulesPage />);
    expect(screen.getByText('~A$8,974')).toBeInTheDocument();
    expect(screen.getByText('~A$8,891')).toBeInTheDocument();
    expect(screen.getByText('~A$14,598')).toBeInTheDocument();
  });

  it('displays instrument notes', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Primary instrument/)).toBeInTheDocument();
    expect(screen.getByText(/Most margin-efficient/)).toBeInTheDocument();
    expect(screen.getByText(/Higher margin/)).toBeInTheDocument();
  });

  it('displays T2 margin reference', () => {
    render(<RulesPage />);
    expect(screen.getByText('T2 margin ($400 risk)')).toBeInTheDocument();
  });

  it('displays session time for all instruments', () => {
    const { container } = render(<RulesPage />);
    const sessionElements = container.querySelectorAll('[class*="text-xs"]');
    expect(sessionElements.length).toBeGreaterThan(0);
  });

  it('has correct page reference label', () => {
    render(<RulesPage />);
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('displays complete subtitle with all components', () => {
    render(<RulesPage />);
    expect(screen.getByText(/Entry conditions/)).toBeInTheDocument();
    expect(screen.getByText(/Risk management/)).toBeInTheDocument();
    expect(screen.getByText(/Tier sizing/)).toBeInTheDocument();
  });
});
