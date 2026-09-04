/**
 * Unified Widget Registry Architecture
 * Extensible provider system for all header pinned widgets, floating status widgets,
 * and quick-access utility tools.
 */

export type WidgetCategory = 'productivity' | 'focus' | 'system' | 'learning';

export interface WidgetDefinition {
  id: string;
  name: string;
  category: WidgetCategory;
  description: string;
  iconName: string;
  isWidgetStyle: boolean; // true if it renders a dynamic badge/pill, false if standard icon button
  defaultPinned?: boolean;
  minWidth?: number;
}

export const REGISTERED_WIDGETS: WidgetDefinition[] = [
  {
    id: 'pomodoro',
    name: 'Focus Pomodoro',
    category: 'focus',
    description: 'Interval countdown timer with completion audio chime',
    iconName: 'Timer',
    isWidgetStyle: true,
    defaultPinned: true,
    minWidth: 80
  },
  {
    id: 'typing',
    name: 'Typing Practice Sprint',
    category: 'productivity',
    description: 'Real-time practice game WPM telemetry and accuracy monitor',
    iconName: 'Keyboard',
    isWidgetStyle: true,
    defaultPinned: true,
    minWidth: 105
  },
  {
    id: 'study',
    name: 'Active Recall Cards',
    category: 'learning',
    description: 'SuperMemo-2 spaced repetition flashcards & quiz arena',
    iconName: 'GraduationCap',
    isWidgetStyle: false,
    defaultPinned: true
  },
  {
    id: 'knowledge',
    name: 'Galaxy Graph',
    category: 'system',
    description: 'Visual relationship map of all workspaces and notes',
    iconName: 'Network',
    isWidgetStyle: false
  },
  {
    id: 'internalMind',
    name: 'Internal Mind',
    category: 'learning',
    description: 'Conceptual lexicon and semantic knowledge bank',
    iconName: 'Sparkles',
    isWidgetStyle: false
  },
  {
    id: 'linkTree',
    name: 'Library Tree',
    category: 'productivity',
    description: 'Hierarchical explorer for folders and book volumes',
    iconName: 'FolderTree',
    isWidgetStyle: false
  },
  {
    id: 'webclipper',
    name: 'Web Clipper',
    category: 'productivity',
    description: 'Fetch and parse web articles into structured markdown notes',
    iconName: 'Globe',
    isWidgetStyle: false
  }
];

class WidgetRegistryService {
  private customWidgets: Map<string, WidgetDefinition> = new Map();

  public getAllWidgets(): WidgetDefinition[] {
    return [...REGISTERED_WIDGETS, ...Array.from(this.customWidgets.values())];
  }

  public getWidget(id: string): WidgetDefinition | undefined {
    return this.getAllWidgets().find((w) => w.id === id);
  }

  public registerWidget(def: WidgetDefinition) {
    this.customWidgets.set(def.id, def);
  }
}

export const widgetRegistry = new WidgetRegistryService();
