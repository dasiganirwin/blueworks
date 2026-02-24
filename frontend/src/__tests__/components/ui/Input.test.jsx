import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input, Textarea, Select } from '@/components/ui/Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('renders label text', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders required asterisk when required', () => {
    render(<Input label="Phone" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not render required asterisk when not required', () => {
    render(<Input label="Phone" />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error border class when error provided', () => {
    render(<Input error="Invalid" />);
    expect(screen.getByRole('textbox').className).toMatch(/border-red-400/);
  });

  it('does not apply error border when no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox').className).not.toMatch(/border-red-400/);
  });

  it('passes value and onChange to input', async () => {
    const onChange = jest.fn();
    render(<Input value="hello" onChange={onChange} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });
});

describe('Textarea', () => {
  it('renders textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<Textarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Textarea error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('defaults to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });
});

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders all options', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
  });

  it('renders label', () => {
    render(<Select label="Choose" options={options} />);
    expect(screen.getByText('Choose')).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Select options={options} error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
