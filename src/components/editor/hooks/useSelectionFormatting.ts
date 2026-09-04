import { useCallback, type RefObject } from 'react';
import type { Note } from '../../../types';

interface UseSelectionFormattingProps {
  note: Note | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onUpdateNote: (updatedNote: Note) => void;
}

export function useSelectionFormatting({
  note,
  textareaRef,
  onUpdateNote
}: UseSelectionFormattingProps) {
  const insertFormatting = useCallback(
    (prefix: string, suffix = '') => {
      if (!note || note.isTrashed) return;
      const textarea = textareaRef.current;

      if (!textarea) {
        let textToAppend = '';
        if (prefix.startsWith('```mermaid') || prefix.startsWith('```') || prefix.startsWith('> ')) {
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
      const currentText = note.content || '';
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
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
        }
      }, 10);
    },
    [note, textareaRef, onUpdateNote]
  );

  return {
    insertFormatting
  };
}
