import { describe, it, expect } from 'bun:test';
import { sanitizer } from '../src/services/sanitizer';

describe('Sanitizer Service Tests', () => {
  it('strips malicious <script> tags from HTML inputs', () => {
    const malicious = 'Hello <script>alert("XSS")</script><b>World</b>';
    const clean = sanitizer.sanitize(malicious);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('<b>World</b>');
  });

  it('strips dangerous javascript: URLs while keeping valid links', () => {
    expect(sanitizer.sanitizeUrl('javascript:alert(1)')).toBe('#');
    expect(sanitizer.sanitizeUrl('JAVASCRIPT:evil()')).toBe('#');
    expect(sanitizer.sanitizeUrl('https://google.com')).toBe('https://google.com');
  });

  it('allows safe markdown elements like code, mark, kbd, table, blockquote', () => {
    const formatted = '<blockquote>Quote</blockquote><mark>highlight</mark><kbd>Ctrl</kbd>';
    const clean = sanitizer.sanitize(formatted);
    expect(clean).toContain('<blockquote>Quote</blockquote>');
    expect(clean).toContain('<mark>highlight</mark>');
    expect(clean).toContain('<kbd>Ctrl</kbd>');
  });
});
