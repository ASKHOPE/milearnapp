import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { Note, Folder, GraphNode, GraphLink } from '../types';
import { 
  Network, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Search, 
  Crosshair, 
  Sliders 
} from 'lucide-react';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  notes: Note[];
  folders: Folder[];
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  notes,
  folders,
  onClose,
  onSelectNote
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPhysicsControls, setShowPhysicsControls] = useState(false);

  // Physics settings
  const [repulsionStrength, setRepulsionStrength] = useState(2200);
  const [clusterGravity, setClusterGravity] = useState(true);

  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const mouseMovedDistanceRef = useRef(0);

  // 1. Build Graph Nodes & Links
  const { graphNodes, graphLinks, folderCentroids } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const titleToId = new Map<string, string>();
    notes.forEach((n) => {
      titleToId.set(n.title.trim().toLowerCase(), n.id);
    });

    // Folder color mapping
    const folderColorMap = new Map<string, string>();
    folders.forEach((f) => {
      folderColorMap.set(f.id, f.color || '#6366f1');
    });

    // Compute distinct folder anchor centers around a circle for cluster gravity
    const folderIds = Array.from(new Set(notes.map((n) => n.folderId || 'root')));
    const folderCenters = new Map<string, { x: number; y: number; name: string; color: string }>();
    folderIds.forEach((fId, idx) => {
      const angle = (idx / (folderIds.length || 1)) * Math.PI * 2;
      const radius = 280;
      const folderObj = folders.find((f) => f.id === fId);
      folderCenters.set(fId, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        name: folderObj ? folderObj.name : 'Unfiled',
        color: folderObj?.color || '#94a3b8'
      });
    });

    // Create Nodes
    notes.forEach((note) => {
      const folder = folders.find((f) => f.id === note.folderId);
      const center = folderCenters.get(note.folderId || 'root') || { x: 0, y: 0 };

      nodes.push({
        id: note.id,
        title: note.title || 'Untitled Note',
        folderId: note.folderId,
        folderName: folder ? folder.name : 'Unfiled',
        folderColor: folder?.color || '#6366f1',
        tags: note.tags || [],
        connectionCount: 0,
        attachmentCount: note.attachments?.length || 0,
        // Start near cluster center with jitter
        x: center.x + (Math.random() - 0.5) * 120,
        y: center.y + (Math.random() - 0.5) * 120,
        vx: 0,
        vy: 0
      });
    });

    // Parse Wiki Links [[Title]]
    notes.forEach((note) => {
      const matches = note.content.match(/\[\[(.*?)\]\]/g);
      if (matches) {
        matches.forEach((m) => {
          const targetTitle = m.slice(2, -2).trim().toLowerCase();
          const targetId = titleToId.get(targetTitle);
          if (targetId && targetId !== note.id) {
            links.push({
              source: note.id,
              target: targetId,
              type: 'wikilink'
            });
            const srcNode = nodes.find((n) => n.id === note.id);
            const tgtNode = nodes.find((n) => n.id === targetId);
            if (srcNode) srcNode.connectionCount += 1;
            if (tgtNode) tgtNode.connectionCount += 1;
          }
        });
      }
    });

    return { graphNodes: nodes, graphLinks: links, folderCentroids: folderCenters };
  }, [notes, folders]);

  // Metrics
  const totalNotes = notes.length;
  const totalLinks = graphLinks.length;
  const totalAttachments = notes.reduce((acc, n) => acc + (n.attachments?.length || 0), 0);
  const connectedNodes = graphNodes.filter((n) => n.connectionCount > 0).length;

  // Zoom to Fit Helper
  const handleZoomToFit = () => {
    if (graphNodes.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graphNodes.forEach((n) => {
      if ((n.x || 0) < minX) minX = n.x || 0;
      if ((n.x || 0) > maxX) maxX = n.x || 0;
      if ((n.y || 0) < minY) minY = n.y || 0;
      if ((n.y || 0) > maxY) maxY = n.y || 0;
    });

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;

    const scaleX = canvas.width / graphWidth;
    const scaleY = canvas.height / graphHeight;
    const fitZoom = Math.min(1.8, Math.max(0.15, Math.min(scaleX, scaleY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: -midX * fitZoom,
      y: -midY * fitZoom
    });
  };

  // 2. Physics Simulation & Infinite LOD Canvas Rendering
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();

    const nodeMap = new Map<string, GraphNode>();
    graphNodes.forEach((n) => nodeMap.set(n.id, n));

    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const springLength = 140;
      const springStrength = 0.04;
      const damping = 0.82;

      // Coulomb Node Repulsion
      for (let i = 0; i < graphNodes.length; i++) {
        const n1 = graphNodes[i];
        for (let j = i + 1; j < graphNodes.length; j++) {
          const n2 = graphNodes[j];
          const dx = (n1.x || 0) - (n2.x || 0);
          const dy = (n1.y || 0) - (n2.y || 0);
          const distSq = dx * dx + dy * dy + 150;
          const dist = Math.sqrt(distSq);
          const force = repulsionStrength / distSq;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx = (n1.vx || 0) + fx;
          n1.vy = (n1.vy || 0) + fy;
          n2.vx = (n2.vx || 0) - fx;
          n2.vy = (n2.vy || 0) - fy;
        }

        // Cluster Gravity (pull towards folder centroid)
        if (clusterGravity) {
          const center = folderCentroids.get(n1.folderId || 'root');
          if (center) {
            n1.vx = (n1.vx || 0) + (center.x - (n1.x || 0)) * 0.012;
            n1.vy = (n1.vy || 0) + (center.y - (n1.y || 0)) * 0.012;
          }
        }

        // Global Center Gravity
        n1.vx = (n1.vx || 0) - (n1.x || 0) * 0.005;
        n1.vy = (n1.vy || 0) - (n1.y || 0) * 0.005;
      }

      // Link Attraction
      graphLinks.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const dx = (target.x || 0) - (source.x || 0);
        const dy = (target.y || 0) - (source.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const diff = dist - springLength;

        const fx = (dx / dist) * diff * springStrength;
        const fy = (dy / dist) * diff * springStrength;

        source.vx = (source.vx || 0) + fx;
        source.vy = (source.vy || 0) + fy;
        target.vx = (target.vx || 0) - fx;
        target.vy = (target.vy || 0) - fy;
      });

      // Update positions
      graphNodes.forEach((node) => {
        if (draggedNodeRef.current?.id === node.id) return;
        node.vx = (node.vx || 0) * damping;
        node.vy = (node.vy || 0) * damping;
        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);
      });

      // ==========================================
      // RENDER CANVAS WITH LEVEL OF DETAIL (LOD)
      // ==========================================
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);

      // --- LOD LAYER 1: GALAXY NEBULA CLUSTER HALOS (< 0.5x) ---
      if (zoom < 0.6) {
        folderCentroids.forEach((center) => {
          const gradient = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, 220);
          gradient.addColorStop(0, center.color + '28');
          gradient.addColorStop(0.7, center.color + '0a');
          gradient.addColorStop(1, 'transparent');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(center.x, center.y, 220, 0, Math.PI * 2);
          ctx.fill();

          // Cluster Name in Galaxy View
          ctx.font = 'bold 18px Inter, sans-serif';
          ctx.fillStyle = isDark ? center.color : '#334155';
          ctx.textAlign = 'center';
          ctx.fillText(`📁 ${center.name}`, center.x, center.y - 120);
        });
      }

      // --- LAYER 2: CONNECTION LINKS ---
      graphLinks.forEach((link) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;

        const isHighlighted = hoveredNode?.id === source.id || hoveredNode?.id === target.id;

        ctx.beginPath();
        ctx.moveTo(source.x || 0, source.y || 0);
        ctx.lineTo(target.x || 0, target.y || 0);

        if (isHighlighted) {
          ctx.strokeStyle = isDark ? '#a855f7' : '#4f46e5';
          ctx.lineWidth = 3.5 / zoom;
        } else {
          ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.35)' : 'rgba(79, 70, 229, 0.22)';
          ctx.lineWidth = Math.max(1, 1.8 / Math.sqrt(zoom));
        }
        ctx.stroke();
      });

      // --- LAYER 3: NODES (LOD Scaling) ---
      graphNodes.forEach((node) => {
        const baseRadius = Math.min(22, Math.max(9, 9 + node.connectionCount * 3));
        const isHovered = hoveredNode?.id === node.id;
        const isMatch = searchQuery ? node.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;

        const nodeX = node.x || 0;
        const nodeY = node.y || 0;

        // --- MICRO DETAIL VIEW (zoom > 2.2): Render as expanded card! ---
        if (zoom > 2.2) {
          const cardW = 160;
          const cardH = 80;
          const cardX = nodeX - cardW / 2;
          const cardY = nodeY - cardH / 2;

          ctx.fillStyle = isDark ? '#1a1c24' : '#ffffff';
          ctx.strokeStyle = isHovered ? '#6366f1' : (node.folderColor || '#e2e8f0');
          ctx.lineWidth = isHovered ? 2.5 : 1.5;

          // Rounded card
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 8);
          ctx.fill();
          ctx.stroke();

          // Card folder badge
          ctx.fillStyle = node.folderColor || '#6366f1';
          ctx.beginPath();
          ctx.roundRect(cardX + 8, cardY + 8, 6, 6, 2);
          ctx.fill();

          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
          ctx.textAlign = 'left';
          ctx.fillText(node.folderName, cardX + 18, cardY + 14);

          // Card title
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
          const truncatedTitle = node.title.length > 20 ? node.title.slice(0, 18) + '...' : node.title;
          ctx.fillText(truncatedTitle, cardX + 8, cardY + 34);

          // Card meta: connections and attachments
          ctx.font = '10px Inter, sans-serif';
          ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
          ctx.fillText(`🔗 ${node.connectionCount} links · 📎 ${node.attachmentCount} files`, cardX + 8, cardY + 52);

          // Tags
          if (node.tags?.length > 0) {
            ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.fillRect(cardX + 8, cardY + 60, 50, 12);
            ctx.fillStyle = '#8b5cf6';
            ctx.fillText(`#${node.tags[0]}`, cardX + 11, cardY + 69);
          }
          return;
        }

        // --- STANDARD & GALAXY VIEW (zoom <= 2.2): Render as circular node ---
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isMatch ? (node.folderColor || '#6366f1') : (isDark ? '#27272a' : '#cbd5e1');
        ctx.fill();

        if (isHovered) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        // Title Labels (Only show if zoom >= 0.4 or if hovered or searched)
        if (zoom >= 0.4 || isHovered || (searchQuery && isMatch)) {
          const fontSize = Math.max(8, Math.min(14, 11 / Math.sqrt(zoom)));
          ctx.font = isHovered ? `bold ${fontSize}px Inter, sans-serif` : `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
          ctx.textAlign = 'center';
          ctx.fillText(node.title, nodeX, nodeY + baseRadius + fontSize + 2);
        }
      });

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, graphNodes, graphLinks, folderCentroids, zoom, pan, hoveredNode, searchQuery, repulsionStrength, clusterGravity]);

  if (!isOpen) return null;

  // Cursor-Anchored Infinite Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom multiplier
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(30.0, Math.max(0.05, zoom * factor));

    // Pan shift to anchor zoom at mouse coordinate
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Mouse / Touch Dragging and Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2 + pan.x;
    const cy = canvas.height / 2 + pan.y;

    const graphX = (clickX - cx) / zoom;
    const graphY = (clickY - cy) / zoom;

    mouseMovedDistanceRef.current = 0;

    // Hit-test nodes
    const clicked = graphNodes.find((n) => {
      const radius = Math.min(22, Math.max(9, 9 + n.connectionCount * 3));
      const dist = Math.sqrt(Math.pow((n.x || 0) - graphX, 2) + Math.pow((n.y || 0) - graphY, 2));
      return dist <= radius + 8;
    });

    if (clicked) {
      draggedNodeRef.current = clicked;
    } else {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cx = canvas.width / 2 + pan.x;
    const cy = canvas.height / 2 + pan.y;

    const graphX = (mouseX - cx) / zoom;
    const graphY = (mouseY - cy) / zoom;

    mouseMovedDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = graphX;
      draggedNodeRef.current.y = graphY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
      return;
    }

    // Hover check
    const found = graphNodes.find((n) => {
      const radius = Math.min(22, Math.max(9, 9 + n.connectionCount * 3));
      const dist = Math.sqrt(Math.pow((n.x || 0) - graphX, 2) + Math.pow((n.y || 0) - graphY, 2));
      return dist <= radius + 8;
    });

    setHoveredNode(found || null);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    draggedNodeRef.current = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only trigger navigation if barely moved (not a drag gesture)
    if (mouseMovedDistanceRef.current > 6) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2 + pan.x;
    const cy = canvas.height / 2 + pan.y;

    const graphX = (clickX - cx) / zoom;
    const graphY = (clickY - cy) / zoom;

    const clicked = graphNodes.find((n) => {
      const radius = Math.min(22, Math.max(9, 9 + n.connectionCount * 3));
      const dist = Math.sqrt(Math.pow((n.x || 0) - graphX, 2) + Math.pow((n.y || 0) - graphY, 2));
      return dist <= radius + 8;
    });

    if (clicked) {
      onSelectNote(clicked.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-card ${isFullscreen ? 'fullscreen-graph' : ''}`} 
        style={{ maxWidth: isFullscreen ? '100vw' : '1080px', height: isFullscreen ? '100vh' : '92vh', borderRadius: isFullscreen ? 0 : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Network size={20} color="var(--accent-primary)" />
            <span>Knowledge Base — Infinite Galaxy Graph</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Quick Search */}
            <div className="list-search-box" style={{ width: '200px' }}>
              <Search size={13} color="var(--text-muted)" />
              <input 
                type="text"
                placeholder="Find in galaxy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Physics Settings Toggle */}
            <button
              className={`header-btn ${showPhysicsControls ? 'highlight' : ''}`}
              onClick={() => setShowPhysicsControls(!showPhysicsControls)}
              title="Physics & Clustering Settings"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              <Sliders size={13} />
              <span>Physics</span>
            </button>

            {/* Zoom to Fit */}
            <button
              className="header-btn"
              onClick={handleZoomToFit}
              title="Zoom to fit all notes in view"
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              <Crosshair size={13} />
              <span>Fit</span>
            </button>

            {/* Fullscreen Toggle */}
            <button 
              className="editor-icon-btn" 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Graph'}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 18px', flex: 1, overflow: 'hidden' }}>
          {/* Key Metrics Bar */}
          <div className="kb-metrics-row" style={{ marginBottom: '4px' }}>
            <div className="kb-metric-card">
              <span className="kb-metric-label">Total Notes</span>
              <span className="kb-metric-value">{totalNotes}</span>
            </div>
            <div className="kb-metric-card">
              <span className="kb-metric-label">Active Links</span>
              <span className="kb-metric-value" style={{ color: 'var(--accent-primary)' }}>
                {totalLinks}
              </span>
            </div>
            <div className="kb-metric-card">
              <span className="kb-metric-label">Connected Nodes</span>
              <span className="kb-metric-value" style={{ color: 'var(--color-success)' }}>
                {connectedNodes}
              </span>
            </div>
            <div className="kb-metric-card">
              <span className="kb-metric-label">Attachments</span>
              <span className="kb-metric-value" style={{ color: 'var(--color-purple)' }}>
                {totalAttachments}
              </span>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="kb-canvas-container" style={{ flex: 1, minHeight: '400px' }}>
            <canvas 
              ref={canvasRef}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handleCanvasClick}
              style={{ cursor: hoveredNode ? 'pointer' : 'grab' }}
            />

            {/* Controls Overlay (Zoom HUD & Buttons) */}
            <div className="kb-canvas-overlay-controls">
              {/* Zoom Percentage HUD */}
              <button 
                className="zoom-hud-badge"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                title="Click to reset zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button 
                className="kb-ctrl-btn" 
                title="Zoom In (or scroll wheel up)"
                onClick={() => setZoom((z) => Math.min(30.0, z * 1.25))}
              >
                <ZoomIn size={15} />
              </button>
              <button 
                className="kb-ctrl-btn" 
                title="Zoom Out (or scroll wheel down)"
                onClick={() => setZoom((z) => Math.max(0.05, z * 0.8))}
              >
                <ZoomOut size={15} />
              </button>
              <button 
                className="kb-ctrl-btn" 
                title="Reset View"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Physics Settings Drawer */}
            {showPhysicsControls && (
              <div className="kb-physics-drawer">
                <span style={{ fontSize: '12px', fontWeight: 700 }}>Physics Controls</span>
                <label style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Repulsion Force ({repulsionStrength})</span>
                  <input
                    type="range"
                    min="500"
                    max="6000"
                    step="100"
                    value={repulsionStrength}
                    onChange={(e) => setRepulsionStrength(Number(e.target.value))}
                  />
                </label>
                <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={clusterGravity}
                    onChange={(e) => setClusterGravity(e.target.checked)}
                  />
                  <span>Cluster Notes by Folder</span>
                </label>
              </div>
            )}

            {/* Hover Tooltip Card */}
            {hoveredNode && zoom <= 2.2 && (
              <div 
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'var(--bg-modal)',
                  border: '1px solid var(--border-active)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  boxShadow: 'var(--shadow-md)',
                  pointerEvents: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  maxWidth: '260px'
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {hoveredNode.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  📁 {hoveredNode.folderName} · 🔗 {hoveredNode.connectionCount} connections
                </span>
                {hoveredNode.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    {hoveredNode.tags.map((t) => (
                      <span key={t} className="card-badge tag">#{t}</span>
                    ))}
                  </div>
                )}
                <span style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: '4px' }}>
                  Click to open note ↗
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
