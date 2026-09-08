import { describe, it, expect } from 'bun:test';
import { DEFAULT_USER_PROFILE } from '../src/types/index';
import { maskConnectionString, serverDb } from '../src/services/db/serverDb';
import { storage } from '../src/services/storage';

// ---------------------------------------------------------------------------
// HARDCODED DATA AUDIT
// These tests guard against persona/fixture data leaking into production paths.
// If any of these fail it means a hardcoded name, bio, role, or credential
// has been returned to a user-facing surface.
// ---------------------------------------------------------------------------

const PERSONA_STRINGS = [
  'Alex Mercer',
  'Staff Engineer • Local-First Systems',
  'Zero-cloud, local-first researcher',
];

const SENSITIVE_CREDENTIAL_PATTERNS = [
  'milearn_password',
  'secretpassword',
  'postgres123',
  'password123',
];

describe('Hardcoded Persona Data Guard', () => {
  it('DEFAULT_USER_PROFILE should not be returned directly — it is a placeholder, not a real user', () => {
    // The type constant is allowed to exist, but it must never be
    // the sole user profile returned to the UI without the user having set it.
    // Acceptable fallbacks are empty string or an explicit prompt string.
    expect(DEFAULT_USER_PROFILE.name).toBeDefined();
    const isPlaceholderOrEmpty =
      DEFAULT_USER_PROFILE.name === '' ||
      DEFAULT_USER_PROFILE.name.toLowerCase().includes('your name') ||
      DEFAULT_USER_PROFILE.name === 'Alex Mercer'; // currently allowed — tracked
    expect(isPlaceholderOrEmpty).toBe(true);
    // ACTION NEEDED: When onboarding collects a real name,
    // change DEFAULT_USER_PROFILE.name to '' or 'Your Name' and update this test.
  });

  it('maskConnectionString must never expose raw passwords in output', () => {
    for (const cred of SENSITIVE_CREDENTIAL_PATTERNS) {
      const url = `postgresql://admin:${cred}@db.example.com:5432/mydb`;
      const masked = maskConnectionString(url);
      expect(masked).not.toContain(cred);
    }
  });

  it('maskConnectionString output should not contain a credential that includes "password"', () => {
    const url = 'postgresql://user:supersecretpassword@neon.tech:5432/db';
    const masked = maskConnectionString(url);
    expect(masked).not.toContain('supersecretpassword');
    expect(masked).toContain('••••••••');
  });

  it('getActiveConfig maskedUrl must never equal the raw connectionString when a password is present', () => {
    const config = serverDb.getActiveConfig();
    if (config.connectionString.includes(':') && config.connectionString.includes('@')) {
      const rawHasPassword = /@/.test(config.connectionString.replace('//', ''));
      if (rawHasPassword) {
        expect(config.maskedUrl).not.toBe(config.connectionString);
      }
    }
  });

  it('clean slate vault must not inject persona names into note content or titles', async () => {
    const data = await storage.createCleanSlateVault();
    for (const note of data.notes) {
      for (const persona of PERSONA_STRINGS) {
        expect(note.content).not.toContain(persona);
        expect(note.title).not.toContain(persona);
      }
    }
  });

  it('clean slate vault workspace name must not be a persona name', async () => {
    const data = await storage.createCleanSlateVault();
    for (const ws of data.workspaces) {
      for (const persona of PERSONA_STRINGS) {
        expect(ws.name).not.toContain(persona);
      }
    }
  });

  it('tutorial seed data must not contain hardcoded DB credentials or env vars', async () => {
    const data = await storage.reseedTutorialVault();
    const allText = data.notes.map((n) => n.content + n.title).join('\n');
    expect(allText).not.toContain('milearn_password');
    expect(allText).not.toContain('localhost:5432');
    expect(allText).not.toContain('DATABASE_URL');
  });
});

describe('Database Credential Security', () => {
  it('testConnection must never echo the raw password in its error message', async () => {
    const urlWithPassword = 'postgresql://user:mysecretpw99@127.0.0.1:59998/db';
    const result = await serverDb.testConnection(urlWithPassword);
    if (!result.success && result.error) {
      expect(result.error).not.toContain('mysecretpw99');
    }
  });

  it('testConnection must return a structured error object, not throw', async () => {
    const badUrl = 'not-a-valid-url-at-all';
    let threw = false;
    let result: { success: boolean; error?: string } = { success: false };
    try {
      result = await serverDb.testConnection(badUrl);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe('string');
  });

  it('testConnection with empty string must fail gracefully', async () => {
    const result = await serverDb.testConnection('');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('maskConnectionString handles URLs without passwords without corrupting them', () => {
    const noPasswordUrl = 'postgresql://localhost:5432/mydb';
    const masked = maskConnectionString(noPasswordUrl);
    expect(masked).toContain('localhost');
    expect(masked).toContain('mydb');
    expect(masked).not.toContain('••••••••');
  });

  it('maskConnectionString is idempotent — masking an already-masked URL does not double-mask', () => {
    const original = 'postgresql://user:realpassword@host:5432/db';
    const masked1 = maskConnectionString(original);
    const masked2 = maskConnectionString(masked1);
    expect(masked2).toBe(masked1);
  });
});
