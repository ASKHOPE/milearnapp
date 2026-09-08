import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles, 
  Database, 
  Brain, 
  Code2, 
  ShieldCheck, 
  Layers, 
  Zap,
  Palette,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'basics' | 'markdown' | 'flashcards' | 'database' | 'productivity';
  question: string;
  answer: React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'data-privacy',
    category: 'basics',
    question: 'Where is my data stored? Does anything ever leave my computer?',
    answer: (
      <>
        <p>
          <strong>100% Local-First:</strong> All your notes, folders, flashcards, settings, and sketches are stored directly on your computer inside your browser's <strong>IndexedDB</strong> and your local <strong>PostgreSQL 16 Docker container</strong>.
        </p>
        <p>
          MiLEARNAPP has <strong>zero proprietary cloud servers</strong>, zero third-party telemetry, and zero remote tracking. Your intellectual property and personal notes never leave your device.
        </p>
      </>
    )
  },
  {
    id: 'passwords-login',
    category: 'basics',
    question: 'Do I need a password or login account to use the app?',
    answer: (
      <>
        <p>
          <strong>No passwords or logins are required!</strong> MiLEARNAPP is architected as an uninterrupted personal workstation. You open the app and immediately land in your workspace with full access to all your notes and tools.
        </p>
        <p>
          Optional note-level zero-knowledge encryption (AES-256-GCM) is available if you choose to lock specific sensitive notes with a personal passphrase.
        </p>
      </>
    )
  },
  {
    id: 'flashcard-extraction',
    category: 'flashcards',
    question: 'How does automatic Flashcard extraction work in notes?',
    answer: (
      <>
        <p>
          You don't need to manually create flashcard decks. While writing or studying in any Markdown note, you can use any of these standard active-recall patterns:
        </p>
        <ul>
          <li><strong>Q&amp;A:</strong> <code>Q: What is gradient descent? A: An optimization algorithm...</code></li>
          <li><strong>Delimiter:</strong> <code>Photosynthesis / The process plants use to convert light into energy</code></li>
          <li><strong>Concept Definition:</strong> <code>Transformer::A neural network architecture based on self-attention</code></li>
          <li><strong>Cloze Deletion:</strong> <code>The capital of France is [Paris]</code></li>
        </ul>
        <p>
          The SuperMemo-2 (SM-2) engine automatically indexes these cards and schedules them based on your review retention grades (Again, Hard, Good, Easy).
        </p>
      </>
    )
  },
  {
    id: 'postgres-sync',
    category: 'database',
    question: 'How does the PostgreSQL 16 synchronization work?',
    answer: (
      <>
        <p>
          MiLEARNAPP uses a hybrid architecture:
        </p>
        <ul>
          <li><strong>IndexedDB:</strong> Provides zero-latency reads and writes on every keystroke so editing is instant.</li>
          <li><strong>PostgreSQL 16:</strong> Connects to your local Docker container (<code>localhost:5432</code>, database: <code>milearndb</code>) through Vite's API middleware. Edits are opportunistically persisted to relational SQL tables.</li>
          <li><strong>Offline Resilience:</strong> If your Docker container is not running, the application gracefully operates in IndexedDB-only mode without breaking. When the container returns online, you can sync with one click.</li>
        </ul>
      </>
    )
  },
  {
    id: 'katex-mermaid',
    category: 'markdown',
    question: 'How do I render LaTeX math formulas and Mermaid diagrams?',
    answer: (
      <>
        <p>
          MiLEARNAPP includes full integrated rendering for scientific and engineering notes:
        </p>
        <ul>
          <li><strong>Inline Math:</strong> Enclose equations in single dollar signs, like <code>{"$f(x) = \\sigma(W^T x + b)$"}</code>.</li>
          <li><strong>Block Math:</strong> Enclose display formulas in double dollar signs <code>{"$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$"}</code>.</li>
          <li><strong>Mermaid Diagrams:</strong> Use standard markdown code fences with language <code>```mermaid</code> to create flowcharts, sequence diagrams, state diagrams, and mindmaps. You can also use the <strong>AI Diagram Scanner</strong> to turn bulleted outlines into flowcharts automatically!</li>
        </ul>
      </>
    )
  },
  {
    id: 'creative-studios',
    category: 'productivity',
    question: 'What are the 7 Multimodal Creative Studios and how do I open them?',
    answer: (
      <>
        <p>
          MiLEARNAPP bundles dedicated creative studios accessible from the top toolbar:
        </p>
        <ul>
          <li><strong>🎨 Drawing Canvas:</strong> Freehand vector sketching with smooth Apple Pencil / mouse ink curves.</li>
          <li><strong>🧊 3D Three.js Studio:</strong> Interactive 3D mesh rendering, lighting, and wireframe inspection.</li>
          <li><strong>📐 Desmos Math Grapher:</strong> Function plotting, trigonometric curves, and parametric calculations.</li>
          <li><strong>🧩 Blockly Studio:</strong> Visual node-based code generator (JavaScript, Python, Lua).</li>
          <li><strong>📷 OCR Scanner:</strong> On-device optical character recognition to extract text from screenshots.</li>
          <li><strong>📚 Citation Studio:</strong> Full BibTeX, APA, and Vancouver reference manager powered by Citation.js.</li>
          <li><strong>🌐 Web Clipper:</strong> Clean article scraper that strips navigation and extracts markdown directly into your vault.</li>
        </ul>
      </>
    )
  },
  {
    id: 'backup-restore',
    category: 'database',
    question: 'How do I backup and restore my vault data?',
    answer: (
      <>
        <p>
          Go to the <strong>Backup &amp; Vault</strong> tab in Settings. You can click <strong>Download Vault JSON</strong> to export your entire dataset (notes, folders, books, flashcards, settings) into a portable, standard JSON file.
        </p>
        <p>
          To restore on a new computer, simply click <strong>Restore Vault Backup</strong> and select your JSON file. You can also export individual notes as Markdown, PDF, or HTML directly from the note editor toolbar.
        </p>
      </>
    )
  },
  {
    id: 'keyboard-shortcuts',
    category: 'productivity',
    question: 'What are the most essential keyboard shortcuts?',
    answer: (
      <>
        <p>
          MiLEARNAPP is optimized for keyboard-driven power users:
        </p>
        <ul>
          <li><code>Cmd / Ctrl + K</code>: Universal Command Palette &amp; Search</li>
          <li><code>Alt + Q</code>: Instant Quick Note modal</li>
          <li><code>Cmd / Ctrl + S</code>: Force Save active note</li>
          <li><code>Cmd / Ctrl + E</code>: Toggle Split-View Dual Editor</li>
          <li><code>Cmd / Ctrl + Shift + P</code>: Toggle Pomodoro Focus Timer</li>
          <li><code>Cmd / Ctrl + B</code> / <code>I</code>: Bold / Italic formatting</li>
        </ul>
        <p>
          You can customize every shortcut in the <strong>Hotkeys &amp; Mouse</strong> tab!
        </p>
      </>
    )
  }
];

export interface TutorialFaqTabProps {
  onLaunchTour?: () => void;
}

export const TutorialFaqTab: React.FC<TutorialFaqTabProps> = ({ onLaunchTour }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqIds, setOpenFaqIds] = useState<Set<string>>(new Set(['data-privacy', 'flashcard-extraction']));

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenFaqIds(new Set(FAQ_ITEMS.map((item) => item.id)));
  };

  const collapseAll = () => {
    setOpenFaqIds(new Set());
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        item.question.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="settings-page-wrapper">
      {/* Hero Banner */}
      <div className="settings-page-hero">
        <div className="settings-page-hero-title">
          <div className="settings-page-hero-icon">
            <HelpCircle size={20} />
          </div>
          <div className="settings-page-hero-text">
            <h3>Knowledge Studio Guide &amp; FAQ</h3>
            <p>Master local-first workflows, active recall flashcards, and creative studios</p>
          </div>
        </div>

        <div className="settings-hero-badges">
          <span className="settings-pill-badge success">
            <CheckCircle2 size={12} /> Local-First (No Cloud)
          </span>
          <span className="settings-pill-badge accent">
            <Database size={12} /> PostgreSQL 16 Sync
          </span>
          <span className="settings-pill-badge">
            <Brain size={12} /> SuperMemo-2
          </span>
        </div>
      </div>

      {/* Quick-Start Walkthrough Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 className="panel-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Sparkles size={14} color="var(--accent-primary)" />
            Quick-Start Feature Walkthrough
          </h4>
          <button
            type="button"
            onClick={() => {
              if (onLaunchTour) {
                onLaunchTour();
              } else {
                window.dispatchEvent(new CustomEvent('milearn:open-tour'));
              }
            }}
            style={{
              fontSize: '12px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'var(--accent-primary, #6366f1)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Sparkles size={13} /> Launch Interactive Tour
          </button>
        </div>

        <div className="tutorial-cards-grid">
          {/* Card 1 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <BookOpen size={16} color="#6366f1" />
                1. Dual-Pane Markdown &amp; Math
              </span>
              <span className="tutorial-step-number">01</span>
            </div>
            <p className="tutorial-step-desc">
              Write formatted notes with instant split-pane preview. Write LaTeX formulas inline or in display blocks:
            </p>
            <div className="tutorial-code-example">
              $E = mc^2$
              {'\n'}{'$$\\nabla \\cdot \\mathbf{B} = 0$$'}
            </div>
            <div className="tutorial-step-footer">
              <Zap size={12} color="#f59e0b" />
              <span>Toggle split mode anytime with Cmd+E</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <Brain size={16} color="#8b5cf6" />
                2. Active Recall &amp; SM-2
              </span>
              <span className="tutorial-step-number">02</span>
            </div>
            <p className="tutorial-step-desc">
              Automatic flashcard extraction directly from note syntax. No manual card entry required:
            </p>
            <div className="tutorial-code-example">
              Q: What is backprop?{'\n'}A: Reverse-mode automatic diff.{'\n'}Concept::Definition
            </div>
            <div className="tutorial-step-footer">
              <Clock size={12} color="#10b981" />
              <span>Click Study Cards in header to review</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <Code2 size={16} color="#0ea5e9" />
                3. Mermaid &amp; Diagrams
              </span>
              <span className="tutorial-step-number">03</span>
            </div>
            <p className="tutorial-step-desc">
              Turn text or outlines into interactive diagrams, sequence flows, state machines, and mindmaps:
            </p>
            <div className="tutorial-code-example">
              ```mermaid{'\n'}graph TD{'\n'}  A[Client] --&gt; B[PostgreSQL]{'\n'}```
            </div>
            <div className="tutorial-step-footer">
              <Sparkles size={12} color="#8b5cf6" />
              <span>Supports automatic text-to-diagram generation</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <Palette size={16} color="#ec4899" />
                4. 7 Creative Studios
              </span>
              <span className="tutorial-step-number">04</span>
            </div>
            <p className="tutorial-step-desc">
              Access <strong>Drawing Canvas</strong>, <strong>3D Three.js</strong>, <strong>Desmos Math</strong>, <strong>Blockly</strong>, <strong>OCR</strong>, <strong>Citations</strong>, and <strong>Web Clipper</strong>.
            </p>
            <div className="tutorial-code-example">
              Top Toolbar &gt; Tools Tray &gt; Launch Studio
            </div>
            <div className="tutorial-step-footer">
              <Layers size={12} color="#ec4899" />
              <span>Embed generated outputs directly into notes</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <Database size={16} color="#10b981" />
                5. PostgreSQL 16 Sync
              </span>
              <span className="tutorial-step-number">05</span>
            </div>
            <p className="tutorial-step-desc">
              Relational harmony with Docker. Zero latency local reads from IndexedDB, automatically synced to PostgreSQL.
            </p>
            <div className="tutorial-code-example">
              docker compose up -d{'\n'}Settings &gt; PostgreSQL Sync &gt; Sync Now
            </div>
            <div className="tutorial-step-footer">
              <CheckCircle2 size={12} color="#10b981" />
              <span>Pulsing green dot in header shows connection</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="tutorial-step-card">
            <div className="tutorial-step-header">
              <span className="tutorial-step-title">
                <ShieldCheck size={16} color="#059669" />
                6. Zero Friction / Personal
              </span>
              <span className="tutorial-step-number">06</span>
            </div>
            <p className="tutorial-step-desc">
              No logins, accounts, or passwords to get in your way. Built exclusively for your desktop workstation.
            </p>
            <div className="tutorial-code-example">
              Fast Launch: bun run dev{'\n'}Export Vault: Settings &gt; Backup &gt; JSON
            </div>
            <div className="tutorial-step-footer">
              <Zap size={12} color="#059669" />
              <span>Full control over your data &amp; exports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive FAQ Section */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 className="panel-section-title" style={{ margin: 0 }}>
            Frequently Asked Questions ({filteredFaqs.length})
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={expandAll}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="faq-filter-bar" style={{ marginBottom: '14px' }}>
          <div className="faq-search-wrapper">
            <Search size={14} className="faq-search-icon" />
            <input
              type="text"
              className="faq-search-input"
              placeholder="Search guide &amp; FAQ topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="faq-category-pills">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'basics', label: 'Basics & Privacy' },
              { id: 'flashcards', label: 'Flashcards & SM-2' },
              { id: 'markdown', label: 'Markdown & Math' },
              { id: 'database', label: 'Database & Sync' },
              { id: 'productivity', label: 'Productivity' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`faq-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="faq-accordion-list">
          {filteredFaqs.length === 0 ? (
            <div style={{
              padding: '28px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px dashed var(--border-color)'
            }}>
              No FAQ articles found matching "{searchQuery}".
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqIds.has(faq.id);
              return (
                <div key={faq.id} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-accordion-header"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-accordion-question">
                      <span className="faq-accordion-cat">{faq.category}</span>
                      <span>{faq.question}</span>
                    </div>
                    {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </button>

                  {isOpen && (
                    <div className="faq-accordion-body">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
