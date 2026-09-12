/**
 * Animated shim semantics that affect perceived smoothness.
 *
 * The important one: Animated.loop must reset the driven value before each
 * iteration (React Native's default). Without it a 0→1 rotation animates 1→1 on
 * every later iteration, so a spinner turns once and then appears frozen.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Animated } from '../index';

/** Drives requestAnimationFrame deterministically from a fake clock. */
function installFakeFrames() {
  let now = 0;
  let nextId = 1;
  const queue: { id: number; cb: FrameRequestCallback }[] = [];
  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = nextId++;
    queue.push({ id, cb });
    return id;
  });
  // A cancelled frame must never fire, exactly as in a browser.
  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id: number) => {
    const i = queue.findIndex((f) => f.id === id);
    if (i >= 0) queue.splice(i, 1);
  });
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  return {
    /** Advances time by `ms` and flushes every frame queued so far. */
    tick(ms: number) {
      now += ms;
      const frames = queue.splice(0, queue.length);
      frames.forEach((f) => f.cb(now));
    },
    pending: () => queue.length,
  };
}

describe('Animated.loop', () => {
  let frames: ReturnType<typeof installFakeFrames>;
  beforeEach(() => {
    frames = installFakeFrames();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets the value to its origin before every iteration, so a spinner keeps turning', () => {
    const spin = new Animated.Value(0);
    const seen: number[] = [];
    spin.addListener((v) => seen.push(v));

    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 100 }));
    loop.start();

    // First sweep: 0 -> 1. On completion the loop immediately resets to the
    // origin and schedules the next sweep, so the observed values reach 1 then 0.
    frames.tick(50);
    frames.tick(50);
    expect(seen).toContain(1);
    expect(spin.getValue()).toBe(0);

    // Second iteration must progress again from 0, not sit at 1.
    frames.tick(50);
    expect(spin.getValue()).toBeCloseTo(0.5, 5);

    loop.stop();
  });

  it('stop() halts a running loop', () => {
    const v = new Animated.Value(0);
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 100 }));
    loop.start();
    frames.tick(50);
    loop.stop();
    const at = v.getValue();
    frames.tick(50);
    frames.tick(50);
    expect(v.getValue()).toBe(at);
  });

  it('sequence inside a loop restarts from the first step each iteration', () => {
    const v = new Animated.Value(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.4, duration: 100 }),
        Animated.timing(v, { toValue: 1, duration: 100 }),
      ]),
    );
    loop.start();
    frames.tick(100); // -> 0.4
    frames.tick(0);
    frames.tick(100); // -> 1
    frames.tick(0);
    frames.tick(0);
    frames.tick(50); // next iteration, half-way down again
    expect(v.getValue()).toBeCloseTo(0.7, 5);
    loop.stop();
  });
});
