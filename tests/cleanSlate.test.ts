import { describe, it, expect } from 'bun:test';
import { storage } from '../src/services/storage';

describe('Clean Slate Vault Initialization Tests', () => {
  it('creates clean slate vault with exactly 1 personal workspace and 1 welcome note', async () => {
    const data = await storage.createCleanSlateVault();

    expect(data.workspaces.length).toBe(1);
    expect(data.workspaces[0].id).toBe('ws-personal');
    expect(data.workspaces[0].name).toBe('Personal');
    expect(data.workspaces[0].createdAt).toBeDefined();

    expect(data.folders.length).toBe(1);
    expect(data.folders[0].id).toBe('f-quick');
    expect(data.folders[0].name).toBe('Quick Notes');

    expect(data.books.length).toBe(0);

    expect(data.notes.length).toBe(1);
    expect(data.notes[0].id).toBe('n-welcome');
    expect(data.notes[0].title).toBe('Welcome to your Workspace');
    expect(data.notes[0].folderId).toBe('f-quick');
    expect(data.notes[0].workspaceId).toBe('ws-personal');
    expect(data.notes[0].content).toContain('# Welcome to MiLEARNAPP');
    expect(data.notes[0].isFavorite).toBe(true);
    expect(data.notes[0].isPinned).toBe(true);
    expect(data.notes[0].createdAt).toBeDefined();
    expect(data.notes[0].updatedAt).toBeDefined();
  });

  it('can transition from clean slate to reseeded tutorial vault and vice-versa cleanly', async () => {
    // 1. Re-seed tutorial
    const tutorialData = await storage.reseedTutorialVault();
    expect(tutorialData.workspaces.length).toBe(4);
    expect(tutorialData.books.length).toBe(3);
    expect(tutorialData.notes.length).toBeGreaterThan(5);

    // 2. Transition to clean slate
    const cleanData = await storage.createCleanSlateVault();
    expect(cleanData.workspaces.length).toBe(1);
    expect(cleanData.books.length).toBe(0);
    expect(cleanData.notes.length).toBe(1);
  });
});
