import React, { useState } from 'react';
import { 
  Globe, 
  FileText, 
  BookMarked, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  Folder as FolderIcon,
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { Folder, Note, Workspace } from '../types';
import { webContentScraper, type ScrapedWebDocument } from '../services/webContentScraper';
import { citationStorage, type StoredCitationItem } from '../services/citationStorage';
import { storage } from '../services/storage';
import { Modal } from './ui/Modal';

export interface WebClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  activeWorkspace?: Workspace;
  onSaveClippedNote: (note: Note) => void;
}

type TabMode = 'preview' | 'markdown' | 'snippets';

export const WebClipperModal: React.FC<WebClipperModalProps> = ({
  isOpen,
  onClose,
  folders,
  activeWorkspace,
  onSaveClippedNote
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'paste'>('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [rawHtml, setRawHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scraped output
  const [scrapedDoc, setScrapedDoc] = useState<ScrapedWebDocument | null>(null);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<TabMode>('preview');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(() => {
    const wsFolders = folders.filter((f) => !activeWorkspace || f.workspaceId === activeWorkspace.id);
    return wsFolders[0]?.id || '';
  });

  // Action feedback
  const [copied, setCopied] = useState(false);
  const [citationSaved, setCitationSaved] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Scrape via backend proxy or fallback
  const handleFetchUrl = async () => {
    if (!targetUrl.trim()) return;
    setIsLoading(true);
    setError(null);

    let finalUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
      setTargetUrl(finalUrl);
    }

    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(finalUrl)}`);
      if (!res.ok) {
        throw new Error(`Scrape proxy error: HTTP ${res.status}`);
      }
      const data = await res.json();
      const htmlContent = data.content || data.html || '';

      if (!htmlContent) {
        throw new Error('Received empty content from target URL.');
      }

      const parsed = webContentScraper.parseHtmlToMarkdown(htmlContent, finalUrl);
      setScrapedDoc(parsed);
      setEditedMarkdown(parsed.markdown);
      setActiveTab('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch webpage';
      setError(`${msg}. If the site blocks proxy requests, try copying the HTML and using "Paste HTML" mode.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse pasted raw HTML or text
  const handleParsePaste = () => {
    if (!rawHtml.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const parsed = webContentScraper.parseHtmlToMarkdown(rawHtml, targetUrl.trim() || undefined);
      setScrapedDoc(parsed);
      setEditedMarkdown(parsed.markdown);
      setActiveTab('preview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error parsing HTML content';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy structured Markdown
  const handleCopyMarkdown = async () => {
    const textToCopy = editedMarkdown || scrapedDoc?.markdown || '';
    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to Vault as Note
  const handleSaveToVault = async () => {
    if (!scrapedDoc && !editedMarkdown) return;
    setIsSavingNote(true);

    const title = scrapedDoc?.title || 'Clipped Web Document';
    const content = editedMarkdown || scrapedDoc?.markdown || '';

    const newNote: Note = {
      id: 'n-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title,
      content,
      folderId: selectedFolderId || null,
      workspaceId: activeWorkspace?.id || 'ws-personal',
      tags: ['web-clipped', 'research'],
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await storage.saveNote(newNote);
      onSaveClippedNote(newNote);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      setError(msg);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Save as Citation in Citation Studio
  const handleSaveCitation = () => {
    if (!scrapedDoc) return;

    const citation: StoredCitationItem = {
      id: 'web-' + Date.now().toString(36),
      type: 'webpage',
      title: scrapedDoc.title,
      author: scrapedDoc.author ? [{ literal: scrapedDoc.author }] : [{ literal: 'Web Author' }],
      year: new Date().getFullYear(),
      URL: scrapedDoc.url || targetUrl,
      abstract: scrapedDoc.description || undefined,
      dateAdded: new Date().toISOString()
    };

    citationStorage.saveCitation(citation);
    setCitationSaved(true);
    setTimeout(() => setCitationSaved(false), 2500);
  };

  // Metrics computation
  const wordCount = (editedMarkdown || scrapedDoc?.markdown || '').trim().split(/\s+/).filter(Boolean).length;
  const estReadingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

  const filteredFolders = folders.filter(
    (f) => !activeWorkspace || f.workspaceId === activeWorkspace.id
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={20} color="var(--accent-primary, #6366f1)" />
          <span>Web Clipper & Content Structurer</span>
          <span className="badge-tag" style={{ fontSize: '11px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            Structured Markdown
          </span>
        </div>
      }
      subtitle="Clip web articles, research papers, and documentation directly into structured notes."
      maxWidth="860px"
    >
      <div className="web-clipper-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Input Selector */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            type="button"
            className={`btn-filter ${inputMode === 'url' ? 'active' : ''}`}
            onClick={() => setInputMode('url')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              background: inputMode === 'url' ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary)',
              color: inputMode === 'url' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Globe size={14} /> Fetch from Web URL
          </button>
          <button
            type="button"
            className={`btn-filter ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              background: inputMode === 'paste' ? 'var(--accent-primary, #6366f1)' : 'var(--bg-secondary)',
              color: inputMode === 'paste' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <FileText size={14} /> Paste HTML / Source
          </button>
        </div>

        {/* URL Input Form */}
        {inputMode === 'url' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="url"
              className="editor-input"
              placeholder="https://en.wikipedia.org/wiki/Spaced_repetition or article URL..."
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFetchUrl();
              }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleFetchUrl}
              disabled={isLoading || !targetUrl.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '8px',
                cursor: isLoading || !targetUrl.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !targetUrl.trim() ? 0.6 : 1
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={15} className="spin-animation" /> Scraping...
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Fetch & Extract
                </>
              )}
            </button>
          </div>
        )}

        {/* Paste HTML Form */}
        {inputMode === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="url"
              className="editor-input"
              placeholder="Optional Source URL (e.g. https://example.com/article)"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px'
              }}
            />
            <textarea
              className="editor-textarea"
              placeholder="Paste raw HTML or copied web content here..."
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleParsePaste}
              disabled={isLoading || !rawHtml.trim()}
              style={{
                alignSelf: 'flex-end',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: isLoading || !rawHtml.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <Sparkles size={14} /> Parse HTML to Markdown
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Scraped Document Workspace */}
        {scrapedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Metadata bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                  {scrapedDoc.title}
                </h4>
                {scrapedDoc.url && (
                  <a 
                    href={scrapedDoc.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ fontSize: '12px', color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {scrapedDoc.url} <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {estReadingTimeMin} min read
                </span>
                <span>{wordCount} words</span>
                <span>{scrapedDoc.headings.length} headings</span>
                <span>{scrapedDoc.codeSnippets.length} code blocks</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '6px 12px',
                  borderBottom: activeTab === 'preview' ? '2px solid var(--accent-primary)' : 'none',
                  color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'preview' ? 600 : 400
                }}
              >
                Rendered Preview
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
                onClick={() => setActiveTab('markdown')}
                style={{
                  padding: '6px 12px',
                  borderBottom: activeTab === 'markdown' ? '2px solid var(--accent-primary)' : 'none',
                  color: activeTab === 'markdown' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'markdown' ? 600 : 400
                }}
              >
                Structured Markdown
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'snippets' ? 'active' : ''}`}
                onClick={() => setActiveTab('snippets')}
                style={{
                  padding: '6px 12px',
                  borderBottom: activeTab === 'snippets' ? '2px solid var(--accent-primary)' : 'none',
                  color: activeTab === 'snippets' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'snippets' ? 600 : 400
                }}
              >
                Extracted Snippets ({scrapedDoc.codeSnippets.length})
              </button>
            </div>

            {/* Tab 1: Rendered Preview */}
            {activeTab === 'preview' && (
              <div 
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {editedMarkdown}
                </div>
              </div>
            )}

            {/* Tab 2: Raw Markdown Editor */}
            {activeTab === 'markdown' && (
              <textarea
                value={editedMarkdown}
                onChange={(e) => setEditedMarkdown(e.target.value)}
                rows={14}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              />
            )}

            {/* Tab 3: Extracted Snippets */}
            {activeTab === 'snippets' && (
              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scrapedDoc.codeSnippets.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No isolated code snippets found in this document.
                  </div>
                ) : (
                  scrapedDoc.codeSnippets.map((snippet, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        background: 'var(--bg-secondary)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        background: 'rgba(0,0,0,0.1)',
                        color: 'var(--text-secondary)'
                      }}>
                        <span>Snippet #{idx + 1} {snippet.language ? `(${snippet.language})` : ''}</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(snippet.code)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '11px' }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '10px 12px', fontSize: '12px', overflowX: 'auto' }}>
                        <code>{snippet.code}</code>
                      </pre>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Action Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)'
            }}>
              {/* Target Folder Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderIcon size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Destination:</span>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '13px'
                  }}
                >
                  <option value="">(No Folder / Root)</option>
                  {filteredFolders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyMarkdown}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy MD'}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleSaveCitation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {citationSaved ? <Check size={14} color="#10b981" /> : <BookMarked size={14} />}
                  {citationSaved ? 'Citation Saved!' : 'Add Citation'}
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveToVault}
                  disabled={isSavingNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: isSavingNote ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSavingNote ? <RefreshCw size={14} className="spin-animation" /> : <Sparkles size={14} />}
                  Save as Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
