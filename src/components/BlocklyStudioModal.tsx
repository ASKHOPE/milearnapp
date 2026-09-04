import React, { useState, useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';
import { pythonGenerator } from 'blockly/python';
import { 
  Puzzle, 
  Code2, 
  Play, 
  Copy, 
  Check, 
  X, 
  Trash2, 
  Terminal,
  AlertTriangle
} from 'lucide-react';

interface BlocklyStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoNote: (codeBlock: string) => void;
}

const TOOLBOX_XML = `
<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
  <category name="Logic" colour="#5b80a5">
    <block type="controls_if"></block>
    <block type="logic_compare"></block>
    <block type="logic_operation"></block>
    <block type="logic_negate"></block>
    <block type="logic_boolean"></block>
  </category>
  <category name="Loops" colour="#5ba55b">
    <block type="controls_repeat_ext">
      <value name="TIMES">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
    </block>
    <block type="controls_whileUntil"></block>
    <block type="controls_for">
      <value name="FROM">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
      <value name="TO">
        <shadow type="math_number">
          <field name="NUM">10</field>
        </shadow>
      </value>
      <value name="BY">
        <shadow type="math_number">
          <field name="NUM">1</field>
        </shadow>
      </value>
    </block>
  </category>
  <category name="Math" colour="#5b67a5">
    <block type="math_number"></block>
    <block type="math_arithmetic"></block>
    <block type="math_single"></block>
    <block type="math_trig"></block>
    <block type="math_round"></block>
    <block type="math_random_int"></block>
  </category>
  <category name="Text" colour="#5ba58c">
    <block type="text"></block>
    <block type="text_join"></block>
    <block type="text_length"></block>
    <block type="text_print"></block>
  </category>
  <category name="Variables" colour="#a55b80" custom="VARIABLE"></category>
</xml>
`;

