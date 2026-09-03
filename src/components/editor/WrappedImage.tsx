import React, { useState } from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Maximize2, 
  X, 
  MoveUp, 
  MoveDown, 
  Sliders,
  Maximize,
  Check
} from 'lucide-react';

export type ImageAlignMode = 'left' | 'center' | 'right' | 'full';
export type ImageSizeMode = 'small' | 'normal' | 'large' | 'original' | 'custom';

interface WrappedImageProps {
  src: string;
  alt: string;
  align?: ImageAlignMode;
  size?: ImageSizeMode;
  customWidth?: number;
  lineIndex?: number;
  onUpdateImageProps?: (
    lineIndex: number, 
    newAlign: ImageAlignMode, 
    newSize: ImageSizeMode, 
    customWidth?: number
  ) => void;
  onMoveImage?: (lineIndex: number, direction: 'up' | 'down') => void;
  isReadOnly?: boolean;
}

export const WrappedImage: React.FC<WrappedImageProps> = ({
  src,
  alt,
  align = 'center',
  size = 'normal',
  customWidth,
  lineIndex,
  onUpdateImageProps,
  onMoveImage,
  isReadOnly = false
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCustomWidthOpen, setIsCustomWidthOpen] = useState(false);
  const [pixelWidthInput, setPixelWidthInput] = useState<number>(customWidth || 400);

  // Compute CSS width based on size mode
  let renderedWidthStyle: React.CSSProperties = {};
  if (size === 'small') {
    renderedWidthStyle = { width: '220px', maxWidth: '100%' };
  } else if (size === 'normal') {
    renderedWidthStyle = { width: '420px', maxWidth: '100%' };
  } else if (size === 'large') {
    renderedWidthStyle = { width: '680px', maxWidth: '100%' };
  } else if (size === 'original') {
    renderedWidthStyle = { width: 'auto', maxWidth: '100%' };
  } else if (size === 'custom' && customWidth) {
    renderedWidthStyle = { width: `${customWidth}px`, maxWidth: '100%' };
  } else if (align === 'full') {
    renderedWidthStyle = { width: '100%', maxWidth: '100%' };
  } else {
    renderedWidthStyle = { width: '420px', maxWidth: '100%' };
  }

  const containerClasses = [
    'wrapped-image-figure',
    `align-${align}`,
    `size-${size}`
  ].join(' ');

  const handleAlignChange = (newAlign: ImageAlignMode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lineIndex !== undefined && onUpdateImageProps) {
      onUpdateImageProps(lineIndex, newAlign, size, customWidth);
    }
  };

  const handleSizeChange = (newSize: ImageSizeMode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newSize === 'custom') {
      setIsCustomWidthOpen(true);
      return;
    }
    setIsCustomWidthOpen(false);
    if (lineIndex !== undefined && onUpdateImageProps) {
      onUpdateImageProps(lineIndex, align, newSize, customWidth);
    }
  };

  const handleApplyCustomWidth = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (lineIndex !== undefined && onUpdateImageProps) {
      const finalWidth = Math.max(100, Math.min(1400, Number(pixelWidthInput) || 400));
      onUpdateImageProps(lineIndex, align, 'custom', finalWidth);
    }
    setIsCustomWidthOpen(false);
  };

  const handleMove = (direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (lineIndex !== undefined && onMoveImage) {
      onMoveImage(lineIndex, direction);
    }
  };

  // Clean caption text by stripping internal syntax tags
  const cleanCaption = alt ? alt.split('|')[0].trim() : '';

  return (
    <>
      <figure className={containerClasses} style={align === 'center' ? {} : renderedWidthStyle}>
        <div className="image-content-wrapper" style={renderedWidthStyle}>
          <img
            src={src}
            alt={cleanCaption || 'Image'}
            className="wrapped-img-element"
            onClick={() => setIsLightboxOpen(true)}
            loading="lazy"
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }}
          />

          {/* Hover Alignment & Resizing Dock */}
          {!isReadOnly && lineIndex !== undefined && onUpdateImageProps && (
            <div className="image-hover-dock" onClick={(e) => e.stopPropagation()}>
              {/* Row 1: Alignment */}
              <div className="dock-row">
                <span className="dock-row-label">Align</span>
                <div className="dock-row-buttons">
                  <button
                    type="button"
                    className={`btn-image-dock ${align === 'left' ? 'active' : ''}`}
                    onClick={(e) => handleAlignChange('left', e)}
                    title="Float Left — text wraps right"
                  >
                    <AlignLeft size={12} />
                    <span>Left</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-image-dock ${align === 'center' ? 'active' : ''}`}
                    onClick={(e) => handleAlignChange('center', e)}
                    title="Center — full-width block"
                  >
                    <AlignCenter size={12} />
                    <span>Center</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-image-dock ${align === 'right' ? 'active' : ''}`}
                    onClick={(e) => handleAlignChange('right', e)}
                    title="Float Right — text wraps left"
                  >
                    <AlignRight size={12} />
                    <span>Right</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-image-dock ${align === 'full' ? 'active' : ''}`}
                    onClick={(e) => handleAlignChange('full', e)}
                    title="Full Width Banner"
                  >
                    <Maximize size={12} />
                    <span>Full</span>
                  </button>
                </div>
              </div>

              <hr className="dock-row-divider" />

              {/* Row 2: Size */}
              <div className="dock-row">
                <span className="dock-row-label">Size</span>
                <div className="dock-row-buttons">
                  <button
                    type="button"
                    className={`btn-image-dock size-pill ${size === 'small' ? 'active' : ''}`}
                    onClick={(e) => handleSizeChange('small', e)}
                    title="Small — 220px"
                  >S</button>
                  <button
                    type="button"
                    className={`btn-image-dock size-pill ${size === 'normal' ? 'active' : ''}`}
                    onClick={(e) => handleSizeChange('normal', e)}
                    title="Medium — 420px"
                  >M</button>
                  <button
                    type="button"
                    className={`btn-image-dock size-pill ${size === 'large' ? 'active' : ''}`}
                    onClick={(e) => handleSizeChange('large', e)}
                    title="Large — 680px"
                  >L</button>
                  <button
                    type="button"
                    className={`btn-image-dock size-pill ${size === 'original' ? 'active' : ''}`}
                    onClick={(e) => handleSizeChange('original', e)}
                    title="Original — auto size"
                  >Orig</button>
                  <button
                    type="button"
                    className={`btn-image-dock size-pill ${size === 'custom' ? 'active' : ''}`}
                    onClick={(e) => handleSizeChange('custom', e)}
                    title="Custom pixel width"
                  >
                    <Sliders size={11} />
                    <span>{customWidth ? `${customWidth}px` : 'Px'}</span>
                  </button>
                </div>
              </div>

              {/* Row 3: Move & Lightbox */}
              {(onMoveImage) && (
                <>
                  <hr className="dock-row-divider" />
                  <div className="dock-row">
                    <span className="dock-row-label">Move</span>
                    <div className="dock-row-buttons">
                      <button
                        type="button"
                        className="btn-image-dock"
                        onClick={(e) => handleMove('up', e)}
                        title="Move image up"
                      >
                        <MoveUp size={12} />
                        <span>Up</span>
                      </button>
                      <button
                        type="button"
                        className="btn-image-dock"
                        onClick={(e) => handleMove('down', e)}
                        title="Move image down"
                      >
                        <MoveDown size={12} />
                        <span>Down</span>
                      </button>
                      <button
                        type="button"
                        className="btn-image-dock"
                        onClick={() => setIsLightboxOpen(true)}
                        title="Open full-size lightbox"
                        style={{ marginLeft: 'auto' }}
                      >
                        <Maximize2 size={12} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Custom Pixel Width Popover */}
          {isCustomWidthOpen && (
            <div className="custom-width-popover" onClick={(e) => e.stopPropagation()}>
              <div className="custom-width-header">
                <span>Set Width (pixels)</span>
                <button type="button" onClick={() => setIsCustomWidthOpen(false)} className="btn-close-popover">
                  <X size={12} />
                </button>
              </div>
              <form onSubmit={handleApplyCustomWidth} className="custom-width-form">
                <input
                  type="range"
                  min="120"
                  max="1200"
                  step="10"
                  value={pixelWidthInput}
                  onChange={(e) => setPixelWidthInput(Number(e.target.value))}
                  className="custom-width-slider"
                />
                <div className="custom-width-input-row">
                  <input
                    type="number"
                    min="100"
                    max="1600"
                    value={pixelWidthInput}
                    onChange={(e) => setPixelWidthInput(Number(e.target.value))}
                    className="custom-width-number-input"
                  />
                  <span>px</span>
                  <button type="submit" className="btn-apply-width">
                    <Check size={13} /> Apply
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {cleanCaption && (
          <figcaption className="wrapped-image-caption">{cleanCaption}</figcaption>
        )}
      </figure>

      {/* High-Resolution Lightbox Modal */}
      {isLightboxOpen && (
        <div className="image-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-close-lightbox"
              onClick={() => setIsLightboxOpen(false)}
              title="Close Preview (Esc)"
            >
              <X size={18} />
            </button>
            <img src={src} alt={cleanCaption || 'Image'} className="lightbox-img" />
            {cleanCaption && <p className="lightbox-caption">{cleanCaption}</p>}
          </div>
        </div>
      )}
    </>
  );
};
