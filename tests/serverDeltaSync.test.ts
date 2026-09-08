import { describe, it, expect } from 'bun:test';
import { validateDeltaSyncPayload } from '../src/services/validation/schemas';

describe('Server Differential Delta Sync Schema & Validation', () => {
  it('validates valid delta sync request payload', () => {
    const payload = {
      sinceTimestamp: 1710000000000,
      deviceId: 'client-desktop-win32',
      clientMutations: [
        {
          id: 'mut-1234',
          entityType: 'note',
          entityId: 'n-abc',
          action: 'upsert',
          payload: { title: 'Delta Sync Note', content: 'Testing delta sync' },
          timestamp: 1710000005000,
          deviceId: 'client-desktop-win32'
        },
        {
          id: 'mut-5678',
          entityType: 'folder',
          entityId: 'f-xyz',
          action: 'delete',
          timestamp: 1710000010000,
          deviceId: 'client-desktop-win32'
        }
      ]
    };

    const res = validateDeltaSyncPayload(payload);
    expect(res.success).toBe(true);
    expect(res.data?.clientMutations.length).toBe(2);
    expect(res.data?.deviceId).toBe('client-desktop-win32');
  });

  it('rejects malformed delta sync request without deviceId or negative timestamp', () => {
    const badPayload = {
      sinceTimestamp: -5,
      clientMutations: []
    };

    const res = validateDeltaSyncPayload(badPayload);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });
});
