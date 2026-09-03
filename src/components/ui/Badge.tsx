import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  icon,
  dot = false,
  className = '',
  onClick
}) => {
  return (
    <span 
      className={`ui-badge ui-badge-${variant} ${onClick ? 'ui-badge-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {dot && <span className="ui-badge-dot" />}
      {icon && <span className="ui-badge-icon">{icon}</span>}
      <span className="ui-badge-text">{children}</span>
    </span>
  );
};
