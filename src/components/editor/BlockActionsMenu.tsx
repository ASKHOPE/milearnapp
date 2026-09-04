import React, { useState } from 'react';
import { 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Heading1, 
  Heading2, 
  List, 
  CheckSquare, 
  Quote, 
  Info
} from 'lucide-react';

export interface BlockActionTarget {
  startLine: number;
  endLine: number;
  blockType: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'task' | 'list' | 'quote' | 'callout' | 'code' | 'table' | 'image';
  rawContent: string;
}

interface BlockActionsMenuProps {
  target: BlockActionTarget;
  onMoveBlock: (startLine: number, endLine: number, direction: 'up' | 'down') => void;
  onDuplicateBlock: (startLine: number, endLine: number) => void;
  onDeleteBlock: (startLine: number, endLine: number) => void;
  onConvertBlockType: (startLine: number, endLine: number, newType: string) => void;
  isReadOnly?: boolean;
}

export const BlockActionsMenu: React.FC<BlockActionsMenuProps> = ({
  target,
  onMoveBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onConvertBlockType,
  isReadOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  if (isReadOnly) return null;

  return (
    <div 
      className="editorjs-block-tune-gutter" 
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="btn-block-tune-handle"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsConvertOpen(false);
        }}
        title="Block Actions (Move, Duplicate, Convert, Delete)"
      >
        <GripVertical size={13} />
      </button>

      {isOpen && (
        <div className="block-tune-dropdown">
          {/* Move Up */}
          <button
            type="button"
            className="tune-dropdown-item"
            onClick={() => {
              onMoveBlock(target.startLine, target.endLine, 'up');
              setIsOpen(false);
            }}
          >
            <ChevronUp size={13} />
            <span>Move Up</span>
          </button>

          {/* Move Down */}
          <button
            type="button"
            className="tune-dropdown-item"
            onClick={() => {
              onMoveBlock(target.startLine, target.endLine, 'down');
              setIsOpen(false);
            }}
          >
            <ChevronDown size={13} />
            <span>Move Down</span>
          </button>

          {/* Duplicate Block */}
          <button
            type="button"
            className="tune-dropdown-item"
            onClick={() => {
              onDuplicateBlock(target.startLine, target.endLine);
              setIsOpen(false);
            }}
          >
            <Copy size={13} />
            <span>Duplicate Block</span>
          </button>

          {/* Convert Block Type */}
          <button
            type="button"
            className="tune-dropdown-item"
            onClick={() => setIsConvertOpen(!isConvertOpen)}
          >
            <RefreshCw size={13} />
            <span>Convert to...</span>
          </button>

          {/* Convert Submenu */}
          {isConvertOpen && (
            <div className="tune-convert-submenu">
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'paragraph');
                  setIsOpen(false);
                }}
              >
                Paragraph (Normal)
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'h1');
                  setIsOpen(false);
                }}
              >
                <Heading1 size={12} /> Heading 1
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'h2');
                  setIsOpen(false);
                }}
              >
                <Heading2 size={12} /> Heading 2
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'task');
                  setIsOpen(false);
                }}
              >
                <CheckSquare size={12} /> Task Item
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'list');
                  setIsOpen(false);
                }}
              >
                <List size={12} /> Bullet List
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'quote');
                  setIsOpen(false);
                }}
              >
                <Quote size={12} /> Quote
              </button>
              <button
                type="button"
                className="tune-convert-option"
                onClick={() => {
                  onConvertBlockType(target.startLine, target.endLine, 'callout');
                  setIsOpen(false);
                }}
              >
                <Info size={12} /> Callout Box
              </button>
            </div>
          )}

          <hr className="tune-divider" />

          {/* Delete Block */}
          <button
            type="button"
            className="tune-dropdown-item danger"
            onClick={() => {
              onDeleteBlock(target.startLine, target.endLine);
              setIsOpen(false);
            }}
          >
            <Trash2 size={13} />
            <span>Delete Block</span>
          </button>
        </div>
      )}
    </div>
  );
};
