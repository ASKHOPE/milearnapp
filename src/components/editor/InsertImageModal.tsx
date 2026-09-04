import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { optimizer } from '../../services/optimizer';

interface InsertImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (markdownImageTag: string) => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  onClose,
  onInsert
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!caption) {
      setCaption(file.name.replace(/\.[^/.]+$/, ''));
    }

    optimizer.compressImage(file)
      .then((opt) => {
        setPreviewSrc(opt.dataUrl);
      })
      .catch(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          setPreviewSrc(result);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleConfirm = () => {
    const finalSrc = activeTab === 'upload' ? previewSrc : imageUrl.trim();
    if (!finalSrc) return;

    const altText = caption.trim() || 'Image';
    const tag = `![${altText}|${alignment}](${finalSrc})\n`;

    onInsert(tag);
    // Reset state
    setImageUrl('');
    setCaption('');
    setPreviewSrc(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert & Position Image"
      subtitle="Place images anywhere and wrap surrounding text automatically"
      maxWidth="500px"
    >
      <div className="insert-image-dialog">
        {/* Source Tabs */}
        <div className="insert-source-tabs">
          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            className={`source-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <LinkIcon size={14} />
            <span>Web Image URL</span>
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 'upload' && (
          <div className="upload-dropzone-area" onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {previewSrc ? (
              <div className="upload-preview-box">
                <img src={previewSrc} alt="Preview" className="upload-preview-img" />
                <span className="upload-rechoose-text">Click to choose a different image</span>
              </div>
            ) : (
              <div className="upload-empty-prompt">
                <div className="upload-icon-circle">
                  <ImageIcon size={24} color="var(--accent-primary)" />
                </div>
                <span className="upload-prompt-title">Choose an image from device</span>
                <span className="upload-prompt-sub">Supports PNG, JPG, WebP, GIF, SVG</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: URL */}
        {activeTab === 'url' && (
          <div className="url-input-group">
            <label className="form-field-label">Image Web Address</label>
            <input
              type="url"
              className="dialog-text-input"
              placeholder="https://example.com/photo.png"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setPreviewSrc(e.target.value);
              }}
            />
          </div>
        )}

        {/* Caption */}
        <div className="form-field-row" style={{ marginTop: '14px' }}>
          <label className="form-field-label">Caption / Alt Description</label>
          <input
            type="text"
            className="dialog-text-input"
            placeholder="e.g. System Architecture Flow"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        {/* Text Wrapping Alignment Options */}
        <div className="form-field-row" style={{ marginTop: '14px' }}>
          <label className="form-field-label">Layout & Text Wrapping</label>
          <div className="alignment-selector-grid">
            <button
              type="button"
              className={`align-card-btn ${alignment === 'left' ? 'active' : ''}`}
              onClick={() => setAlignment('left')}
            >
              <AlignLeft size={16} />
              <div className="align-text-wrap">
                <span className="align-btn-title">Float Left</span>
                <span className="align-btn-desc">Text wraps right</span>
              </div>
            </button>

            <button
              type="button"
              className={`align-card-btn ${alignment === 'center' ? 'active' : ''}`}
              onClick={() => setAlignment('center')}
            >
              <AlignCenter size={16} />
              <div className="align-text-wrap">
                <span className="align-btn-title">Center</span>
                <span className="align-btn-desc">Full paragraph break</span>
              </div>
            </button>

            <button
              type="button"
              className={`align-card-btn ${alignment === 'right' ? 'active' : ''}`}
              onClick={() => setAlignment('right')}
            >
              <AlignRight size={16} />
              <div className="align-text-wrap">
                <span className="align-btn-title">Float Right</span>
                <span className="align-btn-desc">Text wraps left</span>
              </div>
            </button>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="dialog-footer-actions">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={activeTab === 'upload' ? !previewSrc : !imageUrl.trim()}
            onClick={handleConfirm}
          >
            Insert Image
          </Button>
        </div>
      </div>
    </Modal>
  );
};
