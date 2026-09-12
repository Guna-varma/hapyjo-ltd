/**
 * Regression: a double-tap on "Submit survey" created two survey rows (verified
 * live). React `disabled` state set inside the handler only applies after the
 * next render, so the second tap of a double-tap still fired. Every touchable
 * now ignores presses while an async onPress is still pending.
 */
import { render, fireEvent, act } from '@testing-library/react';
import { Pressable, TouchableOpacity } from '../index';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => { resolve = r; });
  return { promise, resolve };
}

describe('async press guard', () => {
  it('TouchableOpacity ignores a second press while the first async handler is pending', async () => {
    const d = deferred();
    const onPress = vi.fn(() => d.promise);
    const { getByRole } = render(<TouchableOpacity onPress={onPress}>Submit</TouchableOpacity>);
    const btn = getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn); // double-tap
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => { d.resolve(); await d.promise; });
    fireEvent.click(btn); // a later, deliberate press still works
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('Pressable releases the guard when the handler rejects', async () => {
    let reject!: (e: Error) => void;
    const p = new Promise<void>((_, r) => { reject = r; });
    p.catch(() => {});
    const onPress = vi.fn(() => p);
    const { getByRole } = render(<Pressable onPress={onPress}>Save</Pressable>);
    const btn = getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => { reject(new Error('server error')); try { await p; } catch { /* expected */ } });
    fireEvent.click(btn);
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('synchronous handlers are not throttled', () => {
    const onPress = vi.fn();
    const { getByRole } = render(<TouchableOpacity onPress={onPress}>Tab</TouchableOpacity>);
    const btn = getByRole('button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
