import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Note } from '../types';
import { FileText, X, Plus, Pencil, ArrowRight, ArrowLeft, Columns2, ChevronLeft, ChevronRight } from 'lucide-react';

interface NoteTabsProps {
  openNoteIds: string[];
  activeNoteId: string | null;
  allNotes: Note[];
  paneSide?: 'left' | 'right';
  isSplitView?: boolean;
  onSelectTab: (noteId: string) => void;
  onCloseTab: (noteId: string, e: React.MouseEvent) => void;
  onNewTab: () => void;
  onRenameTab?: (noteId: string, newTitle: string) => void;
  onMoveTabToOtherPane?: (noteId: string) => void;
  onReorderTabs?: (newOrder: string[]) => void;
  onDropTabFromOtherPane?: (noteId: string, targetIndex?: number) => void;
  rightToolbar?: React.ReactNode;
}

export const NoteTabs: React.FC<NoteTabsProps> = ({
  openNoteIds,
  activeNoteId,
  allNotes,
  paneSide = 'left',
  isSplitView = false,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onRenameTab,
  onMoveTabToOtherPane,
  onReorderTabs,
  onDropTabFromOtherPane,
  rightToolbar
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabTitle, setEditTabTitle] = useState('');
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after' | null>(null);
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);

  // Tab horizontal scrolling state & ref
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = tabsScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollability);
    window.addEventListener('resize', checkScrollability);
    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [openNoteIds, checkScrollability]);

  // Scroll active tab into view smoothly
  useEffect(() => {
    if (!activeNoteId || !tabsScrollRef.current) return;
    const activeEl = tabsScrollRef.current.querySelector('.note-tab-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeNoteId]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = tabsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -140 : 140, behavior: 'smooth' });
  };

  if (openNoteIds.length === 0) return null;

  const handleStartRename = (noteId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingTabId(noteId);
    setEditTabTitle(currentTitle || 'Untitled Note');
  };

  const handleSaveRename = (noteId: string) => {
    if (onRenameTab && editTabTitle.trim()) {
      onRenameTab(noteId, editTabTitle.trim());
    }
    setEditingTabId(null);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    if (editingTabId) {
      e.preventDefault();
      return;
    }
    setDraggedNoteId(noteId);
    const dragPayload = {
      noteId,
      sourcePane: paneSide
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setDragOverPosition(null);
    setIsDragOverContainer(false);
  };

  const handleTabDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const pos = e.clientX < midX ? 'before' : 'after';

    if (dragOverNoteId !== noteId || dragOverPosition !== pos) {
      setDragOverNoteId(noteId);
      setDragOverPosition(pos);
    }
  };

  const handleTabDragLeave = (e: React.DragEvent, noteId: string) => {
    e.stopPropagation();
    if (dragOverNoteId === noteId) {
      setDragOverNoteId(null);
      setDragOverPosition(null);
    }
  };

  const handleTabDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const targetPos = dragOverPosition;
    setDragOverNoteId(null);
    setDragOverPosition(null);
    setDraggedNoteId(null);
    setIsDragOverContainer(false);

    let droppedData: { noteId: string; sourcePane: 'left' | 'right' } | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) droppedData = JSON.parse(raw);
    } catch {
      // Fallback
    }
    if (!droppedData) {
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId) {
        droppedData = {
          noteId,
          sourcePane: paneSide === 'right' ? 'left' : 'right'
        };
      }
    }

    if (!droppedData || !droppedData.noteId) return;

    const { noteId: droppedId, sourcePane } = droppedData;
    const targetIdx = openNoteIds.indexOf(targetNoteId);
    const insertIdx = targetPos === 'after' ? targetIdx + 1 : targetIdx;

    if (sourcePane !== paneSide) {
      // Dropped from the other pane
      if (onDropTabFromOtherPane) {
        onDropTabFromOtherPane(droppedId, Math.max(0, insertIdx));
      }
    } else {
      // Reorder within the same pane
      if (droppedId === targetNoteId) return;
      const fromIdx = openNoteIds.indexOf(droppedId);
      if (fromIdx !== -1 && onReorderTabs) {
        const nextList = [...openNoteIds];
        nextList.splice(fromIdx, 1);
        const finalIdx = fromIdx < insertIdx ? insertIdx - 1 : insertIdx;
        nextList.splice(Math.max(0, Math.min(finalIdx, nextList.length)), 0, droppedId);
        onReorderTabs(nextList);
      }
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverContainer) {
      setIsDragOverContainer(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverContainer(false);
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    setDragOverNoteId(null);
    setDragOverPosition(null);
    setDraggedNoteId(null);

    let droppedData: { noteId: string; sourcePane: 'left' | 'right' } | null = null;
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) droppedData = JSON.parse(raw);
    } catch {
      // Fallback
    }
    if (!droppedData) {
      const noteId = e.dataTransfer.getData('text/plain');
      if (noteId) {
        droppedData = {
          noteId,
          sourcePane: paneSide === 'right' ? 'left' : 'right'
        };
      }
    }

    if (!droppedData || !droppedData.noteId) return;
    const { noteId: droppedId, sourcePane } = droppedData;

    if (sourcePane !== paneSide) {
      if (onDropTabFromOtherPane) {
        onDropTabFromOtherPane(droppedId, openNoteIds.length);
      }
    } else {
      const fromIdx = openNoteIds.indexOf(droppedId);
      if (fromIdx !== -1 && onReorderTabs) {
        const nextList = [...openNoteIds];
        nextList.splice(fromIdx, 1);
        nextList.push(droppedId);
        onReorderTabs(nextList);
      }
    }
  };

  return (
    <div
      className={`note-tabs-bar ${isDragOverContainer ? 'drag-over-container' : ''}`}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      <div className="note-tabs-scroll-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="tab-scroll-btn prev"
            onClick={() => handleScroll('left')}
            title="Scroll tabs left"
          >
            <ChevronLeft size={13} />
          </button>
        )}

        <div 
          ref={tabsScrollRef} 
          className="note-tabs-scroll"
          onWheel={(e) => {
            if (tabsScrollRef.current && e.deltaY !== 0) {
              tabsScrollRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          {openNoteIds.map((noteId) => {
            const note = allNotes.find((n) => n.id === noteId);
            if (!note) return null;
            const isActive = noteId === activeNoteId;
            const isEditing = editingTabId === noteId;
            const isDragging = draggedNoteId === noteId;
            const isOverThis = dragOverNoteId === noteId;
            const dropPositionClass = isOverThis ? (dragOverPosition === 'before' ? 'drag-over-before' : 'drag-over-after') : '';

            return (
              <div
                key={noteId}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, noteId)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleTabDragOver(e, noteId)}
                onDragLeave={(e) => handleTabDragLeave(e, noteId)}
                onDrop={(e) => handleTabDrop(e, noteId)}
                className={`note-tab-item ${isActive ? 'active' : ''} ${isDragging ? 'is-dragging' : ''} ${dropPositionClass}`}
                onClick={() => onSelectTab(noteId)}
                title={isEditing ? '' : (note.title || 'Untitled Note')}
              >
                <FileText size={13} className="note-tab-icon" />
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    className="note-tab-rename-input"
                    value={editTabTitle}
                    onChange={(e) => setEditTabTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => handleSaveRename(noteId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(noteId);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                  />
                ) : (
                  <span className="note-tab-title">
                    {note.title || 'Untitled Note'}
                  </span>
                )}

                {/* Single-click rename button for active tab */}
                {isActive && !isEditing && onRenameTab && (
                  <button
                    type="button"
                    className="note-tab-rename-btn"
                    onClick={(e) => handleStartRename(noteId, note.title, e)}
                    title="Rename Note"
                  >
                    <Pencil size={11} />
                  </button>
                )}

                {/* Dynamic Split / Move to Other Pane Button */}
                {isActive && !isEditing && onMoveTabToOtherPane && (
                  <button
                    type="button"
                    className="note-tab-move-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveTabToOtherPane(noteId);
                    }}
                    title={
                      !isSplitView
                        ? 'Duplicate in Split View (Side-by-Side)'
                        : paneSide === 'right'
                        ? 'Move tab to Left Pane'
                        : 'Move tab to Right Pane'
                    }
                  >
                    {!isSplitView ? (
                      <Columns2 size={11} />
                    ) : paneSide === 'right' ? (
                      <ArrowLeft size={11} />
                    ) : (
                      <ArrowRight size={11} />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="note-tab-close"
                  onClick={(e) => onCloseTab(noteId, e)}
                  title="Close Tab"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="tab-scroll-btn next"
            onClick={() => handleScroll('right')}
            title="Scroll tabs right"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      <button className="note-tab-add" onClick={onNewTab} title="New Note Tab">
        <Plus size={14} />
      </button>

      {/* Embedded Right Controls / Collapsible Row Toggles (Utilizes Empty Tab Bar Space) */}
      {rightToolbar && (
        <div className="note-tabs-right-toolbar">
          {rightToolbar}
        </div>
      )}
    </div>
  );
};
