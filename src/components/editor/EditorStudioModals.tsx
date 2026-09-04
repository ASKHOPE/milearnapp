import React, { lazy, Suspense } from 'react';
import type { Note, Workspace, Attachment } from '../../types';
import { ErrorBoundary } from '../common/ErrorBoundary';

// Lazy-loaded visual studio modals for optimal performance
const DrawingCanvasModal = lazy(() => import('../DrawingCanvasModal').then(m => ({ default: m.DrawingCanvasModal })));
const InteractiveFlowModal = lazy(() => import('../InteractiveFlowModal').then(m => ({ default: m.InteractiveFlowModal })));
const MathGraphStudioModal = lazy(() => import('../MathGraphStudioModal').then(m => ({ default: m.MathGraphStudioModal })));
const BlocklyStudioModal = lazy(() => import('../BlocklyStudioModal').then(m => ({ default: m.BlocklyStudioModal })));
const ThreeStudioModal = lazy(() => import('../ThreeStudioModal').then(m => ({ default: m.ThreeStudioModal })));
const CitationStudioModal = lazy(() => import('../CitationStudioModal').then(m => ({ default: m.CitationStudioModal })));
const ExportModal = lazy(() => import('../ExportModal').then(m => ({ default: m.ExportModal })));
const NoteCanvasModal = lazy(() => import('../NoteCanvasModal').then(m => ({ default: m.NoteCanvasModal })));
const FlashcardQuizModal = lazy(() => import('../FlashcardQuizModal').then(m => ({ default: m.FlashcardQuizModal })));
const OcrScannerModal = lazy(() => import('../OcrScannerModal').then(m => ({ default: m.OcrScannerModal })));
const SlideDeckModal = lazy(() => import('../SlideDeckModal').then(m => ({ default: m.SlideDeckModal })));
const VideoEmbedModal = lazy(() => import('./VideoEmbedModal').then(m => ({ default: m.VideoEmbedModal })));

export interface EditorStudioModalsProps {
  note: Note | null;
  allNotes: Note[];
  activeWorkspace?: Workspace;
  onSelectTab: (noteId: string) => void;
  onInsertIntoNote: (content: string) => void;
  onSaveAttachment: (attachment: Attachment) => void;

  // Modal Open States & Closers
  isDrawingModalOpen: boolean;
  onCloseDrawingModal: () => void;

  isInteractiveFlowOpen: boolean;
  onCloseInteractiveFlow: () => void;

  isMathGraphStudioOpen: boolean;
  onCloseMathGraphStudio: () => void;

  isBlocklyStudioOpen: boolean;
  onCloseBlocklyStudio: () => void;

  isThreeStudioOpen: boolean;
  onCloseThreeStudio: () => void;

  isCitationStudioOpen: boolean;
  onCloseCitationStudio: () => void;

  isExportModalOpen: boolean;
  onCloseExportModal: () => void;

  isNoteCanvasOpen: boolean;
  onCloseNoteCanvas: () => void;

  isFlashcardQuizOpen: boolean;
  onCloseFlashcardQuiz: () => void;

  isOcrScannerOpen: boolean;
  onCloseOcrScanner: () => void;

  isSlideDeckOpen: boolean;
  onCloseSlideDeck: () => void;

  isVideoModalOpen: boolean;
  onCloseVideoModal: () => void;
}

export const EditorStudioModals: React.FC<EditorStudioModalsProps> = ({
  note,
  allNotes,
  activeWorkspace,
  onSelectTab,
  onInsertIntoNote,
  onSaveAttachment,
  isDrawingModalOpen,
  onCloseDrawingModal,
  isInteractiveFlowOpen,
  onCloseInteractiveFlow,
  isMathGraphStudioOpen,
  onCloseMathGraphStudio,
  isBlocklyStudioOpen,
  onCloseBlocklyStudio,
  isThreeStudioOpen,
  onCloseThreeStudio,
  isCitationStudioOpen,
  onCloseCitationStudio,
  isExportModalOpen,
  onCloseExportModal,
  isNoteCanvasOpen,
  onCloseNoteCanvas,
  isFlashcardQuizOpen,
  onCloseFlashcardQuiz,
  isOcrScannerOpen,
  onCloseOcrScanner,
  isSlideDeckOpen,
  onCloseSlideDeck,
  isVideoModalOpen,
  onCloseVideoModal
}) => {
  return (
    <ErrorBoundary name="Visual Studios">
      <Suspense fallback={null}>
        {isDrawingModalOpen && (
          <DrawingCanvasModal
            isOpen={isDrawingModalOpen}
            onClose={onCloseDrawingModal}
            onSaveDrawing={onSaveAttachment}
          />
        )}

        {isInteractiveFlowOpen && (
          <InteractiveFlowModal
            isOpen={isInteractiveFlowOpen}
            onClose={onCloseInteractiveFlow}
            onInsertIntoNote={onInsertIntoNote}
          />
        )}

        {isMathGraphStudioOpen && (
          <MathGraphStudioModal
            isOpen={isMathGraphStudioOpen}
            onClose={onCloseMathGraphStudio}
            onInsertIntoNote={onInsertIntoNote}
            onSaveAttachment={onSaveAttachment}
          />
        )}

        {isBlocklyStudioOpen && (
          <BlocklyStudioModal
            isOpen={isBlocklyStudioOpen}
            onClose={onCloseBlocklyStudio}
            onInsertIntoNote={onInsertIntoNote}
          />
        )}

        {isThreeStudioOpen && (
          <ThreeStudioModal
            isOpen={isThreeStudioOpen}
            onClose={onCloseThreeStudio}
            onSaveAttachment={onSaveAttachment}
          />
        )}

        {isCitationStudioOpen && (
          <CitationStudioModal
            isOpen={isCitationStudioOpen}
            onClose={onCloseCitationStudio}
            onInsertIntoNote={onInsertIntoNote}
          />
        )}

        {isExportModalOpen && (
          <ExportModal
            isOpen={isExportModalOpen}
            note={note}
            activeWorkspace={activeWorkspace}
            onClose={onCloseExportModal}
          />
        )}

        {isNoteCanvasOpen && (
          <NoteCanvasModal
            isOpen={isNoteCanvasOpen}
            onClose={onCloseNoteCanvas}
            allNotes={allNotes}
            onSelectNote={onSelectTab}
          />
        )}

        {isFlashcardQuizOpen && (
          <FlashcardQuizModal
            isOpen={isFlashcardQuizOpen}
            onClose={onCloseFlashcardQuiz}
            currentNote={note}
            allNotes={allNotes}
          />
        )}

        {isOcrScannerOpen && (
          <OcrScannerModal
            isOpen={isOcrScannerOpen}
            onClose={onCloseOcrScanner}
            onInsertIntoNote={onInsertIntoNote}
          />
        )}

        {isSlideDeckOpen && (
          <SlideDeckModal
            isOpen={isSlideDeckOpen}
            onClose={onCloseSlideDeck}
            note={note}
          />
        )}

        {isVideoModalOpen && (
          <VideoEmbedModal
            isOpen={isVideoModalOpen}
            onClose={onCloseVideoModal}
            onInsert={onInsertIntoNote}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};
