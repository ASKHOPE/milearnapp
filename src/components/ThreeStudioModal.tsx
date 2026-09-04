import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Attachment } from '../types';
import { 
  Box, 
  RotateCw, 
  Check, 
  X, 
  Layers
} from 'lucide-react';

interface ThreeStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAttachment: (attachment: Attachment) => void;
}

type ModelPreset = 'torusKnot' | 'dodecahedron' | 'icosahedron' | 'dna' | 'cylinder';

export const ThreeStudioModal: React.FC<ThreeStudioModalProps> = ({
  isOpen,
  onClose,
  onSaveAttachment
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [preset, setPreset] = useState<ModelPreset>('torusKnot');
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [colorTheme, setColorTheme] = useState('#6366f1');

  // Mouse drag rotation state
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0e14');
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 4.5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 1.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Geometry based on preset
    let geometry: THREE.BufferGeometry;
    if (preset === 'torusKnot') {
      geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32);
    } else if (preset === 'dodecahedron') {
      geometry = new THREE.DodecahedronGeometry(1.4);
    } else if (preset === 'icosahedron') {
      geometry = new THREE.IcosahedronGeometry(1.4, 1);
    } else if (preset === 'cylinder') {
      geometry = new THREE.CylinderGeometry(0.8, 0.8, 2.2, 32);
    } else {
      geometry = new THREE.TorusGeometry(1.2, 0.4, 24, 64);
    }

    const material = new THREE.MeshStandardMaterial({
      color: colorTheme,
      roughness: 0.25,
      metalness: 0.7,
      wireframe
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (meshRef.current && autoRotate) {
        meshRef.current.rotation.x += 0.005;
        meshRef.current.rotation.y += 0.009;
      }
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [isOpen, preset, wireframe, autoRotate, colorTheme]);

  if (!isOpen) return null;

  // Mouse Drag Interaction for Manual Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !meshRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    meshRef.current.rotation.y += deltaX * 0.01;
    meshRef.current.rotation.x += deltaY * 0.01;

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Snapshot & Attach to Note
  const handleAttachSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

    const attachment: Attachment = {
      id: '3d-' + Math.random().toString(36).substr(2, 9),
      name: `3D-Model-${preset}-${timestamp}.png`,
      type: 'image',
      size: Math.round(dataUrl.length * 0.75),
      mimeType: 'image/png',
      dataUrl,
      createdAt: new Date().toISOString()
    };

    onSaveAttachment(attachment);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '88vw',
          maxWidth: '1100px',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* Header */}
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
            <Box size={20} color="var(--accent-primary)" />
            <span style={{ fontSize: '15px', fontWeight: 700 }}>3D Interactive Geometry Studio</span>
            <span style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Three.js WebGL
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Presets */}
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as any)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="torusKnot">Torus Knot (Topology)</option>
              <option value="dodecahedron">Dodecahedron (12-Face Polyhedron)</option>
              <option value="icosahedron">Icosahedron (20-Face Polyhedron)</option>
              <option value="cylinder">Cylinder (3D Solid)</option>
            </select>

            {/* Wireframe toggle */}
            <button
              type="button"
              className={`sketch-tool-btn ${wireframe ? 'active' : ''}`}
              onClick={() => setWireframe(!wireframe)}
              title="Toggle Wireframe Mesh"
              style={{ padding: '5px 10px' }}
            >
              <Layers size={14} />
              <span style={{ fontSize: '11px' }}>Wireframe</span>
            </button>

            {/* Auto-rotate toggle */}
            <button
              type="button"
              className={`sketch-tool-btn ${autoRotate ? 'active' : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto Rotation"
              style={{ padding: '5px 10px' }}
            >
              <RotateCw size={14} />
              <span style={{ fontSize: '11px' }}>Rotate</span>
            </button>

            {/* Color swatches */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTheme(c)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: colorTheme === c ? '2px solid #ffffff' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn-new-note"
              onClick={handleAttachSnapshot}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              title="Attach 3D rendering to note"
            >
              <Check size={14} />
              <span>Attach to Note</span>
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div 
          ref={mountRef} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ flex: 1, width: '100%', height: '100%', cursor: 'grab', position: 'relative' }}
        />
      </div>
    </div>
  );
};
