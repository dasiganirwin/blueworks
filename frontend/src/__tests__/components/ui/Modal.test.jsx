import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when isOpen=false', () => {
    render(<Modal isOpen={false} title="Test" onClose={jest.fn()}>Content</Modal>);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders title and children when isOpen=true', () => {
    render(<Modal isOpen title="My Modal" onClose={jest.fn()}>Body text</Modal>);
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <Modal isOpen title="Modal" onClose={onClose}>Content</Modal>
    );
    // The absolute inset-0 overlay div is the backdrop
    const backdrop = container.querySelector('.absolute.inset-0');
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = jest.fn();
    render(<Modal isOpen title="Modal" onClose={onClose}>Content</Modal>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sets body overflow to hidden when open', () => {
    render(<Modal isOpen title="Modal" onClose={jest.fn()}>Content</Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on unmount', () => {
    const { unmount } = render(
      <Modal isOpen title="Modal" onClose={jest.fn()}>Content</Modal>
    );
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
