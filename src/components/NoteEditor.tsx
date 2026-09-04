import React, { useState, useRef, useEffect } from 'react';
import type { 
  Note, 
  Folder as FolderType, 
  Attachment,
  Book,
  Workspace
} from '../types';
import { 
  Star, 
  Pin, 
  Trash2, 
  Bold, 
  Italic, 
  List, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Heading3, 
  Code, 
  Link, 
  ExternalLink,
  Edit3, 
  Columns, 
  ArrowLeft,
  Share2,
  Folder as FolderIcon,
  Mic,
  ListTree,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Copy,
  Check,
  Info,
  Lightbulb,
  AlertTriangle,
  Zap,
  PenTool,
  Search,
  LayoutTemplate,
  ChevronDown,
  Archive,
  RotateCcw,
  BookOpen,
  Lock,
  Unlock,
  KeyRound,
  Sigma,
  GitBranch,
  Columns2,
  Move,
  LogOut,
  XCircle,
  Video as VideoIcon,
  Highlighter as HighlighterIcon,
  Strikethrough as StrikethroughIcon,
  Underline as UnderlineIcon,
  ChevronRight
} from 'lucide-react';
import { AttachmentManager } from './AttachmentManager';
import { VoiceRecorder } from './VoiceRecorder';
import { EditorSuggestions } from './EditorSuggestions';
import type { SuggestionType } from './EditorSuggestions';
import { NoteOutline } from './NoteOutline';
import { NoteTabs } from './NoteTabs';
import { FindReplaceBar } from './FindReplaceBar';
import { DrawingCanvasModal } from './DrawingCanvasModal';
import { ExportModal } from './ExportModal';
import { BookPageNavigator } from './BookPageNavigator';
import { MathRenderer } from './MathRenderer';
import { MermaidRenderer } from './MermaidRenderer';
import { LockNoteModal } from './LockNoteModal';
import { Button } from './ui/Button';
import { NOTE_TEMPLATES } from '../services/templates';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { InteractiveTable } from './editor/InteractiveTable';
import { InteractiveTasks, type TaskItem } from './editor/InteractiveTasks';
import { WrappedImage, type ImageAlignMode, type ImageSizeMode } from './editor/WrappedImage';
import { InsertImageModal } from './editor/InsertImageModal';
import { LinkInsertModal } from './editor/LinkInsertModal';
import { MermaidEditorModal } from './editor/MermaidEditorModal';
import { scanTextToDiagram } from '../services/textToDiagram';
import { FloatingBubbleToolbar, type FloatingBubblePosition } from './editor/FloatingBubbleToolbar';
import { BlockActionsMenu } from './editor/BlockActionsMenu';
import { VideoEmbedModal } from './editor/VideoEmbedModal';

