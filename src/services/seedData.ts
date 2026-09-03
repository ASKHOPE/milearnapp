import type { Workspace, Book, Folder, Note } from '../types';

export const SAMPLE_WORKSPACES: Workspace[] = [
  {
    id: 'ws-personal',
    name: 'Personal Vault',
    icon: '🏠',
    color: '#10b981',
    description: 'Personal life, daily journaling, philosophy, and creative sketches',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws-learning',
    name: 'MI-Learn Academy',
    icon: '🧠',
    color: '#8b5cf6',
    description: 'Active recall flashcards, math formulas, and computer science courses',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws-work',
    name: 'Engineering & Systems',
    icon: '💼',
    color: '#0ea5e9',
    description: 'System architecture, Mermaid sequence diagrams, and software specs',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ws-creative',
    name: 'Creative Studio',
    icon: '🎨',
    color: '#ec4899',
    description: 'Design inspirations, hand drawings, and audio soundscapes',
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'book-math-ai',
    workspaceId: 'ws-learning',
    title: 'Deep Learning & Mathematical Foundations',
    icon: '📐',
    color: '#8b5cf6',
    description: 'Matrix calculus, gradient descent, and attention neural networks',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-architecture',
    workspaceId: 'ws-work',
    title: 'Modern Software Architecture',
    icon: '🏛️',
    color: '#0ea5e9',
    description: 'Local-first architecture, CRDTs, and client-side compression',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-stoic',
    workspaceId: 'ws-personal',
    title: 'The Stoic Life Design',
    icon: '📖',
    color: '#10b981',
    description: 'Meditations, daily rituals, and timeless principles for modern life',
    createdAt: new Date().toISOString()
  }
];

export const SAMPLE_FOLDERS: Folder[] = [
  // Personal Folders
  {
    id: 'f-start',
    workspaceId: 'ws-personal',
    name: '🚀 Quick Start & Guides',
    parentId: null,
    color: '#6366f1',
    icon: 'rocket',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-daily',
    workspaceId: 'ws-personal',
    name: '📅 Daily Notes & Journal',
    parentId: null,
    color: '#10b981',
    icon: 'calendar',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-drawings',
    workspaceId: 'ws-personal',
    name: '🎨 Sketches & Audio Studio',
    parentId: null,
    color: '#ec4899',
    icon: 'pen-tool',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-vault',
    workspaceId: 'ws-personal',
    name: '🔒 Zero-Knowledge Vault',
    parentId: null,
    color: '#f59e0b',
    icon: 'lock',
    createdAt: new Date().toISOString()
  },

  // Learning Folders
  {
    id: 'f-study',
    workspaceId: 'ws-learning',
    name: '🧠 Active Recall & Flashcards',
    parentId: null,
    color: '#8b5cf6',
    icon: 'graduation-cap',
    createdAt: new Date().toISOString()
  },
  {
    id: 'f-math',
    workspaceId: 'ws-learning',
    name: '📐 Formulas & Quantum Physics',
    parentId: null,
    color: '#0ea5e9',
    icon: 'sigma',
    createdAt: new Date().toISOString()
  },

  // Work Folders
  {
    id: 'f-work-arch',
    workspaceId: 'ws-work',
    name: '📊 System Architecture & Diagrams',
    parentId: null,
    color: '#4f46e5',
    icon: 'cpu',
    createdAt: new Date().toISOString()
  }
];

// Sample Drawing SVG Vector Data
export const SAMPLE_DRAWING_DATA = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320"><defs><linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%230f172a"/><stop offset="100%" style="stop-color:%231e1b4b"/></linearGradient><linearGradient id="glowG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%234f46e5"/><stop offset="100%" style="stop-color:%238b5cf6"/></linearGradient></defs><rect width="600" height="320" rx="16" fill="url(%23bgG)"/><circle cx="140" cy="160" r="55" fill="url(%23glowG)" filter="drop-shadow(0 8px 16px rgba(79,70,229,0.4))"/><text x="140" y="165" fill="%23ffffff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" font-weight="700" text-anchor="middle">Noteflow Core</text><circle cx="440" cy="90" r="42" fill="%230ea5e9" opacity="0.85"/><text x="440" y="95" fill="%23ffffff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="600" text-anchor="middle">AES-256 Vault</text><circle cx="440" cy="230" r="42" fill="%2310b981" opacity="0.85"/><text x="440" y="235" fill="%23ffffff" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="12" font-weight="600" text-anchor="middle">SM-2 Spaced Deck</text><path d="M 195 160 C 280 160, 320 90, 398 90" fill="none" stroke="%2338bdf8" stroke-width="3" stroke-dasharray="6,6"/><path d="M 195 160 C 280 160, 320 230, 398 230" fill="none" stroke="%2334d399" stroke-width="3"/><rect x="220" y="275" width="160" height="28" rx="14" fill="rgba(255,255,255,0.08)"/><text x="300" y="293" fill="%2394a3b8" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="11" text-anchor="middle">Canvas Sketch Vector</text></svg>`;

