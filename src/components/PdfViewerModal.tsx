import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, FileText, ScanLine } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { extractText, type OcrLanguage, OCR_LANGUAGES } from '../services/ocrService';

// Set up PDF.js worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
  isOpen: boolean;
  src: string | File;
  filename?: string;
  onClose: () => void;
  onExtractedText?: (text: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  src,
  filename = 'Document.pdf',
  onClose,
  onExtractedText,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrLang, setOcrLang] = useState<OcrLanguage>('eng');
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [showOcrPanel, setShowOcrPanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  // Convert a data URL to Uint8Array for pdfjs
  function dataUrlToUint8Array(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
  }

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    setPageNum(1);
    setPdfDoc(null);

    const loadPdf = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let loadSource: any;
        if (typeof src === 'string') {
          if (src.startsWith('data:')) {
            loadSource = { data: dataUrlToUint8Array(src) };
          } else {
            loadSource = src;
          }
        } else {
          const ab = await src.arrayBuffer();
          loadSource = { data: new Uint8Array(ab) };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = await (pdfjsLib as any).getDocument(loadSource).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setIsLoading(false);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setError('Failed to load PDF: ' + msg);
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [isOpen, src]);

  const renderPage = useCallback(async (doc: unknown, num: number, s: number, rot: number) => {
    if (!canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (doc as any).getPage(num);
    const viewport = page.getViewport({ scale: s, rotation: rot });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rc: any = { canvasContext: ctx, canvas, viewport };
    const task = page.render(rc);
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name !== 'RenderingCancelledException') throw e;
    }
  }, []);

  useEffect(() => {
    if (!pdfDoc) return;
    renderPage(pdfDoc, pageNum, scale, rotation);
  }, [pdfDoc, pageNum, scale, rotation, renderPage]);

  const handleOcr = async () => {
    if (!canvasRef.current) return;
    setIsOcrRunning(true);
    setShowOcrPanel(true);
    try {
      const result = await extractText(canvasRef.current, ocrLang);
      setExtractedOcrText(result.text);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setExtractedOcrText('OCR failed: ' + msg);
    }
    setIsOcrRunning(false);
  };

  if (!isOpen) return null;

  return (
    <div className={`pdf-viewer-overlay ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="pdf-viewer-modal">
        {/* Toolbar */}
        <div className="pdf-toolbar">
          <div className="pdf-toolbar-left">
            <div className="pdf-file-badge">
              <FileText size={14} />
              <span>{filename}</span>
            </div>
            <span className="pdf-page-info">{totalPages > 0 ? `Page ${pageNum} of ${totalPages}` : '...'}</span>
          </div>
          <div className="pdf-toolbar-center">
            <button className="pdf-nav-btn" onClick={() => setPageNum(n => Math.max(1, n - 1))} disabled={pageNum <= 1} title="Previous Page">
              <ChevronLeft size={16} />
            </button>
            <input
              type="number"
              className="pdf-page-input"
              value={pageNum}
              min={1}
              max={totalPages}
              onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPageNum(v); }}
            />
            <button className="pdf-nav-btn" onClick={() => setPageNum(n => Math.min(totalPages, n + 1))} disabled={pageNum >= totalPages} title="Next Page">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="pdf-toolbar-right">
            <button className="pdf-icon-btn" onClick={() => setScale(s => Math.max(0.5, Math.round((s - 0.2) * 10) / 10))} title="Zoom Out"><ZoomOut size={15} /></button>
            <span className="pdf-scale-label">{Math.round(scale * 100)}%</span>
            <button className="pdf-icon-btn" onClick={() => setScale(s => Math.min(4.0, Math.round((s + 0.2) * 10) / 10))} title="Zoom In"><ZoomIn size={15} /></button>
            <button className="pdf-icon-btn" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate 90°"><RotateCw size={15} /></button>
            <div className="pdf-divider" />
            <select className="pdf-lang-select" value={ocrLang} onChange={e => setOcrLang(e.target.value as OcrLanguage)} title="OCR Language">
              {OCR_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
            </select>
            <button className="pdf-icon-btn ocr" onClick={handleOcr} disabled={isOcrRunning} title="Extract Text from Page (OCR)">
              <ScanLine size={15} />
              <span>{isOcrRunning ? 'Reading…' : 'OCR'}</span>
            </button>
            <div className="pdf-divider" />
            <button className="pdf-icon-btn" onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            <button className="pdf-icon-btn danger" onClick={onClose} title="Close PDF Viewer"><X size={15} /></button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="pdf-canvas-wrapper">
          {isLoading && (
            <div className="pdf-loading-state">
              <div className="pdf-spinner" />
              <p>Loading PDF…</p>
            </div>
          )}
          {error && (
            <div className="pdf-error-state">
              <p>{error}</p>
              <button onClick={onClose} className="btn-small-primary">Close</button>
            </div>
          )}
          <canvas ref={canvasRef} className="pdf-canvas" style={{ display: isLoading || !!error ? 'none' : 'block' }} />
        </div>

        {/* OCR Text Panel */}
        {showOcrPanel && (
          <div className="pdf-ocr-panel">
            <div className="pdf-ocr-header">
              <span>📝 Extracted Text (Page {pageNum})</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {onExtractedText && extractedOcrText && (
                  <button className="btn-small-primary" onClick={() => { onExtractedText(extractedOcrText); onClose(); }}>
                    Insert into Note
                  </button>
                )}
                <button className="pdf-icon-btn" onClick={() => setShowOcrPanel(false)}><X size={13} /></button>
              </div>
            </div>
            <textarea
              className="pdf-ocr-textarea"
              value={isOcrRunning ? 'Scanning page with OCR…' : extractedOcrText}
              readOnly
              placeholder="OCR text will appear here after scanning…"
            />
          </div>
        )}
      </div>
    </div>
  );
};
