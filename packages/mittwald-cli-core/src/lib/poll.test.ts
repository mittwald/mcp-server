import { afterEach, describe, expect, it, vi } from 'vitest';
import { poll, PollTimeoutError } from './poll.js';

describe('poll', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when the first attempt is already ready', async () => {
    const fn = vi.fn().mockResolvedValue('ready-value');

    const result = await poll(fn, (value) => value === 'ready-value');

    expect(result).toBe('ready-value');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until a later attempt is ready', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockResolvedValueOnce('not-ready').mockResolvedValueOnce('not-ready').mockResolvedValueOnce('ready');

    const resultPromise = poll(fn, (value) => value === 'ready', { maxAttempts: 5 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('ready');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('applies exponential backoff between attempts', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockResolvedValue('not-ready');
    const delayFn = vi.fn((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

    const resultPromise = poll(fn, (value) => value === 'ready', {
      maxAttempts: 4,
      initialDelayMs: 100,
      backoffFactor: 2,
      delayFn,
    });
    await vi.runAllTimersAsync();
    await resultPromise;

    // 4 attempts -> 3 delays between them, doubling from the initial delay.
    expect(delayFn.mock.calls.map(([ms]) => ms)).toEqual([100, 200, 400]);
  });

  it('caps the delay at maxDelayMs', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockResolvedValue('not-ready');
    const delayFn = vi.fn((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

    const resultPromise = poll(fn, (value) => value === 'ready', {
      maxAttempts: 5,
      initialDelayMs: 100,
      backoffFactor: 3,
      maxDelayMs: 250,
      delayFn,
    });
    await vi.runAllTimersAsync();
    await resultPromise;

    expect(delayFn.mock.calls.map(([ms]) => ms)).toEqual([100, 250, 250, 250]);
  });

  it('resolves with undefined once the attempt budget is exhausted by default', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockResolvedValue('never-ready');

    const resultPromise = poll(fn, (value) => value === 'ready', { maxAttempts: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws PollTimeoutError once the attempt budget is exhausted when throwOnExhausted is set', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockResolvedValue('never-ready');

    const resultPromise = poll(fn, (value) => value === 'ready', {
      maxAttempts: 3,
      throwOnExhausted: true,
    });
    const assertion = expect(resultPromise).rejects.toBeInstanceOf(PollTimeoutError);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('propagates an error from fn immediately by default (retryOnError: false)', async () => {
    const error = new Error('boom');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(poll(fn, () => true)).rejects.toBe(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps retrying past an error from fn when retryOnError is true', async () => {
    vi.useFakeTimers();

    const fn = vi.fn().mockRejectedValueOnce(new Error('transient')).mockResolvedValueOnce('ready');

    const resultPromise = poll(fn, (value) => value === 'ready', {
      maxAttempts: 3,
      retryOnError: true,
    });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('ready');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
