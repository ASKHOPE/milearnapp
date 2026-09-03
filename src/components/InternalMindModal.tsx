import React, { useState, useMemo } from 'react';
import type { Note } from '../types';
import { internalMindService } from '../services/internalMind';
import { Modal } from './ui/Modal';
import { 
  Brain, 
  Search, 
  BookOpen, 
  Sparkles, 
  ExternalLink, 
  Network, 
  CheckCircle2,
  FileText
} from 'lucide-react';

interface InternalMindModalProps {
  isOpen: boolean;
  notes: Note[];
  onNavigateToNote: (noteId: string) => void;
  onClose: () => void;
}

export const InternalMindModal: React.FC<InternalMindModalProps> = ({
  isOpen,
  notes,
  onNavigateToNote,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'definitions' | 'wikilinks'>('all');

  // Build lexicon from active notes
  const { concepts, analytics } = useMemo(() => {
    return internalMindService.buildDictionary(notes);
  }, [notes]);

  // Filter concepts based on search and tab
  const filteredConcepts = useMemo(() => {
    return concepts.filter((c) => {
      if (filterType === 'definitions' && !c.definition) return false;
      if (filterType === 'wikilinks' && c.type !== 'wikilink') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTerm = c.term.toLowerCase().includes(q);
        const matchDef = c.definition?.toLowerCase().includes(q);
        const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTerm && !matchDef && !matchTag) return false;
      }

      return true;
    });
  }, [concepts, searchQuery, filterType]);

  const activeConcept = useMemo(() => {
    if (selectedConceptId) {
      const found = concepts.find((c) => c.id === selectedConceptId);
      if (found) return found;
    }
    return filteredConcepts[0] || null;
  }, [concepts, selectedConceptId, filteredConcepts]);

  const handleSelectNoteFromMind = (noteId: string) => {
    onNavigateToNote(noteId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Internal Mind & Vault Lexicon"
      subtitle="Autonomous knowledge graph dictionary of concepts, definitions, and word connections"
      maxWidth="860px"
    >
      <div className="internal-mind-layout">
        {/* Top Intelligence Metrics Banner */}
        <div className="mind-analytics-banner">
          <div className="mind-metric-chip">
            <Brain size={14} color="var(--accent-primary)" />
            <div className="metric-text-group">
              <span className="metric-val">{analytics.totalTerms}</span>
              <span className="metric-lbl">Indexed Terms</span>
            </div>
          </div>

          <div className="mind-metric-chip">
            <BookOpen size={14} color="var(--color-success)" />
            <div className="metric-text-group">
              <span className="metric-val">{analytics.totalDefinitions}</span>
              <span className="metric-lbl">Definitions</span>
            </div>
          </div>

          <div className="mind-metric-chip">
            <Network size={14} color="var(--color-purple)" />
            <div className="metric-text-group">
              <span className="metric-val">{analytics.mostConnectedTerms[0]?.term || 'None'}</span>
              <span className="metric-lbl">Core Concept</span>
            </div>
          </div>

          <div className="mind-metric-chip">
            <Sparkles size={14} color="var(--color-warning)" />
            <div className="metric-text-group">
              <span className="metric-val">{analytics.vocabularyRichness}%</span>
              <span className="metric-lbl">Lexical Density</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mind-search-bar">
          <div className="mind-input-wrap">
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search concepts, terms, definitions, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="mind-type-filters">
            <button
              type="button"
              className={`mind-filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({concepts.length})
            </button>
            <button
              type="button"
              className={`mind-filter-btn ${filterType === 'definitions' ? 'active' : ''}`}
              onClick={() => setFilterType('definitions')}
            >
              Definitions ({analytics.totalDefinitions})
            </button>
            <button
              type="button"
              className={`mind-filter-btn ${filterType === 'wikilinks' ? 'active' : ''}`}
              onClick={() => setFilterType('wikilinks')}
            >
              Wikilinks
            </button>
          </div>
        </div>

        {/* Main 2-Column Split: Concept List & Concept Deep-Dive */}
        <div className="mind-split-body">
          {/* Left: Concept List */}
          <div className="mind-concepts-column">
            {filteredConcepts.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  No concepts match your query
                </p>
              </div>
            ) : (
              filteredConcepts.map((concept) => {
                const isSelected = activeConcept?.id === concept.id;
                return (
                  <div
                    key={concept.id}
                    className={`mind-concept-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedConceptId(concept.id)}
                  >
                    <div className="concept-row-top">
                      <span className="concept-term-title">{concept.term}</span>
                      <span className="concept-count-pill" title="Mentioned in notes">
                        {concept.occurrences.length} {concept.occurrences.length === 1 ? 'note' : 'notes'}
                      </span>
                    </div>

                    {concept.definition ? (
                      <p className="concept-row-def-snippet">{concept.definition}</p>
                    ) : (
                      <p className="concept-row-origin">Defined in <em>{concept.originNoteTitle}</em></p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Selected Concept Deep-Dive */}
          <div className="mind-detail-column">
            {activeConcept ? (
              <div className="concept-detail-card">
                <div className="detail-header">
                  <div className="detail-title-wrap">
                    <h3 className="detail-term-heading">{activeConcept.term}</h3>
                    <span className="detail-type-badge">{activeConcept.type}</span>
                  </div>
                </div>

                {/* Definition Box */}
                {activeConcept.definition ? (
                  <div className="concept-definition-box">
                    <div className="def-box-label">
                      <CheckCircle2 size={12} color="var(--color-success)" />
                      <span>Formal Definition</span>
                    </div>
                    <p className="def-box-text">{activeConcept.definition}</p>
                  </div>
                ) : (
                  <div className="concept-definition-box empty">
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No formal definition yet. You can add one anytime in your note using syntax: <br />
                      <code>{activeConcept.term} :: [your definition]</code>
                    </p>
                  </div>
                )}

                {/* Tags */}
                {activeConcept.tags.length > 0 && (
                  <div className="detail-section">
                    <span className="detail-section-lbl">Associated Clusters</span>
                    <div className="detail-tags-row">
                      {activeConcept.tags.map((t) => (
                        <span key={t} className="card-badge tag">#{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Occurrences & Connected Notes */}
                <div className="detail-section" style={{ flex: 1 }}>
                  <span className="detail-section-lbl">
                    Connected Occurrences ({activeConcept.occurrences.length} Notes)
                  </span>
                  <div className="detail-occurrences-scroll">
                    {activeConcept.occurrences.map((occ, oIdx) => (
                      <div
                        key={`occ-${oIdx}`}
                        className="occurrence-card"
                        onClick={() => handleSelectNoteFromMind(occ.noteId)}
                      >
                        <div className="occ-top">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={12} color="var(--accent-primary)" />
                            <span className="occ-note-title">{occ.noteTitle}</span>
                          </div>
                          <ExternalLink size={12} className="occ-link-icon" />
                        </div>
                        {occ.snippet && (
                          <p className="occ-snippet-text">“{occ.snippet}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Select a concept to explore its knowledge graph connections
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
