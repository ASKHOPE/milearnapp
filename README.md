# MiLEARNAPP — Enterprise Local-First Learning & Knowledge Studio

> **MiLEARNAPP** is an ultra-fast, local-first personal knowledge management (PKM), study hub, and learning studio engineered with zero-knowledge cryptography, SuperMemo-2 spaced repetition, multithreaded worker compute, and bi-directional PostgreSQL synchronization.

---

## 🌟 Key Architecture & Capabilities

### 1. 🛡️ Zero-Knowledge Cryptography & Hardened Security
- **Authenticated AES-256-GCM**: Client-side note-level encryption where passphrases never leave the device.
- **Passphrase Entropy Scoring**: Real-time evaluation of passphrase strength with cryptographic salt.
- **Anti-MITM & Tampering Detection**: Guaranteed ciphertext integrity verification via GCM authentication tags.
- **Brute-Force Rate Limiter & Lockout**: Exponential backoff cooldown system protecting encrypted notes against dictionary attacks.
- **Inactivity Auto-Lock**: Configurable security timeouts that automatically re-lock protected vaults when idle.

### 2. ⚡ Local-First & Hybrid PostgreSQL 16 Sync
- **Sub-Millisecond Read/Write**: Powered by IndexedDB and LocalStorage for immediate, offline-capable interactions.
- **PostgreSQL 16 Docker Integration**: Bi-directional relational sync engine keeping local data harmonized with an enterprise SQL backend.
- **Live Connection Telemetry**: Subtle pulsing green status indicator embedded in the navigation bar's Settings gear, providing real-time database health monitoring.
- **Automatic Fallback & Offline Resilience**: Seamless operation whether online, offline, or experiencing network latency.

### 3. 🧠 Study Hub & SuperMemo-2 (SM-2) Spaced Repetition
- **Automated Card Extraction**: Automatically extracts active recall cards from markdown (`Q: ... A: ...`, `Front / Back`, `Concept::Definition`, and `Cloze deletions`).
- **Adaptive Spaced Repetition**: Implements the battle-tested SuperMemo-2 algorithm with dynamic ease factors and intervals based on review grades (Again, Hard, Good, Easy).
- **Interactive Study Arena**: Flashcard quiz modal, mastery status tracking, and concept retention badges.

### 4. ✍️ Advanced Rich Editor & Multimodal Creative Studios
- **Dual-Engine Markdown**: Split-view side-by-side editing, syntax highlighting, and live rendered preview.
- **Interactive Mermaid Diagrams**: Instant text-to-diagram rendering (flowcharts, sequence diagrams, state machines, mindmaps).
- **KaTeX Mathematical Typesetting**: Full LaTeX equation rendering for scientific and engineering notes.
- **Multimodal Studios**:
  - **Drawing Canvas**: Freehand vector sketching and diagramming.
  - **3D Studio**: Interactive Three.js model viewer.
  - **Math Grapher**: Function plotting and parametric graphing.
  - **Blockly Visual Programming**: Visual block-based code generation.
  - **OCR Document Scanner**: Extract text from images using on-device OCR.
  - **Citation Manager**: Academic citation formatting and bibliography generator.
  - **Web Clipper**: Structure articles and web resources into clean notes.

### 5. ⏱️ Ambient Telemetry & Productivity Hub
- **Ambient Keystroke Telemetry**: Real-time rolling WPM (words per minute) calculation across all note editors, with live pinned widget display in the top navigation bar.
- **Typing Practice Game**: Sprint typing challenge with analytics.
- **Pomodoro Focus Timer**: Customizable 25/5 focus cycles with built-in ambient soundscapes.
- **Folder Link Tree Graph**: Visual directory hierarchy and concept relationship mapping.
- **English Dictionary & Vocabulary**: Instant definition and terminology lookup.

### 6. 🎨 Modern Ergonomic UI/UX Design System
- **3-Pane Collapsible Layout**: Symmetrical design with Sidebar (Pane 1), Notes List (Pane 2), and Dual-Pane Editor (Pane 3).
- **Floating Middle Edge Toggles (`<` / `>` )**: Ergonomic pill buttons centered along the panel border edges in both expanded and collapsed rail views.
- **High-Contrast Note Cards**: Color-coded action buttons (Star, Archive, Split-View, Trash Bin, Restore) with text-clamping to prevent button overflow on long titles.
- **Curated Multi-Theme Palette**:
  - 🖥️ **System Default**
  - ☀️ **Day Light**
  - 🌙 **Night Dark**
  - 💎 **Obsidian Onyx** (OLED Pure Black)
  - 🌆 **Tokyo Midnight**
  - ❄️ **Nordic Frost**
  - 📜 **Warm Editorial**
- **Relocated Theme Switcher**: Nestled neatly beneath Archive and Bin in the sidebar footer and collapsed rail.
- **Tabbed Settings Studio**: Complete user preference center covering Identity, Appearance & Typography, Custom Hotkeys & Mouse Actions, Security & Lock, Backup & Vault, Storage & Diagnostics, and PostgreSQL Database Sync.

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) (v1.1+) or Node.js (v20+)
- Docker & Docker Compose (optional, for local PostgreSQL 16 container)

### Installation
```bash
# 1. Install dependencies
bun install

# 2. (Optional) Start the local PostgreSQL 16 container
docker compose up -d

# 3. Launch the development server
bun run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🧪 Verification & Testing Suite

MiLEARNAPP maintains a rigorous quality pipeline with 100% passing tests:

```bash
# Run ultra-fast Oxlint linter (0 errors, 0 warnings)
bun run lint

# Run all 65 unit & cryptographic tests
bun test

# Run Playwright End-to-End browser tests (Chromium)
bun run test:e2e --project=chromium

# Production TypeScript & Vite bundle build
bun run build
```

---

## 📁 Project Structure

```
milearnapp/
├── e2e/                      # Playwright E2E browser test suite
├── src/
│   ├── components/           # React UI components (Sidebar, NoteList, NoteEditor, Modals, Studios)
│   ├── services/             # Core engines (crypto, storage, SM-2, typingMetrics, optimizer)
│   ├── styles/               # Modular CSS system (layout, theme, editor, modals, studios)
│   ├── types/                # Strict TypeScript domain interfaces and schemas
│   ├── App.tsx               # Root application orchestrator and 3-pane layout
│   └── main.tsx              # Application entry point
├── tests/                    # Bun test suites for crypto, security, and feature logic
├── docker-compose.yml        # PostgreSQL 16 container configuration
├── package.json              # Scripts and project dependencies
└── vite.config.ts            # Vite build and development configuration
```

---

## 📜 License
Private & Proprietary. All rights reserved.
