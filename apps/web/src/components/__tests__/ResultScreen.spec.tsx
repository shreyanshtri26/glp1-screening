import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultScreen } from '../ResultScreen';
import type { EligibilityResult } from '@glp1/shared';

describe('ResultScreen', () => {
  const onStartOver = vi.fn();

  it('shows eligible outcome', () => {
    const result: EligibilityResult = { outcome: 'eligible', reason: 'All criteria met' };
    render(<ResultScreen result={result} onStartOver={onStartOver} />);
    expect(screen.getByTestId('result-outcome')).toHaveTextContent('You appear eligible');
    expect(screen.getByTestId('result-reason')).toHaveTextContent('All criteria met');
  });

  it('shows ineligible outcome', () => {
    const result: EligibilityResult = { outcome: 'ineligible', reason: 'Underage' };
    render(<ResultScreen result={result} onStartOver={onStartOver} />);
    expect(screen.getByTestId('result-outcome')).toHaveTextContent('Not eligible at this time');
  });

  it('shows clinical review outcome', () => {
    const result: EligibilityResult = { outcome: 'clinical_review', reason: 'High BMI' };
    render(<ResultScreen result={result} onStartOver={onStartOver} />);
    expect(screen.getByTestId('result-outcome')).toHaveTextContent('Clinical review required');
  });

  it('calls onStartOver when button clicked', () => {
    const result: EligibilityResult = { outcome: 'eligible', reason: 'All criteria met' };
    render(<ResultScreen result={result} onStartOver={onStartOver} />);
    fireEvent.click(screen.getByTestId('start-over-btn'));
    expect(onStartOver).toHaveBeenCalled();
  });
});
