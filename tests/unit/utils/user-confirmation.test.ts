import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { runWithSessionContext } from '../../../src/utils/execution-context.js';
import { CONFIRMATION_TIMEOUT_MS, requestUserConfirmation } from '../../../src/utils/user-confirmation.js';

const mockElicitInput = vi.fn();
const mockGetClientCapabilities = vi.fn();
const server = { elicitInput: mockElicitInput, getClientCapabilities: mockGetClientCapabilities } as unknown as Server;

const confirm = (withServer = true) =>
  runWithSessionContext({ sessionId: 'session-1', requestId: 42, server: withServer ? server : undefined }, () =>
    requestUserConfirmation('Order example.de?', 'Order')
  );

describe('requestUserConfirmation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetClientCapabilities.mockReturnValue({ elicitation: { form: {} } });
  });

  it('is unsupported if the client cannot elicit', async () => {
    mockGetClientCapabilities.mockReturnValue({});

    await expect(confirm()).resolves.toEqual({ outcome: 'unsupported' });
    expect(mockElicitInput).not.toHaveBeenCalled();
  });

  it('is unsupported outside of a tool call', async () => {
    await expect(confirm(false)).resolves.toEqual({ outcome: 'unsupported' });
  });

  it('sends the elicitation on the stream of the current tool call', async () => {
    mockElicitInput.mockResolvedValue({ action: 'accept', content: { confirm: true } });

    await expect(confirm()).resolves.toEqual({ outcome: 'confirmed' });
    expect(mockElicitInput).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'form', message: 'Order example.de?' }),
      expect.objectContaining({ relatedRequestId: 42, timeout: CONFIRMATION_TIMEOUT_MS })
    );
  });

  it.each([
    ['decline', { action: 'decline' }],
    ['cancel', { action: 'cancel' }],
    ['accept without confirmation', { action: 'accept', content: { confirm: false } }],
  ])('rejects on %s', async (_, response) => {
    mockElicitInput.mockResolvedValue(response);

    await expect(confirm()).resolves.toMatchObject({ outcome: 'rejected' });
  });

  it('rejects if no answer arrives', async () => {
    mockElicitInput.mockRejectedValue(new Error('Request timed out'));

    await expect(confirm()).resolves.toEqual({
      outcome: 'rejected',
      reason: 'No confirmation received: Request timed out',
    });
  });
});
