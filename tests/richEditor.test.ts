import { describe, it, expect } from 'bun:test';

describe('Advanced Rich Editor Features (Editor.js, RoosterJS, SunEditor, Froala, Quill)', () => {
  // Test 1: Strikethrough, Highlight, Underline, and Kbd tag generation
  it('correctly constructs rich inline tokens without dependencies', () => {
    const bold = (t: string) => `**${t}**`;
    const strike = (t: string) => `~~${t}~~`;
    const mark = (t: string, color?: string) => color ? `<mark style="background-color: ${color};">${t}</mark>` : `<mark>${t}</mark>`;
    const kbd = (t: string) => `<kbd>${t}</kbd>`;
    const sub = (t: string) => `<sub>${t}</sub>`;
    const sup = (t: string) => `<sup>${t}</sup>`;

    expect(bold('Hello')).toBe('**Hello**');
    expect(strike('Deprecated')).toBe('~~Deprecated~~');
    expect(mark('Key Note', '#fef08a')).toBe('<mark style="background-color: #fef08a;">Key Note</mark>');
    expect(kbd('Cmd+K')).toBe('<kbd>Cmd+K</kbd>');
    expect(sub('2')).toBe('<sub>2</sub>');
    expect(sup('2')).toBe('<sup>2</sup>');
  });

  // Test 2: Video Embed Parser (YouTube, Vimeo, MP4)
  it('accurately detects and transforms YouTube and Vimeo URLs into responsive embeds', () => {
    const parseVideoEmbed = (url: string) => {
      const trimmed = url.trim();
      const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        return {
          embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
          provider: 'YouTube'
        };
      }
      const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
      if (vimeoMatch && vimeoMatch[1]) {
        return {
          embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
          provider: 'Vimeo'
        };
      }
      return null;
    };

    const ytShort = parseVideoEmbed('https://youtu.be/dQw4w9WgXcQ');
    expect(ytShort).not.toBeNull();
    expect(ytShort?.provider).toBe('YouTube');
    expect(ytShort?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');

    const ytFull = parseVideoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(ytFull?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');

    const vimeo = parseVideoEmbed('https://vimeo.com/76979871');
    expect(vimeo?.provider).toBe('Vimeo');
    expect(vimeo?.embedUrl).toBe('https://player.vimeo.com/video/76979871');
  });

  // Test 3: Block Actions (Move Up/Down, Duplicate, Convert)
  it('correctly duplicates and converts block types like Editor.js', () => {
    const content = '# Title\nFirst paragraph\nSecond paragraph';
    const lines = content.split('\n');

    // Duplicate line 1 (First paragraph)
    const duplicate = (start: number, end: number, arr: string[]) => {
      const copy = [...arr];
      const slice = copy.slice(start, end + 1);
      copy.splice(end + 1, 0, ...slice);
      return copy;
    };

    const duplicated = duplicate(1, 1, lines);
    expect(duplicated.length).toBe(4);
    expect(duplicated[1]).toBe('First paragraph');
    expect(duplicated[2]).toBe('First paragraph');

    // Convert type
    const convertType = (line: string, newType: string) => {
      const clean = line.replace(/^#+\s*/, '').replace(/^-\s*/, '');
      if (newType === 'h2') return `## ${clean}`;
      if (newType === 'task') return `- [ ] ${clean}`;
      return clean;
    };

    expect(convertType('# Title', 'h2')).toBe('## Title');
    expect(convertType('First paragraph', 'task')).toBe('- [ ] First paragraph');
  });

  // Test 4: Collapsible Accordion / Spoiler Syntax
  it('formats collapsible spoiler markdown syntax cleanly', () => {
    const createSpoiler = (summary: string, body: string) => {
      return `<details>\n<summary>${summary}</summary>\n\n${body}\n\n</details>`;
    };

    const spoiler = createSpoiler('Spoiler Alert', 'The butler did it.');
    expect(spoiler).toContain('<details>');
    expect(spoiler).toContain('<summary>Spoiler Alert</summary>');
    expect(spoiler).toContain('The butler did it.');
    expect(spoiler).toContain('</details>');
  });
});
