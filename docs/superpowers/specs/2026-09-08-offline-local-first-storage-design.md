# Offline Local-First Storage & Desktop Readiness Specification

**Date:** 2026-09-08  
**Status:** Approved by User  
**Scope:** Phase 1 — Standalone Offline Local Storage (Web & Desktop)  

---

## 1. Executive Summary

MiLEARNAPP is evolving into a true local-first workstation across Web (Vercel/Browser) and Native Desktop (Tauri). 

**Phase 1 Objective:** Enable 100% standalone, zero-backend, zero-cloud offline capability so that any user opening the app in a web browser (Vercel) or on native desktop (Tauri) has immediate, persistent, and unconstrained local storage with zero network dependencies or failed-sync errors.

---

## 2. Architecture & Design Principles

### 2.1 The Local-First Guarantee
1. **Zero External Dependency to Boot:** The application boots up in < 200ms directly from local assets and local storage. No server, no Docker, and no internet connection required.
2. **Persistence Guarantee:** Automatically request persistent storage via `navigator.storage.persist()`, preventing browser cache evictions even under low disk space.
3. **Infinite Capacity (Beyond 5MB localStorage):** Migrate heavy entities (flashcards, citations, attachments) from limited `localStorage` into **IndexedDB** (`noteflow_db`), allowing gigabytes of notes, media, and learning records.
4. **Desktop Autonomy:** Provide native desktop scaffolding via **Tauri** (`src-tauri/`) sharing the exact same frontend and local-first storage adapter.

---

## 3. Storage Layer Design

### 3.1 IndexedDB Schema Expansion (`noteflow_db` v3)
Expand `openDB()` to support 6 dedicated object stores:
* `notes` (key: `id`)
* `folders` (key: `id`)
* `workspaces` (key: `id`)
* `books` (key: `id`)
* `flashcards` (key: `id`)
* `citations` (key: `id`)

### 3.2 Storage Quota & Eviction Shield (`navigator.storage`)
* On startup, call `navigator.storage.persist()`:
  * Informs the browser that MiLEARNAPP holds essential user data.
  * Ensures data is never evicted during browser cleanup cycles.
* Call `navigator.storage.estimate()`:
  * Provides real-time quota metrics (`usage` and `quota`) displayed in the Settings Storage & Diagnostics panel.

### 3.3 Offline Telemetry & Graceful Fallback
* When running without a backend (e.g. static Vercel SPA or offline desktop):
  * Remove noisy "PostgreSQL offline / sync deferred" error banners.
  * Display a clean, reassuring badge in Settings and Header: `🟢 Local-First Active (100% Offline)`.
  * Background sync only activates if an active `/api/health` heartbeat is detected.

---

## 4. Tauri Desktop Scaffolding

### 4.1 Configuration
* Add `@tauri-apps/api` and `@tauri-apps/cli`.
* Configure `src-tauri/tauri.conf.json`:
  * Product name: `MiLEARNAPP`
  * Window configuration: 1200x800 minimum, frameless or modern titlebar, background `#0b0e17`.
  * Capabilities: Local file system dialogs, system tray, and global shortcut (`Alt+Q` quick note).

---

## 5. Verification & Testing Plan

1. **Unit & Schema Tests:**
   * Test `openDB()` v3 schema creation and multi-store transactions.
   * Test quota estimation helper and persistence request logic.
   * Test that all 65 existing tests pass without regression.
2. **Build Verification:**
   * `bun run lint` (0 errors)
   * `bun x tsc -b` (0 type errors)
   * `bun run build` (Production Vite bundle compiles cleanly)
3. **Runtime Verification:**
   * Verify app loads cleanly in standalone mode with 0 failed fetch error logs.
