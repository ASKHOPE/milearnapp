import React, { useState, useCallback } from 'react';
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
  GitFork, 
  Plus, 
  X, 
  FileCode, 
  Trash2
} from 'lucide-react';

interface InteractiveFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoNote: (content: string) => void;
}

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: '🧠 Core Concept / Idea' },
    style: {
      background: '#4f46e5',
      color: '#ffffff',
      fontWeight: 600,
      padding: '12px 18px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
    }
  },
  {
    id: '2',
    position: { x: 380, y: 50 },
    data: { label: '⚡ Analysis & Hypothesis' },
    style: {
      background: '#141724',
      color: '#f1f5f9',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid #6366f1'
    }
  },
  {
    id: '3',
    position: { x: 380, y: 180 },
    data: { label: '🎯 Action Item / Decision' },
    style: {
      background: '#141724',
      color: '#10b981',
      padding: '10px 16px',
      borderRadius: '8px',
      border: '1px solid #10b981'
    }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: '#10b981', strokeWidth: 2 } }
];

export const InteractiveFlowModal: React.FC<InteractiveFlowModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoNote
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeType, setNodeType] = useState<'concept' | 'decision' | 'action'>('concept');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  if (!isOpen) return null;

  const handleAddNode = () => {
    if (!nodeTitle.trim()) return;

    const id = (nodes.length + 1).toString() + '-' + Math.random().toString(36).substr(2, 4);
    const colors = {
      concept: { bg: '#4f46e5', border: '#818cf8', text: '#ffffff' },
      decision: { bg: '#d97706', border: '#fbbf24', text: '#ffffff' },
      action: { bg: '#059669', border: '#34d399', text: '#ffffff' }
    };

    const chosen = colors[nodeType];
    const newNode: Node = {
      id,
      position: { x: 200 + Math.random() * 200, y: 150 + Math.random() * 150 },
      data: { label: nodeTitle.trim() },
      style: {
        background: chosen.bg,
        color: chosen.text,
        fontWeight: 600,
        padding: '10px 16px',
        borderRadius: '8px',
        border: `1px solid ${chosen.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeTitle('');
  };

  const handleClear = () => {
    if (confirm('Clear all nodes and edges from this flow canvas?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  // Convert current node network to Markdown Mermaid diagram for note insertion
  const handleInsertDiagramToNote = () => {
    let mermaid = '```mermaid\ngraph LR\n';
    
    // Map nodes
    const sanitize = (str: any) => String(str || '').replace(/[^\w\s-]/gi, '').trim() || 'Node';
    nodes.forEach((n) => {
      const label = sanitize(n.data?.label);
      mermaid += `  node_${n.id}["${label}"]\n`;
    });

    // Map edges
    edges.forEach((e) => {
      mermaid += `  node_${e.source} --> node_${e.target}\n`;
    });

    mermaid += '```\n';

    onInsertIntoNote(mermaid);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw',
          maxWidth: '1200px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* Header Bar */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 700 }}>Interactive Flow & Concept Studio</span>
            <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              @xyflow/react v12
            </span>
          </div>

          {/* Quick Node Creator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="text"
              placeholder="Node title / idea..."
              value={nodeTitle}
              onChange={(e) => setNodeTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '180px'
              }}
            />
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as any)}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="concept">💡 Concept</option>
              <option value="decision">❓ Decision</option>
              <option value="action">✅ Action</option>
            </select>
            <button
              type="button"
              className="btn-create-note-compact"
              onClick={handleAddNode}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              <Plus size={13} />
              <span>Add Node</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="editor-icon-btn"
              onClick={handleClear}
              title="Clear Canvas"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              className="btn-new-note"
              onClick={handleInsertDiagramToNote}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              title="Convert interactive canvas into diagram in note"
            >
              <FileCode size={14} />
              <span>Insert Flow into Note</span>
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div style={{ flex: 1, width: '100%', height: '100%', background: '#0a0c12' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Controls style={{ borderRadius: '8px', overflow: 'hidden' }} />
            <MiniMap 
              nodeStrokeColor="#6366f1"
              nodeColor="#1e293b"
              style={{ background: '#0f172a', borderRadius: '8px' }}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
