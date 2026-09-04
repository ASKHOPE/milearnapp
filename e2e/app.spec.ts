// ==============================================================================
// Playwright E2E Test Suite for MiLEARNAPP Core Productivity & Learning Modules
// ==============================================================================

import { test, expect } from '@playwright/test';

test.describe('MiLEARNAPP Enterprise Desktop App Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to finish loading notes and DB sync
    await page.waitForSelector('.app-header', { timeout: 10000 });
  });

  test('loads the app and renders navigation bar, brand, and sidebar', async ({ page }) => {
    await expect(page).toHaveTitle(/MiLEARNAPP|NoteFlow/);
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // Verify PostgreSQL status indicator dot is rendered on settings in header
    const pgDot = page.locator('.settings-nav-pg-dot');
    await expect(pgDot).toBeVisible();
  });

  test('allows opening and testing the Pomodoro Focus Timer modal', async ({ page }) => {
    const pomoWidget = page.locator('.header-pinned-widget').filter({ hasText: /25:00|\d{2}:\d{2}/ }).first();
    if (await pomoWidget.isVisible()) {
      await pomoWidget.click();
      const modal = page.locator('.pomo-timer-view');
      await expect(modal).toBeVisible();
      // Press escape to close
      await page.keyboard.press('Escape');
    }
  });

  test('launches the interactive Typing Practice Game sprint modal', async ({ page }) => {
    const typingWidget = page.locator('.typing-meter-widget').first();
    if (await typingWidget.isVisible()) {
      await typingWidget.click();
      await expect(page.locator('text=Typing Practice Game')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('opens Study Arena and allows viewing active recall flashcards', async ({ page }) => {
    const studyBtn = page.locator('button[title*="Study Cards"]').first();
    if (await studyBtn.isVisible()) {
      await studyBtn.click();
      await expect(page.locator('text=Study Arena & Flashcard Studio')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('opens Database Settings tab from PostgreSQL status indicator', async ({ page }) => {
    const profileTablet = page.locator('.header-profile-tablet');
    await profileTablet.click();

    // Switch to database tab in settings modal
    await page.locator('button:has-text("PostgreSQL Sync")').click();

    // Verify settings modal shows Database Sync tab with live Docker container
    await expect(page.locator('text=PostgreSQL 16 Container Online')).toBeVisible();
    await expect(page.locator('text=Relational Table Telemetry')).toBeVisible();

    // Close settings modal
    await page.keyboard.press('Escape');
  });

  test('opens Folder Link Tree modal with SuperMemo-2 concept retention badges', async ({ page }) => {
    const linkTreeBtn = page.locator('button[title*="Folder Link Tree"]').first();
    if (await linkTreeBtn.isVisible()) {
      await linkTreeBtn.click();
      await expect(page.locator('text=Folder Link Tree Visualizer')).toBeVisible();
      await expect(page.locator('text=Mastered')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('opens Web Clipper & Content Structurer modal from tools tray', async ({ page }) => {
    // Open tools tray
    const toolsBtn = page.locator('.tools-tray-trigger-btn').first();
    await toolsBtn.click();

    // Click Web Clipper
    const webClipperItem = page.locator('button[title*="Web Clipper"]').first();
    if (await webClipperItem.isVisible()) {
      await webClipperItem.click();
      await expect(page.locator('text=Web Clipper & Content Structurer')).toBeVisible();
      await expect(page.locator('text=Fetch from Web URL')).toBeVisible();
      await expect(page.locator('text=Paste HTML / Source')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('supports luxury themes and typography studio preferences in settings', async ({ page }) => {
    // Open settings modal
    const profileTablet = page.locator('.header-profile-tablet').first();
    await profileTablet.click();

    // Switch to Themes & Typography tab
    const appearanceTab = page.locator('button').filter({ hasText: /Themes/i }).first();
    await appearanceTab.click();

    // Verify Curated Luxury Themes are visible
    await expect(page.locator('text=Curated Luxury Themes')).toBeVisible();
    await expect(page.locator('text=Obsidian Onyx')).toBeVisible();
    await expect(page.locator('text=Tokyo Midnight')).toBeVisible();
    await expect(page.locator('text=Nordic Frost')).toBeVisible();
    await expect(page.locator('text=Editorial Paper')).toBeVisible();

    // Click Obsidian Onyx and verify document theme
    await page.locator('button').filter({ hasText: /Obsidian Onyx/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'oled');

    // Click Editorial Paper and verify document theme
    await page.locator('button').filter({ hasText: /Editorial Paper/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'editorial');

    // Verify Typography Studio
    await expect(page.locator('text=Typography Studio')).toBeVisible();
    await expect(page.locator('text=Live Typography Sample')).toBeVisible();

    // Click Editorial Serif font option
    const serifBtn = page.locator('button').filter({ hasText: /Editorial Serif/i }).first();
    await serifBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-font', 'serif');

    await page.keyboard.press('Escape');
  });

  test('displays floating bubble toolbar on text selection in editor', async ({ page }) => {
    // Locate the editor textarea
    const textarea = page.locator('.note-textarea').first();
    if (await textarea.isVisible()) {
      await textarea.focus();
      // Select some text
      await textarea.evaluate((el: HTMLTextAreaElement) => {
        el.setSelectionRange(0, 10);
        document.dispatchEvent(new Event('selectionchange'));
      });

      // Floating bubble toolbar should be visible
      const toolbar = page.locator('.editor-floating-bubble-toolbar');
      await expect(toolbar).toBeVisible({ timeout: 5000 });
      // Verify quick action buttons exist
      await expect(toolbar.locator('button[title*="Bold"]').first()).toBeVisible();
      await expect(toolbar.locator('button[title*="Flashcard"]').first()).toBeVisible();
      await expect(toolbar.locator('button[title*="Wikilink"]').first()).toBeVisible();
      await expect(toolbar.locator('button[title*="Cloze"]').first()).toBeVisible();
    }
  });
});
