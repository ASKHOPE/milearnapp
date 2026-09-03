import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pill'
}) => {
  return (
    <div className={`ui-tabs-container ui-tabs-${variant} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`ui-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.icon && <span className="ui-tab-icon">{tab.icon}</span>}
            <span className="ui-tab-label">{tab.label}</span>
            {tab.badge !== undefined && <span className="ui-tab-badge">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