const TODAY_DATE = new Date().toISOString().split('T')[0];

export const SAMPLE_NOTES: Note[] = [
  // 1. Welcome Tutorial Note (Master onboarding guide)
  {
    id: 'n-welcome',
    workspaceId: 'ws-personal',
    title: '👋 Welcome to Noteflow (Interactive Tutorial & Guide)',
    folderId: 'f-start',
    bookId: null,
    parentPageId: null,
    tags: ['tutorial', 'welcome', 'guide', 'shortcuts'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    content: `# 👋 Welcome to Noteflow

Noteflow is a local-first, privacy-respecting power workspace engineered with zero-knowledge cryptography, LaTeX math, dynamic diagramming, and spaced repetition.

---

### ⚡ Quick Interactive Tour

Try these core features directly within this note:

1. **Bidirectional Wikilinks**: Click or type \`[[\` to interlink your thoughts:
   - [[Active Recall & Flashcard Master Deck]] — Test your memory with SM-2.
   - [[LaTeX Mathematics & Quantum Physics]] — View live KaTeX equations.
   - [[System Architecture & Mermaid Diagrams]] — Explore live diagrams.
   - [[Zero-Knowledge Encrypted Security Guide]] — Discover AES-GCM security.
2. **Slash Commands Menu**: Press \`/\` on any empty line to summon headings, tables, callouts, and math blocks.
3. **Study Mode Flashcards**: Click the **🧠 Study Cards** button in the top header or press \`Cmd + Shift + S\`.
4. **Focus Pomodoro & Ambient Audio**: Click **🍅 25:00** to start a session with synthesized Rain, Waves, or Fireplace sounds!
5. **Lock Any Note**: Click the **🔒 Lock Note** button in the top right to protect confidential thoughts with AES-256-GCM.

---

### ⌨️ Essential Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| \`Cmd + K\` | Global fuzzy search across all notes & folders |
| \`Cmd + N\` | Create a new note in the active folder |
| \`Cmd + W\` | Close the active note tab |
| \`Cmd + F\` | Find & Replace within the current note |
| \`Space\` / \`Enter\` | Flip card in **Study Mode** |
| \`1\` / \`2\` / \`3\` / \`4\` | Rate flashcard difficulty (*Again, Hard, Good, Easy*) |
| \`$$\` | Insert LaTeX Math block |

> [!TIP]
> All your data is saved strictly on this device inside IndexedDB. No accounts, spinners, or cloud tracking.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 2. Active Recall & Flashcards (Study Mode demo)
  {
    id: 'n-flashcards',
    workspaceId: 'ws-learning',
    title: '🧠 Active Recall & Flashcard Master Deck',
    folderId: 'f-study',
    bookId: null,
    parentPageId: null,
    tags: ['study', 'flashcards', 'biology', 'cs'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    content: `# 🧠 Active Recall & Spaced Repetition

Noteflow automatically extracts flashcards from your notes using natural syntax. Click **🧠 Study Cards** in the header to review this deck!

---

### 1. Question & Answer Format
Q: What is the primary difference between symmetric and asymmetric cryptography?
A: Symmetric cryptography uses the same secret key for both encryption and decryption (e.g. AES-256), whereas asymmetric cryptography uses a mathematically linked public/private key pair (e.g. RSA, ECC).

Q: How does the SuperMemo-2 (SM-2) algorithm schedule repetition intervals?
A: Repetition 1 is scheduled for 1 day, repetition 2 for 6 days. Subsequent repetitions multiply the previous interval by the card's Ease Factor ($I(n) = I(n-1) \\times EF$).

---

### 2. Concept Definition Format (\`Term :: Explanation\`)
DNS :: Domain Name System translating human-friendly hostnames into machine-routable IP addresses.
Idempotence :: An operation that yields identical state regardless of whether it is executed once or multiple times.
Zero-Knowledge Encryption :: An architecture where the client holds the encryption key and storage providers never possess plaintext access.

---

### 3. Front / Back Flashcard Format
Front: Mitochondria
Back: The double-membrane organelle responsible for aerobic cellular respiration and ATP generation.

Front: CAP Theorem (Brewer's Theorem)
Back: A distributed data store can guarantee at most two of three properties: Consistency, Availability, and Partition Tolerance.

---

### 4. Cloze Deletion Format
The speed of light in a vacuum is exactly ==299,792,458 m/s==.
In quantum mechanics, Heisenberg's uncertainty relation is ==$\\Delta x \\Delta p \\ge \\frac{\\hbar}{2}$==.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. LaTeX Math & Quantum Physics
  {
    id: 'n-math',
    workspaceId: 'ws-learning',
    title: '📐 LaTeX Mathematics & Quantum Physics',
    folderId: 'f-math',
    bookId: null,
    parentPageId: null,
    tags: ['math', 'physics', 'katex', 'calculus'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# 📐 LaTeX Mathematics & Scientific Computing

Noteflow incorporates high-performance KaTeX rendering for both inline and multi-line display equations.

---

### 🌌 1. Fundamental Constants & Inline Equations
- Mass-Energy Equivalence: $E = mc^2$
- Euler's Identity: $e^{i\\pi} + 1 = 0$
- Summation Formula: $\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}$
- Gauss's Law: $\\oint_{\\partial V} \\mathbf{E} \\cdot d\\mathbf{A} = \\frac{Q_{\\text{enc}}}{\\varepsilon_0}$

---

### 🔬 2. Display Equations & Matrix Calculus

#### Continuous Fourier Transform
$$\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} dx$$

#### Time-Dependent Schrödinger Equation
$$i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t) \\right] \\Psi(\\mathbf{r},t)$$

#### 2D Rotation Matrix Transformation
$$\\begin{pmatrix} x' \\\\ y' \\end{pmatrix} = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta \\\\ \\sin\\theta & \\cos\\theta \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix}$$

#### Gaussian Normal Probability Density Function
$$f(x \\mid \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right)$$

> [!NOTE]
> Equations update dynamically as you type with zero lag.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. System Architecture & Mermaid Diagrams
  {
    id: 'n-diagrams',
    workspaceId: 'ws-work',
    title: '📊 System Architecture & Mermaid Diagrams',
    folderId: 'f-work-arch',
    bookId: null,
    parentPageId: null,
    tags: ['architecture', 'mermaid', 'diagrams', 'security'],
    isFavorite: true,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# 📊 System Architecture & Mermaid Diagrams

Noteflow renders beautiful SVG flowcharts, sequence diagrams, and mindmaps from markdown code blocks.

---

### 1. High-Level Subsystem Flowchart
\`\`\`mermaid
graph TD
  User["👤 User Interaction"] --> UI["💻 Noteflow Interface"]
  UI --> Router["⚡ State & Tab Controller"]
  Router --> Crypto["🔒 Zero-Knowledge AES-GCM Engine"]
  Router --> Audio["🎧 Web Audio Synthesizer"]
  Router --> Flashcards["🧠 SM-2 Spaced Repetition Engine"]
  Crypto --> IndexedDB[("💾 Local IndexedDB Sandbox")]
  Flashcards --> IndexedDB
\`\`\`

---

### 2. Zero-Knowledge Authentication Sequence
\`\`\`mermaid
sequenceDiagram
  autonumber
  actor User as User
  participant UI as Noteflow UI
  participant Worker as WebCrypto Subtle
  participant DB as IndexedDB Vault

  User->>UI: Enter Passphrase
  UI->>Worker: PBKDF2 Key Derivation (600,000 iterations)
  Worker-->>UI: 256-bit AES-GCM CryptoKey
  UI->>DB: Read Encrypted Ciphertext + Salt + IV
  DB-->>UI: EncryptedPayload
  UI->>Worker: Decrypt with Bound Associated Data (noteId)
  alt Verification Successful
    Worker-->>UI: Plaintext Markdown
    UI->>User: Display Note in Memory
  else Tampering Detected / Invalid Passphrase
    Worker-->>UI: Cryptographic Integrity Error
    UI->>User: Exponential Backoff Penalty Lockout
  end
\`\`\`

> [!TIP]
> Hover over any diagram to copy the source or expand it into full screen!`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 5. Drawings & Multimedia Studio
  {
    id: 'n-drawings',
    workspaceId: 'ws-personal',
    title: '🎨 Apple Sketchpad & Multimedia Studio',
    folderId: 'f-drawings',
    bookId: null,
    parentPageId: null,
    tags: ['sketch', 'drawings', 'media', 'creative'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# 🎨 Apple Sketchpad & Multimedia Studio

Capture your visual thoughts alongside markdown notes. Use the freehand canvas drawing pad with stylus or mouse to sketch concepts instantly.

---

### ✏️ Interactive Canvas Sketch
Below is a sample architecture sketch attached directly to this note:

![Architecture Sketch](${SAMPLE_DRAWING_DATA})

---

### 🎙️ Audio Voice Memos
- Click the microphone icon in the bottom right toolbar to record voice thoughts on devices with microphones.
- Audio memos are converted to local browser blobs with zero external cloud upload.
- Toggle microphone permissions anytime in **Settings > Privacy & Audio**.`,
    attachments: [
      {
        id: 'att-sample-sketch-1',
        name: 'architecture_sketch.svg',
        type: 'image',
        mimeType: 'image/svg+xml',
        dataUrl: SAMPLE_DRAWING_DATA,
        size: 3240,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 6. Zero-Knowledge Encrypted Security Guide
  {
    id: 'n-crypto-guide',
    workspaceId: 'ws-personal',
    title: '🔒 Zero-Knowledge Encrypted Security Guide',
    folderId: 'f-vault',
    bookId: null,
    parentPageId: null,
    tags: ['security', 'crypto', 'privacy', 'mitm'],
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    content: `# 🔒 Zero-Knowledge Cryptographic Architecture

Noteflow's note-locking system provides bank-grade, on-device encryption designed to be mathematically tamper-proof and resilient against MITM (Man-in-the-Middle) and automated brute-force attacks.

---

### 🛡️ Security Guarantees

1. **AES-256-GCM Authenticated Encryption**:
   - Every note is encrypted with a unique 128-bit random salt and 96-bit initialization vector (IV).
   - Generates a 128-bit authentication tag. If an attacker modifies even a single bit of ciphertext, decryption fails immediately without leaking plaintext.

2. **Associated Data (AD) Note-ID Binding**:
   - The unique \`noteId\` is bound into the authentication tag (\`noteflow:bound-id:\${noteId}\`).
   - Attackers cannot transplant ciphertext from one note into another.

3. **PBKDF2 with 600,000 Iterations**:
   - Exceeds OWASP 2024 recommendations (310,000 iterations) to render GPU hash-cracking computationally prohibitive.

4. **Exponential Backoff Lockout**:
   - 1–3 failed attempts: Immediate retry.
   - 4 failed attempts: 5-second cooldown.
   - 5 failed attempts: 15-second cooldown.
   - 6 failed attempts: 30-second cooldown.
   - 7–9 failed attempts: 60-second cooldown.
   - 10+ failed attempts: **15-minute hard lockout**.

---

### 🚀 How to Lock This Note
1. Click the **🔒 Lock Note** icon in the editor toolbar.
2. Enter a master passphrase and an optional hint.
3. Once locked, the plaintext is purged from IndexedDB and only the encrypted ciphertext payload is retained.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 7. Today's Daily Journal & Calendar Note
  {
    id: 'n-daily-journal',
    workspaceId: 'ws-personal',
    title: `📅 Daily Focus — ${TODAY_DATE}`,
    folderId: 'f-daily',
    bookId: null,
    parentPageId: null,
    tags: ['daily', 'journal', 'habits', 'focus'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# 📅 Daily Focus — ${TODAY_DATE}

> "We suffer more often in imagination than in reality." — Seneca

---

### 🎯 Top 3 Non-Negotiables
- [x] Complete morning movement & 15m deep breathing
- [ ] Review 10 flashcards in [[Active Recall & Flashcard Master Deck]]
- [ ] 2x 25-minute Pomodoro focus sprints on system architecture

---

### ⚡ Daily Habit Checklist
- [x] Morning hydration (500ml water)
- [x] 10 pages of [[The Stoic Life Design]]
- [ ] Evening gratitude reflection
- [ ] Zero screens 45 mins before sleep

---

### 📝 Evening Retrospective
- **What went exceptionally well?**
  - High focus session with synthesized Ocean Swell ambient sounds.
- **What could be improved tomorrow?**
  - Take regular 5-minute stretch breaks between deep work sessions.`,
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 8. Focus Pomodoro & Ambient Sound Guide
  {
    id: 'n-pomodoro-guide',
    workspaceId: 'ws-learning',
    title: '🍅 Deep Work & Focus Pomodoro Protocol',
    folderId: 'f-study',
    bookId: null,
    parentPageId: null,
    tags: ['pomodoro', 'productivity', 'ambient', 'focus'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# 🍅 Deep Work & Focus Pomodoro Protocol

Maximize mental flow and eliminate cognitive fatigue with Noteflow's built-in Pomodoro timer and procedural audio synthesizers.

---

### ⏳ The 25 / 5 Cadence
1. **Work Sprint (25 mins)**: Single-task focus. No notifications, no context switching.
2. **Short Break (5 mins)**: Stand up, stretch, look at distant horizon.
3. **Long Break (15 mins)**: Awarded automatically after completing 4 consecutive focus cycles.

---

### 🎧 Procedural Soundscape Channels
Access via the **Sound Mixer** tab in the Pomodoro modal:

- 🌧️ **Gentle Rain**: Bandpass-filtered pink noise with random acoustic droplet impulses.
- 🌊 **Ocean Swell**: Low-frequency resonant tidal swell driven by a 0.08Hz LFO.
- 🔥 **Cozy Fireplace**: Low-end flame warmth modulated with Poisson crackle micro-clicks.
- 🧠 **Binaural Alpha Beats**: 210Hz & 220Hz stereo-separated sine frequencies producing an acoustic 10Hz alpha state ideal for memory consolidation.
- 🌫️ **Brown Noise**: High-density sound-masking eliminating background conversation distractions.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 9. Book Chapter: Local-First Foundations (Architecture Book, Page 1)
  {
    id: 'n-book-arch-1',
    workspaceId: 'ws-work',
    title: 'Chapter 1: Local-First Foundations',
    folderId: 'f-work-arch',
    bookId: 'book-architecture',
    parentPageId: null,
    pageOrder: 1,
    tags: ['book', 'architecture', 'local-first'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 1: Local-First Foundations
**Book**: [[Modern Software Architecture]] • **Page 1 of 2**

### 🏛️ The Seven Ideals of Local-First Software
1. **No spinners**: Your work is at your fingertips with zero network latency.
2. **Your work is not trapped on one device**: Seamless multi-device synchronization.
3. **The network is optional**: Full reading, writing, and editing capabilities offline.
4. **Seamless collaboration**: Conflict-free resolution.
5. **Long-term data preservation**: Standardized, human-readable formats (IndexedDB, Markdown, JSON).
6. **Security and privacy by default**: Zero reliance on third-party cloud analytics.
7. **Ultimate user agency**: You hold complete ownership of your data vault.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 10. Book Chapter: Storage & Compression (Architecture Book, Page 2)
  {
    id: 'n-book-arch-2',
    workspaceId: 'ws-work',
    title: 'Chapter 2: Storage & Compression Strategies',
    folderId: 'f-work-arch',
    bookId: 'book-architecture',
    parentPageId: null,
    pageOrder: 2,
    tags: ['book', 'storage', 'webp', 'performance'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 2: Storage & Compression Strategies
**Book**: [[Modern Software Architecture]] • **Page 2 of 2**

### 📦 In-Browser Canvas WebP Compression
When users attach images, drawings, or sketches, Noteflow compresses them on a dedicated offscreen canvas:

\`\`\`typescript
const webpUrl = canvas.toDataURL('image/webp', 0.82);
\`\`\`

### 📊 Benchmark Metrics
- **Raw PNG Image**: 3.2 MB
- **WebP Optimized**: 240 KB (**92.5% compression**)
- **Decoding Latency**: < 12ms inside browser memory`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 11. Book Chapter: Matrix Calculus (Math & AI Book, Page 1)
  {
    id: 'n-book-math-1',
    workspaceId: 'ws-learning',
    title: 'Chapter 1: Matrix Calculus & Backpropagation',
    folderId: 'f-math',
    bookId: 'book-math-ai',
    parentPageId: null,
    pageOrder: 1,
    tags: ['book', 'deep-learning', 'math', 'gradient'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 1: Matrix Calculus & Backpropagation
**Book**: [[Deep Learning & Mathematical Foundations]] • **Page 1 of 2**

### 📐 Chain Rule in Multivariable Calculus
For an artificial neural layer with weight matrix $W$, bias vector $b$, and activation function $\\sigma$:

$$z = Wx + b, \\quad a = \\sigma(z)$$

The gradient of the scalar loss function $L$ with respect to weight matrix $W$ is:

$$\\frac{\\partial L}{\\partial W} = \\frac{\\partial L}{\\partial z} x^T = \\delta x^T$$

Where the error vector $\\delta$ is computed backwards layer-by-layer:

$$\\delta^{(l)} = \\left( (W^{(l+1)})^T \\delta^{(l+1)} \\right) \\odot \\sigma'(z^{(l)})$$`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 12. Book Chapter: Attention Mechanics (Math & AI Book, Page 2)
  {
    id: 'n-book-math-2',
    workspaceId: 'ws-learning',
    title: 'Chapter 2: Attention Mechanics & Transformers',
    folderId: 'f-math',
    bookId: 'book-math-ai',
    parentPageId: null,
    pageOrder: 2,
    tags: ['book', 'transformers', 'attention', 'ai'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 2: Attention Mechanics & Transformers
**Book**: [[Deep Learning & Mathematical Foundations]] • **Page 2 of 2**

### 🧠 Scaled Dot-Product Attention
The core mathematical formulation powering modern Large Language Models:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{QK^T}{\\sqrt{d_k}} \\right) V$$

Where:
- $Q \\in \\mathbb{R}^{n \\times d_k}$ (Queries)
- $K \\in \\mathbb{R}^{m \\times d_k}$ (Keys)
- $V \\in \\mathbb{R}^{m \\times d_v}$ (Values)
- $\\sqrt{d_k}$ is the scaling factor counteracting vanishing gradients in softmax.`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 13. Book Chapter: Morning Stoa (Stoic Book, Page 1)
  {
    id: 'n-book-stoic-1',
    workspaceId: 'ws-personal',
    title: 'Chapter 1: The Morning Stoa & Marcus Aurelius',
    folderId: 'f-daily',
    bookId: 'book-stoic',
    parentPageId: null,
    pageOrder: 1,
    tags: ['book', 'stoicism', 'philosophy', 'habits'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 1: The Morning Stoa & Marcus Aurelius
**Book**: [[The Stoic Life Design]] • **Page 1 of 2**

> "When you arise in the morning, think of what a precious privilege it is to be alive—to breathe, to think, to enjoy, to love." — Marcus Aurelius, *Meditations*

### 🌅 The Three Morning Questions
1. **Control**: *What lies strictly within my sphere of control today, and what lies outside it?*
2. **Virtue**: *How will I respond with patience and wisdom if confronted with difficult circumstances?*
3. **Mortality (*Memento Mori*)**: *If today were my final opportunity to contribute, how would I conduct myself?*`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 14. Book Chapter: Amor Fati (Stoic Book, Page 2)
  {
    id: 'n-book-stoic-2',
    workspaceId: 'ws-personal',
    title: 'Chapter 2: Amor Fati & Embracing Obstacles',
    folderId: 'f-daily',
    bookId: 'book-stoic',
    parentPageId: null,
    pageOrder: 2,
    tags: ['book', 'stoicism', 'resilience'],
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    content: `# Chapter 2: Amor Fati & Embracing Obstacles
**Book**: [[The Stoic Life Design]] • **Page 2 of 2**

### 🛡️ The Obstacle is the Way
The impediment to action advances action. What stands in the way becomes the way.

- **Amor Fati**: Not merely tolerating adversity, but actively loving whatever happens as fuel for character growth.
- **The Dichotomy of Control**: Divide all things into those up to us (our opinions, desires, actions) and those not up to us (external events, other people's judgments, weather).`,
    attachments: [],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    updatedAt: new Date().toISOString()
  }
];
