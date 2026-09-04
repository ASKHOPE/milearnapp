/**
 * PostgreSQL Database Seeder for MiLEARNAPP
 * 
 * Populates the running PostgreSQL container with users, workspaces, books,
 * folders, notes, flashcards, typing passages, citations, dictionary words, and abbreviations.
 */

import { SQL } from 'bun';
import { SAMPLE_WORKSPACES, SAMPLE_BOOKS, SAMPLE_FOLDERS, SAMPLE_NOTES } from '../src/services/seedData';
import { SEED_CITATIONS } from '../src/services/citationService';

const rawUrl = process.env.DATABASE_URL || 'postgresql://milearn:milearn_password@localhost:5432/milearndb';
const DATABASE_URL = rawUrl.replace(/\?.*$/, '');

console.log('🌱 Connecting to PostgreSQL at:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));
const sql = new SQL(DATABASE_URL);

function toPgArray(arr?: string[]): string {
  if (!arr || arr.length === 0) return '{}';
  return `{${arr.map(item => `"${String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
}

export async function runSeed() {
  try {
    console.log('⚡ Starting comprehensive database seeding...');

    // 1. Seed Default User
    const defaultUserId = 'user-default';
    await sql`
      INSERT INTO users (id, email, name, bio, role, avatar_type, avatar_value, mood, created_at, updated_at)
      VALUES (
        ${defaultUserId},
        'alex.mercer@milearn.io',
        'Alex Mercer',
        'Systems Architect & Deep Learning Researcher. Building local-first knowledge systems.',
        'Systems Architect',
        'emoji',
        '⚡',
        'Deep Focus',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        bio = EXCLUDED.bio,
        role = EXCLUDED.role,
        avatar_type = EXCLUDED.avatar_type,
        avatar_value = EXCLUDED.avatar_value,
        mood = EXCLUDED.mood,
        updated_at = NOW();
    `;
    console.log('✅ User seeded:', defaultUserId);

    // 2. Seed Workspaces
    for (const ws of SAMPLE_WORKSPACES) {
      await sql`
        INSERT INTO workspaces (id, user_id, name, icon, color, description, created_at)
        VALUES (
          ${ws.id},
          ${defaultUserId},
          ${ws.name},
          ${ws.icon || '💼'},
          ${ws.color || '#6366f1'},
          ${ws.description || ''},
          ${ws.createdAt ? new Date(ws.createdAt) : new Date()}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          description = EXCLUDED.description;
      `;
    }
    console.log(`✅ ${SAMPLE_WORKSPACES.length} Workspaces seeded.`);

    // 3. Seed Books
    for (const book of SAMPLE_BOOKS) {
      await sql`
        INSERT INTO books (id, user_id, workspace_id, title, icon, color, description, created_at)
        VALUES (
          ${book.id},
          ${defaultUserId},
          ${book.workspaceId || 'ws-milearn'},
          ${book.title},
          ${book.icon || '📖'},
          ${book.color || '#10b981'},
          ${book.description || ''},
          ${book.createdAt ? new Date(book.createdAt) : new Date()}
        )
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          title = EXCLUDED.title,
          icon = EXCLUDED.icon,
          color = EXCLUDED.color,
          description = EXCLUDED.description;
      `;
    }
    console.log(`✅ ${SAMPLE_BOOKS.length} Books seeded.`);

    // 4. Seed Folders
    for (const folder of SAMPLE_FOLDERS) {
      await sql`
        INSERT INTO folders (id, user_id, workspace_id, name, parent_id, color, icon, created_at)
        VALUES (
          ${folder.id},
          ${defaultUserId},
          ${folder.workspaceId || 'ws-milearn'},
          ${folder.name},
          ${folder.parentId || null},
          ${folder.color || null},
          ${folder.icon || null},
          ${folder.createdAt ? new Date(folder.createdAt) : new Date()}
        )
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          name = EXCLUDED.name,
          parent_id = EXCLUDED.parent_id,
          color = EXCLUDED.color,
          icon = EXCLUDED.icon;
      `;
    }
    console.log(`✅ ${SAMPLE_FOLDERS.length} Folders seeded.`);

    // 5. Seed Notes
    for (const note of SAMPLE_NOTES) {
      await sql`
        INSERT INTO notes (
          id, user_id, workspace_id, folder_id, book_id, parent_page_id, page_order,
          title, content, tags, is_favorite, is_pinned, is_archived, is_trashed,
          is_locked, created_at, updated_at
        )
        VALUES (
          ${note.id},
          ${defaultUserId},
          ${note.workspaceId || 'ws-milearn'},
          ${note.folderId || null},
          ${note.bookId || null},
          ${note.parentPageId || null},
          ${note.pageOrder || 0},
          ${note.title},
          ${note.content || ''},
          ${toPgArray(note.tags)}::text[],
          ${!!note.isFavorite},
          ${!!note.isPinned},
          ${!!note.isArchived},
          ${!!note.isTrashed},
          ${!!note.isLocked},
          ${note.createdAt ? new Date(note.createdAt) : new Date()},
          ${note.updatedAt ? new Date(note.updatedAt) : new Date()}
        )
        ON CONFLICT (id) DO UPDATE SET
          workspace_id = EXCLUDED.workspace_id,
          folder_id = EXCLUDED.folder_id,
          book_id = EXCLUDED.book_id,
          parent_page_id = EXCLUDED.parent_page_id,
          page_order = EXCLUDED.page_order,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          tags = EXCLUDED.tags,
          is_favorite = EXCLUDED.is_favorite,
          is_pinned = EXCLUDED.is_pinned,
          is_archived = EXCLUDED.is_archived,
          is_trashed = EXCLUDED.is_trashed,
          is_locked = EXCLUDED.is_locked,
          updated_at = EXCLUDED.updated_at;
      `;
    }
    console.log(`✅ ${SAMPLE_NOTES.length} Notes seeded.`);

    // 6. Seed Typing Passages
    const passages = [
      {
        id: 'pass-1',
        title: 'Local-First Philosophy',
        category: 'Tech',
        difficulty: 'beginner',
        text: "Local-first software gives users ownership of their data and operates reliably without requiring constant network connectivity."
      },
      {
        id: 'pass-2',
        title: 'Knowledge Graphs',
        category: 'Science',
        difficulty: 'intermediate',
        text: "Knowledge graphs represent relationships between concepts, transforming unstructured notes into interconnected thought networks."
      },
      {
        id: 'pass-3',
        title: 'Spaced Repetition Mastery',
        category: 'Wisdom',
        difficulty: 'intermediate',
        text: "The SuperMemo-2 spaced repetition algorithm calculates exponential review intervals to combat the human forgetting curve."
      },
      {
        id: 'pass-4',
        title: 'Keystroke Dynamics & Rhythm',
        category: 'Science',
        difficulty: 'expert',
        text: "Keystroke dynamics analyze typing rhythm, flight time, and dwell duration to measure cognitive fluency and typing mastery."
      },
      {
        id: 'pass-5',
        title: 'PostgreSQL Indexing & B-Trees',
        category: 'Tech',
        difficulty: 'intermediate',
        text: "PostgreSQL B-Tree and GIN indexes accelerate queries across billions of records by maintaining balanced tree structures and inverted term maps."
      },
      {
        id: 'pass-6',
        title: 'Distributed Consensus & Raft',
        category: 'Tech',
        difficulty: 'expert',
        text: "The Raft consensus algorithm decomposes state machine replication into leader election, log replication, and commit safety."
      },
      {
        id: 'pass-7',
        title: 'Attention Is All You Need',
        category: 'Science',
        difficulty: 'expert',
        text: "The Transformer architecture discards recurrence entirely and relies on multi-head scaled dot-product self-attention to compute input representations."
      },
      {
        id: 'pass-8',
        title: 'Cognitive Load Theory',
        category: 'Wisdom',
        difficulty: 'beginner',
        text: "Working memory has limited capacity; structuring knowledge into modular chunks and schemas prevents cognitive overload."
      }
    ];

    for (const p of passages) {
      await sql`
        INSERT INTO typing_passages (id, title, category, difficulty, text, created_at)
        VALUES (${p.id}, ${p.title}, ${p.category}, ${p.difficulty}, ${p.text}, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          difficulty = EXCLUDED.difficulty,
          text = EXCLUDED.text;
      `;
    }
    console.log(`✅ ${passages.length} Typing Passages seeded.`);

    // 7. Seed Citations & Landmark Bibliography
    const citationItems = [
      ...SEED_CITATIONS.map(c => ({
        id: c.id,
        title: c.title,
        authors: (c.author || []).map(a => `${a.given || ''} ${a.family || ''}`.trim()),
        year: c.year || 2024,
        container: c['container-title'] || '',
        bibtex: `@article{${c.id},\n  title={${c.title}},\n  year={${c.year || 2024}}\n}`,
        tags: ['academic', 'reference'],
        isLandmark: false
      })),
      {
        id: 'shannon1948',
        title: 'A Mathematical Theory of Communication',
        authors: ['Claude E. Shannon'],
        year: 1948,
        container: 'Bell System Technical Journal',
        bibtex: `@article{shannon1948mathematical,\n  title={A mathematical theory of communication},\n  author={Shannon, Claude Elwood},\n  journal={Bell System Technical Journal},\n  volume={27},\n  number={3},\n  pages={379--423},\n  year={1948}\n}`,
        tags: ['information-theory', 'foundational'],
        isLandmark: true
      },
      {
        id: 'turing1936',
        title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
        authors: ['Alan M. Turing'],
        year: 1936,
        container: 'Proc. London Math. Soc.',
        bibtex: `@article{turing1936computable,\n  title={On computable numbers, with an application to the Entscheidungsproblem},\n  author={Turing, Alan Mathison},\n  journal={Proceedings of the London Mathematical Society},\n  volume={42},\n  pages={230--265},\n  year={1936}\n}`,
        tags: ['computer-science', 'turing-machine'],
        isLandmark: true
      },
      {
        id: 'kleppmann2017',
        title: 'Designing Data-Intensive Applications',
        authors: ['Martin Kleppmann'],
        year: 2017,
        container: "O'Reilly Media",
        bibtex: `@book{kleppmann2017designing,\n  title={Designing Data-Intensive Applications},\n  author={Kleppmann, Martin},\n  year={2017},\n  publisher={O'Reilly Media}\n}`,
        tags: ['distributed-systems', 'databases'],
        isLandmark: true
      },
      {
        id: 'ongaro2014raft',
        title: 'In Search of an Understandable Consensus Algorithm (Raft)',
        authors: ['Diego Ongaro', 'John Ousterhout'],
        year: 2014,
        container: 'USENIX ATC 14',
        bibtex: `@inproceedings{ongaro2014search,\n  title={In Search of an Understandable Consensus Algorithm},\n  author={Ongaro, Diego and Ousterhout, John},\n  booktitle={2014 USENIX Annual Technical Conference},\n  pages={305--319},\n  year={2014}\n}`,
        tags: ['distributed-systems', 'consensus', 'raft'],
        isLandmark: true
      }
    ];

    for (const c of citationItems) {
      await sql`
        INSERT INTO citations (id, user_id, title, authors, year, container, bibtex, tags, is_landmark, created_at)
        VALUES (
          ${c.id},
          ${defaultUserId},
          ${c.title},
          ${toPgArray(c.authors)}::text[],
          ${c.year},
          ${c.container},
          ${c.bibtex},
          ${toPgArray(c.tags)}::text[],
          ${c.isLandmark},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          authors = EXCLUDED.authors,
          year = EXCLUDED.year,
          container = EXCLUDED.container,
          bibtex = EXCLUDED.bibtex,
          tags = EXCLUDED.tags,
          is_landmark = EXCLUDED.is_landmark;
      `;
    }
    console.log(`✅ ${citationItems.length} Citations seeded.`);

    // 8. Seed Custom Words (Dictionary)
    const customWords = [
      {
        id: 'word-crdt',
        word: 'CRDT',
        definition: 'Conflict-free Replicated Data Type: A data structure that replicates across multiple nodes without requiring central coordination.',
        partOfSpeech: 'noun',
        example: 'MI-Learn synchronizes offline note edits using state-based CRDTs.',
        tags: ['distributed-systems', 'local-first']
      },
      {
        id: 'word-spaced-rep',
        word: 'Spaced Repetition',
        definition: 'A learning technique that incorporates increasing intervals of time between subsequent reviews of previously learned material.',
        partOfSpeech: 'noun',
        example: 'Spaced repetition enhances retention according to the Ebbinghaus forgetting curve.',
        tags: ['cognition', 'learning']
      },
      {
        id: 'word-zettelkasten',
        word: 'Zettelkasten',
        definition: 'A knowledge management and note-taking method using interconnected index cards to generate emergent insights.',
        partOfSpeech: 'noun',
        example: 'Niklas Luhmann used a Zettelkasten to author dozens of books and hundreds of articles.',
        tags: ['productivity', 'knowledge-graphs']
      },
      {
        id: 'word-wikilink',
        word: 'Wikilink',
        definition: 'A bidirectional hypertext link syntax [[Title]] connecting related notes across a personal knowledge graph.',
        partOfSpeech: 'noun',
        example: 'Typing [[Neural Networks]] creates an instant associative link.',
        tags: ['linking', 'syntax']
      },
      {
        id: 'word-local-first',
        word: 'Local-First',
        definition: 'A software architecture where data is stored primarily on client devices and synchronized opportunistically to the cloud.',
        partOfSpeech: 'adjective',
        example: 'Local-first architecture ensures instant responsiveness and user data ownership.',
        tags: ['architecture', 'philosophy']
      }
    ];

    for (const w of customWords) {
      await sql`
        INSERT INTO custom_words (id, user_id, word, definition, part_of_speech, example, tags, created_at)
        VALUES (
          ${w.id},
          ${defaultUserId},
          ${w.word},
          ${w.definition},
          ${w.partOfSpeech},
          ${w.example},
          ${toPgArray(w.tags)}::text[],
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          word = EXCLUDED.word,
          definition = EXCLUDED.definition,
          part_of_speech = EXCLUDED.part_of_speech,
          example = EXCLUDED.example,
          tags = EXCLUDED.tags;
      `;
    }
    console.log(`✅ ${customWords.length} Custom Dictionary Words seeded.`);

    // 9. Seed Abbreviations
    const abbreviations = [
      { id: 'abb-wpm', prefix: ';wpm', expansion: 'Words Per Minute', category: 'Metrics', description: 'Standard metric for typing speed measurement.' },
      { id: 'abb-crdt', prefix: ';crdt', expansion: 'Conflict-free Replicated Data Type', category: 'Tech', description: 'Autonomous distributed data structure.' },
      { id: 'abb-sm2', prefix: ';sm2', expansion: 'SuperMemo-2 Spaced Repetition Algorithm', category: 'Learning', description: 'Interval calculation algorithm.' },
      { id: 'abb-raft', prefix: ';raft', expansion: 'Raft Distributed Consensus Algorithm', category: 'Tech', description: 'Fault-tolerant consensus algorithm.' },
      { id: 'abb-kbase', prefix: ';kbase', expansion: 'MI-Learn Central Knowledge Base', category: 'App', description: 'Unified multi-workspace vault.' },
      { id: 'abb-db', prefix: ';db', expansion: 'PostgreSQL Relational Database', category: 'Database', description: 'Enterprise relational database engine.' }
    ];

    for (const a of abbreviations) {
      await sql`
        INSERT INTO abbreviations (id, user_id, prefix, expansion, category, description, created_at)
        VALUES (
          ${a.id},
          ${defaultUserId},
          ${a.prefix},
          ${a.expansion},
          ${a.category},
          ${a.description},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          prefix = EXCLUDED.prefix,
          expansion = EXCLUDED.expansion,
          category = EXCLUDED.category,
          description = EXCLUDED.description;
      `;
    }
    console.log(`✅ ${abbreviations.length} Abbreviations seeded.`);

    // 10. Seed Flashcards (Spaced Repetition Cards)
    const flashcards = [
      {
        id: 'card-1',
        noteId: 'n-book-math-2',
        noteTitle: 'Chapter 2: Attention Mechanics & Transformers',
        question: 'What is the core formula for Scaled Dot-Product Attention?',
        answer: 'Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V',
        type: 'qa',
        repetition: 2,
        interval: 6,
        easeFactor: 2.6,
        deckCategory: 'AI & Machine Learning',
        tags: ['attention', 'transformer', 'deep-learning'],
        isManual: false
      },
      {
        id: 'card-2',
        noteId: 'n-book-math-1',
        noteTitle: 'Chapter 1: Matrix Calculus & Backpropagation',
        question: 'What mathematical principle does backpropagation rely on to compute gradients?',
        answer: 'The calculus Chain Rule, which allows calculating partial derivatives backwards from output error to weight tensors.',
        type: 'concept',
        repetition: 3,
        interval: 14,
        easeFactor: 2.5,
        deckCategory: 'AI & Machine Learning',
        tags: ['backprop', 'calculus', 'gradients'],
        isManual: false
      },
      {
        id: 'card-3',
        noteId: 'n-diagrams',
        noteTitle: '📊 System Architecture & Mermaid Diagrams',
        question: 'What are the three core subproblems that the Raft algorithm decomposes consensus into?',
        answer: '1. Leader Election, 2. Log Replication, and 3. Safety (Commit guarantees).',
        type: 'qa',
        repetition: 1,
        interval: 3,
        easeFactor: 2.4,
        deckCategory: 'Distributed Systems',
        tags: ['raft', 'consensus', 'reliability'],
        isManual: false
      },
      {
        id: 'card-4',
        noteId: 'n-book-arch-2',
        noteTitle: 'Chapter 2: Storage & Compression Strategies',
        question: 'What is the difference between PostgreSQL B-Tree and GIN indexes?',
        answer: 'B-Tree indexes support efficient equality and range queries on scalar values, while GIN (Generalized Inverted Index) indexes multi-value items like full-text vectors and JSONB documents.',
        type: 'concept',
        repetition: 2,
        interval: 5,
        easeFactor: 2.55,
        deckCategory: 'Database Engineering',
        tags: ['postgresql', 'indexing', 'performance'],
        isManual: false
      },
      {
        id: 'card-5',
        noteId: 'n-crypto-guide',
        noteTitle: '🔒 Zero-Knowledge Encrypted Security Guide',
        question: 'What cryptographic standard is used for end-to-end local note locking?',
        answer: 'AES-GCM-256 with PBKDF2 key derivation (100,000 SHA-256 iterations) and random cryptographic nonces.',
        type: 'qa',
        repetition: 4,
        interval: 21,
        easeFactor: 2.7,
        deckCategory: 'Security & Cryptography',
        tags: ['encryption', 'aes-gcm', 'security'],
        isManual: true
      }
    ];

    for (const fc of flashcards) {
      await sql`
        INSERT INTO flashcards (
          id, user_id, note_id, note_title, question, answer, type,
          repetition, interval, ease_factor, next_review_date, grade_history,
          is_manual, tags, deck_category, created_at
        )
        VALUES (
          ${fc.id},
          ${defaultUserId},
          ${fc.noteId},
          ${fc.noteTitle},
          ${fc.question},
          ${fc.answer},
          ${fc.type},
          ${fc.repetition},
          ${fc.interval},
          ${fc.easeFactor},
          CURRENT_DATE + (${fc.interval} || ' days')::interval,
          '[]'::jsonb,
          ${fc.isManual},
          ${toPgArray(fc.tags)}::text[],
          ${fc.deckCategory},
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          note_id = EXCLUDED.note_id,
          note_title = EXCLUDED.note_title,
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          type = EXCLUDED.type,
          repetition = EXCLUDED.repetition,
          interval = EXCLUDED.interval,
          ease_factor = EXCLUDED.ease_factor,
          is_manual = EXCLUDED.is_manual,
          tags = EXCLUDED.tags,
          deck_category = EXCLUDED.deck_category;
      `;
    }
    console.log(`✅ ${flashcards.length} Flashcards seeded.`);

    // 11. Seed Baseline Typing Practice Logs
    const typingLogs = [
      {
        id: 'tlog-1',
        wpm: 84,
        rawWpm: 88,
        cpm: 420,
        accuracy: 97.4,
        totalKeystrokes: 420,
        errorKeystrokes: 11,
        backspaceCount: 7,
        averageHoldTime: 82,
        averageFlightTime: 65,
        consistencyScore: 92,
        durationSeconds: 60,
        difficulty: 'intermediate',
        passageTitle: 'Local-First Philosophy'
      },
      {
        id: 'tlog-2',
        wpm: 92,
        rawWpm: 95,
        cpm: 460,
        accuracy: 98.6,
        totalKeystrokes: 460,
        errorKeystrokes: 6,
        backspaceCount: 4,
        averageHoldTime: 78,
        averageFlightTime: 58,
        consistencyScore: 95,
        durationSeconds: 60,
        difficulty: 'expert',
        passageTitle: 'Distributed Consensus & Raft'
      }
    ];

    for (const tl of typingLogs) {
      await sql`
        INSERT INTO typing_logs (
          id, user_id, wpm, raw_wpm, cpm, accuracy, total_keystrokes,
          error_keystrokes, backspace_count, average_hold_time, average_flight_time,
          consistency_score, duration_seconds, difficulty, passage_title, created_at
        )
        VALUES (
          ${tl.id},
          ${defaultUserId},
          ${tl.wpm},
          ${tl.rawWpm},
          ${tl.cpm},
          ${tl.accuracy},
          ${tl.totalKeystrokes},
          ${tl.errorKeystrokes},
          ${tl.backspaceCount},
          ${tl.averageHoldTime},
          ${tl.averageFlightTime},
          ${tl.consistencyScore},
          ${tl.durationSeconds},
          ${tl.difficulty},
          ${tl.passageTitle},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log(`✅ ${typingLogs.length} Typing Practice Logs seeded.`);

    // 12. Print Final Status Table Counts
    const counts = await sql`
      SELECT 'users' AS table_name, count(*) FROM users
      UNION ALL SELECT 'workspaces', count(*) FROM workspaces
      UNION ALL SELECT 'books', count(*) FROM books
      UNION ALL SELECT 'folders', count(*) FROM folders
      UNION ALL SELECT 'notes', count(*) FROM notes
      UNION ALL SELECT 'flashcards', count(*) FROM flashcards
      UNION ALL SELECT 'typing_passages', count(*) FROM typing_passages
      UNION ALL SELECT 'citations', count(*) FROM citations
      UNION ALL SELECT 'custom_words', count(*) FROM custom_words
      UNION ALL SELECT 'abbreviations', count(*) FROM abbreviations
      UNION ALL SELECT 'typing_logs', count(*) FROM typing_logs;
    `;

    console.log('\n📊 SEEDING COMPLETE! PostgreSQL Table Statistics:');
    console.table(counts);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sql.close();
  }
}

runSeed();