interface NoteEditorProps {
  note: Note | null;
  folders: FolderType[];
  allNotes: Note[];
  books: Book[];
  activeWorkspace?: Workspace;
  openNoteIds: string[];
  activeNoteId: string | null;
  isMicEnabled: boolean;
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (noteId: string) => void; // Soft-delete to Trash
  onRestoreNote: (noteId: string) => void;
  onPermanentDeleteNote: (noteId: string) => void;
  onToggleArchiveNote: (noteId: string) => void;
  onAddPageToBook: (bookId: string) => void;
  onNavigateToNote: (noteTitle: string) => void;
  onBackMobile: () => void;
  isSplitView?: boolean;
  onCloseSplit?: () => void;
  onOpenSplit?: (noteId: string) => void;
  onCloseNote?: () => void;
  onDuplicateNote?: (note: Note) => void;
  onMoveNote?: (noteId: string, folderId: string | null, bookId: string | null) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  folders,
  allNotes,
  books,
  activeWorkspace,
  openNoteIds,
  activeNoteId,
  isMicEnabled,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isZenMode,
  onToggleZenMode,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentDeleteNote,
  onToggleArchiveNote,
  onAddPageToBook,
  onNavigateToNote,
  onBackMobile,
  isSplitView = false,
  onCloseSplit,
  onOpenSplit,
  onCloseNote,
  onDuplicateNote,
  onMoveNote
}) => {
  const [mode, setMode] = useState<'live' | 'split' | 'source'>('live');
  const [isInsertImageOpen, setIsInsertImageOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const [cryptoModalMode, setCryptoModalMode] = useState<'lock' | 'unlock'>('lock');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveFolderChoice, setMoveFolderChoice] = useState<string>('');
  const [moveBookChoice, setMoveBookChoice] = useState<string>('');

  // Smart Link & Mermaid Studio Modal states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInitialText, setLinkInitialText] = useState('');
  const [isMermaidModalOpen, setIsMermaidModalOpen] = useState(false);
  const [mermaidInitialCode, setMermaidInitialCode] = useState('');
  const [activeMermaidBlock, setActiveMermaidBlock] = useState<{ startLine: number; endLine: number } | null>(null);

  // Video Embed Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Typography settings (RoosterJS / SunEditor)
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');

  // Floating Contextual Bubble Toolbar state (Froala / Editor.js)
  const [bubblePosition, setBubblePosition] = useState<FloatingBubblePosition>({
    top: 0,
    left: 0,
    visible: false
  });
  const [activeSelectionRange, setActiveSelectionRange] = useState<{ start: number; end: number; selectedText: string } | null>(null);

  useEffect(() => {
    if (note) {
      setMoveFolderChoice(note.folderId || '');
      setMoveBookChoice(note.bookId || '');
    }
  }, [note?.id, note?.folderId, note?.bookId]);

  // Suggestions state (Slash command & Wiki-link)
  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    type: SuggestionType;
    query: string;
    position: { top: number; left: number };
    triggerIndex: number;
  }>({
    isOpen: false,
    type: 'slash',
    query: '',
    position: { top: 0, left: 0 },
    triggerIndex: 0
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Cmd+F for in-note search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindReplaceOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selection change listener for Floating Bubble Toolbar (Froala / RoosterJS / Editor.js)
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Ensure selection is inside our note editor pane and not in tabs, headers, or toolbars
      const editorPane = document.querySelector('.note-editor-pane');
      const anchorNode = selection.anchorNode;
      if (!editorPane || !anchorNode || !editorPane.contains(anchorNode)) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Ignore selections in tab bar, header bar, breadcrumbs, or toolbar buttons
      const anchorEl = anchorNode instanceof HTMLElement ? anchorNode : anchorNode.parentElement;
      if (anchorEl?.closest('.note-tabs-bar, .editor-header-bar, .editor-toolbar, .editor-tags-bar, .split-wm-toolbar')) {
        setBubblePosition((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Calculate bounding rect
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBubblePosition({
          top: rect.top,
          left: rect.left + rect.width / 2 - 120,
          visible: true
        });

        // If in textarea mode, track cursor start/end
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          setActiveSelectionRange({ start, end, selectedText: text });
        } else {
          setActiveSelectionRange({ start: -1, end: -1, selectedText: text });
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  if (!note) {
    return (
      <main className="note-editor-pane">
        <div className="empty-state">
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Select a note to view or create a new one
          </p>
        </div>
      </main>
    );
  }

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      title: e.target.value,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle content change & Slash / Wiki-link triggers
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (note.isTrashed) return;
    const newContent = e.target.value;
    const cursor = e.target.selectionStart;

    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    // Check for Slash Command '/' or '[['
    const textBeforeCursor = newContent.slice(0, cursor);
    const lastSlash = textBeforeCursor.lastIndexOf('/');
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');

    if (lastDoubleBracket !== -1 && lastDoubleBracket > lastSlash && !textBeforeCursor.slice(lastDoubleBracket).includes(']]')) {
      const query = textBeforeCursor.slice(lastDoubleBracket + 2);
      const rect = e.target.getBoundingClientRect();
      setSuggestionState({
        isOpen: true,
        type: 'wikilink',
        query,
        position: { top: rect.top + 80, left: rect.left + 40 },
        triggerIndex: lastDoubleBracket
      });
      return;
    }

    if (lastSlash !== -1 && (lastSlash === 0 || textBeforeCursor[lastSlash - 1] === '\n' || textBeforeCursor[lastSlash - 1] === ' ')) {
      const query = textBeforeCursor.slice(lastSlash + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        const rect = e.target.getBoundingClientRect();
        setSuggestionState({
          isOpen: true,
          type: 'slash',
          query,
          position: { top: rect.top + 80, left: rect.left + 40 },
          triggerIndex: lastSlash
        });
        return;
      }
    }

    if (suggestionState.isOpen) {
      setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Handle folder change
  const handleFolderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      folderId: e.target.value || null,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle book assignment
  const handleBookChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (note.isTrashed) return;
    const chosenBookId = e.target.value || null;
    const pages = allNotes.filter((n) => n.bookId === chosenBookId);
    onUpdateNote({
      ...note,
      bookId: chosenBookId,
      pageOrder: chosenBookId ? pages.length + 1 : undefined,
      updatedAt: new Date().toISOString()
    });
  };

  // Tag Management
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (note.isTrashed) return;
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!note.tags.includes(cleanTag)) {
        onUpdateNote({
          ...note,
          tags: [...note.tags, cleanTag],
          updatedAt: new Date().toISOString()
        });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString()
    });
  };

  // Markdown Formatting Helper
  const insertFormatting = (prefix: string, suffix = '') => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (!textarea) {
      let textToAppend = '';
      if (prefix.startsWith('```mermaid')) {
        textToAppend = `\n\n${prefix}\n`;
      } else if (prefix === '- [ ] ') {
        textToAppend = `\n\n- [ ] New Checklist Item\n`;
      } else if (prefix.includes('|')) {
        textToAppend = `\n${prefix}\n`;
      } else if (prefix === '[[') {
        textToAppend = ` [[New Note]] `;
      } else {
        textToAppend = `\n\n${prefix}Text${suffix}\n`;
      }
      onUpdateNote({
        ...note,
        content: (note.content ? note.content + textToAppend : textToAppend).trim(),
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = note.content;
    const selectedText = currentText.substring(start, end);

    let replacement = '';
    if (prefix === '- [ ] ') {
      replacement = `\n- [ ] ${selectedText || 'Task item'}\n`;
    } else if (prefix === '[[') {
      replacement = `[[${selectedText || 'Note Title'}]]`;
    } else {
      replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    }

    const newContent = currentText.substring(0, start) + replacement + currentText.substring(end);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 10);
  };

  // Floating Bubble Formatting Action Handler (Froala / Quill / SunEditor / RoosterJS)
  const handleApplyBubbleFormat = (formatType: string, value?: string) => {
    if (note.isTrashed) return;
    const selectedText = activeSelectionRange?.selectedText || '';

    let prefix = '';
    let suffix = '';

    switch (formatType) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'strikethrough':
        prefix = '~~';
        suffix = '~~';
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      case 'highlight':
        prefix = value ? `<mark style="background-color: ${value}; padding: 1px 4px; border-radius: 3px;">` : '<mark>';
        suffix = '</mark>';
        break;
      case 'color':
        prefix = `<span style="color: ${value || 'inherit'};">`;
        suffix = '</span>';
        break;
      case 'superscript':
        prefix = '<sup>';
        suffix = '</sup>';
        break;
      case 'subscript':
        prefix = '<sub>';
        suffix = '</sub>';
        break;
      case 'kbd':
        prefix = '<kbd>';
        suffix = '</kbd>';
        break;
      case 'link':
        setLinkInitialText(selectedText);
        setIsLinkModalOpen(true);
        setBubblePosition((prev) => ({ ...prev, visible: false }));
        return;
      case 'align-left':
        prefix = '\n<div align="left">\n';
        suffix = '\n</div>\n';
        break;
      case 'align-center':
        prefix = '\n<div align="center">\n';
        suffix = '\n</div>\n';
        break;
      case 'align-right':
        prefix = '\n<div align="right">\n';
        suffix = '\n</div>\n';
        break;
      default:
        break;
    }

    if (activeSelectionRange && activeSelectionRange.start !== -1 && textareaRef.current) {
      // Direct textarea replacement
      const { start, end } = activeSelectionRange;
      const current = note.content;
      const targetText = current.substring(start, end) || selectedText;
      const replaced = `${prefix}${targetText}${suffix}`;
      const newContent = current.substring(0, start) + replaced + current.substring(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else if (selectedText) {
      // Live preview DOM selection replacement
      const current = note.content;
      const idx = current.indexOf(selectedText);
      if (idx !== -1) {
        const replaced = `${prefix}${selectedText}${suffix}`;
        const newContent = current.slice(0, idx) + replaced + current.slice(idx + selectedText.length);
        onUpdateNote({
          ...note,
          content: newContent,
          updatedAt: new Date().toISOString()
        });
      }
    }

    setBubblePosition((prev) => ({ ...prev, visible: false }));
  };

  // Editor.js-Style Block Actions (Move, Duplicate, Delete, Convert)
  const handleMoveBlock = (startLine: number, endLine: number, direction: 'up' | 'down') => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const blockCount = endLine - startLine + 1;
    const blockLines = lines.splice(startLine, blockCount);

    if (direction === 'up' && startLine > 0) {
      let targetIdx = startLine - 1;
      while (targetIdx > 0 && lines[targetIdx].trim() === '') {
        targetIdx--;
      }
      lines.splice(targetIdx, 0, ...blockLines);
    } else if (direction === 'down' && startLine < lines.length) {
      let targetIdx = startLine + 1;
      while (targetIdx < lines.length && lines[targetIdx].trim() === '') {
        targetIdx++;
      }
      lines.splice(Math.min(targetIdx + 1, lines.length), 0, ...blockLines);
    } else {
      // Re-insert if unable to move
      lines.splice(startLine, 0, ...blockLines);
      return;
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDuplicateBlock = (startLine: number, endLine: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const blockLines = lines.slice(startLine, endLine + 1);
    lines.splice(endLine + 1, 0, ...blockLines);

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteBlock = (startLine: number, endLine: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    lines.splice(startLine, endLine - startLine + 1);

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleConvertBlockType = (startLine: number, endLine: number, newType: string) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    for (let i = startLine; i <= endLine; i++) {
      const raw = lines[i];
      // strip existing prefixes
      const clean = raw
        .replace(/^#+\s*/, '')
        .replace(/^-\s\[[ x]\]\s*/, '')
        .replace(/^-\s*/, '')
        .replace(/^>\s*/, '');

      switch (newType) {
        case 'h1':
          lines[i] = `# ${clean}`;
          break;
        case 'h2':
          lines[i] = `## ${clean}`;
          break;
        case 'h3':
          lines[i] = `### ${clean}`;
          break;
        case 'task':
          lines[i] = `- [ ] ${clean}`;
          break;
        case 'list':
          lines[i] = `- ${clean}`;
          break;
        case 'quote':
          lines[i] = `> ${clean}`;
          break;
        case 'callout':
          lines[i] = `> [!NOTE]\n> ${clean}`;
          break;
        case 'paragraph':
        default:
          lines[i] = clean;
          break;
      }
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Insert Template into Note
  const handleInsertTemplate = (templateContent: string) => {
    if (note.isTrashed) return;
    const newContent = note.content ? `${note.content}\n\n${templateContent}` : templateContent;
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });
    setIsTemplateMenuOpen(false);
  };

  // Handle Slash Command Selection
  const handleSelectSlashCommand = (snippet: string) => {
    const textarea = textareaRef.current;
    const currentText = note.content;
    const triggerIdx = suggestionState.triggerIndex;
    const cursor = textarea?.selectionStart || triggerIdx + 1;

    const newContent = currentText.slice(0, triggerIdx) + snippet + currentText.slice(cursor);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextCursor = triggerIdx + snippet.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  // Handle Wiki-Link Selection
  const handleSelectWikiLink = (noteTitle: string) => {
    const textarea = textareaRef.current;
    const currentText = note.content;
    const triggerIdx = suggestionState.triggerIndex;
    const cursor = textarea?.selectionStart || triggerIdx + 2;

    const replacement = `[[${noteTitle}]] `;
    const newContent = currentText.slice(0, triggerIdx) + replacement + currentText.slice(cursor);
    onUpdateNote({
      ...note,
      content: newContent,
      updatedAt: new Date().toISOString()
    });

    setSuggestionState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextCursor = triggerIdx + replacement.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
      }
    }, 10);
  };

  // Checkbox toggle in interactive preview mode
  const handleToggleChecklist = (lineIndex: number) => {
    if (note.isTrashed) return;
    const lines = note.content.split('\n');
    const targetLine = lines[lineIndex];

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]')) {
      lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Table update handler
  const handleUpdateTableLines = (startIndex: number, oldLength: number, newLines: string[]) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(startIndex, oldLength, ...newLines);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Task add & delete handlers
  const handleAddTask = (afterLineIndex: number, taskText: string) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(afterLineIndex + 1, 0, `- [ ] ${taskText}`);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteTask = (lineIndex: number) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    allLines.splice(lineIndex, 1);
    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Image properties updater (alignment, size, custom pixel width)
  const handleUpdateImageProps = (
    lineIndex: number, 
    newAlign: ImageAlignMode, 
    newSize: ImageSizeMode, 
    customWidth?: number
  ) => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    const line = allLines[lineIndex] || '';
    const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (match) {
      const rawAlt = match[1];
      const cleanAlt = rawAlt.split('|')[0].trim();
      const url = match[2];
      let meta = `${cleanAlt}|${newAlign}|${newSize}`;
      if (newSize === 'custom' && customWidth) {
        meta += `|${customWidth}px`;
      }
      allLines[lineIndex] = `![${meta}](${url})`;
      onUpdateNote({
        ...note,
        content: allLines.join('\n'),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Move image up or down across paragraphs
  const handleMoveImage = (lineIndex: number, direction: 'up' | 'down') => {
    if (note.isTrashed) return;
    const allLines = note.content.split('\n');
    const targetLine = allLines[lineIndex];
    if (!targetLine) return;

    if (direction === 'up' && lineIndex > 0) {
      let prevIdx = lineIndex - 1;
      while (prevIdx > 0 && allLines[prevIdx].trim() === '') {
        prevIdx--;
      }
      allLines.splice(lineIndex, 1);
      allLines.splice(prevIdx, 0, targetLine);
    } else if (direction === 'down' && lineIndex < allLines.length - 1) {
      let nextIdx = lineIndex + 1;
      while (nextIdx < allLines.length - 1 && allLines[nextIdx].trim() === '') {
        nextIdx++;
      }
      allLines.splice(lineIndex, 1);
      allLines.splice(nextIdx, 0, targetLine);
    }

    onUpdateNote({
      ...note,
      content: allLines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Diagram Toolbar & Scanner Handler
  const handleToolbarDiagramClick = () => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    let selected = '';
    if (textarea) {
      selected = note.content.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }

    if (selected) {
      const result = scanTextToDiagram(selected);
      setMermaidInitialCode(result.chartCode);
    } else {
      setMermaidInitialCode('');
    }
    setActiveMermaidBlock(null);
    setIsMermaidModalOpen(true);
  };

  // Save Diagram (either insert new block or update existing block)
  const handleSaveMermaidDiagram = (chartCode: string) => {
    if (note.isTrashed) return;

    // Case 1: Editing existing block in note
    if (activeMermaidBlock) {
      const { startLine, endLine } = activeMermaidBlock;
      const allLines = note.content.split('\n');
      allLines.splice(startLine + 1, endLine - startLine - 1, ...chartCode.split('\n'));
      onUpdateNote({
        ...note,
        content: allLines.join('\n'),
        updatedAt: new Date().toISOString()
      });
      setActiveMermaidBlock(null);
      return;
    }

    // Case 2: Inserting new diagram at cursor position
    const textarea = textareaRef.current;
    const block = `\n\`\`\`mermaid\n${chartCode}\n\`\`\`\n`;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + block + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + block,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Smart Link Toolbar Handler
  const handleToolbarLinkClick = () => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    let selected = '';
    if (textarea) {
      selected = note.content.slice(textarea.selectionStart, textarea.selectionEnd).trim();
    }
    setLinkInitialText(selected);
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = (markdownLink: string) => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + markdownLink + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + ' ' + markdownLink,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Insert image tag handler
  const handleInsertImageTag = (tag: string) => {
    if (note.isTrashed) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = note.content.slice(0, start) + '\n' + tag + '\n' + note.content.slice(end);
      onUpdateNote({
        ...note,
        content: newContent,
        updatedAt: new Date().toISOString()
      });
    } else {
      onUpdateNote({
        ...note,
        content: note.content + '\n\n' + tag,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Attachment operations
  const handleAddAttachment = (att: Attachment) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      attachments: [...(note.attachments || []), att],
      updatedAt: new Date().toISOString()
    });
  };

  const handleDeleteAttachment = (attId: string) => {
    if (note.isTrashed) return;
    onUpdateNote({
      ...note,
      attachments: note.attachments.filter((a) => a.id !== attId),
      updatedAt: new Date().toISOString()
    });
  };

  // Scroll to heading from Outline
  const handleScrollToHeading = (lineIndex: number) => {
    const headingEl = document.getElementById(`heading-${lineIndex}`);
    if (headingEl) {
      headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (textareaRef.current && (mode === 'source' || mode === 'split')) {
      const lines = note.content.split('\n');
      let charCount = 0;
      for (let i = 0; i < lineIndex; i++) {
        charCount += lines[i].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(charCount, charCount + (lines[lineIndex]?.length || 0));
    }
  };

  // Copy Code snippet helper
  const handleCopyCode = (codeText: string, blockId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(blockId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Calculate Backlinks
  const currentTitleClean = note.title.trim().toLowerCase();
  const backlinks = allNotes.filter((otherNote) => {
    if (otherNote.id === note.id || otherNote.isTrashed) return false;
    const pattern = `[[${currentTitleClean}]]`;
    return otherNote.content.toLowerCase().includes(pattern);
  });

  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
  const charCount = note.content.length;

  // Book pages lookup
  const currentBook = note.bookId ? books.find((b) => b.id === note.bookId) : null;
  const allBookPages = note.bookId ? allNotes.filter((n) => n.bookId === note.bookId && !n.isTrashed) : [];

  // Custom Markdown Parser
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    let insideCodeBlock = false;
    let codeLanguage = 'code';
    let codeBuffer: string[] = [];

    let insideTable = false;
    let tableStartIndex = 0;
    let tableBuffer: string[] = [];

    let insideCallout = false;
    let calloutType: 'note' | 'tip' | 'warning' | 'important' = 'note';
    let calloutBuffer: string[] = [];

    let insideTasks = false;
    let taskBuffer: TaskItem[] = [];

    const elements: React.ReactNode[] = [];

    const parseInlineSpans = (str: string) => {
      // Regex splitting on WikiLinks, LaTeX, Highlights, Del/Strikethrough, Sub/Sup, Underline, Kbd, and HTML tags
      const parts = str.split(/(\[\[.*?\]\]|\$[^$]+\$|==.*?==|~~.*?~~|<mark[\s\S]*?<\/mark>|<kbd>.*?<\/kbd>|<sub>.*?<\/sub>|<sup>.*?<\/sup>|<u>.*?<\/u>|<span[\s\S]*?<\/span>)/g);
      return parts.map((part, i) => {
        if (!part) return null;

        // Wiki-link
        if (part.startsWith('[[') && part.endsWith(']]')) {
          const targetTitle = part.slice(2, -2).trim();
          return (
            <button
              key={i}
              className="wiki-link"
              onClick={() => onNavigateToNote(targetTitle)}
              title={`Jump to note: ${targetTitle}`}
            >
              <Link size={11} />
              <span>{targetTitle}</span>
            </button>
          );
        }

        // Inline LaTeX Math
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const mathExpr = part.slice(1, -1);
          return <MathRenderer key={i} math={mathExpr} />;
        }

        // Markdown Highlight ==text==
        if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
          const textContent = part.slice(2, -2);
          return (
            <mark key={i} className="editor-text-highlight">
              {textContent}
            </mark>
          );
        }

        // Markdown Strikethrough ~~text~~
        if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
          const textContent = part.slice(2, -2);
          return <del key={i}>{textContent}</del>;
        }

        // HTML <mark ...>...</mark>
        if (part.startsWith('<mark') && part.endsWith('</mark>')) {
          const innerMatch = part.match(/<mark(?:\s+style="([^"]*)")?>(.*?)<\/mark>/i);
          if (innerMatch) {
            const inlineStyle = innerMatch[1];
            const textContent = innerMatch[2];
            return (
              <mark
                key={i}
                className="editor-text-highlight"
                style={inlineStyle ? { backgroundColor: inlineStyle.replace(/.*background-color:\s*([^;]+).*/, '$1') } : {}}
              >
                {textContent}
              </mark>
            );
          }
        }

        // HTML <kbd>...</kbd>
        if (part.startsWith('<kbd>') && part.endsWith('</kbd>')) {
          return <kbd key={i} className="editor-inline-kbd">{part.slice(5, -6)}</kbd>;
        }

        // HTML <sub>...</sub>
        if (part.startsWith('<sub>') && part.endsWith('</sub>')) {
          return <sub key={i}>{part.slice(5, -6)}</sub>;
        }

        // HTML <sup>...</sup>
        if (part.startsWith('<sup>') && part.endsWith('</sup>')) {
          return <sup key={i}>{part.slice(5, -6)}</sup>;
        }

        // HTML <u>...</u>
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
          return <u key={i}>{part.slice(3, -4)}</u>;
        }

        // HTML <span style="...">...</span>
        if (part.startsWith('<span') && part.endsWith('</span>')) {
          const spanMatch = part.match(/<span(?:\s+style="([^"]*)")?>(.*?)<\/span>/i);
          if (spanMatch) {
            const inlineStyle = spanMatch[1] || '';
            const textContent = spanMatch[2];
            const colorMatch = inlineStyle.match(/color:\s*([^;]+)/i);
            const colorHex = colorMatch ? colorMatch[1].trim() : undefined;
            return (
              <span key={i} style={{ color: colorHex }}>
                {textContent}
              </span>
            );
          }
        }

        return <span key={i}>{part}</span>;
      });
    };

    const flushTable = (keyIdx: number) => {
      if (tableBuffer.length < 2) {
        tableBuffer = [];
        insideTable = false;
        return;
      }
      elements.push(
        <div key={`table-wrap-${keyIdx}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{
              startLine: tableStartIndex,
              endLine: tableStartIndex + tableBuffer.length - 1,
              blockType: 'table',
              rawContent: tableBuffer.join('\n')
            }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <div className="editorjs-block-content">
            <InteractiveTable
              tableLines={tableBuffer}
              startIndex={tableStartIndex}
              onUpdateTableLines={handleUpdateTableLines}
              isReadOnly={note.isTrashed}
            />
          </div>
        </div>
      );
      tableBuffer = [];
      insideTable = false;
    };

    const flushTasks = (keyIdx: number) => {
      if (taskBuffer.length === 0) return;
      const startLine = taskBuffer[0].lineIndex;
      const endLine = taskBuffer[taskBuffer.length - 1].lineIndex;
      elements.push(
        <div key={`tasks-wrap-${keyIdx}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{
              startLine,
              endLine,
              blockType: 'task',
              rawContent: taskBuffer.map(t => `- [${t.isCompleted ? 'x' : ' '}] ${t.text}`).join('\n')
            }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <div className="editorjs-block-content">
            <InteractiveTasks
              tasks={[...taskBuffer]}
              onToggleTask={handleToggleChecklist}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              isReadOnly={note.isTrashed}
            />
          </div>
        </div>
      );
      taskBuffer = [];
      insideTasks = false;
    };

    const flushCallout = (keyIdx: number) => {
      const iconMap = {
        note: <Info size={16} color="var(--color-info)" />,
        tip: <Lightbulb size={16} color="var(--color-success)" />,
        warning: <AlertTriangle size={16} color="var(--color-warning)" />,
        important: <Zap size={16} color="var(--color-purple)" />
      };

      elements.push(
        <div key={`callout-${keyIdx}`} className="editorjs-block-row">
          <div className={`callout-box callout-${calloutType} editorjs-block-content`}>
            <div className="callout-title-row">
              {iconMap[calloutType]}
              <span>{calloutType.toUpperCase()}</span>
            </div>
            <div className="callout-content-text">
              {calloutBuffer.map((line, idx) => (
                <p key={idx}>{parseInlineSpans(line)}</p>
              ))}
            </div>
          </div>
        </div>
      );
      calloutBuffer = [];
      insideCallout = false;
    };

    let codeBlockStartIndex = 0;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // Code Block parsing
      if (line.startsWith('```')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        if (insideCodeBlock) {
          const codeText = codeBuffer.join('\n');
          const blockId = `code-block-${index}`;
          const isCopied = copiedCodeId === blockId;

          // Mermaid Diagram with interactive Edit callback
          if (codeLanguage === 'mermaid') {
            const startLine = codeBlockStartIndex;
            const endLine = index;
            elements.push(
              <MermaidRenderer 
                key={blockId} 
                chart={codeText} 
                id={blockId}
                onEditChart={(newChart) => {
                  setActiveMermaidBlock({ startLine, endLine });
                  setMermaidInitialCode(newChart);
                  setIsMermaidModalOpen(true);
                }}
              />
            );
          } else if (codeLanguage === 'math' || codeLanguage === 'latex') {
            elements.push(
              <MathRenderer key={blockId} math={codeText} block />
            );
          } else {
            elements.push(
              <div key={blockId} className="editorjs-block-row">
                <BlockActionsMenu
                  target={{
                    startLine: codeBlockStartIndex,
                    endLine: index,
                    blockType: 'code',
                    rawContent: codeText
                  }}
                  onMoveBlock={handleMoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onConvertBlockType={handleConvertBlockType}
                  isReadOnly={note.isTrashed}
                />
                <div className="code-block-container editorjs-block-content">
                  <div className="code-block-header">
                    <span>{codeLanguage || 'code'}</span>
                    <button 
                      className="btn-copy-code"
                      onClick={() => handleCopyCode(codeText, blockId)}
                      title="Copy code to clipboard"
                    >
                      {isCopied ? <Check size={12} color="var(--color-success)" /> : <Copy size={12} />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre style={{ margin: 0, padding: '12px 14px' }}>
                    <code>{codeText}</code>
                  </pre>
                </div>
              </div>
            );
          }
          codeBuffer = [];
          insideCodeBlock = false;
        } else {
          insideCodeBlock = true;
          codeBlockStartIndex = index;
          codeLanguage = line.slice(3).trim().toLowerCase() || 'code';
        }
        continue;
      }

      if (insideCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Standalone Block Math ($$ ... $$)
      if (line.startsWith('$$') && line.endsWith('$$') && line.length > 4) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        elements.push(
          <MathRenderer key={`math-block-${index}`} math={line.slice(2, -2)} block />
        );
        continue;
      }

      // Embedded Video Card / iFrame detection (<div class="embedded-video-card"> or <video ...>)
      if (line.includes('embedded-video-card') || line.includes('<video controls')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        // Gather HTML until closing tag
        let videoHtml = line;
        let endIdx = index;
        if (!line.includes('</div>') && !line.includes('</video>')) {
          while (endIdx + 1 < lines.length && !lines[endIdx].includes('</div>') && !lines[endIdx].includes('</video>')) {
            endIdx++;
            videoHtml += '\n' + lines[endIdx];
          }
          index = endIdx;
        }

        elements.push(
          <div 
            key={`video-${index}`} 
            className="editor-embedded-video-wrapper"
            dangerouslySetInnerHTML={{ __html: videoHtml }} 
          />
        );
        continue;
      }

      // Collapsible / Spoiler Details (<details><summary>...</summary>...)
      if (line.startsWith('<details>')) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        let detailsContent: string[] = [];
        let endIdx = index + 1;
        while (endIdx < lines.length && !lines[endIdx].includes('</details>')) {
          detailsContent.push(lines[endIdx]);
          endIdx++;
        }
        index = endIdx;

        let summaryText = 'Click to expand';
        if (detailsContent[0]?.startsWith('<summary>')) {
          summaryText = detailsContent[0].replace(/<\/?summary>/g, '').trim();
          detailsContent.shift();
        }

        elements.push(
          <details key={`details-${index}`} className="editor-collapsible-spoiler">
            <summary className="spoiler-summary">
              <ChevronRight size={14} className="summary-chevron" />
              <span>{summaryText}</span>
            </summary>
            <div className="spoiler-body">
              {renderMarkdownPreview(detailsContent.join('\n'))}
            </div>
          </details>
        );
        continue;
      }

      // Image with optional text wrap & sizing: ![caption|align|size|width](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        if (insideTable) flushTable(index);
        if (insideCallout) flushCallout(index);
        if (insideTasks) flushTasks(index);

        const rawAlt = imgMatch[1];
        const url = imgMatch[2];
        let align: ImageAlignMode = 'center';
        let size: ImageSizeMode = 'normal';
        let customWidth: number | undefined = undefined;
        let caption = rawAlt;

        if (rawAlt.includes('|')) {
          const parts = rawAlt.split('|');
          caption = parts[0].trim();
          for (let p = 1; p < parts.length; p++) {
            const part = parts[p].trim().toLowerCase();
            if (['left', 'right', 'center', 'full'].includes(part)) {
              align = part as ImageAlignMode;
            } else if (['small', 'normal', 'large', 'original', 'custom'].includes(part)) {
              size = part as ImageSizeMode;
            } else if (part.endsWith('px')) {
              customWidth = parseInt(part, 10) || undefined;
              if (customWidth) size = 'custom';
            }
          }
        }

        elements.push(
          <div key={`img-wrap-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{
                startLine: index,
                endLine: index,
                blockType: 'image',
                rawContent: line
              }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <div className="editorjs-block-content" style={{ width: '100%' }}>
              <WrappedImage
                src={url}
                alt={caption}
                align={align}
                size={size}
                customWidth={customWidth}
                lineIndex={index}
                onUpdateImageProps={handleUpdateImageProps}
                onMoveImage={handleMoveImage}
                isReadOnly={note.isTrashed}
              />
            </div>
          </div>
        );
        continue;
      }

      // Markdown Tables
      if (line.startsWith('|') && line.endsWith('|')) {
        if (insideTasks) flushTasks(index);
        if (!insideTable) {
          insideTable = true;
          tableStartIndex = index;
          tableBuffer = [];
        }
        tableBuffer.push(line);
        continue;
      } else if (insideTable) {
        flushTable(index);
      }

      // Callout Boxes (> [!NOTE])
      const calloutMatch = line.match(/^>\s\[!(NOTE|TIP|WARNING|IMPORTANT)\]/i);
      if (calloutMatch) {
        if (insideTasks) flushTasks(index);
        if (insideCallout) flushCallout(index);
        insideCallout = true;
        calloutType = calloutMatch[1].toLowerCase() as any;
        continue;
      }

      if (insideCallout) {
        if (line.startsWith('>')) {
          calloutBuffer.push(line.replace(/^>\s?/, ''));
          continue;
        } else {
          flushCallout(index);
        }
      }

      // Interactive Tasks / Checklists: - [ ] or - [x]
      const checkMatch = line.match(/^-\s\[([ x])\]\s(.*)/);
      if (checkMatch) {
        if (!insideTasks) {
          insideTasks = true;
          taskBuffer = [];
        }
        const isCompleted = checkMatch[1] === 'x';
        const itemText = checkMatch[2];
        taskBuffer.push({ lineIndex: index, text: itemText, isCompleted });
        continue;
      } else if (insideTasks) {
        flushTasks(index);
      }

      // Center-aligned div wrapper
      if (line.startsWith('<div align="center">') || line.startsWith('<div align="right">')) {
        const alignMode = line.includes('center') ? 'center' : 'right';
        let innerCenterLines: string[] = [];
        let endIdx = index + 1;
        while (endIdx < lines.length && !lines[endIdx].includes('</div>')) {
          innerCenterLines.push(lines[endIdx]);
          endIdx++;
        }
        index = endIdx;
        elements.push(
          <div key={`align-${index}`} style={{ textAlign: alignMode, margin: '8px 0' }}>
            {renderMarkdownPreview(innerCenterLines.join('\n'))}
          </div>
        );
        continue;
      }

      // Headings with Editor.js Tune Handles
      if (line.startsWith('# ')) {
        elements.push(
          <div key={`h1-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading1', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h1 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(2))}</h1>
          </div>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <div key={`h2-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading2', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h2 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(3))}</h2>
          </div>
        );
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <div key={`h3-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'heading3', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <h3 id={`heading-${index}`} className="editorjs-block-content">{parseInlineSpans(line.slice(4))}</h3>
          </div>
        );
        continue;
      }

      if (line.startsWith('> ')) {
        elements.push(
          <div key={`quote-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'quote', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <blockquote className="editorjs-block-content">
              {parseInlineSpans(line.slice(2))}
            </blockquote>
          </div>
        );
        continue;
      }

      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${index}`} style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' }} />);
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={`ul-row-${index}`} className="editorjs-block-row">
            <BlockActionsMenu
              target={{ startLine: index, endLine: index, blockType: 'list', rawContent: line }}
              onMoveBlock={handleMoveBlock}
              onDuplicateBlock={handleDuplicateBlock}
              onDeleteBlock={handleDeleteBlock}
              onConvertBlockType={handleConvertBlockType}
              isReadOnly={note.isTrashed}
            />
            <ul className="editorjs-block-content" style={{ margin: '3px 0' }}>
              <li>{parseInlineSpans(line.slice(2))}</li>
            </ul>
          </div>
        );
        continue;
      }

      if (!line.trim()) {
        elements.push(<div key={`br-${index}`} style={{ height: '8px' }} />);
        continue;
      }

      // Paragraph with block handle
      elements.push(
        <div key={`p-row-${index}`} className="editorjs-block-row">
          <BlockActionsMenu
            target={{ startLine: index, endLine: index, blockType: 'paragraph', rawContent: line }}
            onMoveBlock={handleMoveBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onDeleteBlock={handleDeleteBlock}
            onConvertBlockType={handleConvertBlockType}
            isReadOnly={note.isTrashed}
          />
          <p className="editorjs-block-content">{parseInlineSpans(line)}</p>
        </div>
      );
    }

    if (insideTable) flushTable(lines.length);
    if (insideCallout) flushCallout(lines.length);
    if (insideTasks) flushTasks(lines.length);

    return elements;
  };

  return (
    <main className="note-editor-pane active-mobile selectable-text">
      {/* Mac-Style Note Tabs Bar with Inline Double-Click Rename */}
      <NoteTabs
        openNoteIds={openNoteIds}
        activeNoteId={activeNoteId}
        allNotes={allNotes}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
        onRenameTab={(noteId, newTitle) => {
          const target = allNotes.find((n) => n.id === noteId);
          if (target && !target.isTrashed) {
            onUpdateNote({
              ...target,
              title: newTitle,
              updatedAt: new Date().toISOString()
            });
          }
        }}
      />

      {/* Trash Recovery Warning Banner */}
      {note.isTrashed && (
        <div className="trash-warning-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} color="#ef4444" />
            <span>This note is in the Trash. Editing is disabled.</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-small-primary" 
              onClick={() => onRestoreNote(note.id)}
            >
              <RotateCcw size={12} />
              <span>Restore Note</span>
            </button>
            <button 
              className="btn-small-ghost danger"
              onClick={() => {
                if (confirm('Permanently delete this note? This action cannot be undone.')) {
                  onPermanentDeleteNote(note.id);
                }
              }}
            >
              Delete Forever
            </button>
          </div>
        </div>
      )}

      {/* In-Note Find & Replace Bar */}
      <FindReplaceBar
        isOpen={isFindReplaceOpen}
        content={note.content}
        onClose={() => setIsFindReplaceOpen(false)}
        onUpdateContent={(newContent) => {
          onUpdateNote({
            ...note,
            content: newContent,
            updatedAt: new Date().toISOString()
          });
        }}
      />

      {/* Top Header Bar */}
      <div className="editor-header-bar">
        <div className="editor-breadcrumb">
          <button 
            className="editor-icon-btn mobile-only" 
            onClick={onBackMobile}
            title="Back to notes list"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Folder Selector */}
          <FolderIcon size={14} color="var(--text-muted)" />
          <select 
            className="editor-folder-select"
            value={note.folderId || ''}
            onChange={handleFolderChange}
            disabled={note.isTrashed}
            title="Move note to folder"
          >
            <option value="">(No Folder / Root)</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          {/* Book / Chapter Selector */}
          <BookOpen size={14} color="var(--accent-primary)" style={{ marginLeft: '6px' }} />
          <select
            className="editor-folder-select"
            value={note.bookId || ''}
            onChange={handleBookChange}
            disabled={note.isTrashed}
            title="Organize note into a Book / Notebook"
          >
            <option value="">(Not in a Book)</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.icon} {b.title}</option>
            ))}
          </select>

          <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>
            {wordCount} words · {charCount} chars
          </span>
        </div>

        {/* Action Controls */}
        <div className="editor-header-actions">
          {/* Find in Note Trigger */}
          <button
            className={`editor-action-pill ${isFindReplaceOpen ? 'active' : ''}`}
            onClick={() => setIsFindReplaceOpen(!isFindReplaceOpen)}
            title="Find & Replace in note (Cmd+F)"
          >
            <Search size={14} />
            <span className="btn-label-text">Find</span>
          </button>

          {/* Apple Freehand Drawing Canvas Trigger */}
          <button
            className="editor-action-pill"
            onClick={() => setIsDrawingModalOpen(true)}
            disabled={note.isTrashed}
            title="Open Freehand Sketchpad"
          >
            <PenTool size={14} color="#8b5cf6" />
            <span className="btn-label-text">Draw</span>
          </button>

          {/* Table of Contents Outline Trigger */}
          <button
            className={`editor-action-pill ${isOutlineOpen ? 'active' : ''}`}
            onClick={() => setIsOutlineOpen(!isOutlineOpen)}
            title="Document Outline / Table of Contents"
          >
            <ListTree size={14} />
            <span className="btn-label-text">Outline</span>
          </button>

          {/* Direct Voice Recording Trigger (ONLY if mic enabled) */}
          {isMicEnabled && (
            <button
              className={`editor-action-pill ${isVoiceRecorderOpen ? 'active' : ''}`}
              onClick={() => setIsVoiceRecorderOpen(!isVoiceRecorderOpen)}
              disabled={note.isTrashed}
              title="Record voice memo"
            >
              <Mic size={14} color="#ef4444" />
              <span className="btn-label-text">Voice</span>
            </button>
          )}

          {/* Dual Split-View Trigger */}
          {onOpenSplit && !isSplitView && (
            <button
              type="button"
              className="editor-action-pill"
              onClick={() => onOpenSplit(note.id)}
              title="Open Split View (Side-by-Side)"
            >
              <Columns2 size={14} color="var(--accent-primary)" />
              <span className="btn-label-text">Split</span>
            </button>
          )}

          {isSplitView && onCloseSplit && (
            <button
              type="button"
              className="editor-action-pill danger"
              onClick={onCloseSplit}
              title="Close Split View"
            >
              <XCircle size={14} />
              <span className="btn-label-text">Exit Split</span>
            </button>
          )}

          {/* Duplicate Note Trigger */}
          {onDuplicateNote && (
            <button
              type="button"
              className="editor-icon-btn"
              onClick={() => onDuplicateNote(note)}
              title="Duplicate Note (Copy)"
            >
              <Copy size={15} />
            </button>
          )}

          {/* Move to Folder / Book Trigger */}
          {onMoveNote && (
            <button
              type="button"
              className="editor-icon-btn"
              onClick={() => setIsMoveModalOpen(true)}
              title="Move Note (Folder & Book Organizer)"
            >
              <Move size={15} />
            </button>
          )}

          {/* Omni-Format Presentable Export Trigger */}
          <button
            className="editor-action-pill"
            onClick={() => setIsExportModalOpen(true)}
            title="Export & Share (PDF, Image Card, HTML, Markdown)"
          >
            <Share2 size={14} color="var(--accent-primary)" />
            <span className="btn-label-text">Export</span>
          </button>

          {/* Archive / Unarchive Button */}
          <button
            className={`editor-icon-btn ${note.isArchived ? 'active' : ''}`}
            onClick={() => onToggleArchiveNote(note.id)}
            disabled={note.isTrashed}
            title={note.isArchived ? 'Unarchive note' : 'Archive note'}
          >
            <Archive size={15} color={note.isArchived ? '#8b5cf6' : undefined} />
          </button>

          {/* Zen Focus Mode Toggle */}
          <button
            className={`editor-icon-btn ${isZenMode ? 'active' : ''}`}
            onClick={onToggleZenMode}
            title={isZenMode ? 'Exit Zen Focus Mode' : 'Distraction-Free Zen Mode'}
          >
            {isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            className={`editor-icon-btn ${note.isPinned ? 'active' : ''}`}
            onClick={() => onUpdateNote({ ...note, isPinned: !note.isPinned })}
            disabled={note.isTrashed}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={15} />
          </button>

          <button
            className={`editor-icon-btn ${note.isFavorite ? 'active' : ''}`}
            onClick={() => onUpdateNote({ ...note, isFavorite: !note.isFavorite })}
            disabled={note.isTrashed}
            title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={15} fill={note.isFavorite ? '#f59e0b' : 'none'} />
          </button>

          {/* Zero-Knowledge Note Lock / Unlock */}
          <button
            className={`editor-icon-btn ${note.isLocked ? 'active-lock' : ''}`}
            onClick={() => {
              setCryptoModalMode(note.isLocked ? 'unlock' : 'lock');
              setIsCryptoModalOpen(true);
            }}
            disabled={note.isTrashed}
            title={note.isLocked ? 'Unlock Encrypted Note (AES-256-GCM)' : 'Encrypt & Lock Note (AES-256-GCM)'}
          >
            {note.isLocked ? <Lock size={15} color="var(--color-warning)" /> : <KeyRound size={15} />}
          </button>

          {/* Delete to Trash Button */}
          <button
            className="editor-icon-btn danger"
            onClick={() => onDeleteNote(note.id)}
            title={note.isTrashed ? 'Delete Forever' : 'Move note to Trash'}
          >
            <Trash2 size={15} />
          </button>

          {/* Exit Note Button */}
          {onCloseNote && (
            <button
              type="button"
              className="editor-icon-btn exit-btn"
              onClick={onCloseNote}
              title="Exit Note (Deselect and return to workspace)"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Formatting & View Mode Toolbar */}
      <div className="editor-toolbar">
        <button className="toolbar-btn" onClick={() => insertFormatting('# ')} disabled={note.isTrashed} title="Heading 1">
          <Heading1 size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('## ')} disabled={note.isTrashed} title="Heading 2">
          <Heading2 size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('### ')} disabled={note.isTrashed} title="Heading 3">
          <Heading3 size={14} />
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={() => insertFormatting('**', '**')} disabled={note.isTrashed} title="Bold (**text**)">
          <Bold size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('*', '*')} disabled={note.isTrashed} title="Italic (*text*)">
          <Italic size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('<u>', '</u>')} disabled={note.isTrashed} title="Underline (<u>text</u>)">
          <UnderlineIcon size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('~~', '~~')} disabled={note.isTrashed} title="Strikethrough (~~text~~)">
          <StrikethroughIcon size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('<mark>', '</mark>')} disabled={note.isTrashed} title="Highlight (<mark>text</mark>)">
          <HighlighterIcon size={14} color="#f59e0b" />
        </button>
        <div className="toolbar-divider" />
        {/* Font Family Selector (RoosterJS / SunEditor) */}
        <select 
          className="editor-font-select"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value as any)}
          title="Font Family"
        >
          <option value="sans">Sans (Inter)</option>
          <option value="serif">Serif (Editorial)</option>
          <option value="mono">Mono (Code)</option>
        </select>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={() => insertFormatting('- [ ] ')} disabled={note.isTrashed} title="Checklist item">
          <CheckSquare size={14} />
          <span>Task</span>
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('- ')} disabled={note.isTrashed} title="Bullet List">
          <List size={14} />
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('\n| Header 1 | Header 2 |\n| :--- | :--- |\n| Item 1 | Item 2 |\n\n')} disabled={note.isTrashed} title="Insert Table">
          <TableIcon size={14} />
          <span>Table</span>
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('> [!NOTE]\n> ')} disabled={note.isTrashed} title="Callout Card">
          <Info size={14} />
          <span>Callout</span>
        </button>
        <button className="toolbar-btn" onClick={() => insertFormatting('```typescript\n', '\n```')} disabled={note.isTrashed} title="Code Block">
          <Code size={14} />
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => insertFormatting('[[', ']]')} 
          disabled={note.isTrashed} 
          title="Internal Note Link ([[Wiki-Link]] to another note in your workspace)"
        >
          <Link size={14} />
          <span>[[Wiki]]</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleToolbarLinkClick} 
          disabled={note.isTrashed} 
          title="Insert Web Link (Dialog to enter URL & Title with smart website title derivation)"
        >
          <ExternalLink size={14} />
          <span>[Link]</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => insertFormatting('$$ ', ' $$')} 
          disabled={note.isTrashed} 
          title="LaTeX Math Formula ($$ Formula $$)"
        >
          <Sigma size={14} />
          <span>Math</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={handleToolbarDiagramClick} 
          disabled={note.isTrashed} 
          title="Interactive Mermaid Diagram Studio (Click to design or highlight text to auto-convert text to diagram)"
        >
          <GitBranch size={14} color="#8b5cf6" />
          <span>Diagram</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => setIsInsertImageOpen(true)} 
          disabled={note.isTrashed} 
          title="Insert Image with Text Wrapping & Pixel Width Control"
        >
          <ImageIcon size={14} color="var(--accent-primary)" />
          <span>Image</span>
        </button>
        <button 
          className="toolbar-btn" 
          onClick={() => setIsVideoModalOpen(true)} 
          disabled={note.isTrashed} 
          title="Embed Video (YouTube, Vimeo, HTML5 Video)"
        >
          <VideoIcon size={14} color="#ef4444" />
          <span>Video</span>
        </button>

        {/* Templates Dropdown Button */}
        <div style={{ position: 'relative' }}>
          <button 
            className="toolbar-btn" 
            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            disabled={note.isTrashed}
            title="Insert Note Template"
          >
            <LayoutTemplate size={14} color="var(--accent-primary)" />
            <span>Template</span>
            <ChevronDown size={11} />
          </button>

          {isTemplateMenuOpen && (
            <div 
              className="editor-suggestions-menu"
              style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '260px', zIndex: 60 }}
            >
              <div className="suggestion-menu-header">
                <span>Choose Template</span>
              </div>
              <div className="suggestion-items-list">
                {NOTE_TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id} 
                    className="suggestion-item"
                    onClick={() => handleInsertTemplate(tmpl.content)}
                  >
                    <div className="suggestion-item-icon">
                      <LayoutTemplate size={14} color="var(--accent-primary)" />
                    </div>
                    <div className="suggestion-item-text">
                      <span className="suggestion-item-title">{tmpl.name}</span>
                      <span className="suggestion-item-sub">{tmpl.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Selector: Live, Split, Markdown */}
        <div className="mode-toggle-group">
          <button 
            className={`mode-btn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
            title="Interactive Live Document (WYSIWYG)"
          >
            <Sparkles size={11} style={{ marginRight: '3px' }} />
            <span>Live</span>
          </button>
          <button 
            className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
            title="Side-by-Side Split View"
          >
            <Columns size={11} style={{ marginRight: '3px' }} />
            <span>Split</span>
          </button>
          <button 
            className={`mode-btn ${mode === 'source' ? 'active' : ''}`}
            onClick={() => setMode('source')}
            title="Raw Markdown Source Editor"
          >
            <Edit3 size={11} style={{ marginRight: '3px' }} />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* Voice Recorder Bar (if active and mic enabled) */}
      {isMicEnabled && (
        <VoiceRecorder
          isOpen={isVoiceRecorderOpen}
          onClose={() => setIsVoiceRecorderOpen(false)}
          onSaveVoiceNote={handleAddAttachment}
        />
      )}

      {/* Freehand Drawing Canvas Modal */}
      <DrawingCanvasModal
        isOpen={isDrawingModalOpen}
        onClose={() => setIsDrawingModalOpen(false)}
        onSaveDrawing={handleAddAttachment}
      />

      {/* Omni-Format Presentable Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        note={note}
        activeWorkspace={activeWorkspace}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Outline Drawer (Table of Contents) */}
      <NoteOutline
        content={note.content}
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        onScrollToHeading={handleScrollToHeading}
      />

      {/* Suggestions Popup (Slash & Wiki-link) */}
      {suggestionState.isOpen && (
        <EditorSuggestions
          type={suggestionState.type}
          query={suggestionState.query}
          allNotes={allNotes}
          position={suggestionState.position}
          isMicEnabled={isMicEnabled}
          onSelectSlashCommand={handleSelectSlashCommand}
          onSelectWikiLink={handleSelectWikiLink}
          onTriggerVoiceRecorder={() => {
            if (isMicEnabled) {
              setSuggestionState((prev) => ({ ...prev, isOpen: false }));
              setIsVoiceRecorderOpen(true);
            }
          }}
          onTriggerDrawing={() => {
            setSuggestionState((prev) => ({ ...prev, isOpen: false }));
            setIsDrawingModalOpen(true);
          }}
          onTriggerVideoEmbed={() => {
            setSuggestionState((prev) => ({ ...prev, isOpen: false }));
            setIsVideoModalOpen(true);
          }}
          onClose={() => setSuggestionState((prev) => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* Main Canvas Area: Locked State OR Single View OR Side-by-Side Split View */}
      {note.isLocked ? (
        <div className="locked-note-view">
          <div className="locked-note-card">
            <div className="locked-note-shield">
              <Lock size={44} color="var(--color-warning)" />
            </div>
            <h2>Protected Note</h2>
            <p className="locked-note-desc">
              This note is encrypted with zero-knowledge <strong>AES-256-GCM</strong> authenticated encryption.
              Plaintext is withheld from persistent storage until unlocked with your passphrase.
            </p>

            {note.encryptedData?.hint && (
              <div className="locked-note-hint">
                <span>Hint: <strong>{note.encryptedData.hint}</strong></span>
              </div>
            )}

            <div className="locked-note-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setCryptoModalMode('unlock');
                  setIsCryptoModalOpen(true);
                }}
                leftIcon={<Unlock size={18} />}
              >
                Unlock Note
              </Button>
            </div>

            <div className="locked-note-specs">
              <span>PBKDF2-SHA256 (600K iterations)</span>
              <span>•</span>
              <span>AES-256-GCM AEAD Tag</span>
              <span>•</span>
              <span>Anti-MITM Bound</span>
            </div>
          </div>
        </div>
      ) : mode === 'split' ? (
        <div className="split-view-container">
          {/* Left Pane: Raw Markdown Editor */}
          <div className="split-pane-editor">
            <input
              type="text"
              className="editor-title-input"
              placeholder="Untitled Note..."
              value={note.title}
              disabled={note.isTrashed}
              onChange={handleTitleChange}
            />
            <div className="editor-tags-bar">
              {note.tags?.map((tag) => (
                <span key={tag} className="tag-pill">
                  <span>#{tag}</span>
                  {!note.isTrashed && (
                    <button className="tag-delete-btn" onClick={() => handleRemoveTag(tag)}>×</button>
                  )}
                </span>
              ))}
              {!note.isTrashed && (
                <input
                  type="text"
                  className="new-tag-input"
                  placeholder="+ Add tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              )}
            </div>
            <textarea
              ref={textareaRef}
              className="editor-content-textarea selectable-text"
              placeholder="Type markdown, / for commands, or [[ for note links..."
              value={note.content}
              disabled={note.isTrashed}
              onChange={handleContentChange}
              style={{ minHeight: '600px' }}
            />
          </div>

          {/* Right Pane: Live Rendered Output */}
          <div className="split-pane-preview">
            <div className="markdown-body selectable-text">
              {renderMarkdownPreview(note.content)}
            </div>
          </div>
        </div>
      ) : (
        <div 
          className={`editor-scroll-area ${mode === 'live' ? 'live-document-mode' : ''}`} 
          ref={scrollAreaRef}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              target === e.currentTarget || 
              target.classList.contains('editor-scroll-area') || 
              target.classList.contains('live-document-wrapper') ||
              target.classList.contains('live-empty-canvas-prompt') ||
              target.closest('.live-empty-canvas-prompt') ||
              target.closest('.live-empty-trailing-space')
            ) {
              if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(note.content.length, note.content.length);
              }
            }
          }}
        >
          {/* Hierarchy Breadcrumb Trail */}
          <nav className="editor-hierarchy-breadcrumbs" aria-label="Hierarchy">
            {activeWorkspace && (
              <span className="crumb-item ws" title={`Workspace: ${activeWorkspace.name}`}>
                <span className="crumb-icon">{activeWorkspace.icon}</span>
                <span>{activeWorkspace.name}</span>
              </span>
            )}
            {currentBook ? (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item crumb-book-item" title={`Book: ${currentBook.title}`}>
                  <span>{currentBook.icon}</span>
                  <span>{currentBook.title}</span>
                </span>
                {typeof note.pageOrder === 'number' && (
                  <>
                    <span className="crumb-sep">/</span>
                    <span className="crumb-item chapter">Chapter {note.pageOrder + 1}</span>
                  </>
                )}
              </>
            ) : folders.find((f) => f.id === note.folderId) ? (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item folder" style={{ color: folders.find((f) => f.id === note.folderId)?.color }}>
                  <FolderIcon size={11} />
                  <span>{folders.find((f) => f.id === note.folderId)?.name}</span>
                </span>
              </>
            ) : (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-item root">Root Notes</span>
              </>
            )}
            <span className="crumb-sep">/</span>
            <span className="crumb-item current">{note.title || 'Untitled Note'}</span>
          </nav>

          {/* Title Field */}
          <input
            type="text"
            className="editor-title-input"
            placeholder="Untitled Note..."
            value={note.title}
            disabled={note.isTrashed}
            onChange={handleTitleChange}
          />

          {/* Tags Bar */}
          <div className="editor-tags-bar">
            {note.tags?.map((tag) => (
              <span key={tag} className="tag-pill">
                <span>#{tag}</span>
                {!note.isTrashed && (
                  <button 
                    className="tag-delete-btn" 
                    onClick={() => handleRemoveTag(tag)}
                    title="Remove tag"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
            {!note.isTrashed && (
              <input
                type="text"
                className="new-tag-input"
                placeholder="+ Add tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            )}
          </div>

          {/* Content Field: Live Interactive Document vs Raw Source Editor */}
          {mode === 'source' ? (
            <textarea
              ref={textareaRef}
              className="editor-content-textarea selectable-text"
              placeholder="Write markdown, type / for commands, or [[ for note links..."
              value={note.content}
              disabled={note.isTrashed}
              onChange={handleContentChange}
            />
          ) : (
            <div className="live-document-wrapper">
              {(!note.content || !note.content.trim()) && !note.isTrashed && (
                <div 
                  className="live-empty-canvas-prompt"
                  onClick={() => {
                    setMode('source');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }, 50);
                  }}
                  title="Click to write or edit"
                >
                  <Edit3 size={15} color="var(--accent-primary)" />
                  <span>Click here or anywhere in this space to type, or type <code>/</code> for templates & commands</span>
                </div>
              )}
              <div className={`markdown-body live-rich-document font-${fontFamily} selectable-text`}>
                {renderMarkdownPreview(note.content)}
              </div>
              {/* Trailing click-to-type area for adding text below existing content */}
              {!note.isTrashed && (
                <div 
                  className="live-empty-trailing-space"
                  onClick={() => {
                    setMode('source');
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(note.content.length, note.content.length);
                      }
                    }, 50);
                  }}
                  title="Click here to continue typing at the end of the note"
                >
                  <span className="trailing-prompt-hint">Click here to continue writing...</span>
                </div>
              )}
            </div>
          )}

          {/* Book Reader Page Navigation Bar (if note is part of a book) */}
          {currentBook && allBookPages.length > 0 && (
            <BookPageNavigator
              currentNote={note}
              book={currentBook}
              allBookPages={allBookPages}
              onSelectPage={onNavigateToNote}
              onAddPageToBook={onAddPageToBook}
            />
          )}

          {/* Multimedia & Attachments Section */}
          <AttachmentManager
            attachments={note.attachments || []}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />

          {/* Backlinks & Connected References */}
          {backlinks.length > 0 && (
            <div className="backlinks-section">
              <span className="backlinks-header">
                <Share2 size={13} />
                <span>Referenced in {backlinks.length} other note{backlinks.length > 1 ? 's' : ''}</span>
              </span>
              <div className="backlinks-list">
                {backlinks.map((bn) => (
                  <div 
                    key={bn.id} 
                    className="backlink-card"
                    onClick={() => onNavigateToNote(bn.title)}
                    title={`Open ${bn.title}`}
                  >
                    <Link size={12} color="var(--accent-primary)" />
                    <span>{bn.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zero-Knowledge Note Encryption / Unlock Modal */}
      <LockNoteModal
        isOpen={isCryptoModalOpen}
        note={note}
        mode={cryptoModalMode}
        onClose={() => setIsCryptoModalOpen(false)}
        onLockSuccess={(payload) => {
          onUpdateNote({
            ...note,
            isLocked: true,
            encryptedData: payload,
            content: '', // wipes plaintext from storage
            updatedAt: new Date().toISOString()
          });
        }}
        onUnlockSuccess={(decryptedContent) => {
          onUpdateNote({
            ...note,
            isLocked: false,
            content: decryptedContent,
            updatedAt: new Date().toISOString()
          });
        }}
        onRemoveLock={() => {
          onUpdateNote({
            ...note,
            isLocked: false,
            encryptedData: null,
            updatedAt: new Date().toISOString()
          });
          setIsCryptoModalOpen(false);
        }}
      />

      {/* Insert & Wrap Image Modal */}
      <InsertImageModal
        isOpen={isInsertImageOpen}
        onClose={() => setIsInsertImageOpen(false)}
        onInsert={handleInsertImageTag}
      />

      {/* Move Note Modal */}
      {isMoveModalOpen && (
        <div className="library-submodal-backdrop" onClick={() => setIsMoveModalOpen(false)}>
          <div className="library-submodal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="submodal-title">Move Note: {note.title || 'Untitled'}</h3>
            
            <div className="form-group">
              <label>Destination Folder</label>
              <select 
                value={moveFolderChoice} 
                onChange={(e) => setMoveFolderChoice(e.target.value)}
              >
                <option value="">(No Folder / Root)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Organize into Book / Notebook</label>
              <select 
                value={moveBookChoice} 
                onChange={(e) => setMoveBookChoice(e.target.value)}
              >
                <option value="">(Not in a Book)</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.icon} {b.title}</option>
                ))}
              </select>
            </div>

            <div className="submodal-btn-row">
              <button type="button" className="btn-cancel" onClick={() => setIsMoveModalOpen(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn-confirm" 
                onClick={() => {
                  if (onMoveNote) onMoveNote(note.id, moveFolderChoice || null, moveBookChoice || null);
                  setIsMoveModalOpen(false);
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Web Link Insertion Modal */}
      <LinkInsertModal
        isOpen={isLinkModalOpen}
        initialSelectedText={linkInitialText}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={handleInsertLink}
      />

      {/* Interactive Mermaid Diagram Studio Modal */}
      <MermaidEditorModal
        isOpen={isMermaidModalOpen}
        initialCode={mermaidInitialCode}
        onClose={() => {
          setIsMermaidModalOpen(false);
          setActiveMermaidBlock(null);
        }}
        onSave={handleSaveMermaidDiagram}
      />

      {/* Video Embed Modal (YouTube / Vimeo / MP4 - Froala / Editor.js) */}
      <VideoEmbedModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onInsert={(embedMarkdown) => {
          insertFormatting(embedMarkdown);
        }}
      />

      {/* Floating Bubble Contextual Formatting Toolbar (Froala / Quill / SunEditor / RoosterJS) */}
      <FloatingBubbleToolbar
        position={bubblePosition}
        onApplyFormat={handleApplyBubbleFormat}
        onClose={() => setBubblePosition((prev) => ({ ...prev, visible: false }))}
      />
    </main>
  );
};
