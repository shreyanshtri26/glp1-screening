import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadioInput } from '../RadioInput';
import { CheckboxInput } from '../CheckboxInput';
import { NumberInput } from '../NumberInput';

const OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

describe('RadioInput', () => {
  it('renders all options', () => {
    render(<RadioInput id="test" options={OPTIONS} value="" onChange={vi.fn()} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(<RadioInput id="test" options={OPTIONS} value="" onChange={onChange} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(onChange).toHaveBeenCalledWith('yes');
  });

  it('shows checked state', () => {
    render(<RadioInput id="test" options={OPTIONS} value="yes" onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it('has radiogroup role', () => {
    render(<RadioInput id="test" options={OPTIONS} value="" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

describe('CheckboxInput', () => {
  it('renders all options', () => {
    render(<CheckboxInput id="test" options={OPTIONS} value={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('calls onChange with toggled value', () => {
    const onChange = vi.fn();
    render(<CheckboxInput id="test" options={OPTIONS} value={[]} onChange={onChange} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(onChange).toHaveBeenCalledWith(['yes']);
  });

  it('untoggle removes value', () => {
    const onChange = vi.fn();
    render(<CheckboxInput id="test" options={OPTIONS} value={['yes']} onChange={onChange} />);
    fireEvent.click(screen.getByText('Yes'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});

describe('NumberInput', () => {
  it('renders with placeholder', () => {
    render(<NumberInput id="age" label="Age" value="" onChange={vi.fn()} unit="years" />);
    expect(screen.getByPlaceholderText('Enter value (years)')).toBeInTheDocument();
  });

  it('calls onChange on input', () => {
    const onChange = vi.fn();
    render(<NumberInput id="age" label="Age" value="30" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '35' } });
    expect(onChange).toHaveBeenCalledWith('35');
  });
});
