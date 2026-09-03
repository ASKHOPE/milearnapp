import React, { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Maximize2, X } from 'lucide-react';

interface WrappedImageProps {
  src: string;
  alt: string;
  align?: 'left' | 'right' | 'center';
  lineIndex?: number;
  onUpdateAlign?: (lineIndex: number, newAlign: 'left' | 'right' | 'center') => void;
  isReadOnly?: boolean;
}

export const WrappedImage: React.FC<WrappedImageProps> = ({
  src,
  alt,
  align = 'center',
  lineIndex,
  onUpdateAlign,
  isReadOnly = false
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerClasses = [
    'wrapped-image-figure',
    `align-${align}`
  ].join(' ');

  const handleAlignChange = (newAlign: 'left' | 'right' | 'center', e: React.MouseEvent) => {
    e.stopPropagation();
    if (lineIndex !== undefined && onUpdateAlign) {
      onUpdateAlign(lineIndex, newAlign);
    }
  };

  return (
    <>
      <figure className={containerClasses}>
        <div className="image-content-wrapper">
          <img
            src={src}
            alt={alt}
            className="wrapped-img-element"
            onClick={() => setIsLightboxOpen(true)}
            loading="lazy"
          />

          {/* Hover Alignment Quick Toolbar */}
          {!isReadOnly && onUpdateAlign && lineIndex !== undefined && (
            <div className="image-hover-dock" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={`btn-image-align ${align === 'left' ? 'active' : ''}`}
                onClick={(e) => handleAlignChange('left', e)}
                title="Float Left (Text wraps right)"
              >
                <AlignLeft size={12} />
                <span>Left</span>
              </button>

              <button
                type="button"
                className={`btn-image-align ${align === 'center' ? 'active' : ''}`}
                onClick={(e) => handleAlignChange('center', e)}
                title="Center (Break text)"
              >
                <AlignCenter size={12} />
                <span>Center</span>
              </button>

              <button
                type="button"
                className={`btn-image-align ${align === 'right' ? 'active' : ''}`}
                onClick={(e) => handleAlignChange('right', e)}
                title="Float Right (Text wraps left)"
              >
                <AlignRight size={12} />
                <span>Right</span>
              </button>

              <button
                type="button"
                className="btn-image-align"
                onClick={() => setIsLightboxOpen(true)}
                title="Expand Full View"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          )}
        </div>

        {alt && alt.trim() && !['left', 'right', 'center'].includes(alt.toLowerCase()) && (
          <figcaption className="wrapped-image-caption">{alt}</figcaption>
        )}
      </figure>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="image-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-close-lightbox"
              onClick={() => setIsLightboxOpen(false)}
              title="Close Preview"
            >
              <X size={18} />
            </button>
            <img src={src} alt={alt} className="lightbox-img" />
            {alt && <p className="lightbox-caption">{alt}</p>}
          </div>
        </div>
      )}
    </>
  );
};
