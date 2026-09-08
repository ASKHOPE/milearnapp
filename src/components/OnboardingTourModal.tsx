import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Database,
  Layers,
  Brain,
  Code2,
  Command,
  ChevronRight,
  ChevronLeft,
  X,
  BookOpen,
  Palette,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  ExternalLink
} from 'lucide-react';

export interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettingsGuide?: () => void;
  onStartWithCleanSlate?: () => Promise<void> | void;
}

interface TourSlide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  features: {
    icon: React.ReactNode;
    title: string;
    description: string;
    tag?: string;
  }[];
  previewBox?: {
    type: 'code' | 'diagram' | 'quote' | 'stats';
    header: string;
    content: React.ReactNode;
  };
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onOpenSettingsGuide,
  onStartWithCleanSlate
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [starterChoice, setStarterChoice] = useState<'sample' | 'clean'>('sample');
  const [isApplyingChoice, setIsApplyingChoice] = useState(false);

  const slides: TourSlide[] = [
    {
      id: 'local-first',
      badge: 'Architecture',
      badgeColor: '#10b981',
      title: 'Welcome to MiLEARNAPP',
      subtitle: 'Your 100% Private, Local-First Personal Knowledge Workstation',
      icon: <ShieldCheck size={32} color="#10b981" />,
      features: [
        {
          icon: <Database size={18} color="#10b981" />,
          title: 'True Local Data Ownership',
          description: 'All your notes, sketches, and flashcards stay on your machine in IndexedDB and your local PostgreSQL 16 Docker container.'
        },
        {
          icon: <Zap size={18} color="#f59e0b" />,
          title: 'Zero Logins or Cloud Tracking',
          description: 'No passwords or mandatory accounts. You launch the app and land directly in your workstation with instant read/write latency.'
        },
        {
          icon: <ShieldCheck size={18} color="#6366f1" />,
          title: 'Zero-Knowledge Note Locking',
          description: 'Encrypt sensitive documents with military-grade AES-GCM-256 and PBKDF2 passphrases that never leave your device.'
        }
      ],
      previewBox: {
        type: 'stats',
        header: 'Local-First Engine Status',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Primary Storage:</span>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Browser IndexedDB (Instant)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Relational SQL:</span>
              <span style={{ color: '#6366f1', fontWeight: 600 }}>PostgreSQL 16 (Docker :5432)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Telemetry / Telemetry Trackers:</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>None (Zero)</span>
            </div>
          </div>
        )
      }
    },
    {
      id: 'hierarchy',
      badge: 'Organization',
      badgeColor: '#6366f1',
      title: 'Workspaces, Books & Deep Hierarchy',
      subtitle: 'Organize your intellectual work across multi-tier structures',
      icon: <Layers size={32} color="#6366f1" />,
      features: [
        {
          icon: <Layers size={18} color="#6366f1" />,
          title: 'Isolated Context Workspaces',
          description: 'Switch between Personal, Systems Architecture, and Research vaults with one click without mixing projects.'
        },
        {
          icon: <BookOpen size={18} color="#8b5cf6" />,
          title: 'Multi-Chapter Books & Notebooks',
          description: 'Write coherent long-form books with sequential chapter ordering, parent-child sub-pages, and unified reading mode.'
        },
        {
          icon: <Palette size={18} color="#ec4899" />,
          title: 'Color-Coded Nested Folders',
          description: 'Infinitely nested folder trees with custom emoji badges, pinning, favorites, and drag-and-drop hierarchy.'
        }
      ],
      previewBox: {
        type: 'diagram',
        header: 'Hierarchy Architecture',
        content: (
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <span style={{ color: '#6366f1' }}>💼 Workspace (Personal / Systems)</span><br />
            &nbsp;&nbsp;└── <span style={{ color: '#8b5cf6' }}>📖 Book: Local-First Engineering</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├── 📄 Ch 1: State Replication<br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── 📄 Ch 2: CRDTs &amp; IndexedDB<br />
            &nbsp;&nbsp;└── <span style={{ color: '#10b981' }}>📁 Folder: Mathematics &amp; Physics</span>
          </div>
        )
      }
    },
    {
      id: 'markdown-math',
      badge: 'Editor & Scientific Math',
      badgeColor: '#0ea5e9',
      title: 'Dual-Pane Markdown & LaTeX',
      subtitle: 'Write notes with instant split-pane preview and scientific precision',
      icon: <Code2 size={32} color="#0ea5e9" />,
      features: [
        {
          icon: <Zap size={18} color="#0ea5e9" />,
          title: 'Live Split-Screen Dual Editor',
          description: 'Press Cmd+E or Ctrl+E to split your view: write raw Markdown on the left while reading real-time rendered preview on the right.'
        },
        {
          icon: <Sparkles size={18} color="#f59e0b" />,
          title: 'Full KaTeX Math Rendering',
          description: 'Enclose formulas in $ for inline equations ($E = mc^2$) or $$ for display blocks with full calculus & tensor matrices.'
        },
        {
          icon: <Code2 size={18} color="#ec4899" />,
          title: 'Interactive Mermaid Diagrams',
          description: 'Embed flowcharts, sequence diagrams, and architecture topologies with ```mermaid code blocks or the AI Diagram tool.'
        }
      ],
      previewBox: {
        type: 'code',
        header: 'Scientific KaTeX & Mermaid Syntax',
        content: (
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <span style={{ color: '#10b981' }}>// Display LaTeX Math formula:</span><br />
            {'$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$'}<br /><br />
            <span style={{ color: '#6366f1' }}>// Architecture Mermaid graph:</span><br />
            {'```mermaid'}<br />
            {'graph LR; Client[IndexedDB] -->|Sync| PG[(Postgres 16)]'}<br />
            {'```'}
          </div>
        )
      }
    },
    {
      id: 'flashcards',
      badge: 'Active Recall',
      badgeColor: '#8b5cf6',
      title: 'Active Recall & Spaced Repetition',
      subtitle: 'Automatically convert notes into flashcards with SuperMemo-2',
      icon: <Brain size={32} color="#8b5cf6" />,
      features: [
        {
          icon: <Brain size={18} color="#8b5cf6" />,
          title: 'Zero-Friction In-Note Extraction',
          description: 'No manual card decks needed! Write Q: ... A: ..., Concept::Definition, or [Cloze deletions] anywhere in your notes.'
        },
        {
          icon: <Clock size={18} color="#10b981" />,
          title: 'SuperMemo-2 (SM-2) Scheduling',
          description: 'The learning engine calculates optimal review intervals (Again, Hard, Good, Easy) based on your retention history.'
        },
        {
          icon: <Layers size={18} color="#6366f1" />,
          title: 'Study Studio with Flip Cards',
          description: 'Launch the dedicated study viewer from the top toolbar to test your memory across books, folders, or workspaces.'
        }
      ],
      previewBox: {
        type: 'code',
        header: 'Auto-Card Extraction Syntax',
        content: (
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <span style={{ color: '#f59e0b' }}>Q:</span> What is the Raft consensus algorithm?<br />
            <span style={{ color: '#10b981' }}>A:</span> A leader-based consensus algorithm for replicated logs.<br /><br />
            <span style={{ color: '#8b5cf6' }}>CRDT</span>::Conflict-free Replicated Data Type<br />
            The capital of Japan is <span style={{ color: '#ec4899', fontWeight: 600 }}>[Tokyo]</span>.
          </div>
        )
      }
    },
    {
      id: 'studios',
      badge: 'Creative Suites',
      badgeColor: '#ec4899',
      title: '7 Multimodal Creative Studios',
      subtitle: 'Specialized toolkits directly accessible from your top toolbar',
      icon: <Palette size={32} color="#ec4899" />,
      features: [
        {
          icon: <Palette size={18} color="#ec4899" />,
          title: 'Apple Sketchpad & 3D Studio',
          description: 'Smooth vector inking for freehand handwritten notes, plus interactive Three.js 3D mesh modeling and inspection.'
        },
        {
          icon: <Code2 size={18} color="#0ea5e9" />,
          title: 'Desmos Math & Blockly Coder',
          description: 'Plot trigonometric and polynomial curves with Desmos, or generate Python and JavaScript algorithms visually with Blockly.'
        },
        {
          icon: <BookOpen size={18} color="#f59e0b" />,
          title: 'OCR Scanner, Citations & Clipper',
          description: 'Extract text from screenshots with on-device OCR, format BibTeX/APA references with Citation.js, and clip clean web articles.'
        }
      ],
      previewBox: {
        type: 'stats',
        header: 'Available In Header Tools Tray (📐)',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎨 Drawing Canvas
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧊 3D Three.js Studio
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📈 Desmos Grapher
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🧩 Blockly Studio
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📷 OCR Scanner
            </div>
            <div style={{ padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📚 Citations Manager
            </div>
          </div>
        )
      }
    },
    {
      id: 'power-tools',
      badge: 'Productivity',
      badgeColor: '#f59e0b',
      title: 'Power Hotkeys & Focus Protocol',
      subtitle: 'Supercharge your daily workflow with keyboard-first speed',
      icon: <Command size={32} color="#f59e0b" />,
      features: [
        {
          icon: <Command size={18} color="#f59e0b" />,
          title: 'Universal Command Palette (Cmd+K / Ctrl+K)',
          description: 'Instantly find any note, execute studio commands, change themes, and toggle workspaces without touching the mouse.'
        },
        {
          icon: <Zap size={18} color="#ec4899" />,
          title: 'Instant Quick Note (Alt+Q)',
          description: 'Capture fleeting ideas immediately from anywhere in the app into your quick inbox.'
        },
        {
          icon: <Clock size={18} color="#10b981" />,
          title: 'Deep Focus Pomodoro Protocol',
          description: 'Built-in 25/5 focus interval timer with soothing ambient sounds, break notifications, and task tracking.'
        }
      ],
      previewBox: {
        type: 'stats',
        header: 'Essential Hotkeys Cheat Sheet',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Universal Search:</span>
              <code>Cmd / Ctrl + K</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Split Editor View:</span>
              <code>Cmd / Ctrl + E</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Quick Scratch Note:</span>
              <code>Alt + Q</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Toggle Focus Timer:</span>
              <code>Cmd / Ctrl + Shift + P</code>
            </div>
          </div>
        )
      }
    },
    {
      id: 'starter-choice',
      badge: 'Workstation Setup',
      badgeColor: '#06b6d4',
      title: 'Choose Your Starting Workspace',
      subtitle: 'Customize your setup: explore rich samples or start with a clean slate',
      icon: <Sparkles size={32} color="#06b6d4" />,
      features: [
        {
          icon: <BookOpen size={18} color="#6366f1" />,
          title: 'Tutorial & Sample Vault',
          description: '4 Workspaces, 3 Books, LaTeX formulas, Mermaid charts, flashcards, and sketches ready to explore.'
        },
        {
          icon: <Palette size={18} color="#06b6d4" />,
          title: 'Clean Slate (Empty Workstation)',
          description: 'Start fresh with 1 clean Personal workspace, 1 welcome note, and 0 clutter.'
        },
        {
          icon: <CheckCircle2 size={18} color="#10b981" />,
          title: 'Flexible & Reseedable Anytime',
          description: 'You can always reseed the sample vault or export your workspace from Settings.'
        }
      ]
    }
  ];

  const handleDismiss = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('milearn_tour_completed', 'true');
    }
    onClose();
  }, [onClose]);

  const handleFinish = useCallback(async () => {
    if (starterChoice === 'clean' && onStartWithCleanSlate) {
      setIsApplyingChoice(true);
      try {
        await onStartWithCleanSlate();
      } catch (err) {
        console.error('Failed to initialize clean slate:', err);
      } finally {
        setIsApplyingChoice(false);
      }
    }
    handleDismiss();
  }, [starterChoice, onStartWithCleanSlate, handleDismiss]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < slides.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, slides.length, handleDismiss]);

  const handleNext = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentSlide = slides[currentStep];

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(5, 7, 15, 0.78)',
        backdropFilter: 'blur(12px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '820px',
          height: '620px',
          maxHeight: '90vh',
          background: 'var(--bg-modal, #111420)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Header with Progress */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            background: 'var(--bg-surface, #161a2b)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 10px',
                borderRadius: '12px',
                background: `${currentSlide.badgeColor}22`,
                color: currentSlide.badgeColor,
                border: `1px solid ${currentSlide.badgeColor}44`
              }}
            >
              {currentSlide.badge}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #717694)', fontWeight: 500 }}>
              Step {currentStep + 1} of {slides.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'transparent',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                color: 'var(--text-muted, #717694)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary, #fff)';
                e.currentTarget.style.background = 'var(--bg-subtle, rgba(255, 255, 255, 0.05))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted, #717694)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Skip Tour
            </button>
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleDismiss}
              aria-label="Close walkthrough"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div style={{ width: '100%', height: '3px', background: 'var(--border-color, rgba(255, 255, 255, 0.08))' }}>
          <div
            style={{
              height: '100%',
              width: `${((currentStep + 1) / slides.length) * 100}%`,
              background: currentSlide.badgeColor,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>

        {/* Slide Main Content */}
        <div
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Slide Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: `${currentSlide.badgeColor}18`,
                border: `1px solid ${currentSlide.badgeColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {currentSlide.icon}
            </div>
            <div>
              <h2
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--text-primary, #ffffff)',
                  letterSpacing: '-0.02em'
                }}
              >
                {currentSlide.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary, #9499b8)',
                  lineHeight: '1.4'
                }}
              >
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* Slide Content: Starter Customization Choice vs Standard Two-Column Body */}
          {currentSlide.id === 'starter-choice' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '4px' }}>
              {/* Option 1: Sample & Tutorial Vault */}
              <div
                onClick={() => setStarterChoice('sample')}
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: starterChoice === 'sample' ? '2px solid #6366f1' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  background: starterChoice === 'sample' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface, rgba(255, 255, 255, 0.02))',
                  boxShadow: starterChoice === 'sample' ? '0 0 24px rgba(99, 102, 241, 0.22)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={22} color="#6366f1" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Tutorial &amp; Sample Vault</h3>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Recommended for Beginners</span>
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: starterChoice === 'sample' ? '6px solid #6366f1' : '2px solid var(--text-muted)',
                    background: starterChoice === 'sample' ? '#fff' : 'transparent',
                    transition: 'all 0.15s ease'
                  }} />
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Start with rich interactive tutorial notes, multi-chapter books, and study decks so you can immediately explore all workstation capabilities.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💼</span> <span><strong>4 Preloaded Workspaces</strong> (Personal, Systems, Math, Research)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📖</span> <span><strong>3 Multi-chapter Books</strong> with nested pages</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📐</span> <span><strong>KaTeX Math &amp; Mermaid</strong> diagrams pre-configured</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧠</span> <span><strong>Active Recall Cards</strong> with SuperMemo-2</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  💡 Notes can be modified or deleted freely at any time.
                </div>
              </div>

              {/* Option 2: Clean Slate */}
              <div
                onClick={() => setStarterChoice('clean')}
                style={{
                  padding: '20px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  border: starterChoice === 'clean' ? '2px solid #06b6d4' : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  background: starterChoice === 'clean' ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface, rgba(255, 255, 255, 0.02))',
                  boxShadow: starterChoice === 'clean' ? '0 0 24px rgba(6, 182, 212, 0.22)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={22} color="#06b6d4" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Clean Slate Workspace</h3>
                      <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 600 }}>Pure Empty Canvas</span>
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: starterChoice === 'clean' ? '6px solid #06b6d4' : '2px solid var(--text-muted)',
                    background: starterChoice === 'clean' ? '#fff' : 'transparent',
                    transition: 'all 0.15s ease'
                  }} />
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Start completely fresh with a minimal workspace and a single onboarding note. Perfect for organizing your own notes from day one.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span> <span><strong>1 Clean Workspace</strong> (Personal)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span> <span><strong>1 Welcome Cheatsheet Note</strong> with key shortcuts</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📁</span> <span><strong>0 Clutter</strong> (empty folders and book lists)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡</span> <span><strong>Instant, distraction-free</strong> blank slate</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  🔄 You can always reload sample data anytime from Settings.
                </div>
              </div>
            </div>
          ) : (
            /* Two-Column Body: Features List + Preview Box */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.15fr 0.85fr',
                gap: '20px',
                alignItems: 'stretch',
                marginTop: '4px'
              }}
            >
              {/* Left: Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {currentSlide.features.map((feat, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-surface, rgba(255, 255, 255, 0.03))',
                      border: '1px solid var(--border-color, rgba(255, 255, 255, 0.06))',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--bg-subtle, rgba(255, 255, 255, 0.06))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {feat.icon}
                    </div>
                    <div>
                      <h4
                        style={{
                          margin: '0 0 3px 0',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary, #ffffff)'
                        }}
                      >
                        {feat.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--text-secondary, #9499b8)',
                          lineHeight: '1.45'
                        }}
                      >
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Live Preview Snippet / Diagram Card */}
              {currentSlide.previewBox && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    background: 'var(--bg-subtle, #0d101a)',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--text-muted, #717694)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <Sparkles size={12} color={currentSlide.badgeColor} />
                    {currentSlide.previewBox.header}
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    {currentSlide.previewBox.content}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            background: 'var(--bg-surface, #161a2b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Step dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                aria-label={`Jump to step ${idx + 1}`}
                style={{
                  width: idx === currentStep ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStep ? currentSlide.badgeColor : 'var(--text-muted, rgba(255, 255, 255, 0.2))',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle, rgba(255, 255, 255, 0.05))',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  color: 'var(--text-primary, #ffffff)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isApplyingChoice}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: currentStep === slides.length - 1 ? '#10b981' : 'var(--accent-primary, #6366f1)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isApplyingChoice ? 'not-allowed' : 'pointer',
                opacity: isApplyingChoice ? 0.7 : 1,
                boxShadow: `0 4px 14px ${currentStep === slides.length - 1 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`
              }}
            >
              {currentStep === slides.length - 1 ? (
                <>
                  <CheckCircle2 size={16} /> {isApplyingChoice ? 'Setting up...' : 'Get Started'}
                </>
              ) : (
                <>
                  Next <ChevronRight size={16} />
                </>
              )}
            </button>

            {currentStep === slides.length - 1 && onOpenSettingsGuide && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onOpenSettingsGuide();
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px dashed var(--border-color, rgba(255, 255, 255, 0.2))',
                  color: 'var(--text-secondary, #9499b8)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={14} /> Full Guide &amp; FAQ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
