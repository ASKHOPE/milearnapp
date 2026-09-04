import { useState, useEffect, useRef, useCallback } from 'react';
import type { Note } from '../../../types';

export type AutosaveStatus = 'saved' | 'saving' | 'unsaved';

interface UseNoteAutosaveProps {
  note: Note | null;
  content: string;
  title: string;
  onUpdateNote: (updatedNote: Note) => void;
  debounceMs?: number;
}

export function useNoteAutosave({
  note,
  content,
  title,
  onUpdateNote,
  debounceMs = 600
}: UseNoteAutosaveProps) {
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>('saved');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string }>({
    title: note?.title || '',
    content: note?.content || ''
  });

  // Track note switch
  useEffect(() => {
    if (note) {
      lastSavedRef.current = {
        title: note.title,
        content: note.content
      };
      setSaveStatus('saved');
    }
  }, [note?.id]);

  // Debounced autosave effect
  useEffect(() => {
    if (!note) return;

    const isDirty = content !== lastSavedRef.current.content || title !== lastSavedRef.current.title;
    if (!isDirty) return;

    setSaveStatus('unsaved');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      const updatedNote: Note = {
        ...note,
        title: title.trim() || 'Untitled Note',
        content,
        updatedAt: new Date().toISOString()
      };

      try {
        onUpdateNote(updatedNote);
        lastSavedRef.current = { title: updatedNote.title, content: updatedNote.content };
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('unsaved');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, title, note, onUpdateNote, debounceMs]);

  // Immediate force save
  const forceSave = useCallback(() => {
    if (!note) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const updatedNote: Note = {
      ...note,
      title: title.trim() || 'Untitled Note',
      content,
      updatedAt: new Date().toISOString()
    };
    onUpdateNote(updatedNote);
    lastSavedRef.current = { title: updatedNote.title, content: updatedNote.content };
    setSaveStatus('saved');
  }, [note, title, content, onUpdateNote]);

  return {
    saveStatus,
    forceSave
  };
}
