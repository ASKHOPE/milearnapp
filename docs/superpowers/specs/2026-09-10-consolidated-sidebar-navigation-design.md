# Consolidated Sidebar & Top Navigation Design Specification

## 1. Overview
This specification outlines the complete rebuild of the main top navigation (`Header.tsx`) and the consolidation of the dual-pane sidebar (`Sidebar.tsx` + `NoteList.tsx`) into a single, unified, high-efficiency **Consolidated M & N Sidebar** based on the Stitch design system (`7193838054172749055` / screen `20b6cde3a30349fb95edc5a177ce96ce`).

The primary goals are:
1. Reclaim horizontal screen real estate for the Note Editor by unifying the separate Navigation Sidebar and Notes List into a single 320px column.
2. Provide a seamless segmented toggle between **Navigation Directory (Mode 'M')** and **Notes Feed List (Mode 'N')**.
3. Modernize the Top Global Navigation with centered omnisearch (`⌘K`), quick note action, tools menu, and live profile/sync status.
4. Align the application's dark palette with the Stitch design tokens (`#090b10`, `#0d111a`, `#131824`, `#1c2233`, `#6366f1`).

---

## 2. Component Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                      Top Global Navigation (<Header />)                             |
|  [MILEARNAPP Logo]  |         [ Search notes, tags, files... ⌘K ]         | [⚡ Quick] [Tools ▾] [Profile] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Consolidated Sidebar (<Sidebar />)              |   Note Editor (<NoteEditor /> / <SplitWindow />) |
|  Width: 320px (or 48px collapsed)                |   Expands across remaining screen width         |
|                                                  |                                                 |
|  +--------------------------------------------+  |                                                 |
|  | [🌿 Personal Vault ▾]  [◧ Collapse Button] |  |                                                 |
|  | [ Navigation (M) ]  [ Notes (N) • 7 ]      |  |                                                 |
|  +--------------------------------------------+  |                                                 |
|  |                                            |  |                                                 |
|  | IF Mode === 'M' (Directory & Tree):        |  |                                                 |
|  | - Navigation Views (All, Starred, Recent)  |  |                                                 |
|  | - Books Section (+ Browse & Pin)           |  |                                                 |
|  | - Folders Section (+ Browse & Pin)         |  |                                                 |
|  |                                            |  |                                                 |
|  | IF Mode === 'N' (Notes Feed):              |  |                                                 |
|  | - Header: "Notes" (7)  [+ New Note]        |  |                                                 |
|  | - Filter Search & Sort Dropdown            |  |                                                 |
|  | - Scrollable Note Cards with Hover Actions |  |                                                 |
|  +--------------------------------------------+  |                                                 |
|  | Footer: Bin/Archive | ☀️ 🌙 🖥️ Theme | More ▾|  |                                                 |
|  +--------------------------------------------+  |                                                 |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Detailed Component Specifications

### 3.1 Top Global Navigation (`src/components/Header.tsx`)
- **Brand Identity:** Bold `MILEARNAPP` typographic logo in `#818cf8` / `#ffffff` with subtle letter spacing. Includes mobile hamburger toggle button for narrow viewports.
- **Centered Omnisearch:**
  - Placed prominently in the center header.
  - Search input with placeholder `Search notes, tags, files...` and keyboard shortcut badge `⌘K`.
  - Clicking input or pressing `Cmd+K` / `Ctrl+K` triggers `onOpenSearch()`.
- **Action Controls (Right):**
  - **`⚡ Quick Note` button:** High-visibility amber button (`#f59e0b` / `rgba(245, 158, 11, 0.15)`) invoking `onQuickNote()`.
  - **`Tools ▾` Dropdown:** Indigo-accented dropdown menu containing shortcuts to:
    - Study Mode
    - Knowledge Base
    - Internal Mind
    - Pomodoro Timer
    - Typing Metrics
    - Dictionary & Abbreviations
    - Web Clipper
    - Link Tree
  - **User Profile & Sync Status Badge:**
    - Profile avatar circle with user initials / custom avatar.
    - User display name.
    - Sync status indicator pill with green pulsing dot (`Saved` / `Syncing` / `Offline`).
    - Settings button triggering `SettingsModal`.

