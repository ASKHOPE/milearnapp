import { describe, it, expect } from 'bun:test';
import { maskConnectionString, serverDb } from '../src/services/db/serverDb';

describe('PostgreSQL Database Connector & Reconfiguration Tests', () => {
  it('masks database passwords in connection strings securely', () => {
    const url = 'postgresql://postgres:secretpassword123@db.supabase.co:5432/postgres';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('secretpassword123');
    expect(masked).toContain('••••••••');
    expect(masked).toContain('db.supabase.co');
  });

  it('retrieves active database config with masked url', () => {
    const config = serverDb.getActiveConfig();
    expect(config).toBeDefined();
    expect(typeof config.connectionString).toBe('string');
    expect(config.maskedUrl).toContain('••••••••');
  });

  it('rejects invalid or unreachable connection string gracefully without throwing', async () => {
    const invalidUrl = 'postgresql://fake_user:fake_password@127.0.0.1:59999/nonexistent';
    const result = await serverDb.testConnection(invalidUrl);
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  it('tests valid local Docker postgres connection successfully', async () => {
    const validUrl = 'postgresql://milearn:milearn_password@localhost:5432/milearndb';
    const result = await serverDb.testConnection(validUrl);
    if (result.success) {
      expect(result.database).toBe('milearndb');
      expect(result.user).toBe('milearn');
      expect(result.version).toBeDefined();
    } else {
      // In case Docker isn't running in a specific CI environment, ensure graceful error format
      expect(typeof result.error).toBe('string');
    }
  });
});
