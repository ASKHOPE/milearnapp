import React, { useState, useEffect, useRef } from 'react';
import calculator from '../services/calculator';
import type { Attachment } from '../types';
import { 
  Sigma, 
  Calculator, 
  TrendingUp, 
  Check, 
  X, 
  Copy, 
  Play, 
  Sparkles,
  BookOpen
} from 'lucide-react';

interface MathGraphStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoNote: (content: string) => void;
  onSaveAttachment?: (attachment: Attachment) => void;
}

const PRESET_CURVES = [
  { label: 'Parabola', latex: 'y=x^2', desc: 'Quadratic Polynomial' },
  { label: 'Sine Wave', latex: 'y=\\sin(x)', desc: 'Harmonic Oscillation' },
  { label: 'Sigmoid', latex: 'y=\\frac{1}{1+e^{-x}}', desc: 'Logistic Activation' },
  { label: 'Gaussian', latex: 'y=e^{-x^2}', desc: 'Normal Distribution' },
  { label: 'Cardioid', latex: 'r=1+\\cos(\\theta)', desc: 'Polar Curve' },
  { label: 'Ellipse', latex: '\\frac{x^2}{9}+\\frac{y^2}{4}=1', desc: 'Conic Section' }
];

export const MathGraphStudioModal: React.FC<MathGraphStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoNote,
  onSaveAttachment
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'calc'>('graph');
  
  // Graphing State
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const desmosCalcRef = useRef<any>(null);
  const [selectedPreset, setSelectedPreset] = useState('y=x^2');
  const [customEquation, setCustomEquation] = useState('y = x^2 - 4');
  const [isDesmosLoaded, setIsDesmosLoaded] = useState(false);

  // Advanced Calculator State
  const [calcExpr, setCalcExpr] = useState('2 * (3.5 + 4.5)^2 / 8');
  const [calcResult, setCalcResult] = useState<string | number>('16');
  const [calcCategory, setCalcCategory] = useState<'eval' | 'geometry' | 'quad' | 'coords'>('eval');

  // Geometry Toolkit inputs
  const [radius, setRadius] = useState<number>(5);
  const [geomHeight, setGeomHeight] = useState<number>(10);
  const [geomWidth, setGeomWidth] = useState<number>(8);

  // Quadratic solver inputs
  const [quadA, setQuadA] = useState<number>(1);
  const [quadB, setQuadB] = useState<number>(-5);
  const [quadC, setQuadC] = useState<number>(6);

  // Coordinate math inputs
  const [x1, setX1] = useState<number>(0);
  const [y1, setY1] = useState<number>(0);
  const [x2, setX2] = useState<number>(4);
  const [y2, setY2] = useState<number>(3);

  // Initialize Desmos in Graph tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'graph') return;

    let isMounted = true;

    const initDesmos = () => {
      if (!graphContainerRef.current) return;
      const Desmos = (window as any).Desmos;

      if (Desmos && Desmos.GraphingCalculator) {
        if (!desmosCalcRef.current) {
          try {
            graphContainerRef.current.innerHTML = '';
            const calc = Desmos.GraphingCalculator(graphContainerRef.current, {
              keypad: true,
              expressions: true,
              settingsMenu: true,
              zoomButtons: true,
              border: false
            });
            desmosCalcRef.current = calc;
            calc.setExpression({ id: 'fn1', latex: selectedPreset });
            if (isMounted) setIsDesmosLoaded(true);
          } catch (e) {
            console.error('Error instantiating Desmos:', e);
          }
        }
      }
    };

    // Check if Desmos script is already loaded
    if ((window as any).Desmos) {
      initDesmos();
    } else {
      const existingScript = document.getElementById('desmos-api-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'desmos-api-script';
        script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
        script.async = true;
        script.onload = () => {
          if (isMounted) initDesmos();
        };
        document.body.appendChild(script);
      } else {
        existingScript.addEventListener('load', initDesmos);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, activeTab, selectedPreset]);

  if (!isOpen) return null;

  // Apply preset curve to Desmos
  const handleSelectPreset = (latex: string) => {
    setSelectedPreset(latex);
    if (desmosCalcRef.current) {
      desmosCalcRef.current.setExpression({ id: 'fn1', latex });
    }
  };

  // Plot custom equation
  const handlePlotCustom = () => {
    if (!customEquation.trim()) return;
    if (desmosCalcRef.current) {
      desmosCalcRef.current.setExpression({ id: 'custom_fn', latex: customEquation.trim() });
    }
  };

  // Evaluate general expression using advanced-calculator
  const handleEvaluateExpr = () => {
    try {
      const res = calculator.evaluate(calcExpr);
      setCalcResult(res);
    } catch {
      setCalcResult('Error in expression');
    }
  };

  // Insert formula directly into active note
  const handleInsertFormulaToNote = (formula: string) => {
    const formatted = `\n$$\n${formula}\n$$\n`;
    onInsertIntoNote(formatted);
    onClose();
  };

  // Screenshot and attach graph image
  const handleAttachGraphScreenshot = () => {
    if (desmosCalcRef.current && onSaveAttachment) {
      try {
        desmosCalcRef.current.asyncScreenshot(
          { width: 700, height: 450, targetPixelRatio: 2 },
          (dataUrl: string) => {
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
            const attachment: Attachment = {
              id: 'graph-' + Math.random().toString(36).substr(2, 9),
              name: `Math-Graph-${timestamp}.png`,
              type: 'image',
              size: Math.round(dataUrl.length * 0.75),
              mimeType: 'image/png',
              dataUrl,
              createdAt: new Date().toISOString()
            };
            onSaveAttachment(attachment);
            onClose();
          }
        );
      } catch (err) {
        console.error('Screenshot error:', err);
      }
    } else {
      handleInsertFormulaToNote(selectedPreset);
    }
  };

  // Insert solver computation result into note
  const handleInsertCalcResult = (title: string, formulaStr: string, resultVal: any) => {
    const md = `\n> **${title}**\n> Formula: \`${formulaStr}\`\n> **Result:** \`${resultVal}\`\n\n`;
    onInsertIntoNote(md);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: '1240px',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* Header Bar with Dual Tabs */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sigma size={20} color="var(--accent-primary)" />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Math & Graphing Studio</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="tab-row-pill-group">
              <button
                type="button"
                className={`tab-row-pill ${activeTab === 'graph' ? 'active' : ''}`}
                onClick={() => setActiveTab('graph')}
              >
                <TrendingUp size={13} />
                <span>2D Interactive Grapher (Desmos)</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${activeTab === 'calc' ? 'active' : ''}`}
                onClick={() => setActiveTab('calc')}
              >
                <Calculator size={13} />
                <span>Scientific Solver (Advanced Calculator)</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'graph' && (
              <>
                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={() => handleInsertFormulaToNote(selectedPreset)}
                  title="Insert LaTeX formula into note"
                >
                  <Copy size={14} />
                  <span style={{ fontSize: '11px', marginLeft: '4px' }}>Formula</span>
                </button>
                <button
                  type="button"
                  className="btn-new-note"
                  onClick={handleAttachGraphScreenshot}
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                  title="Attach graph image to active note"
                >
                  <Check size={14} />
                  <span>Attach Graph to Note</span>
                </button>
              </>
            )}

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab 1: Desmos 2D Graphing Calculator */}
        {activeTab === 'graph' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar with Presets & Formula Input */}
            <div 
              style={{
                width: '320px',
                borderRight: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Function Presets
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {PRESET_CURVES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p.latex)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: selectedPreset === p.latex ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                        border: selectedPreset === p.latex ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                        <code style={{ fontSize: '11px', color: 'var(--accent-primary)' }}>{p.latex}</code>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  Custom Equation
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <input
                    type="text"
                    value={customEquation}
                    onChange={(e) => setCustomEquation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlotCustom()}
                    placeholder="e.g. y = x^3 - 2x"
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    className="btn-create-note-compact"
                    onClick={handlePlotCustom}
                    title="Plot on graph"
                  >
                    <Play size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desmos Interactive Canvas Container */}
            <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
              <div 
                ref={graphContainerRef} 
                style={{ width: '100%', height: '100%' }} 
              />
              {!isDesmosLoaded && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-muted)'
                  }}
                >
                  <Sparkles size={24} color="var(--accent-primary)" />
                  <span style={{ fontSize: '13px' }}>Initializing Desmos Graphing Engine...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Scientific Solver powered by advanced-calculator */}
        {activeTab === 'calc' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Toolkit category selector */}
            <div 
              style={{
                width: '260px',
                borderRight: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                Calculator Toolkits
              </span>
              
              <button
                type="button"
                className={`tab-row-pill ${calcCategory === 'eval' ? 'active' : ''}`}
                onClick={() => setCalcCategory('eval')}
                style={{ padding: '8px 12px', justifyContent: 'flex-start' }}
              >
                <Calculator size={14} />
                <span>Expression Evaluator</span>
              </button>
              
              <button
                type="button"
                className={`tab-row-pill ${calcCategory === 'geometry' ? 'active' : ''}`}
                onClick={() => setCalcCategory('geometry')}
                style={{ padding: '8px 12px', justifyContent: 'flex-start' }}
              >
                <BookOpen size={14} />
                <span>2D & 3D Geometry</span>
              </button>

              <button
                type="button"
                className={`tab-row-pill ${calcCategory === 'quad' ? 'active' : ''}`}
                onClick={() => setCalcCategory('quad')}
                style={{ padding: '8px 12px', justifyContent: 'flex-start' }}
              >
                <Sigma size={14} />
                <span>Quadratic & Parabola</span>
              </button>

              <button
                type="button"
                className={`tab-row-pill ${calcCategory === 'coords' ? 'active' : ''}`}
                onClick={() => setCalcCategory('coords')}
                style={{ padding: '8px 12px', justifyContent: 'flex-start' }}
              >
                <TrendingUp size={14} />
                <span>Coordinates & Slopes</span>
              </button>
            </div>

            {/* Toolkit Active Panel */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: 'var(--bg-primary)' }}>
              {/* Category 1: Freeform Expression Evaluator */}
              {calcCategory === 'eval' && (
                <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Expression Evaluator (Shunting-Yard Engine)</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Evaluates mathematical expressions respecting standard arithmetic precedence, exponents, parentheses, and roots.
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={calcExpr}
                      onChange={(e) => setCalcExpr(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEvaluateExpr()}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      className="btn-create-note-compact"
                      onClick={handleEvaluateExpr}
                      style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                      <span>Calculate</span>
                    </button>
                  </div>

                  {/* Result Card */}
                  <div 
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Result</span>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '2px' }}>
                        {calcResult}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-small-primary"
                      onClick={() => handleInsertCalcResult('Expression Evaluation', calcExpr, calcResult)}
                    >
                      <Check size={13} />
                      <span>Insert into Note</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Category 2: 2D & 3D Geometry */}
              {calcCategory === 'geometry' && (
                <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>2D & 3D Geometric Formulas</h4>
                  
                  {/* Inputs */}
                  <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Radius (r)</label>
                      <input 
                        type="number" 
                        value={radius} 
                        onChange={(e) => setRadius(parseFloat(e.target.value) || 0)} 
                        style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Height (h)</label>
                      <input 
                        type="number" 
                        value={geomHeight} 
                        onChange={(e) => setGeomHeight(parseFloat(e.target.value) || 0)} 
                        style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Width / Base (w)</label>
                      <input 
                        type="number" 
                        value={geomWidth} 
                        onChange={(e) => setGeomWidth(parseFloat(e.target.value) || 0)} 
                        style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  {/* Calculations Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Circle Area (πr²)</span>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary)', margin: '4px 0' }}>
                        {calculator.circleArea(radius)}
                      </div>
                      <button 
                        type="button" 
                        className="btn-small-ghost" 
                        style={{ fontSize: '11px' }}
                        onClick={() => handleInsertCalcResult('Circle Area', `π * (${radius})²`, calculator.circleArea(radius))}
                      >
                        Insert to Note
                      </button>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Sphere Volume (4/3 πr³)</span>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                        {calculator.sphereVolume(radius)}
                      </div>
                      <button 
                        type="button" 
                        className="btn-small-ghost" 
                        style={{ fontSize: '11px' }}
                        onClick={() => handleInsertCalcResult('Sphere Volume', `(4/3) * π * (${radius})³`, calculator.sphereVolume(radius))}
                      >
                        Insert to Note
                      </button>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Cylinder Volume (πr²h)</span>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59e0b', margin: '4px 0' }}>
                        {calculator.cylinderVolume(radius, geomHeight)}
                      </div>
                      <button 
                        type="button" 
                        className="btn-small-ghost" 
                        style={{ fontSize: '11px' }}
                        onClick={() => handleInsertCalcResult('Cylinder Volume', `π * (${radius})² * ${geomHeight}`, calculator.cylinderVolume(radius, geomHeight))}
                      >
                        Insert to Note
                      </button>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Cone Volume (1/3 πr²h)</span>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#8b5cf6', margin: '4px 0' }}>
                        {calculator.coneVolume(radius, geomHeight)}
                      </div>
                      <button 
                        type="button" 
                        className="btn-small-ghost" 
                        style={{ fontSize: '11px' }}
                        onClick={() => handleInsertCalcResult('Cone Volume', `(1/3) * π * (${radius})² * ${geomHeight}`, calculator.coneVolume(radius, geomHeight))}
                      >
                        Insert to Note
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Category 3: Quadratic Formula & Parabola */}
              {calcCategory === 'quad' && (
                <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Quadratic Equations: ax² + bx + c = 0</h4>
                  
                  <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>a</label>
                      <input 
                        type="number" 
                        value={quadA} 
                        onChange={(e) => setQuadA(parseFloat(e.target.value) || 1)} 
                        style={{ width: '80px', padding: '6px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>b</label>
                      <input 
                        type="number" 
                        value={quadB} 
                        onChange={(e) => setQuadB(parseFloat(e.target.value) || 0)} 
                        style={{ width: '80px', padding: '6px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>c</label>
                      <input 
                        type="number" 
                        value={quadC} 
                        onChange={(e) => setQuadC(parseFloat(e.target.value) || 0)} 
                        style={{ width: '80px', padding: '6px', borderRadius: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Discriminant (b² - 4ac)</span>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', margin: '4px 0 12px 0' }}>
                      {calculator.discriminant(quadA, quadB, quadC)}
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Roots & Factoring</span>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', margin: '4px 0' }}>
                      {calculator.quadraticFormula(quadA, quadB, quadC)}
                    </div>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>Vertex Form</span>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 12px 0' }}>
                      {calculator.vertexParabolaStandardForm(quadA, quadB, quadC)}
                    </div>

                    <button 
                      type="button" 
                      className="btn-small-primary"
                      onClick={() => handleInsertCalcResult(
                        'Quadratic Solution', 
                        `${quadA}x² + (${quadB})x + (${quadC}) = 0`, 
                        calculator.quadraticFormula(quadA, quadB, quadC)
                      )}
                    >
                      Insert Solution to Note
                    </button>
                  </div>
                </div>
              )}

              {/* Category 4: Coordinates & Slopes */}
              {calcCategory === 'coords' && (
                <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>2D Coordinate Geometry</h4>

                  <div style={{ display: 'flex', gap: '14px', background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>Point 1 (x1, y1)</span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <input type="number" value={x1} onChange={(e) => setX1(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px', borderRadius: '4px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                        <input type="number" value={y1} onChange={(e) => setY1(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px', borderRadius: '4px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Point 2 (x2, y2)</span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <input type="number" value={x2} onChange={(e) => setX2(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px', borderRadius: '4px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                        <input type="number" value={y2} onChange={(e) => setY2(parseFloat(e.target.value) || 0)} style={{ width: '60px', padding: '4px', borderRadius: '4px', background: '#000', color: '#fff', border: '1px solid #333' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Euclidean Distance</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', margin: '4px 0' }}>
                        {calculator.distanceBetweenTwoPoints(x1, y1, x2, y2)}
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Slope (m)</span>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', margin: '4px 0' }}>
                        {calculator.slopeFromPoints(y2, y1, x2, x1)}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn-small-primary"
                    onClick={() => handleInsertCalcResult(
                      'Distance & Slope', 
                      `(${x1}, ${y1}) to (${x2}, ${y2})`, 
                      `Distance = ${calculator.distanceBetweenTwoPoints(x1, y1, x2, y2)}, Slope = ${calculator.slopeFromPoints(y2, y1, x2, x1)}`
                    )}
                  >
                    Insert Distance & Slope to Note
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
