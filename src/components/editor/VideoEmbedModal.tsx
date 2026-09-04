import React, { useState } from 'react';
import { Video, X, Check } from 'lucide-react';

interface VideoEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (embedMarkdown: string) => void;
}

export const VideoEmbedModal: React.FC<VideoEmbedModalProps> = ({
  isOpen,
  onClose,
  onInsert
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');

  if (!isOpen) return null;

  const parseVideoEmbed = (url: string): { embedUrl: string; provider: string } | null => {
    const trimmed = url.trim();
    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return {
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
        provider: 'YouTube'
      };
    }
    // Vimeo
    const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        provider: 'Vimeo'
      };
    }
    // Generic MP4 or direct video url
    if (/\.(mp4|webm|ogg)$/i.test(trimmed)) {
      return {
        embedUrl: trimmed,
        provider: 'HTML5 Video'
      };
    }
    return null;
  };

  const detected = parseVideoEmbed(videoUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    if (detected) {
      if (detected.provider === 'HTML5 Video') {
        const md = `\n<video controls width="100%" style="border-radius: 8px; margin: 12px 0;"><source src="${detected.embedUrl}" type="video/mp4">Your browser does not support the video tag.</video>\n`;
        onInsert(md);
      } else {
        const md = `\n<div class="embedded-video-card" data-provider="${detected.provider}">\n  <iframe src="${detected.embedUrl}" title="${caption || 'Video Embed'}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; aspect-ratio: 16/9; border-radius: 8px; border: none;"></iframe>\n</div>\n`;
        onInsert(md);
      }
    } else {
      // Fallback standard link
      onInsert(`\n[▶ Watch Video: ${caption || videoUrl}](${videoUrl})\n`);
    }

    setVideoUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="link-modal-backdrop" onClick={onClose}>
      <div className="link-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="link-modal-header">
          <div className="link-modal-title">
            <Video size={16} color="var(--accent-primary)" />
            <span>Embed Video (YouTube / Vimeo / MP4)</span>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="link-modal-form">
          <div className="form-group">
            <label>Video URL (YouTube, Vimeo, or MP4 link)</label>
            <input
              type="text"
              autoFocus
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Video Caption / Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. System Architecture Walkthrough"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {detected && (
            <div className="link-preview-box" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <span className="link-preview-label">Detected Provider:</span>
              <strong style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>{detected.provider}</strong>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                Will render a responsive 16:9 embedded player directly inside the note.
              </div>
            </div>
          )}

          <div className="link-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={!videoUrl.trim()}>
              <Check size={14} /> Embed Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
