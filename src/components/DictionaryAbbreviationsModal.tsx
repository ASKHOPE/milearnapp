import React, { useState, useEffect } from 'react';
import { 
  BookA, 
  Search, 
  Plus, 
  Trash2, 
  X, 
  Layers
} from 'lucide-react';
import { 
  dictionaryService, 
  type CustomWordDefinition, 
  type AbbreviationEntry, 
  type LookupResult 
} from '../services/dictionaryService';

interface DictionaryAbbreviationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DictionaryAbbreviationsModal: React.FC<DictionaryAbbreviationsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'custom-words' | 'abbreviations'>('lookup');
  
  // Search & Lookup State
  const [searchQuery, setSearchQuery] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Custom Words List
  const [customWords, setCustomWords] = useState<CustomWordDefinition[]>([]);
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPos, setNewPos] = useState('noun');
  const [newDef, setNewDef] = useState('');
  const [newEx, setNewEx] = useState('');
  const [newTags, setNewTags] = useState('');

  // Abbreviations List
  const [abbreviations, setAbbreviations] = useState<AbbreviationEntry[]>([]);
  const [isAddingAbb, setIsAddingAbb] = useState(false);
  const [newShortForm, setNewShortForm] = useState('');
  const [newFullForm, setNewFullForm] = useState('');
  const [newCategory, setNewCategory] = useState('Tech');
  const [newAbbDesc, setNewAbbDesc] = useState('');

  // Text Expander Tester
  const [expandInput, setExpandInput] = useState('The API response was fast IMO. Check the K8s logs!');
  const [expandedOutput, setExpandedOutput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomWords(dictionaryService.getCustomWords());
      setAbbreviations(dictionaryService.getAbbreviations());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const res = await dictionaryService.lookup(searchQuery.trim());
    setLookupResult(res);
    setIsSearching(false);
  };

  const handleSaveCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newDef.trim()) return;

    dictionaryService.addCustomWord({
      word: newWord.trim(),
      partOfSpeech: newPos,
      definition: newDef.trim(),
      example: newEx.trim() || undefined,
      tags: newTags ? newTags.split(',').map(t => t.trim()).filter(Boolean) : []
    });

    setCustomWords(dictionaryService.getCustomWords());
    setNewWord('');
    setNewDef('');
    setNewEx('');
    setNewTags('');
    setIsAddingWord(false);
  };

  const handleDeleteCustomWord = (id: string) => {
    dictionaryService.deleteCustomWord(id);
    setCustomWords(dictionaryService.getCustomWords());
  };

  const handleSaveAbbreviation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortForm.trim() || !newFullForm.trim()) return;

    dictionaryService.addAbbreviation({
      shortForm: newShortForm.trim().toUpperCase(),
      fullForm: newFullForm.trim(),
      category: newCategory,
      description: newAbbDesc.trim() || undefined
    });

    setAbbreviations(dictionaryService.getAbbreviations());
    setNewShortForm('');
    setNewFullForm('');
    setNewAbbDesc('');
    setIsAddingAbb(false);
  };

  const handleDeleteAbbreviation = (id: string) => {
    dictionaryService.deleteAbbreviation(id);
    setAbbreviations(dictionaryService.getAbbreviations());
  };

  const handleTestExpansion = () => {
    const res = dictionaryService.expandAbbreviationsInText(expandInput);
    setExpandedOutput(res.expandedText);
  };

  const filteredCustomWords = customWords.filter(w => 
    w.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAbbreviations = abbreviations.filter(a => 
    a.shortForm.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.fullForm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="selector-modal-overlay" onClick={onClose}>
      <div className="selector-modal-card" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="selector-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'rgba(14, 165, 233, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <BookA size={18} color="#0ea5e9" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Dictionary & Abbreviations</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Powered by <code>en-dictionary</code> + Local Custom Vault Terms & Acronyms
              </span>
            </div>
          </div>

          <button className="library-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))', 
          background: 'var(--bg-subtle, rgba(255, 255, 255, 0.02))',
          padding: '4px 16px',
          gap: '8px'
        }}>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'lookup' ? 'active' : ''}`}
            onClick={() => setActiveTab('lookup')}
          >
            <Search size={13} />
            <span>Search & Lookup</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'custom-words' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom-words')}
          >
            <BookA size={13} />
            <span>My Custom Words ({customWords.length})</span>
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'abbreviations' ? 'active' : ''}`}
            onClick={() => setActiveTab('abbreviations')}
          >
            <Layers size={13} />
            <span>Abbreviations & Acronyms ({abbreviations.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '65vh' }}>

          {/* TAB 1: LOOKUP */}
          {activeTab === 'lookup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form onSubmit={handleLookup} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Type any word, concept, or abbreviation (e.g. serendipity, API, Local-First)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    background: 'var(--bg-primary, #0c0e14)',
                    border: '1px solid var(--border-color)',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
                <button type="submit" className="library-btn-primary" disabled={isSearching}>
                  <Search size={14} />
                  <span>{isSearching ? 'Searching...' : 'Lookup'}</span>
                </button>
              </form>

              {lookupResult && (
                <div style={{
                  padding: '18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>{lookupResult.word}</h3>
                      {lookupResult.partOfSpeech && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontStyle: 'italic', 
                          color: 'var(--accent-primary)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {lookupResult.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <span style={{ 
                      fontSize: '10px', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.04em',
                      color: lookupResult.source === 'custom' ? '#10b981' : '#0ea5e9'
                    }}>
                      Source: {lookupResult.source}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lookupResult.definitions.map((def, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}.</span>
                        <span>{def}</span>
                      </div>
                    ))}
                  </div>

                  {lookupResult.examples && lookupResult.examples.length > 0 && (
                    <div style={{ 
                      padding: '10px', 
                      background: 'var(--bg-subtle)', 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: 'var(--text-secondary)'
                    }}>
                      Example: "{lookupResult.examples[0]}"
                    </div>
                  )}

                  {!lookupResult.found && (
                    <button
                      type="button"
                      className="library-btn-secondary"
                      style={{ alignSelf: 'flex-start', marginTop: '6px' }}
                      onClick={() => {
                        setNewWord(lookupResult.word);
                        setActiveTab('custom-words');
                        setIsAddingWord(true);
                      }}
                    >
                      <Plus size={13} />
                      <span>Add "{lookupResult.word}" to Custom Dictionary</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUSTOM WORDS */}
          {activeTab === 'custom-words' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Personalized technical terms, definitions & domain terminology
                </span>
                <button
                  type="button"
                  className="library-btn-primary"
                  onClick={() => setIsAddingWord(true)}
                >
                  <Plus size={13} />
                  <span>Add Word</span>
                </button>
              </div>

              {isAddingWord && (
                <form onSubmit={handleSaveCustomWord} style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>Add Term to Dictionary</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Word / Term</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Byzantine Fault Tolerance"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Part of Speech</label>
                      <select value={newPos} onChange={(e) => setNewPos(e.target.value)}>
                        <option value="noun">Noun</option>
                        <option value="verb">Verb</option>
                        <option value="adjective">Adjective</option>
                        <option value="concept">Concept</option>
                        <option value="acronym">Acronym</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Definition</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Comprehensive explanation or definition..."
                      value={newDef}
                      onChange={(e) => setNewDef(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Usage Example (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed consensus algorithms withstand Byzantine faults."
                      value={newEx}
                      onChange={(e) => setNewEx(e.target.value)}
                    />
                  </div>

                  <div className="submodal-btn-row">
                    <button type="button" className="btn-cancel" onClick={() => setIsAddingWord(false)}>Cancel</button>
                    <button type="submit" className="btn-confirm">Save Term</button>
                  </div>
                </form>
              )}

              {/* Words List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredCustomWords.map((cw) => (
                  <div
                    key={cw.id}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '15px' }}>{cw.word}</strong>
                        {cw.partOfSpeech && (
                          <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontStyle: 'italic' }}>
                            ({cw.partOfSpeech})
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {cw.definition}
                      </p>
                      {cw.example && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Example: "{cw.example}"
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-book-icon-btn danger"
                      onClick={() => handleDeleteCustomWord(cw.id)}
                      title="Delete Term"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ABBREVIATIONS & ACRONYMS */}
          {activeTab === 'abbreviations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Acronyms, shorthand & quick expansion registry
                </span>
                <button
                  type="button"
                  className="library-btn-primary"
                  onClick={() => setIsAddingAbb(true)}
                >
                  <Plus size={13} />
                  <span>Add Abbreviation</span>
                </button>
              </div>

              {isAddingAbb && (
                <form onSubmit={handleSaveAbbreviation} style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>New Abbreviation / Acronym</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label>Short Form</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. CRDT"
                        value={newShortForm}
                        onChange={(e) => setNewShortForm(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Full Meaning</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Conflict-free Replicated Data Type"
                        value={newFullForm}
                        onChange={(e) => setNewFullForm(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                        <option value="Tech">Tech</option>
                        <option value="Metrics">Metrics</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Crypto">Crypto</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Data structures that can be replicated concurrently without coordination."
                      value={newAbbDesc}
                      onChange={(e) => setNewAbbDesc(e.target.value)}
                    />
                  </div>

                  <div className="submodal-btn-row">
                    <button type="button" className="btn-cancel" onClick={() => setIsAddingAbb(false)}>Cancel</button>
                    <button type="submit" className="btn-confirm">Save Abbreviation</button>
                  </div>
                </form>
              )}

              {/* Smart Expander Box */}
              <div style={{
                padding: '14px',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <strong style={{ fontSize: '12px', color: 'var(--accent-primary)' }}>⚡ Smart Abbreviation Expander Test</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={expandInput}
                    onChange={(e) => setExpandInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '5px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: '#ffffff'
                    }}
                  />
                  <button type="button" className="library-btn-primary" onClick={handleTestExpansion}>
                    Expand
                  </button>
                </div>
                {expandedOutput && (
                  <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                    Result: <span>{expandedOutput}</span>
                  </div>
                )}
              </div>

              {/* Abbreviations Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {filteredAbbreviations.map((abb) => (
                  <div
                    key={abb.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: 'var(--accent-primary)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {abb.shortForm}
                      </span>
                      <button
                        type="button"
                        className="folder-del-mini"
                        onClick={() => handleDeleteAbbreviation(abb.id)}
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    <strong style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {abb.fullForm}
                    </strong>

                    {abb.description && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {abb.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
