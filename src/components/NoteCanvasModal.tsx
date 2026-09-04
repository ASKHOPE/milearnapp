import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Network, 
  X, 
  Search, 
  FileText, 
  Maximize2, 
  Minimize2,
  Sparkles
} from 'lucide-react';
import type { Note } from '../types';

interface NoteCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNotes: Note[];
  onSelectNote: (noteId: string) => void;
}

export const NoteCanvasModal: React.FC<NoteCanvasModalProps> = ({
  isOpen,
  onClose,
  allNotes,
  onSelectNote
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Generate nodes and wiki-link edges from allNotes
  useEffect(() => {
    if (!isOpen || allNotes.length === 0) return;

    const radius = Math.max(220, allNotes.length * 35);
    const centerX = 500;
    const centerY = 350;

    const initialNodes: Node[] = allNotes.map((n, idx) => {
      const angle = (idx / allNotes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle) + (Math.random() * 40 - 20);
      const y = centerY + radius * Math.sin(angle) + (Math.random() * 40 - 20);

      const snippet = n.content.slice(0, 75).replace(/[#*`_\[\]]/g, '').trim();

      return {
        id: n.id,
        position: { x, y },
        data: {
          label: (
            <div className="note-canvas-node-card">
              <div className="node-card-header">
                <FileText size={13} color="var(--accent-primary)" />
                <span className="node-card-title">{n.title || 'Untitled Note'}</span>
              </div>
              {snippet && <p className="node-card-snippet">{snippet}...</p>}
              {n.tags && n.tags.length > 0 && (
                <div className="node-card-tags">
                  {n.tags.slice(0, 2).map((t) => (
                    <span key={t} className="node-tag-chip">#{t}</span>
                  ))}
                </div>
              )}
            </div>
          )
        },
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          padding: '10px 14px',
          minWidth: '200px',
          maxWidth: '240px',
          cursor: 'pointer'
        }
      };
    });

    // Build edges from Wiki-Links [[Title]]
    const initialEdges: Edge[] = [];
    allNotes.forEach((sourceNote) => {
      const wikiMatches = sourceNote.content.matchAll(/\[\[(.*?)\]\]/g);
      for (const match of wikiMatches) {
        const linkedTitle = match[1]?.trim().toLowerCase();
        const targetNote = allNotes.find((other) => other.title.trim().toLowerCase() === linkedTitle);
        if (targetNote && targetNote.id !== sourceNote.id) {
          const edgeId = `edge-${sourceNote.id}-${targetNote.id}`;
          if (!initialEdges.some((e) => e.id === edgeId)) {
            initialEdges.push({
              id: edgeId,
              source: sourceNote.id,
              target: targetNote.id,
              animated: true,
              style: { stroke: 'var(--accent-primary)', strokeWidth: 1.8 }
            });
          }
        }
      }
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [isOpen, allNotes, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    onSelectNote(node.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay visual-studio-overlay" onClick={onClose}>
      <div 
        className={`modal-container visual-studio-modal ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: isFullscreen ? '98vw' : '92vw', height: isFullscreen ? '96vh' : '88vh', maxWidth: '1440px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="studio-header-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
              <Network size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Infinite Note Canvas</h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Visual Knowledge Map • {allNotes.length} notes & {edges.length} connections • Click any node to open
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search Filter */}
            <div className="studio-search-box">
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search notes on canvas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              className="editor-icon-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close */}
            <button
              type="button"
              className="editor-icon-btn"
              onClick={onClose}
              title="Close Note Canvas"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Canvas Body */}
        <div className="modal-body" style={{ padding: 0, height: 'calc(100% - 64px)', position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
          >
            <Controls />
            <MiniMap 
              nodeColor="var(--accent-primary)"
              maskColor="rgba(0, 0, 0, 0.65)"
              style={{ background: 'var(--bg-card)', borderRadius: '8px' }}
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border-color)" />
          </ReactFlow>

          {/* Quick Help Overlay */}
          <div className="canvas-instruction-chip">
            <Sparkles size={13} color="#f59e0b" />
            <span>Drag notes to organize • Drag between handles to connect • Click a node to open note</span>
          </div>
        </div>
      </div>
    </div>
  );
};
