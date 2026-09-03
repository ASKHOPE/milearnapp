import React from 'react';

interface BookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const BookLoader: React.FC<BookLoaderProps> = ({ size = 'md', text }) => {
  return (
    <div className={`book-loader-wrapper size-${size}`}>
      <div className="book">
        <div className="book__pg-shadow" />
        <div className="book__pg" />
        <div className="book__pg book__pg--2" />
        <div className="book__pg book__pg--3" />
        <div className="book__pg book__pg--4" />
        <div className="book__pg book__pg--5" />
      </div>
      {text && <div className="book-loader-text">{text}</div>}
    </div>
  );
};
