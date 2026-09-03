import React from 'react';

interface FolderLoaderProps {
  text?: string;
  className?: string;
}

export const FolderLoader: React.FC<FolderLoaderProps> = ({ 
  text = 'getting files ready...',
  className = ''
}) => {
  return (
    <div className={`folder-loader-wrapper ${className}`}>
      <div className="folder-container">
        <div className="folder-floating">
          <div className="folder-top" />
          <div className="folder-bottom" />
        </div>
        {text && <div className="folder-title">{text}</div>}
      </div>
    </div>
  );
};
