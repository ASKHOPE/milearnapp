import React, { useState, useRef } from 'react';
import type { Attachment, AttachmentType } from '../types';
import { 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  BookOpen
} from 'lucide-react';
import { PdfViewerModal } from './PdfViewerModal';
import { EpubViewerModal } from './EpubViewerModal';
import { optimizer } from '../services/optimizer';

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAddAttachment: (attachment: Attachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  onAddAttachment,
  onDeleteAttachment
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [pdfViewerAtt, setPdfViewerAtt] = useState<Attachment | null>(null);
  const [epubViewerAtt, setEpubViewerAtt] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Format byte size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper: Determine attachment category
  const detectType = (file: File): AttachmentType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) return 'pdf';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.name.endsWith('.epub') || file.type === 'application/epub+zip') return 'document';
    if (
      file.type.includes('document') || 
      file.type.includes('text') || 
      file.name.endsWith('.docx') || 
      file.name.endsWith('.doc') || 
      file.name.endsWith('.csv') || 
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    ) {
      return 'document';
    }
    return 'document';
  };

  const isEpub = (att: Attachment) => att.name.endsWith('.epub');

  // Process selected or dropped files
  const processFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const type = detectType(file);

      if (type === 'image') {
        try {
          const opt = await optimizer.compressImage(file);
          const newAttachment: Attachment = {
            id: 'att-' + Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, '') + '.webp',
            type: 'image',
            size: opt.size,
            mimeType: opt.mimeType,
            dataUrl: opt.dataUrl,
            createdAt: new Date().toISOString()
          };
          onAddAttachment(newAttachment);
          return;
        } catch {
          // fallback to raw reader if optimization fails
        }
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const newAttachment: Attachment = {
          id: 'att-' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          dataUrl: result,
          createdAt: new Date().toISOString()
        };
        onAddAttachment(newAttachment);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  // Download attachment helper
  const downloadAttachment = (att: Attachment) => {
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (att: Attachment) => {
    if (att.type === 'image') return <ImageIcon size={18} color="#4f46e5" />;
    if (att.type === 'pdf') return <FileText size={18} color="#ef4444" />;
    if (att.type === 'audio') return <Music size={18} color="#10b981" />;
    if (isEpub(att)) return <BookOpen size={18} color="#8b5cf6" />;
    if (att.name.endsWith('.csv') || att.name.endsWith('.xlsx')) return <FileSpreadsheet size={18} color="#10b981" />;
    if (att.name.endsWith('.ts') || att.name.endsWith('.js') || att.name.endsWith('.json')) return <FileCode size={18} color="#f59e0b" />;
    return <FileText size={18} color="#6366f1" />;
  };

  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <span className="attachments-title">
          <Paperclip size={15} />
          <span>Attachments & Media ({attachments.length})</span>
        </span>
        <button 
          className="header-btn" 
          onClick={() => fileInputRef.current?.click()}
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          <UploadCloud size={13} />
          <span>Upload File</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => processFiles(e.target.files)} 
      />

      {/* Drag & Drop Zone */}
      <div 
        className={`attachment-dropzone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud size={24} color="var(--accent-primary)" />
        <p style={{ fontWeight: 500 }}>
          Drag & drop images, PDFs, documents, audio or <span style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>browse</span>
        </p>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Supports PNG, JPG, PDF, Word, CSV, Markdown, Audio & more
        </span>
      </div>

      {/* Attachments Grid */}
      {attachments.length > 0 && (
        <div className="attachments-grid">
          {attachments.map((att) => (
            <div key={att.id} className="attachment-card">
              {/* Media Preview Box */}
              {att.type === 'image' ? (
                <div 
                  className="attachment-preview-box"
                  onClick={() => setLightboxImage(att.dataUrl)}
                  title="Click to zoom image"
                >
                  <img src={att.dataUrl} alt={att.name} />
                </div>
              ) : att.type === 'audio' ? (
                <div className="audio-attachment-box">
                  <audio controls src={att.dataUrl} preload="metadata" />
                </div>
              ) : (
                <div 
                  className="attachment-preview-box"
                  style={{ cursor: (att.type === 'pdf' || isEpub(att)) ? 'pointer' : 'default', flexDirection: 'column', gap: '6px' }}
                  onClick={() => {
                    if (att.type === 'pdf') setPdfViewerAtt(att);
                    else if (isEpub(att)) setEpubViewerAtt(att);
                  }}
                  title={att.type === 'pdf' ? 'Open PDF Viewer' : isEpub(att) ? 'Open ePub Reader' : ''}
                >
                  {getFileIcon(att)}
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {isEpub(att) ? 'EPUB' : att.type.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info & Actions */}
              <div className="attachment-card-info">
                <span className="attachment-name" title={att.name}>{att.name}</span>
                <div className="attachment-submeta">
                  <span>{formatBytes(att.size)}</span>
                  <div className="attachment-actions-bar">
                    {att.type === 'image' && (
                      <button 
                        className="attachment-btn" 
                        title="View Fullscreen"
                        onClick={() => setLightboxImage(att.dataUrl)}
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    {att.type === 'pdf' && (
                      <button 
                        className="attachment-btn" 
                        title="Open PDF Viewer with OCR"
                        onClick={() => setPdfViewerAtt(att)}
                      >
                        <Eye size={13} />
                      </button>
                    )}
                    {isEpub(att) && (
                      <button
                        className="attachment-btn"
                        title="Open ePub Reader"
                        onClick={() => setEpubViewerAtt(att)}
                      >
                        <BookOpen size={13} />
                      </button>
                    )}
                    <button 
                      className="attachment-btn" 
                      title="Download"
                      onClick={() => downloadAttachment(att)}
                    >
                      <Download size={13} />
                    </button>
                    <button 
                      className="attachment-btn" 
                      title="Delete attachment"
                      onClick={() => onDeleteAttachment(att.id)}
                    >
                      <Trash2 size={13} color="var(--color-danger)" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Images */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close-btn" onClick={() => setLightboxImage(null)}>
              <X size={26} />
            </button>
            <img src={lightboxImage} alt="Fullscreen Attachment Preview" />
          </div>
        </div>
      )}

      {/* Full PDF Viewer with OCR */}
      {pdfViewerAtt && (
        <PdfViewerModal
          isOpen={true}
          src={pdfViewerAtt.dataUrl}
          filename={pdfViewerAtt.name}
          onClose={() => setPdfViewerAtt(null)}
        />
      )}

      {/* Full ePub Reader */}
      {epubViewerAtt && (
        <EpubViewerModal
          isOpen={true}
          src={epubViewerAtt.dataUrl}
          filename={epubViewerAtt.name}
          onClose={() => setEpubViewerAtt(null)}
        />
      )}
    </div>
  );
};
