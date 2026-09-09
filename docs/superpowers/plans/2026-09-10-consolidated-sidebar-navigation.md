# Consolidated M & N Sidebar & Modern Top Navigation Plan

Consolidate the dual-pane sidebar (`Sidebar.tsx` + `NoteList.tsx`) into a single high-efficiency 320px column with segmented M/N toggles, modernized dark Stitch design tokens, and rebuild the global header with centered omnisearch (`⌘K`), quick note action, tools menu, and profile/sync indicator.

## Implemented Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                      Top Global Navigation (<Header />)                             |
|  [MILEARNAPP Logo]  |         [ Search notes, tags, files... ⌘K ]         | [⚡ Quick] [Tools ▾] [Profile] |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  Consolidated Sidebar (<Sidebar />)              |   Note Editor (<NoteEditor /> / <SplitWindow />) |
|  Width: 320px (or 48px collapsed)                |   Expands across entire remaining width         |
|                                                  |                                                 |
|  +--------------------------------------------+  |                                                 |
|  | [🌿 Personal Vault ▾]  [◧ Collapse Button] |  |                                                 |
|  | [ Menu (M) ]  [ Notes (N) • 7 ]            |  |                                                 |
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

## Changes Made
1. `src/styles/theme.css`: Aligned dark tokens with Stitch palette (`#090b10`, `#0d111a`, `#0b0e14`, `#131824`, `#1c2233`, `#6366f1`).
2. `src/styles/layout.css`: Added styles for consolidated sidebar, segmented switcher, note cards, hover actions, 48px rail, and modern header.
3. `src/components/Header.tsx`: Rebuilt top header with MILEARNAPP brand, centered omnisearch (`⌘K`), amber quick note button, tools dropdown, and user profile pill with live PostgreSQL sync indicator.
4. `src/components/Sidebar.tsx`: Consolidated Mode 'M' (Menu) and Mode 'N' (Notes) into a single 320px column with keyboard shortcuts (`M`, `N`), search, sort, note cards, hover actions, and 48px collapsed rail.
5. `src/App.tsx`: Removed standalone `NoteList` column, wired all note actions into `Sidebar`, and reclaimed full width for the editor.
