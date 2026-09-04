import { describe, it, expect } from 'bun:test';
import { webContentScraper } from '../src/services/webContentScraper';

describe('Web Content Scraper & Markdown Structurer Tests', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SuperMemo 2 Spaced Repetition Algorithm</title>
        <meta name="description" content="A comprehensive guide to spaced repetition memory systems." />
        <meta name="author" content="Dr. Piotr Wozniak" />
      </head>
      <body>
        <nav><a href="/home">Home</a></nav>
        <h1>SuperMemo 2 Spaced Repetition Algorithm</h1>
        <p>Spaced repetition is an <strong>evidence-based</strong> learning technique.</p>
        <h2>Algorithmic Formula</h2>
        <p>The calculation of ease factor is defined as:</p>
        <pre><code class="language-typescript">EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))</code></pre>
        <h3>Review Intervals</h3>
        <ul>
          <li>First repetition: 1 day</li>
          <li>Second repetition: 6 days</li>
        </ul>
        <footer>Copyright 2026</footer>
      </body>
    </html>
  `;

  it('extracts document title, description, and author metadata', () => {
    const doc = webContentScraper.parseHtmlToMarkdown(sampleHtml, 'https://supermemo.com/sm2');

    expect(doc.title).toBe('SuperMemo 2 Spaced Repetition Algorithm');
    expect(doc.description).toContain('guide to spaced repetition');
    expect(doc.author).toBe('Dr. Piotr Wozniak');
    expect(doc.url).toBe('https://supermemo.com/sm2');
  });

  it('filters out navigation, scripts, and footers while structuring clean markdown', () => {
    const doc = webContentScraper.parseHtmlToMarkdown(sampleHtml, 'https://supermemo.com/sm2');

    // Should contain headings & bold text
    expect(doc.markdown).toContain('# SuperMemo 2 Spaced Repetition Algorithm');
    expect(doc.markdown).toContain('## Algorithmic Formula');
    expect(doc.markdown).toContain('**evidence-based**');

    // Should NOT contain nav or footer
    expect(doc.markdown).not.toContain('Home');
    expect(doc.markdown).not.toContain('Copyright 2026');
  });

  it('extracts structured headings hierarchy and code snippets', () => {
    const doc = webContentScraper.parseHtmlToMarkdown(sampleHtml, 'https://supermemo.com/sm2');

    expect(doc.headings.length).toBeGreaterThanOrEqual(2);
    expect(doc.headings[0].text).toBe('SuperMemo 2 Spaced Repetition Algorithm');
    expect(doc.headings[1].text).toBe('Algorithmic Formula');

    expect(doc.codeSnippets.length).toBe(1);
    expect(doc.codeSnippets[0].code).toContain("EF' = EF +");
    expect(doc.codeSnippets[0].language).toBe('typescript');
  });
});
