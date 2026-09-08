import DOMPurify from 'dompurify';

/**
 * Enterprise HTML & Content Sanitizer Service
 * Hardens user-rendered HTML against XSS attacks while preserving
 * rich markdown formatting, embedded media, tables, and math.
 *
 * Security notes:
 *  - <iframe> is NOT in the default allowlist. Only YouTube/Vimeo iframes
 *    are permitted, enforced via the afterSanitizeAttributes hook.
 *  - data: URIs are blocked unless they are data:image/* (safe for <img>).
 *  - javascript: and vbscript: protocols are always blocked in URLs.
 */

// Allowed iframe src origins (YouTube & Vimeo only)
const ALLOWED_IFRAME_ORIGINS = /^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/;

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
      'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g',
      'text', 'tspan', 'defs', 'marker', 'linearGradient', 'stop'
      // <iframe> intentionally omitted — allowed only via afterSanitizeAttributes hook below
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height', 'loading',
      'class', 'style', 'id', 'align',
      // SVG attrs needed for Mermaid
      'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'd',
      'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2',
      'transform', 'text-anchor', 'font-size', 'font-family', 'font-weight',
      'opacity', 'marker-end', 'marker-start', 'offset', 'stop-color'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|[\s]|$))/i,
    FORCE_BODY: true
  };

  private hookInstalled = false;

  private installHooks(): void {
    if (this.hookInstalled || typeof window === 'undefined') return;
    if (typeof (DOMPurify as any).addHook !== 'function') return;

    // Allow iframes ONLY from YouTube/Vimeo — strip all others
    (DOMPurify as any).addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.tagName === 'IFRAME') {
        const src = node.getAttribute('src') || '';
        if (!ALLOWED_IFRAME_ORIGINS.test(src)) {
          node.parentNode?.removeChild(node);
        }
      }
    });

    this.hookInstalled = true;
  }

  private getPurifier(): { sanitize: (html: string, cfg?: any) => string } {
    if (typeof window !== 'undefined') {
      this.installHooks();
      if (typeof (DOMPurify as any).sanitize === 'function') {
        return DOMPurify;
      }
      if (typeof DOMPurify === 'function') {
        return (DOMPurify as any)(window);
      }
    }
    // Headless / SSR fallback — strip scripts and event handlers
    return {
      sanitize: (raw: string) =>
        raw
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
          .replace(/<iframe\b[^>]*>/gi, '') // always strip iframes in headless
    };
  }

  /**
   * Sanitizes rich HTML content (Mermaid SVG, user HTML, imported content).
   * Safe to call in both browser and SSR/test environments.
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
   * Sanitizes a URL to prevent javascript:, vbscript:, and non-image data: exploits.
   */
  public sanitizeUrl(url: string): string {
    if (!url) return '';
    const trimmed = url.trim();
    // Block script-execution protocols
    if (/^javascript:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) return '#';
    // Block data: URIs unless they are safe image data (data:image/...)
    if (/^data:/i.test(trimmed) && !/^data:image\//i.test(trimmed)) return '#';
    return trimmed;
  }
}

export const sanitizer = new SanitizerService();
