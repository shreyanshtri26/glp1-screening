import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders correct step info', () => {
    render(<ProgressBar current={3} total={14} />);
    expect(screen.getByText('Step 3 of 14')).toBeInTheDocument();
  });

  it('shows correct percentage', () => {
    render(<ProgressBar current={7} total={14} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('has accessible progressbar role', () => {
    render(<ProgressBar current={5} total={10} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '5');
    expect(bar).toHaveAttribute('aria-valuemin', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '10');
  });
});
