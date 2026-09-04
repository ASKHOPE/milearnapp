/**
 * Web Content Scraper & Structure Parser
 * Extracts structured markdown, headings, tables, code blocks, and metadata
 * from raw HTML or web page responses for direct insertion into notes.
 */

export interface ScrapedWebDocument {
  title: string;
  url?: string;
  description?: string;
  author?: string;
  markdown: string;
  headings: { level: number; text: string }[];
  tables: string[];
  codeSnippets: { language: string; code: string }[];
}

export class WebContentScraper {
  /**
   * Parses raw HTML string and extracts structured Markdown with clean headings & syntax
   */
  public parseHtmlToMarkdown(htmlString: string, sourceUrl?: string): ScrapedWebDocument {
    if (typeof DOMParser === 'undefined') {
      return this.parseHtmlHeadless(htmlString, sourceUrl);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Extract Metadata
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                  'Imported Web Document';
    
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                        undefined;

    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || undefined;

    // Remove noise elements (scripts, styles, navs, footers, ads)
    doc.querySelectorAll('script, style, noscript, nav, footer, header, svg, iframe, form').forEach((el) => el.remove());

    const headings: { level: number; text: string }[] = [];
    const tables: string[] = [];
    const codeSnippets: { language: string; code: string }[] = [];

    // Extract headings
    doc.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
      const level = parseInt(h.tagName.replace('H', ''), 10);
      const text = h.textContent?.trim() || '';
      if (text) headings.push({ level, text });
    });

    // Extract code blocks
    doc.querySelectorAll('pre, code').forEach((codeEl) => {
      const code = codeEl.textContent?.trim() || '';
      const langClass = codeEl.className.match(/language-(\w+)/);
      const language = langClass ? langClass[1] : '';
      if (code.length > 20) {
        codeSnippets.push({ language, code });
      }
    });

    // Main text conversion to clean readable markdown
    const bodyContent = doc.body ? this.elementToMarkdown(doc.body) : '';
    
    let markdown = `# ${title}\n\n`;
    if (sourceUrl) {
      markdown += `> **Source URL:** [${sourceUrl}](${sourceUrl})\n\n`;
    }
    if (description) {
      markdown += `> ${description}\n\n`;
    }
    markdown += bodyContent;

    return {
      title,
      url: sourceUrl,
      description,
      author,
      markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
      headings,
      tables,
      codeSnippets
    };
  }

  private elementToMarkdown(element: HTMLElement): string {
    let result = '';

    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        switch (tag) {
          case 'h1':
            result += `\n\n# ${el.textContent?.trim()}\n\n`;
            break;
          case 'h2':
            result += `\n\n## ${el.textContent?.trim()}\n\n`;
            break;
          case 'h3':
            result += `\n\n### ${el.textContent?.trim()}\n\n`;
            break;
          case 'p':
            result += `\n\n${this.elementToMarkdown(el)}\n\n`;
            break;
          case 'strong':
          case 'b':
            result += `**${this.elementToMarkdown(el)}**`;
            break;
          case 'em':
          case 'i':
            result += `*${this.elementToMarkdown(el)}*`;
            break;
          case 'code':
            result += ` \`${el.textContent?.trim()}\` `;
            break;
          case 'pre':
            result += `\n\n\`\`\`\n${el.textContent?.trim()}\n\`\`\`\n\n`;
            break;
          case 'blockquote':
            result += `\n\n> ${el.textContent?.trim()}\n\n`;
            break;
          case 'ul':
            result += `\n\n${this.elementToMarkdown(el)}\n`;
            break;
          case 'li':
            result += `- ${el.textContent?.trim()}\n`;
            break;
          case 'a':
            result += `[${el.textContent?.trim()}](${el.getAttribute('href') || '#'})`;
            break;
          default:
            result += this.elementToMarkdown(el);
            break;
        }
      }
    });

    return result;
  }

  /**
   * Headless / server-side fallback parsing when DOMParser is unavailable
   */
  private parseHtmlHeadless(htmlString: string, sourceUrl?: string): ScrapedWebDocument {
    // Extract Title
    const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ||
                       htmlString.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Imported Web Document';

    // Extract Description
    const descMatch = htmlString.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
                      htmlString.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : undefined;

    // Extract Author
    const authorMatch = htmlString.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : undefined;

    // Strip scripts, styles, navs, footers, headers
    let clean = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');

    const headings: { level: number; text: string }[] = [];
    const codeSnippets: { language: string; code: string }[] = [];

    // Extract Headings
    const headingRegex = /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = headingRegex.exec(clean)) !== null) {
      const level = parseInt(hMatch[1], 10);
      const text = hMatch[2].replace(/<[^>]+>/g, '').trim();
      if (text) headings.push({ level, text });
    }

    // Extract Code Snippets
    const codeRegex = /<pre[^>]*><code(?:[^>]*class=["'][^"']*language-([^"']+)["'])?[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = codeRegex.exec(clean)) !== null) {
      const language = cMatch[1] || '';
      const code = cMatch[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      if (code.length > 20) {
        codeSnippets.push({ language, code });
      }
    }

    // Transform HTML to Markdown
    let md = clean
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
      .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n\n#### $1\n\n')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n\n```\n$1\n```\n\n')
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]+>/g, '');

    let markdown = `# ${title}\n\n`;
    if (sourceUrl) {
      markdown += `> **Source URL:** [${sourceUrl}](${sourceUrl})\n\n`;
    }
    if (description) {
      markdown += `> ${description}\n\n`;
    }
    markdown += md;

    return {
      title,
      url: sourceUrl,
      description,
      author,
      markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
      headings,
      tables: [],
      codeSnippets
    };
  }
}

export const webContentScraper = new WebContentScraper();
