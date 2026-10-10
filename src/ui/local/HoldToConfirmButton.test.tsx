import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HoldToConfirmButton } from './HoldToConfirmButton';

afterEach(() => vi.useRealTimers());
describe('user hold-to-confirm integration', () => {
  it('cancels early keyboard release and waits for the saved command before announcing success', async () => {
    vi.useFakeTimers();
    let finish: (() => void) | undefined;
    const confirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<HoldToConfirmButton onConfirm={confirm} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    act(() => vi.advanceTimersByTime(1599));
    fireEvent.keyUp(button, { key: 'Enter' });
    act(() => vi.advanceTimersByTime(2));
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: ' ' });
    act(() => vi.advanceTimersByTime(1600));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Deleting')).toBeInTheDocument();
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    await act(async () => {
      finish?.();
    });
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.getByText('Hold to delete')).toBeInTheDocument();
  });
  it('cancels on blur, disable and unmount, and never reports a failed command as deleted', async () => {
    vi.useFakeTimers();
    const confirm = vi.fn(() =>
      Promise.reject(new Error('Storage unavailable')),
    );
    const view = render(<HoldToConfirmButton onConfirm={confirm} />);
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.blur(button);
    act(() => vi.advanceTimersByTime(1600));
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.keyDown(button, { key: 'Enter' });
    view.rerender(<HoldToConfirmButton onConfirm={confirm} disabled />);
    act(() => vi.advanceTimersByTime(1600));
    expect(confirm).not.toHaveBeenCalled();
    view.rerender(<HoldToConfirmButton onConfirm={confirm} />);
    fireEvent.keyDown(button, { key: 'Enter' });
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    expect(screen.getByText('Delete did not complete.')).toBeInTheDocument();
    fireEvent.keyDown(button, { key: 'Enter' });
    view.unmount();
    act(() => vi.advanceTimersByTime(1600));
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
