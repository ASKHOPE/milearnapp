import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { 
  ScanText, 
  Upload, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoNote: (extractedText: string) => void;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoNote
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setImagePreview(url);
      runOcr(url);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const url = event.target?.result as string;
            setImagePreview(url);
            runOcr(url);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    }
  };

  const runOcr = async (imageUrl: string) => {
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Initializing on-device OCR engine...');

    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round((m.progress || 0) * 100));
            setStatusMessage(`Extracting text from image... ${Math.round((m.progress || 0) * 100)}%`);
          } else {
            setStatusMessage(m.status);
          }
        }
      });

      const ret = await worker.recognize(imageUrl);
      setExtractedText(ret.data.text);
      setStatusMessage('✓ Text extracted successfully!');
      await worker.terminate();
    } catch (err: any) {
      console.error('OCR Error:', err);
      setStatusMessage(`❌ Extraction failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!extractedText.trim()) return;
    onInsertIntoNote(`\n${extractedText.trim()}\n`);
    onClose();
  };

  return (
    <div className="modal-overlay visual-studio-overlay" onClick={onClose} onPaste={handlePaste}>
      <div 
        className="modal-container ocr-scanner-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '92vw', maxWidth: '880px', height: '82vh' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="studio-header-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <ScanText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>OCR Document & Image Scanner</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Client-Side Neural OCR • Paste (Ctrl+V) or upload photos, textbook pages, whiteboard notes
              </p>
            </div>
          </div>

          <button type="button" className="editor-icon-btn" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', gap: '16px', padding: '16px', height: 'calc(100% - 128px)' }}>
          {/* Left: Image Source / Upload Box */}
          <div className="ocr-source-pane">
            {imagePreview ? (
              <div className="ocr-preview-box">
                <img src={imagePreview} alt="Scanned input" className="ocr-preview-img" />
                <button 
                  type="button" 
                  className="btn-change-image"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload size={13} />
                  <span>Choose Another Image</span>
                </button>
              </div>
            ) : (
              <div 
                className="ocr-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={36} color="var(--text-muted)" />
                <h4>Drop Image or Paste Screenshot</h4>
                <p>Supports PNG, JPG, WebP photos of notes, books, or equations</p>
                <span className="btn-upload-fake">
                  <Upload size={13} />
                  <span>Browse File</span>
                </span>
              </div>
            )}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleImageUpload} 
            />
          </div>

          {/* Right: Extracted Text Editor */}
          <div className="ocr-result-pane">
            <div className="ocr-result-header">
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Extracted Text</span>
              {extractedText && (
                <button type="button" className="btn-small-ghost" onClick={handleCopy}>
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {isProcessing ? (
              <div className="ocr-loading-view">
                <Loader2 size={32} className="spin-icon" color="#10b981" />
                <p>{statusMessage}</p>
                <div className="quiz-progress-bar-track" style={{ width: '80%', marginTop: '12px' }}>
                  <div className="quiz-progress-bar-fill" style={{ width: `${progress}%`, background: '#10b981' }} />
                </div>
              </div>
            ) : (
              <textarea
                className="ocr-text-editor"
                placeholder="Extracted text will appear here automatically. You can edit and format it before inserting into your note."
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {statusMessage || 'Upload or paste an image to begin optical character recognition.'}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleInsert}
              disabled={!extractedText.trim() || isProcessing}
            >
              <FileText size={14} />
              <span>Insert into Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
