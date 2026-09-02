import React, { useState, useEffect } from 'react';
import type { Note, Workspace } from '../types';
import { 
  Printer, 
  Image as ImageIcon, 
  FileText, 
  Globe, 
  Copy, 
  Check, 
  X, 
  Share2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  note: Note | null;
  activeWorkspace?: Workspace;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  note,
  activeWorkspace,
  onClose
}) => {
  const [imageTheme, setImageTheme] = useState<'dark' | 'light'>('dark');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Generate PNG Image Card on canvas
  useEffect(() => {
    if (!isOpen || !note) return;

    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 675; // 16:9 social card ratio
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = imageTheme === 'dark';

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      bgGrad.addColorStop(0, '#0f1117');
      bgGrad.addColorStop(0.5, '#161822');
      bgGrad.addColorStop(1, '#0c0d12');
    } else {
      bgGrad.addColorStop(0, '#f8fafc');
      bgGrad.addColorStop(0.5, '#f1f5f9');
      bgGrad.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative gradient glow orb
    const orbGrad = ctx.createRadialGradient(width - 150, 150, 10, width - 150, 150, 400);
    orbGrad.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.fillRect(0, 0, width, height);

    // Inner Card Container
    const cardPad = 48;
    const cardX = cardPad;
    const cardY = cardPad;
    const cardW = width - cardPad * 2;
    const cardH = height - cardPad * 2;

    ctx.fillStyle = isDark ? 'rgba(26, 28, 38, 0.75)' : 'rgba(255, 255, 255, 0.85)';
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Top Header: Workspace & Brand
    ctx.font = 'bold 18px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'left';
    const wsLabel = activeWorkspace ? `${activeWorkspace.icon} ${activeWorkspace.name}` : '⚡ Noteflow';
    ctx.fillText(wsLabel, cardX + 36, cardY + 48);

    // Date & Words Count
    ctx.font = '15px Inter, sans-serif';
    const dateFormatted = new Date(note.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const words = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
    ctx.textAlign = 'right';
    ctx.fillText(`${dateFormatted} · ${words} words`, cardX + cardW - 36, cardY + 48);

    // Note Title
    ctx.font = 'bold 38px Inter, -apple-system, sans-serif';
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.textAlign = 'left';
    const displayTitle = note.title.length > 40 ? note.title.slice(0, 38) + '...' : note.title;
    ctx.fillText(displayTitle, cardX + 36, cardY + 115);

    // Tags
    if (note.tags?.length > 0) {
      let tagX = cardX + 36;
      ctx.font = 'bold 14px Inter, sans-serif';
      note.tags.slice(0, 4).forEach((tag) => {
        const tagText = `#${tag}`;
        const tagWidth = ctx.measureText(tagText).width + 20;

        ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)';
        ctx.beginPath();
        ctx.roundRect(tagX, cardY + 135, tagWidth, 26, 6);
        ctx.fill();

        ctx.fillStyle = '#6366f1';
        ctx.fillText(tagText, tagX + 10, cardY + 153);
        tagX += tagWidth + 10;
      });
    }

    // Snippet content lines
    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#cbd5e1' : '#334155';
    const cleanLines = note.content
      .split('\n')
      .map((l) => l.replace(/^#+\s*/, '').replace(/^-\s*(\[\s*\]\s*)?/, '').trim())
      .filter((l) => Boolean(l) && !l.startsWith('>') && !l.startsWith('```'))
      .slice(0, 8);

    let textY = cardY + 205;
    cleanLines.forEach((line) => {
      if (textY > cardY + cardH - 60) return;
      const truncated = line.length > 75 ? line.slice(0, 72) + '...' : line;
      ctx.fillText(truncated, cardX + 36, textY);
      textY += 32;
    });

    // Footer Watermark
    ctx.font = '14px Inter, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('Noteflow — Power Notes for Mac, iOS & Web', cardX + 36, cardY + cardH - 24);

    setImagePreviewUrl(canvas.toDataURL('image/png'));
  }, [isOpen, note, imageTheme, activeWorkspace]);

  if (!isOpen || !note) return null;

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Export as PNG Image Card
  const handleExportPNG = () => {
    if (!imagePreviewUrl) return;
    const link = document.createElement('a');
    link.href = imagePreviewUrl;
    link.download = `${note.title.replace(/[^\w\s-]/gi, '')}-card.png`;
    link.click();
  };

  // 2. Export as Standalone HTML File
  const handleExportHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${note.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 14px; color: #64748b; margin: 16px 0; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 14px; border-radius: 8px; overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; }
    .meta-bar { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta-bar">Created on ${new Date(note.createdAt).toLocaleString()} · Tags: ${note.tags.map((t) => `#${t}`).join(' ')}</div>
  <div><pre style="white-space: pre-wrap; font-family: inherit; background: none; color: inherit; padding: 0;">${note.content}</pre></div>
</body>
</html>`;
    downloadFile(htmlContent, `${note.title.replace(/[^\w\s-]/gi, '')}.html`, 'text/html');
  };

  // 3. Export as Markdown (.md)
  const handleExportMarkdown = () => {
    const frontmatter = `---
title: "${note.title}"
date: "${note.createdAt}"
tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]
workspace: "${activeWorkspace?.name || 'Personal'}"
---

${note.content}`;
    downloadFile(frontmatter, `${note.title.replace(/[^\w\s-]/gi, '')}.md`, 'text/markdown');
  };

  // 4. Export as Plain Text (.txt)
  const handleExportText = () => {
    const plainText = `${note.title.toUpperCase()}\n${'='.repeat(note.title.length)}\nDate: ${new Date(note.createdAt).toLocaleDateString()}\n\n${note.content}`;
    downloadFile(plainText, `${note.title.replace(/[^\w\s-]/gi, '')}.txt`, 'text/plain');
  };

  // 5. Copy Rich Text to Clipboard
  const handleCopyRichText = async () => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopiedFormat('copied');
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={18} color="var(--accent-primary)" />
            <span>Omni-Format Export & Sharing</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Format Selection Cards Grid */}
          <div className="export-grid">
            {/* 1. PDF Document */}
            <div className="export-card" onClick={() => { onClose(); setTimeout(() => window.print(), 150); }}>
              <div className="export-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Printer size={22} />
              </div>
              <div className="export-card-info">
                <span className="export-card-title">PDF Document</span>
                <span className="export-card-desc">Print-optimized vector document with styled page-breaks</span>
              </div>
              <button className="export-action-btn">Print / PDF</button>
            </div>

            {/* 2. Apple Social Image Card */}
            <div className="export-card" onClick={handleExportPNG}>
              <div className="export-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                <ImageIcon size={22} />
              </div>
              <div className="export-card-info">
                <span className="export-card-title">Social Image Card (PNG)</span>
                <span className="export-card-desc">Aesthetic visual card with dark/light card styling</span>
              </div>
              <button className="export-action-btn">Download PNG</button>
            </div>

            {/* 3. Standalone HTML */}
            <div className="export-card" onClick={handleExportHTML}>
              <div className="export-card-icon" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                <Globe size={22} />
              </div>
              <div className="export-card-info">
                <span className="export-card-title">Standalone Webpage (HTML)</span>
                <span className="export-card-desc">Self-contained file opens offline in any web browser</span>
              </div>
              <button className="export-action-btn">Download HTML</button>
            </div>

            {/* 4. Markdown */}
            <div className="export-card" onClick={handleExportMarkdown}>
              <div className="export-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <FileText size={22} />
              </div>
              <div className="export-card-info">
                <span className="export-card-title">Markdown (.md)</span>
                <span className="export-card-desc">Standard markdown with YAML metadata frontmatter</span>
              </div>
              <button className="export-action-btn">Download .md</button>
            </div>

            {/* 5. Plain Text */}
            <div className="export-card" onClick={handleExportText}>
              <div className="export-card-icon" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#64748b' }}>
                <FileText size={22} />
              </div>
              <div className="export-card-info">
                <span className="export-card-title">Plain Text (.txt)</span>
                <span className="export-card-desc">Clean raw text formatted for notepad or clipboard</span>
              </div>
              <button className="export-action-btn">Download .txt</button>
            </div>

            {/* 6. Copy to Clipboard */}
            <div className="export-card" onClick={handleCopyRichText}>
              <div className="export-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                {copiedFormat ? <Check size={22} color="#10b981" /> : <Copy size={22} />}
              </div>
              <div className="export-card-info">
                <span className="export-card-title">Copy to Clipboard</span>
                <span className="export-card-desc">Copy formatted text to paste into Word, Docs, or Mail</span>
              </div>
              <button className="export-action-btn">
                {copiedFormat ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Live PNG Card Preview */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Social Card Preview
              </span>
              <div className="mode-toggle-group">
                <button
                  className={`mode-btn ${imageTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => setImageTheme('dark')}
                >
                  Dark Card
                </button>
                <button
                  className={`mode-btn ${imageTheme === 'light' ? 'active' : ''}`}
                  onClick={() => setImageTheme('light')}
                >
                  Light Card
                </button>
              </div>
            </div>

            {imagePreviewUrl && (
              <div className="image-card-preview-box">
                <img 
                  src={imagePreviewUrl} 
                  alt="Social Card Preview" 
                  style={{ width: '100%', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
