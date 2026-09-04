-- ==============================================================================
-- PostgreSQL DDL Initialization Schema for MiLEARNAPP (Vercel Postgres / Supabase)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    bio TEXT,
    role VARCHAR(100) DEFAULT 'Systems Architect',
    avatar_type VARCHAR(20) DEFAULT 'emoji',
    avatar_value TEXT DEFAULT '⚡',
    mood VARCHAR(100) DEFAULT 'Deep Focus',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(32) DEFAULT '💼',
    color VARCHAR(32) DEFAULT '#6366f1',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Books Table
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    icon VARCHAR(32) DEFAULT '📖',
    color VARCHAR(32) DEFAULT '#10b981',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Folders Table
CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) REFERENCES folders(id) ON DELETE CASCADE,
    color VARCHAR(32),
    icon VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    folder_id VARCHAR(64) REFERENCES folders(id) ON DELETE SET NULL,
    book_id VARCHAR(64) REFERENCES books(id) ON DELETE SET NULL,
    parent_page_id VARCHAR(64),
    page_order INTEGER DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_favorite BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_trashed BOOLEAN DEFAULT FALSE,
    trashed_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT FALSE,
    encrypted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    note_id VARCHAR(64) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    size INTEGER NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    data_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Flashcards Table (SuperMemo-2 Spaced Repetition)
CREATE TABLE IF NOT EXISTS flashcards (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id VARCHAR(64) REFERENCES notes(id) ON DELETE SET NULL,
    note_title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    type VARCHAR(32) DEFAULT 'qa',
    repetition INTEGER DEFAULT 0,
    interval INTEGER DEFAULT 1,
    ease_factor NUMERIC(4, 2) DEFAULT 2.50,
    next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_reviewed DATE,
    grade_history JSONB DEFAULT '[]'::jsonb,
    is_manual BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    deck_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Typing Practice Logs Table
CREATE TABLE IF NOT EXISTS typing_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wpm INTEGER NOT NULL,
    raw_wpm INTEGER NOT NULL,
    cpm INTEGER NOT NULL,
    accuracy NUMERIC(5, 2) NOT NULL,
    total_keystrokes INTEGER NOT NULL,
    error_keystrokes INTEGER NOT NULL,
    backspace_count INTEGER NOT NULL,
    average_hold_time INTEGER NOT NULL,
    average_flight_time INTEGER NOT NULL,
    consistency_score INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    difficulty VARCHAR(32) DEFAULT 'intermediate',
    passage_title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Citations Table (CSL / BibTeX)
CREATE TABLE IF NOT EXISTS citations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT[] DEFAULT ARRAY[]::TEXT[],
    year INTEGER,
    container TEXT,
    bibtex TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_landmark BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Typing Passages Table
CREATE TABLE IF NOT EXISTS typing_passages (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Custom Dictionary Words Table
CREATE TABLE IF NOT EXISTS custom_words (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    part_of_speech VARCHAR(64),
    example TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Abbreviations Table
CREATE TABLE IF NOT EXISTS abbreviations (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prefix VARCHAR(64) NOT NULL,
    expansion TEXT NOT NULL,
    category VARCHAR(64),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_ws ON notes(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_book ON notes(book_id);
CREATE INDEX IF NOT EXISTS idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_flashcards_due ON flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_typing_logs_user ON typing_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_citations_user ON citations(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_words_user ON custom_words(user_id, word);
CREATE INDEX IF NOT EXISTS idx_abbreviations_user ON abbreviations(user_id, prefix);
