import React, { useState, useEffect } from 'react';
import type { Note } from '../types';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  CheckSquare, 
  List, 
  Quote, 
  Code, 
  Table, 
  Mic, 
  Info, 
  Lightbulb, 
  AlertTriangle, 
  Zap, 
  Minus, 
  Calendar,
  FileText,
  PenTool
} from 'lucide-react';

export type SuggestionType = 'slash' | 'wikilink';

interface CommandItem {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  action: () => void;
}

interface EditorSuggestionsProps {
  type: SuggestionType;
  query: string;
  allNotes: Note[];
  position: { top: number; left: number };
  isMicEnabled?: boolean;
  onSelectSlashCommand: (snippet: string) => void;
  onSelectWikiLink: (noteTitle: string) => void;
  onTriggerVoiceRecorder: () => void;
  onTriggerDrawing: () => void;
  onClose: () => void;
}

export const EditorSuggestions: React.FC<EditorSuggestionsProps> = ({
  type,
  query,
  allNotes,
  position,
  isMicEnabled = true,
  onSelectSlashCommand,
  onSelectWikiLink,
  onTriggerVoiceRecorder,
  onTriggerDrawing,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Define Slash Commands List
  const slashCommands: CommandItem[] = [
    {
      id: 'h1',
      label: 'Heading 1',
      sublabel: 'Large section heading',
      icon: <Heading1 size={15} color="#4f46e5" />,
      action: () => onSelectSlashCommand('# ')
    },
    {
      id: 'h2',
      label: 'Heading 2',
      sublabel: 'Medium subsection heading',
      icon: <Heading2 size={15} color="#4f46e5" />,
      action: () => onSelectSlashCommand('## ')
    },
    {
      id: 'h3',
      label: 'Heading 3',
      sublabel: 'Small group heading',
      icon: <Heading3 size={15} color="#4f46e5" />,
      action: () => onSelectSlashCommand('### ')
    },
    {
      id: 'task',
      label: 'Checklist Item',
      sublabel: 'Interactive todo item',
      icon: <CheckSquare size={15} color="#10b981" />,
      action: () => onSelectSlashCommand('- [ ] ')
    },
    {
      id: 'bullet',
      label: 'Bullet List',
      sublabel: 'Unordered list item',
      icon: <List size={15} color="#f59e0b" />,
      action: () => onSelectSlashCommand('- ')
    },
    {
      id: 'callout-note',
      label: 'Callout: Note',
      sublabel: 'Blue informative callout card',
      icon: <Info size={15} color="#0ea5e9" />,
      action: () => onSelectSlashCommand('> [!NOTE]\n> Useful information or context here.\n\n')
    },
    {
      id: 'callout-tip',
      label: 'Callout: Tip',
      sublabel: 'Green tip & suggestion card',
      icon: <Lightbulb size={15} color="#10b981" />,
      action: () => onSelectSlashCommand('> [!TIP]\n> Pro-tip or best practice here.\n\n')
    },
    {
      id: 'callout-warning',
      label: 'Callout: Warning',
      sublabel: 'Amber warning & caution card',
      icon: <AlertTriangle size={15} color="#f59e0b" />,
      action: () => onSelectSlashCommand('> [!WARNING]\n> Critical notice or caution here.\n\n')
    },
    {
      id: 'callout-important',
      label: 'Callout: Important',
      sublabel: 'Purple highlight callout card',
      icon: <Zap size={15} color="#8b5cf6" />,
      action: () => onSelectSlashCommand('> [!IMPORTANT]\n> High priority essential detail.\n\n')
    },
    {
      id: 'table',
      label: 'Table (3x3)',
      sublabel: 'Formatted markdown table',
      icon: <Table size={15} color="#6366f1" />,
      action: () => onSelectSlashCommand('\n| Feature | Status | Notes |\n| :--- | :--- | :--- |\n| Item 1 | Active | Details |\n| Item 2 | Done | Verified |\n\n')
    },
    {
      id: 'code',
      label: 'Code Block',
      sublabel: 'Syntax formatted code snippet',
      icon: <Code size={15} color="#ec4899" />,
      action: () => onSelectSlashCommand('```typescript\n// Code snippet\nconst noteflow = true;\n```\n')
    },
    {
      id: 'quote',
      label: 'Quote Block',
      sublabel: 'Blockquote styling',
      icon: <Quote size={15} color="#64748b" />,
      action: () => onSelectSlashCommand('> ')
    },
    {
      id: 'voice',
      label: 'Record Voice Note',
      sublabel: 'Record audio via microphone',
      icon: <Mic size={15} color="#ef4444" />,
      action: () => onTriggerVoiceRecorder()
    },
    {
      id: 'sketch',
      label: 'Freehand Sketch & Drawing',
      sublabel: 'Draw diagram, canvas, or sketch',
      icon: <PenTool size={15} color="#8b5cf6" />,
      action: () => onTriggerDrawing()
    },
    {
      id: 'date',
      label: 'Date & Time',
      sublabel: 'Insert current timestamp',
      icon: <Calendar size={15} color="#06b6d4" />,
      action: () => onSelectSlashCommand(`**${new Date().toLocaleString()}** `)
    },
    {
      id: 'divider',
      label: 'Divider Line',
      sublabel: 'Horizontal line separator',
      icon: <Minus size={15} color="#94a3b8" />,
      action: () => onSelectSlashCommand('\n---\n\n')
    }
  ];

  // Filter Slash Commands
  const filteredCommands = slashCommands.filter((cmd) => {
    if (cmd.id === 'voice' && !isMicEnabled) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return cmd.label.toLowerCase().includes(q) || cmd.sublabel.toLowerCase().includes(q);
  });

  // Filter Wiki-Link Notes
  const filteredNotes = allNotes.filter((note) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.tags?.some((t) => t.toLowerCase().includes(q));
  });

  const itemCount = type === 'slash' ? filteredCommands.length : filteredNotes.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (itemCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (type === 'slash' && filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        } else if (type === 'wikilink' && filteredNotes[selectedIndex]) {
          onSelectWikiLink(filteredNotes[selectedIndex].title);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, selectedIndex, itemCount, filteredCommands, filteredNotes, onSelectWikiLink, onClose]);

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (itemCount === 0) return null;

  return (
    <div 
      className="editor-suggestions-menu"
      style={{
        top: `${Math.min(window.innerHeight - 300, Math.max(120, position.top))}px`,
        left: `${Math.min(window.innerWidth - 300, Math.max(40, position.left))}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="suggestion-menu-header">
        <span>{type === 'slash' ? 'Commands' : 'Link to Note'}</span>
        <span style={{ fontSize: '10px', opacity: 0.6 }}>↑↓ to navigate · ↵ to select</span>
      </div>

      <div className="suggestion-items-list">
        {type === 'slash' ? (
          filteredCommands.map((cmd, idx) => (
            <div
              key={cmd.id}
              className={`suggestion-item ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="suggestion-item-icon">{cmd.icon}</div>
              <div className="suggestion-item-text">
                <span className="suggestion-item-title">{cmd.label}</span>
                <span className="suggestion-item-sub">{cmd.sublabel}</span>
              </div>
            </div>
          ))
        ) : (
          filteredNotes.map((note, idx) => (
            <div
              key={note.id}
              className={`suggestion-item ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSelectWikiLink(note.title)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="suggestion-item-icon">
                <FileText size={15} color="var(--accent-primary)" />
              </div>
              <div className="suggestion-item-text">
                <span className="suggestion-item-title">{note.title || 'Untitled Note'}</span>
                {note.tags?.length > 0 && (
                  <span className="suggestion-item-sub">
                    {note.tags.map((t) => `#${t}`).join(' ')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
