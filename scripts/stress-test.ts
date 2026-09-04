/**
 * MILEARNAPP High-Volume Performance & Resource Stress Testing Suite
 * Benchmarks:
 * 1. Massive In-Memory Ingestion (2,000 Notes, 5,000 Flashcards)
 * 2. Full-Text Search Throughput & Latency Distribution (p50, p95, p99)
 * 3. SuperMemo-2 Spaced Repetition Batch Calculation Throughput
 * 4. Zod Runtime Schema Validation Stress
 * 5. Zero-Knowledge Cryptographic Throughput (AES-256-GCM & PBKDF2)
 * 6. RAM Heap Profile (Baseline, Peak, Delta per Item)
 */
import { validateNote } from '../src/services/validation/schemas.js';
import { flashcardService } from '../src/services/flashcards.js';
import { cryptoService } from '../src/services/crypto.js';
import type { Note, Flashcard } from '../src/types/index.js';

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function runStressTest() {
  console.log('===============================================================');
  console.log('       MILEARNAPP PERFORMANCE & RESOURCE STRESS TEST           ');
  console.log('===============================================================\n');

  // Baseline Memory
  const baselineMem = process.memoryUsage();
  console.log(`[RAM] Baseline Heap Used:    ${formatBytes(baselineMem.heapUsed)}`);
  console.log(`[RAM] Baseline RSS:          ${formatBytes(baselineMem.rss)}\n`);

  // ---------------------------------------------------------------------------
  // 1. DATA SYNTHESIS & INGESTION STRESS
  // ---------------------------------------------------------------------------
  const NOTE_COUNT = 2000;
  const FLASHCARD_COUNT = 5000;
  console.log(`--- 1. Ingestion Stress (${NOTE_COUNT} Notes, ${FLASHCARD_COUNT} Flashcards) ---`);

  const t0 = performance.now();
  const notes: Note[] = [];
  const vocabulary = ['quantum', 'superposition', 'neural', 'backprop', 'compiler', 'monad', 'react', 'indexeddb', 'distributed', 'consensus', 'raft', 'paxos', 'algorithm', 'complexity', 'entropy'];

  for (let i = 0; i < NOTE_COUNT; i++) {
    const word1 = vocabulary[i % vocabulary.length];
    const word2 = vocabulary[(i * 3) % vocabulary.length];
    const word3 = vocabulary[(i * 7) % vocabulary.length];

    notes.push({
      id: `note-stress-${i}`,
      title: `Document ${i}: Analysis of ${word1} and ${word2}`,
      content: `# Study Note ${i}\n\nThis note thoroughly examines concepts in **${word1}** and compares it with **${word2}** and **${word3}**.\n\n## Section 1: Foundations\nKey mathematical formulations:\n$$\\mathcal{H} = \\sum_{k} \\omega_k a_k^\\dagger a_k$$\n\nDetailed breakdown of mechanisms and observations.`,
      tags: [word1, word2, 'stress-test', `batch-${i % 10}`],
      folderId: `folder-${i % 20}`,
      isFavorite: i % 10 === 0,
      isPinned: false,
      attachments: [],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  const flashcards: Flashcard[] = [];
  for (let i = 0; i < FLASHCARD_COUNT; i++) {
    flashcards.push({
      id: `card-stress-${i}`,
      noteId: `note-stress-${i % NOTE_COUNT}`,
      noteTitle: `Document ${i % NOTE_COUNT}`,
      question: `What is the core premise of ${vocabulary[i % vocabulary.length]} in module ${i}?`,
      answer: `The fundamental mechanism relies on deterministic state transitions and mathematical invariants in module ${i}.`,
      type: 'qa',
      repetition: i % 8,
      interval: Math.max(1, (i % 30)),
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + (i % 7) * 86400000).toISOString().split('T')[0],
      tags: ['stress', vocabulary[i % vocabulary.length]]
    });
  }

  const ingestionTime = performance.now() - t0;
  const postIngestMem = process.memoryUsage();

  console.log(`✓ Synthesized & Ingested ${NOTE_COUNT} notes and ${FLASHCARD_COUNT} flashcards in ${ingestionTime.toFixed(2)}ms`);
  console.log(`  Ingestion Throughput:      ${((NOTE_COUNT + FLASHCARD_COUNT) / (ingestionTime / 1000)).toFixed(0)} entities/sec`);
  console.log(`[RAM] Heap after Ingestion:  ${formatBytes(postIngestMem.heapUsed)} (+${formatBytes(postIngestMem.heapUsed - baselineMem.heapUsed)})`);
  console.log(`[RAM] Heap per Note/Card:    ${((postIngestMem.heapUsed - baselineMem.heapUsed) / (NOTE_COUNT + FLASHCARD_COUNT)).toFixed(0)} bytes/entity\n`);

  // ---------------------------------------------------------------------------
  // 2. ZOD RUNTIME SCHEMA VALIDATION STRESS
  // ---------------------------------------------------------------------------
  console.log(`--- 2. Zod Schema Validation Stress (${NOTE_COUNT} Notes) ---`);
  const tValStart = performance.now();
  let validCount = 0;
  for (const note of notes) {
    const res = validateNote(note);
    if (res.success) validCount++;
  }
  const valDuration = performance.now() - tValStart;
  console.log(`✓ Validated ${validCount}/${NOTE_COUNT} full notes in ${valDuration.toFixed(2)}ms`);
  console.log(`  Validation Throughput:     ${(NOTE_COUNT / (valDuration / 1000)).toFixed(0)} validations/sec\n`);

  // ---------------------------------------------------------------------------
  // 3. FULL-TEXT SEARCH STRESS & LATENCY PROFILE
  // ---------------------------------------------------------------------------
  console.log(`--- 3. Search Engine Stress (50 Rapid-Fire Queries over ${NOTE_COUNT} Notes) ---`);
  const queries = [
    'quantum superposition',
    'compiler monad',
    'neural backprop',
    'distributed consensus raft',
    'algorithm complexity',
    'entropy analysis',
    'foundations mathematical',
    'note-stress',
    'Section 1',
    'nonexistenttermxyz'
  ];

  const latencies: number[] = [];
  let totalMatches = 0;

  for (let round = 0; round < 5; round++) {
    for (const q of queries) {
      const qLower = q.toLowerCase();
      const tokens = qLower.split(/\s+/);

      const tQueryStart = performance.now();
      const matches = notes.filter(n => {
        const titleL = n.title.toLowerCase();
        const contentL = n.content.toLowerCase();
        const tagsL = n.tags.map(t => t.toLowerCase()).join(' ');
        return tokens.every(tok => titleL.includes(tok) || contentL.includes(tok) || tagsL.includes(tok));
      });
      const qLatency = performance.now() - tQueryStart;
      latencies.push(qLatency);
      totalMatches += matches.length;
    }
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const maxLat = latencies[latencies.length - 1];
  const avgLat = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log(`✓ Executed ${latencies.length} queries across ${NOTE_COUNT} notes (Total results matched: ${totalMatches})`);
  console.log(`  Avg Query Latency:         ${avgLat.toFixed(3)}ms`);
  console.log(`  p50 Latency:               ${p50.toFixed(3)}ms`);
  console.log(`  p95 Latency:               ${p95.toFixed(3)}ms`);
  console.log(`  p99 Latency:               ${p99.toFixed(3)}ms`);
  console.log(`  Max Latency:               ${maxLat.toFixed(3)}ms\n`);

  // ---------------------------------------------------------------------------
  // 4. SUPERMEMO-2 SPACED REPETITION BATCH CALCULATION STRESS
  // ---------------------------------------------------------------------------
  console.log(`--- 4. SuperMemo-2 Spaced Repetition Stress (${FLASHCARD_COUNT} Flashcards) ---`);
  const tSM2Start = performance.now();
  let updatedCards = 0;
  for (const card of flashcards) {
    const updated = flashcardService.scheduleCard(card, 3); // Grade 3: Good
    if (updated.easeFactor >= 1.3) updatedCards++;
  }
  const sm2Duration = performance.now() - tSM2Start;
  console.log(`✓ Calculated SM-2 retention curves for ${updatedCards} cards in ${sm2Duration.toFixed(2)}ms`);
  console.log(`  SM-2 Throughput:           ${(FLASHCARD_COUNT / (sm2Duration / 1000)).toFixed(0)} evaluations/sec\n`);

  // ---------------------------------------------------------------------------
  // 5. ZERO-KNOWLEDGE CRYPTOGRAPHY BENCHMARK (WebCrypto AES-256-GCM + PBKDF2)
  // ---------------------------------------------------------------------------
  console.log('--- 5. Zero-Knowledge Cryptography Stress (AES-256-GCM + 600,000 PBKDF2 Iterations) ---');
  const sampleNote = notes[0];
  const passphrase = 'SuperSecretStressPassphrase!2026';

  const tCryptoStart = performance.now();
  const encrypted = await cryptoService.encrypt(sampleNote.content, passphrase, sampleNote.id, 'Stress test hint');
  const encryptDuration = performance.now() - tCryptoStart;

  const tDecryptStart = performance.now();
  const decrypted = await cryptoService.decrypt(encrypted, passphrase, sampleNote.id);
  const decryptDuration = performance.now() - tDecryptStart;

  console.log(`✓ Encrypted ${sampleNote.content.length} chars in ${encryptDuration.toFixed(2)}ms (PBKDF2 600k + AES-GCM)`);
  console.log(`✓ Decrypted ciphertext in ${decryptDuration.toFixed(2)}ms`);
  console.log(`  Integrity Verified:        ${decrypted === sampleNote.content}\n`);

  // ---------------------------------------------------------------------------
  // 6. FINAL MEMORY AUDIT & RESOURCE EVALUATION
  // ---------------------------------------------------------------------------
  const peakMem = process.memoryUsage();
  console.log('--- 6. Memory & Resource Footprint Summary ---');
  console.log(`  Initial Baseline Heap:     ${formatBytes(baselineMem.heapUsed)}`);
  console.log(`  Peak Heap Under Full Load: ${formatBytes(peakMem.heapUsed)}`);
  console.log(`  Heap Memory Delta:         +${formatBytes(peakMem.heapUsed - baselineMem.heapUsed)}`);
  console.log(`  Total RSS Memory:          ${formatBytes(peakMem.rss)}`);
  console.log('===============================================================\n');
}

runStressTest().catch(console.error);
