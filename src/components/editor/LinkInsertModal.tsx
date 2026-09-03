import React, { useState, useEffect } from 'react';
import { Link2, ExternalLink, Globe, Check, X, Sparkles } from 'lucide-react';

interface LinkInsertModalProps {
  isOpen: boolean;
  initialSelectedText?: string;
  onClose: () => void;
  onInsert: (markdownLink: string) => void;
}

export const LinkInsertModal: React.FC<LinkInsertModalProps> = ({
  isOpen,
  initialSelectedText = '',
  onClose,
  onInsert
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState(initialSelectedText);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [detectedFavicon, setDetectedFavicon] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialSelectedText || '');
      setUrl('');
      setDetectedFavicon(null);
    }
  }, [isOpen, initialSelectedText]);

  if (!isOpen) return null;

  // Auto-suggest title based on URL structure or domain
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);

    if (newUrl.startsWith('http://') || newUrl.startsWith('https://')) {
      try {
        const parsed = new URL(newUrl);
        setDetectedFavicon(`https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`);

        // If title is currently empty, suggest smart name
        if (!title.trim()) {
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const lastSegment = decodeURIComponent(pathSegments[pathSegments.length - 1])
              .replace(/[-_]/g, ' ')
              .replace(/\.\w+$/, '');
            const cleanTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
            setTitle(`${parsed.hostname.replace(/^www\./, '')} - ${cleanTitle}`);
          } else {
            setTitle(parsed.hostname.replace(/^www\./, ''));
          }
        }
      } catch {
        setDetectedFavicon(null);
      }
    } else {
      setDetectedFavicon(null);
    }
  };

  const handleFetchWebsiteTitle = async () => {
    if (!url.trim()) return;
    setIsFetchingTitle(true);
    try {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
        setUrl(finalUrl);
      }
      const parsed = new URL(finalUrl);
      setDetectedFavicon(`https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`);

      // Generate a clean title from hostname and path
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      let derivedTitle = parsed.hostname.replace(/^www\./, '');
      if (pathSegments.length > 0) {
        const segment = decodeURIComponent(pathSegments[pathSegments.length - 1])
          .replace(/[-_]/g, ' ')
          .replace(/\.\w+$/, '');
        derivedTitle = `${segment.charAt(0).toUpperCase() + segment.slice(1)} (${parsed.hostname.replace(/^www\./, '')})`;
      }
      setTitle(derivedTitle);
    } catch {
      // ignore
    } finally {
      setIsFetchingTitle(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = url.trim();
    if (!finalUrl) return;

    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('#') && !finalUrl.startsWith('/')) {
      finalUrl = 'https://' + finalUrl;
    }

    const finalTitle = title.trim() || finalUrl;
    const md = `[${finalTitle}](${finalUrl})`;
    onInsert(md);
    onClose();
  };

  return (
    <div className="link-modal-backdrop" onClick={onClose}>
      <div className="link-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="link-modal-header">
          <div className="link-modal-title">
            <Link2 size={16} color="var(--accent-primary)" />
            <span>Insert Web Link</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="link-modal-form">
          {/* Destination URL */}
          <div className="form-group">
            <label>Destination Web Address (URL)</label>
            <div className="link-input-wrap">
              {detectedFavicon ? (
                <img src={detectedFavicon} alt="" className="link-favicon-preview" />
              ) : (
                <Globe size={15} className="link-input-icon" />
              )}
              <input
                type="text"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                autoFocus
                required
              />
              <button
                type="button"
                className="btn-fetch-metadata"
                onClick={handleFetchWebsiteTitle}
                disabled={!url.trim() || isFetchingTitle}
                title="Derive title from URL"
              >
                <Sparkles size={12} />
                <span>{isFetchingTitle ? 'Fetching...' : 'Derive Title'}</span>
              </button>
            </div>
          </div>

          {/* Display Text / Title */}
          <div className="form-group">
            <label>Link Display Text / Title</label>
            <input
              type="text"
              placeholder="e.g. Official Documentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Live Markdown Preview */}
          <div className="link-preview-box">
            <span className="link-preview-label">Markdown Syntax:</span>
            <code>[{title.trim() || 'Link Text'}]({url.trim() || 'https://...'})</code>
          </div>

          {/* Buttons */}
          <div className="link-modal-actions">
            {url.trim() && (
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-test-link"
                title="Test link in new tab"
              >
                <ExternalLink size={13} />
                <span>Test Link</span>
              </a>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-confirm" disabled={!url.trim()}>
                <Check size={14} /> Insert Link
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
