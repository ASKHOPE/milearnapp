import React, { useState, useRef } from 'react';
import type { Note } from '../../types';
import {
  Zap,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Bold,
  Italic,
  CheckSquare,
  List,
  ListOrdered,
  Code,
  Link2,
  Eye,
  Edit3
} from 'lucide-react';

interface QuickNoteSimpleEditorProps {
  note: Note;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleAdvanced: () => void;
  onOpenConvertModal: () => void;
  saveStatus: 'saved' | 'unsaved' | 'saving';
}

export const QuickNoteSimpleEditor: React.FC<QuickNoteSimpleEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onToggleAdvanced,
  onOpenConvertModal,
  saveStatus
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNote({
      ...note,
      title: e.target.value,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle Content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateNote({
      ...note,
      content: e.target.value,
      updatedAt: new Date().toISOString()
    });
  };

  // Text formatting insertion helper
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = note.content;
    const selected = current.substring(start, end);

    const replacement = `${prefix}${selected || (prefix.startsWith('- [ ]') ? '' : 'text')}${suffix}`;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);

    onUpdateNote({
      ...note,
      content: nextContent,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      textarea.focus();
      const cursorTarget = start + prefix.length + (selected ? selected.length : (prefix.startsWith('- [ ]') ? 0 : 4));
      textarea.setSelectionRange(cursorTarget, cursorTarget);
    }, 0);
  };

  // Smart Enter Key Handler: auto-continuation of checklists and bullet points
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const textBefore = note.content.substring(0, cursor);
      const lines = textBefore.split('\n');
      const currentLine = lines[lines.length - 1];

      // Checklist continuation
      if (currentLine.match(/^(\s*)-\s\[([ xX])\]\s+(.+)$/)) {
        e.preventDefault();
        const indent = currentLine.match(/^\s*/)?.[0] || '';
        const insert = `\n${indent}- [ ] `;
        const newContent = note.content.substring(0, cursor) + insert + note.content.substring(cursor);
        onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
        setTimeout(() => {
          textarea.setSelectionRange(cursor + insert.length, cursor + insert.length);
        }, 0);
      } else if (currentLine.match(/^(\s*)-\s\[([ xX])\]\s*$/)) {
        // Empty checklist item -> clear it on Enter
        e.preventDefault();
        const lineStart = cursor - currentLine.length;
        const newContent = note.content.substring(0, lineStart) + '\n' + note.content.substring(cursor);
        onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
        setTimeout(() => {
          textarea.setSelectionRange(lineStart + 1, lineStart + 1);
        }, 0);
      }
      // Bullet list continuation
      else if (currentLine.match(/^(\s*)-\s+(.+)$/)) {
        e.preventDefault();
        const indent = currentLine.match(/^\s*/)?.[0] || '';
        const insert = `\n${indent}- `;
        const newContent = note.content.substring(0, cursor) + insert + note.content.substring(cursor);
        onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
        setTimeout(() => {
          textarea.setSelectionRange(cursor + insert.length, cursor + insert.length);
        }, 0);
      } else if (currentLine.match(/^(\s*)-\s*$/)) {
        // Empty bullet -> clear it
        e.preventDefault();
        const lineStart = cursor - currentLine.length;
        const newContent = note.content.substring(0, lineStart) + '\n' + note.content.substring(cursor);
        onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
        setTimeout(() => {
          textarea.setSelectionRange(lineStart + 1, lineStart + 1);
        }, 0);
      }
    }
  };

  // Toggle interactive task in preview mode
  const handleToggleTaskLine = (lineIdx: number) => {
    const lines = note.content.split('\n');
    const target = lines[lineIdx];
    if (!target) return;

    if (target.includes('- [ ]')) {
      lines[lineIdx] = target.replace('- [ ]', '- [x]');
    } else if (target.includes('- [x]') || target.includes('- [X]')) {
      lines[lineIdx] = target.replace(/- \[[xX]\]/, '- [ ]');
    }

    onUpdateNote({
      ...note,
      content: lines.join('\n'),
      updatedAt: new Date().toISOString()
    });
  };

  // Task & Stats calculation
  const lines = note.content.split('\n');
  const totalTasks = lines.filter((l) => l.includes('- [ ]') || l.includes('- [x]') || l.includes('- [X]')).length;
  const completedTasks = lines.filter((l) => l.includes('- [x]') || l.includes('- [X]')).length;
  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;

  return (
    <div className="quick-note-simple-editor-container">
      {/* Top Action Bar */}
      <div className="quick-note-header-bar">
        <div className="quick-note-header-left">
          <div className="quick-note-badge" title="Fast Scratchpad">
            <Zap size={13} className="quick-note-zap" />
            <span>Quick Note</span>
          </div>

          <input
            type="text"
            className="quick-note-inline-title"
            value={note.title}
            onChange={handleTitleChange}
            placeholder="Quick Note Title..."
          />

          <span className={`quick-note-save-status ${saveStatus}`}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
          </span>
        </div>

        <div className="quick-note-header-right">
          {/* Show Advanced Editor button */}
          <button
            type="button"
            className="quick-note-action-pill advanced"
            onClick={onToggleAdvanced}
            title="Open Advanced Editor with tables, studios, math & full toolbars"
          >
            <SlidersHorizontal size={12} />
            <span>Advanced Editor</span>
          </button>

          {/* Convert to Note / Book button */}
          <button
            type="button"
            className="quick-note-action-pill convert"
            onClick={onOpenConvertModal}
            title="Convert this quick note into a standard note or page in a book"
          >
            <Sparkles size={12} />
            <span>Convert to Note / Book...</span>
          </button>

          {/* Delete Quick Note */}
          <button
            type="button"
            className="quick-note-icon-btn danger"
            onClick={() => {
              if (confirm('Delete this quick note?')) {
                onDeleteNote(note.id);
              }
            }}
            title="Delete Quick Note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Formatting & Mode Strip */}
      <div className="quick-note-tools-strip">
        <div className="quick-format-btn-group">
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('**', '**')}
            title="Bold (Ctrl+B)"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('*', '*')}
            title="Italic (Ctrl+I)"
          >
            <Italic size={13} />
          </button>
          <button
            type="button"
            className="quick-tool-btn highlight"
            onClick={() => insertFormatting('- [ ] ')}
            title="Insert Checklist Item"
          >
            <CheckSquare size={13} />
            <span>Checklist</span>
          </button>
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('- ')}
            title="Insert Bullet Point"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('1. ')}
            title="Numbered List"
          >
            <ListOrdered size={13} />
          </button>
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('`', '`')}
            title="Inline Code"
          >
            <Code size={13} />
          </button>
          <button
            type="button"
            className="quick-tool-btn"
            onClick={() => insertFormatting('[', '](url)')}
            title="Link"
          >
            <Link2 size={13} />
          </button>
        </div>

        {/* View Toggle: Edit vs Interactive Checklist Preview */}
        <div className="quick-view-toggle-group">
          <button
            type="button"
            className={`quick-toggle-chip ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => setViewMode('edit')}
            title="Text Edit Mode"
          >
            <Edit3 size={11} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className={`quick-toggle-chip ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Interactive Checklist & Preview"
          >
            <Eye size={11} />
            <span>Interactive ({completedTasks}/{totalTasks})</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="quick-note-body-area">
        {viewMode === 'edit' ? (
          <textarea
            ref={textareaRef}
            className="quick-note-textarea"
            placeholder="Jot down quick thoughts, checklists (- [ ]), ideas, or links..."
            value={note.content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="quick-note-interactive-preview">
            {lines.length === 0 || !note.content.trim() ? (
              <p className="quick-preview-empty">No content yet. Switch to Edit mode to write.</p>
            ) : (
              lines.map((line, idx) => {
                const isChecklistUnchecked = line.includes('- [ ]');
                const isChecklistChecked = line.includes('- [x]') || line.includes('- [X]');

                if (isChecklistUnchecked || isChecklistChecked) {
                  const text = line.replace(/- \[[ xX]\]\s*/, '');
                  return (
                    <div
                      key={idx}
                      className={`quick-preview-task-row ${isChecklistChecked ? 'done' : ''}`}
                      onClick={() => handleToggleTaskLine(idx)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecklistChecked}
                        onChange={() => handleToggleTaskLine(idx)}
                        className="quick-preview-checkbox"
                      />
                      <span className="quick-preview-task-text">{text || '(empty task)'}</span>
                    </div>
                  );
                }

                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="quick-preview-h1">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="quick-preview-h2">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="quick-preview-h3">{line.slice(4)}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={idx} className="quick-preview-bullet">{line.slice(2)}</li>;
                }
                if (!line.trim()) {
                  return <div key={idx} style={{ height: '8px' }} />;
                }

                return <p key={idx} className="quick-preview-p">{line}</p>;
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="quick-note-footer-bar">
        <div className="quick-footer-left">
          <span>{wordCount} words</span>
          <span className="dot-divider">•</span>
          <span>{note.content.length} characters</span>
          {totalTasks > 0 && (
            <>
              <span className="dot-divider">•</span>
              <span className="tasks-stat-badge">
                {completedTasks}/{totalTasks} tasks completed ({Math.round((completedTasks / totalTasks) * 100)}%)
              </span>
            </>
          )}
        </div>
        <div className="quick-footer-right">
          <span>⚡ Simple Scratchpad Mode</span>
          <span className="dot-divider">•</span>
          <button
            type="button"
            className="quick-footer-convert-link"
            onClick={onOpenConvertModal}
          >
            Promote to Permanent Note or Book Page →
          </button>
        </div>
      </div>
    </div>
  );
};