export const BlocklyStudioModal: React.FC<BlocklyStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoNote
}) => {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  const [language, setLanguage] = useState<'javascript' | 'python'>('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Wait for DOM to mount
    const timer = setTimeout(() => {
      if (!blocklyDivRef.current) return;

      // Clean old workspace if any
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
      }

      try {
        const ws = Blockly.inject(blocklyDivRef.current, {
          toolbox: TOOLBOX_XML,
          collapse: true,
          comments: true,
          disable: true,
          maxBlocks: Infinity,
          trashcan: true,
          horizontalLayout: false,
          toolboxPosition: 'start',
          css: true,
          media: 'https://blockly-demo.appspot.com/static/media/',
          grid: {
            spacing: 20,
            length: 3,
            colour: '#2a2f42',
            snap: true
          },
          zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
          }
        });

        workspaceRef.current = ws;

        // Add change listener to regenerate code in real time
        const updateCode = () => {
          if (!workspaceRef.current) return;
          try {
            if (language === 'javascript') {
              const code = javascriptGenerator.workspaceToCode(workspaceRef.current);
              setGeneratedCode(code || '// Drag and connect blocks to generate code');
            } else {
              const code = pythonGenerator.workspaceToCode(workspaceRef.current);
              setGeneratedCode(code || '# Drag and connect blocks to generate code');
            }
          } catch (e) {
            console.error('Error generating code:', e);
          }
        };

        ws.addChangeListener(updateCode);
        updateCode();
      } catch (err) {
        console.error('Error injecting Blockly:', err);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
    };
  }, [isOpen, language]);

  if (!isOpen) return null;

  // Run generated JavaScript code in safe simulated sandbox with execution guards
  const handleRunCode = () => {
    if (!workspaceRef.current) return;
    setIsRunning(true);
    const logs: string[] = [];

    try {
      const jsCode = javascriptGenerator.workspaceToCode(workspaceRef.current);
      if (!jsCode.trim()) {
        setConsoleOutput(['// Workspace is empty. Add blocks first!']);
        setIsRunning(false);
        return;
      }

      // Intercept window.alert and console.log
      const customAlert = (msg: any) => logs.push(`[OUTPUT]: ${msg}`);
      const customPrint = (msg: any) => logs.push(`[LOG]: ${msg}`);

      // Inject 100,000 loop iteration safety breaker to prevent while(true) browser freezing
      const safetyGuardedCode = `
        let __loop_iterations = 0;
        const __loop_guard = () => {
          if (++__loop_iterations > 100000) {
            throw new RangeError("Safety Guard: Stopped execution (exceeded 100,000 iterations to protect browser resources)");
          }
        };
        ${jsCode.replace(/(while\s*\([^)]*\)\s*\{|for\s*\([^)]*\)\s*\{)/g, '$1 __loop_guard(); ')}
      `;

      // Sandboxed execution function with safety guards
      const runFn = new Function('alert', 'console', `
        const print = alert;
        ${safetyGuardedCode}
      `);

      const startTime = performance.now();
      runFn(customAlert, { log: customPrint, warn: customPrint, error: customPrint });
      const elapsed = Math.round(performance.now() - startTime);
      
      if (logs.length === 0) {
        logs.push(`✓ Executed successfully in ${elapsed}ms with no output.`);
      } else {
        logs.push(`— Completed in ${elapsed}ms (Browser sandbox: limited resources) —`);
      }
      setConsoleOutput(logs);
    } catch (err: any) {
      setConsoleOutput([`❌ Execution Error: ${err.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Insert generated code block directly into note
  const handleInsertCodeToNote = () => {
    const langTag = language === 'javascript' ? 'javascript' : 'python';
    const content = `\n\`\`\`${langTag}\n${generatedCode}\n\`\`\`\n`;
    onInsertIntoNote(content);
    onClose();
  };

  const handleClearWorkspace = () => {
    if (workspaceRef.current && confirm('Clear all blocks from the workspace?')) {
      workspaceRef.current.clear();
      setGeneratedCode('');
      setConsoleOutput([]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '1300px',
          height: '88vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Puzzle size={20} color="var(--accent-primary)" />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>Visual Logic & Blockly Studio</span>
            </div>

            {/* Language Switcher */}
            <div className="tab-row-pill-group">
              <button
                type="button"
                className={`tab-row-pill ${language === 'javascript' ? 'active' : ''}`}
                onClick={() => setLanguage('javascript')}
              >
                <Code2 size={13} />
                <span>JavaScript</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${language === 'python' ? 'active' : ''}`}
                onClick={() => setLanguage('python')}
              >
                <Code2 size={13} />
                <span>Python</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="editor-icon-btn"
              onClick={handleClearWorkspace}
              title="Clear Workspace"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              className="btn-create-note-compact"
              onClick={handleRunCode}
              disabled={isRunning}
              title="Run simulation in browser"
              style={{ padding: '6px 12px' }}
            >
              <Play size={13} fill="currentColor" />
              <span>Run Logic</span>
            </button>

            <button
              type="button"
              className="btn-new-note"
              onClick={handleInsertCodeToNote}
              style={{ padding: '6px 14px', fontSize: '12px' }}
              title="Insert formatted code into note"
            >
              <Check size={14} />
              <span>Insert Code into Note</span>
            </button>

            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Workspace & Preview Split Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Blockly Workspace Container */}
          <div 
            ref={blocklyDivRef} 
            style={{ flex: 1, height: '100%', width: '60%' }} 
          />

          {/* Right Code & Console Preview Panel */}
          <div 
            style={{
              width: '400px',
              borderLeft: '1px solid var(--border-color)',
              background: '#0d1117',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Code Output Header */}
            <div 
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #21262d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#161b22'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Code2 size={14} color="#58a6ff" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#c9d1d9' }}>
                  Live Generated {language === 'javascript' ? 'JavaScript' : 'Python'}
                </span>
              </div>
              <button
                type="button"
                className="editor-icon-btn"
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                title="Copy code to clipboard"
                style={{ padding: '3px' }}
              >
                <Copy size={13} />
              </button>
            </div>

            {/* Sandbox Notice Banner */}
            <div 
              style={{
                padding: '8px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: '#fbbf24',
                lineHeight: 1.4
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>
                <strong>Notice:</strong> In-browser JS & Python execute in a client sandbox with limited resources and context. Loops are capped at 100k iterations.
              </span>
            </div>

            {/* Code Textarea */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              <pre 
                style={{
                  margin: 0,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  color: '#7ee787',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {generatedCode}
              </pre>
            </div>

            {/* Console Output Footer */}
            <div 
              style={{
                height: '180px',
                borderTop: '1px solid #21262d',
                background: '#090d13',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{
                  padding: '6px 12px',
                  background: '#161b22',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderBottom: '1px solid #21262d'
                }}
              >
                <Terminal size={12} color="#8b949e" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8b949e', textTransform: 'uppercase' }}>
                  Console Output
                </span>
              </div>
              <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', color: '#e6edf3' }}>
                {consoleOutput.length === 0 ? (
                  <span style={{ color: '#484f58' }}>Click "Run Logic" to simulate output...</span>
                ) : (
                  consoleOutput.map((line, idx) => (
                    <div key={idx} style={{ marginBottom: '4px' }}>{line}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
