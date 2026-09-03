import { describe, it, expect } from 'bun:test';
import { scanTextToDiagram } from '../src/services/textToDiagram';

describe('Text-to-Diagram Intelligent Pattern Scanner Tests', () => {
  it('converts arrow sequences into a sequential Flowchart', () => {
    const input = 'Client -> Server -> Database -> Cache';
    const result = scanTextToDiagram(input);

    expect(result.detectedType).toBe('flowchart');
    expect(result.chartCode).toContain('graph TD');
    expect(result.chartCode).toContain('Node1([Client])');
    expect(result.chartCode).toContain('Node1 --> Node2');
    expect(result.chartCode).toContain('Node3 --> Node4');
    expect(result.chartCode).toContain('Node4([Cache])');
  });

  it('converts numbered step lists into a Step-by-Step Flowchart', () => {
    const input = `1. Initialize the local database repository
2. Load configuration environment variables
3. Connect to WebSocket client channel
4. Render the responsive interface`;

    const result = scanTextToDiagram(input);

    expect(result.detectedType).toBe('flowchart');
    expect(result.chartCode).toContain('graph TD');
    expect(result.chartCode).toContain('Step1["Step 1: Initialize the local database repository"]');
    expect(result.chartCode).toContain('Step1 --> Step2');
    expect(result.chartCode).toContain('Step2 --> Step3');
    expect(result.chartCode).toContain('Step3 --> Step4');
  });

  it('converts indented outlines into a hierarchical Mindmap', () => {
    const input = `MiLEARNAPP Architecture
  Frontend Layer
    React Components
    Custom CSS Tokens
  Data Engine
    IndexedDB Storage
    Zero Knowledge Encryption`;

    const result = scanTextToDiagram(input);

    expect(result.detectedType).toBe('mindmap');
    expect(result.chartCode).toContain('mindmap');
    expect(result.chartCode).toContain('root((MiLEARNAPP Architecture))');
    expect(result.chartCode).toContain('Frontend Layer');
    expect(result.chartCode).toContain('React Components');
    expect(result.chartCode).toContain('Data Engine');
  });

  it('detects lifecycle states and converts into a State Diagram', () => {
    const input = 'Notes start as a Draft, then transition to In Review, get Approved, and finally Archived.';
    const result = scanTextToDiagram(input);

    expect(result.detectedType).toBe('state');
    expect(result.chartCode).toContain('stateDiagram-v2');
    expect(result.chartCode).toContain('[*] --> Draft');
    expect(result.chartCode).toContain('Draft --> Review');
    expect(result.chartCode).toContain('Approved --> Archived');
  });

  it('detects actor interactions and converts into a Sequence Diagram', () => {
    const input = `User clicks checkout button
Server verifies card balance
Database updates order status
Server returns confirmation receipt`;

    const result = scanTextToDiagram(input);

    expect(result.detectedType).toBe('sequence');
    expect(result.chartCode).toContain('sequenceDiagram');
    expect(result.chartCode).toContain('autonumber');
    expect(result.chartCode).toContain('actor User');
    expect(result.chartCode).toContain('actor Server');
    expect(result.chartCode).toContain('actor Database');
  });

  it('provides a graceful fallback flowchart for empty or generic text', () => {
    const emptyResult = scanTextToDiagram('');
    expect(emptyResult.chartCode).toContain('graph TD');
    expect(emptyResult.chartCode).toContain('Start([Start])');

    const genericResult = scanTextToDiagram('Deep study session notes on modern algorithms');
    expect(genericResult.chartCode).toContain('graph TD');
    expect(genericResult.chartCode).toContain('Action / Analysis');
  });
});
