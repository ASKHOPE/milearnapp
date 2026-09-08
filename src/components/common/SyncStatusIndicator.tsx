import React, { useState } from 'react';
import { RefreshCw, Cloud } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface SyncStatusIndicatorProps {
  variant?: 'compact' | 'pill' | 'sidebar';
  onOpenSettings?: (tab?: string) => void;
  showLabel?: boolean;
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  variant = 'pill',
  onOpenSettings,
  showLabel = true,
  className = ''
}) => {
  const {
    pendingCount,
    isSyncing,
    lastSyncTime,
    lastSyncFormatted,
    statusLabel,
    statusColor,
    triggerSync
  } = useSyncStatus();

  const [isHovered, setIsHovered] = useState(false);

  const tooltipText = `PostgreSQL Sync: ${statusLabel}\nLast synced: ${lastSyncFormatted}\nPending local mutations: ${pendingCount}\nClick to sync or configure in Settings`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenSettings) {
      onOpenSettings('database');
    } else {
      triggerSync();
    }
  };

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        className={`sidebar-sync-indicator ${className}`}
        onClick={handleClick}
        title={tooltipText}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 10px',
          borderRadius: '6px',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
          background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
          color: 'var(--text-secondary, #94a3b8)',
          fontSize: '11px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.15s ease',
          textAlign: 'left'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 6px ${statusColor}`,
            display: 'inline-block',
            flexShrink: 0
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {statusLabel}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {lastSyncTime ? `Synced ${lastSyncFormatted}` : 'Local mode'}
          </div>
        </div>
        {isSyncing ? (
          <RefreshCw size={12} className="spin-animation" style={{ color: statusColor }} />
        ) : (
          <Cloud size={12} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        className={`sync-indicator-compact ${className}`}
        onClick={handleClick}
        title={tooltipText}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            display: 'inline-block'
          }}
        />
      </button>
    );
  }

  // Default: 'pill' variant for header
  return (
    <button
      type="button"
      className={`header-sync-pill ${className}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '12px',
        border: `1px solid ${isHovered ? statusColor : 'var(--border-color, rgba(255, 255, 255, 0.1))'}`,
        background: isHovered
          ? 'var(--bg-hover, rgba(255, 255, 255, 0.06))'
          : 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
        cursor: 'pointer',
        fontSize: '11px',
        color: 'var(--text-secondary, #94a3b8)',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        height: '24px'
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          boxShadow: `0 0 6px ${statusColor}`,
          display: 'inline-block',
          flexShrink: 0
        }}
      />
      {showLabel && (
        <span style={{ fontWeight: 500, fontSize: '11px', color: 'var(--text-secondary)' }}>
          {statusLabel}
        </span>
      )}
      {isSyncing && (
        <RefreshCw
          size={10}
          className="spin-animation"
          style={{
            color: statusColor,
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
    </button>
  );
};