### 3.2 Consolidated Sidebar Container (`src/components/Sidebar.tsx`)
- **Dimensions & Transition:**
  - Expanded width: `320px` (`w-80`).
  - Collapsed width: `48px` (`w-12`), collapsing the internal panels while keeping the expand toggle and top icon visible.
  - Smooth CSS transition (`0.15s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Header Section:**
  - **Workspace Selector:** Displays active workspace icon and name with a dropdown trigger to switch/create/manage workspaces.
  - **Collapse Toggle Button:** Direct button on the right of the header to toggle between collapsed and expanded states.
  - **Segmented M / N Mode Switcher:**
    - Segmented pill container:
      - `[ Navigation (M) ]`
      - `[ Notes (N) • {activeNotesCount} ]`
    - Active pill highlighted with deep surface background (`#182033`), indigo text (`#a5b4fc`), and subtle glow.
    - Keyboard shortcut listener: pressing `M` or `N` outside text fields switches the active sidebar tab.

### 3.3 Mode 'M' — Navigation & Directory Tree View
- **Navigation Views List:**
  - `All Notes` (shows count badge of all non-trashed notes)
  - `⚡ Quick Notes` (filters notes by quick-notes filter)
  - `★ Favorites` (shows count of favorited notes)
  - `🕒 Recent Notes` (sorts by recent update timestamp)
  - `📎 With Files & Media` (filters notes with attachments)
  - `🏷️ Tag Directory` (shows tag count, opens tag filter popover)
  - `📖 Library & Files` (shows book and file breakdown, opens library manager)
- **Books Section:**
  - Collapsible section header: `▾ 📚 Books {count}` with settings gear icon.
  - Pinned books list with page counts and active selection state.
  - `+ Browse & Pin Books` button triggering `BookSelectorModal`.
- **Folders Section:**
  - Collapsible section header: `▾ 📁 Folders {count}` with settings gear icon.
  - Hierarchical folder list with expandable children and note badges.
  - `+ Browse & Pin Folders` button triggering `FolderSelectorModal`.
- **Interactive Behavior:** Clicking a folder or filter automatically selects the filter and switches the view smoothly to Mode 'N' (Notes Feed) so the user immediately sees the filtered notes.

### 3.4 Mode 'N' — Notes Feed List View
- **Header & Create Action:**
  - Section title `Notes` with count pill.
  - `+ New Note` primary gradient button (`from-indigo-600 to-indigo-500`) with hover glow.
- **Search & Sort Toolbar:**
  - Inline input `Search notes in list...` to filter notes in real-time.
  - Sort dropdown selector: `Recent`, `Title`, `Date Modified`, `Pinned`.
- **Scrollable Note Cards:**
  - Card container with hover styling (`#111624` default, `#151c2d` hover).
  - Selected note card highlighted with indigo outline (`#6366f1` / `#182033`).
  - Title with single-line truncation.
  - Hover action buttons:
    - Favorite star (`★`)
    - Split View (`◫`) to open note in secondary split pane
    - Move folder (`📁`)
    - Soft delete (`🗑`)
  - Metadata row: Relative timestamp (`Just now`, `3d ago`) and folder badge (`📁 Uncategorized`, `📗 Daily Notes`).

### 3.5 Sidebar Footer & Theme Integration
- **Archive & Bin:** Quick access buttons to view archived notes and trash bin with item counts.
- **Theme Switcher:** Compact segmented options: `☀️ Day`, `🌙 Night`, and `🖥️ Auto`.
- **`✨ More` Options:** Dropdown for Settings, Vault Export/Backup, and Help Tour.

### 3.6 Layout & State Coordination (`src/App.tsx`)
- **Layout Container:**
  - Removes the hardcoded separate `<NoteList />` column from `App.tsx`.
  - The single `<Sidebar />` now handles both Navigation and Notes List display based on the `sidebarViewMode` (`'navigation'` | `'notes'`).
  - When the sidebar is collapsed, the Note Editor expands across the entire available workspace.
- **State Management:**
  - Persists `sidebarViewMode` in localStorage / UI preferences.
  - Retains all existing callbacks: `onSelectNote`, `onSelectNoteSplit`, `onCreateNote`, `onToggleFavorite`, `onDeleteNote`, `onMoveNote`, etc.

---

## 4. Design Tokens & Styling (`src/styles/theme.css`, `src/styles/layout.css`)
- Realign dark theme tokens with Stitch color definitions:
  - `--bg-app`: `#090b10`
  - `--bg-sidebar`: `#0d111a`
  - `--bg-editor`: `#0b0e14`
  - `--bg-surface`: `#131824`
  - `--border-color`: `#1c2233`
  - `--border-light`: `#262f47`
  - `--accent-primary`: `#6366f1`
  - `--accent-primary-hover`: `#4f46e5`
  - Custom dark scrollbars (`::-webkit-scrollbar` with `#1e2638` thumb).

---

## 5. Testing & Verification Plan

### Automated Verification:
1. `bun run build`: Ensure zero TypeScript or bundling errors.
2. `bun run lint`: Ensure no lint or syntax errors.
3. `bun test`: Run existing test suite to ensure no regression in business logic.

### Manual / Browser Verification:
1. Load `http://localhost:5173/` in the browser.
2. Verify Top Header:
   - Omnisearch opens search modal on click and `⌘K`.
   - `⚡ Quick Note` button creates a note.
   - `Tools ▾` dropdown triggers each modal tool.
   - Profile badge reflects user profile and sync state.
3. Verify Consolidated Sidebar:
   - Segmented `[ Navigation (M) ]` and `[ Notes (N) ]` switches between views smoothly.
   - Shortcut keys `M` and `N` switch tabs.
   - Mode M displays navigation, books, and folders.
   - Mode N displays note cards with hover actions (favorite, split, delete).
   - Selecting a note opens it in the Editor.
   - Collapse button toggles sidebar between 320px and 48px rail.
