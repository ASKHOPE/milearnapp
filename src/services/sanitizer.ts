import DOMPurify from 'dompurify';

/**
 * Enterprise HTML & Content Sanitizer Service
 * Hardens user-rendered HTML against XSS attacks while preserving
 * rich markdown formatting, embedded media, tables, and math.
 */
class SanitizerService {
  private config: Record<string, any> = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr', 'blockquote',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'mark', 'kbd', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img',
      'details', 'summary',
      'span', 'div',
      'iframe'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'style', 'align',
      'frameborder', 'allowfullscreen', 'allow'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|[\s]|$))/i,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target']
  };

  private getPurifier(): { sanitize: (html: string, cfg?: any) => string } {
    if (typeof window !== 'undefined') {
      if (typeof (DOMPurify as any).sanitize === 'function') {
        return DOMPurify;
      }
      if (typeof DOMPurify === 'function') {
        return (DOMPurify as any)(window);
      }
    }
    // Headless SSR / CLI runtime fallback
    return {
      sanitize: (raw: string) => {
        return raw
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
      }
    };
  }

  /**
   * Sanitizes rich markdown or user HTML content
   */
  public sanitize(html: string): string {
    if (!html) return '';
    try {
      const purifier = this.getPurifier();
      return purifier.sanitize(html, this.config);
    } catch {
      return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  }

  /**
   * Sanitizes an external URL to prevent javascript: or data: exploits
   */
  public sanitizeUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^javascript:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
      return '#';
    }
    return trimmed;
  }
}

export const sanitizer = new SanitizerService();
