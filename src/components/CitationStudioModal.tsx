import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookMarked, 
  Quote, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  FileText, 
  ExternalLink, 
  Layers, 
  FileCode,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  citationService, 
  type CitationItem, 
  type Author 
} from '../services/citationService';

interface CitationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoNote: (content: string) => void;
}

const LANDMARK_PAPERS = [
  {
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, et al.',
    year: 2017,
    container: 'NeurIPS',
    bibtex: `@article{vaswani2017attention,
  title={Attention is all you need},
  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, Lukasz and Polosukhin, Illia},
  journal={Advances in Neural Information Processing Systems},
  volume={30},
  pages={5998--6008},
  year={2017},
  url={https://arxiv.org/abs/1706.03762}
}`
  },
  {
    title: 'A Mathematical Theory of Communication',
    authors: 'Claude E. Shannon',
    year: 1948,
    container: 'Bell System Technical Journal',
    bibtex: `@article{shannon1948mathematical,
  title={A mathematical theory of communication},
  author={Shannon, Claude Elwood},
  journal={Bell System Technical Journal},
  volume={27},
  number={3},
  pages={379--423},
  year={1948},
  publisher={Alcatel-Lucent}
}`
  },
  {
    title: 'On Computable Numbers, with an Application to the Entscheidungsproblem',
    authors: 'Alan M. Turing',
    year: 1936,
    container: 'Proc. London Math. Soc.',
    bibtex: `@article{turing1936computable,
  title={On computable numbers, with an application to the {Entscheidungsproblem}},
  author={Turing, Alan Mathison},
  journal={Proceedings of the London Mathematical Society},
  volume={42},
  number={1},
  pages={230--265},
  year={1936}
}`
  },
  {
    title: 'Molecular Structure of Nucleic Acids (DNA Double Helix)',
    authors: 'J. D. Watson & F. H. C. Crick',
    year: 1953,
    container: 'Nature',
    bibtex: `@article{watson1953molecular,
  title={Molecular structure of nucleic acids: a structure for deoxyribose nucleic acid},
  author={Watson, James D and Crick, Francis HC},
  journal={Nature},
  volume={171},
  number={4356},
  pages={737--738},
  year={1953}
}`
  },
  {
    title: 'Generative Adversarial Nets',
    authors: 'Ian Goodfellow, Jean Pouget-Abadie, et al.',
    year: 2014,
    container: 'NeurIPS',
    bibtex: `@article{goodfellow2014generative,
  title={Generative adversarial nets},
  author={Goodfellow, Ian and Pouget-Abadie, Jean and Mirza, Mehdi and Xu, Bing and Warde-Farley, David and Ozair, Sherjil and Courville, Aaron and Bengio, Yoshua},
  journal={Advances in Neural Information Processing Systems},
  volume={27},
  pages={2672--2680},
  year={2014}
}`
  }
];

export const CitationStudioModal: React.FC<CitationStudioModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoNote
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'add' | 'bibliography'>('library');
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleMode, setStyleMode] = useState<'apa' | 'vancouver'>('apa');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Raw BibTeX / DOI Import State
  const [rawInput, setRawInput] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Manual Entry Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualYear, setManualYear] = useState(new Date().getFullYear().toString());
  const [manualType, setManualType] = useState('article-journal');
  const [manualJournal, setManualJournal] = useState('');
  const [manualVolume, setManualVolume] = useState('');
  const [manualIssue, setManualIssue] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualDoi, setManualDoi] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  // Bibliography Generator Selection State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const list = citationService.getCitations();
      setCitations(list);
      setSelectedItemIds(new Set(list.map((c) => c.id)));
      setStatusNotice(null);
      setImportError(null);
    }
  }, [isOpen]);

  const showStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCitations = useMemo(() => {
    if (!searchQuery.trim()) return citations;
    const q = searchQuery.toLowerCase();
    return citations.filter((c) => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchAuthor = c.author.some((a) => 
        (a.family && a.family.toLowerCase().includes(q)) ||
        (a.given && a.given.toLowerCase().includes(q)) ||
        (a.literal && a.literal.toLowerCase().includes(q))
      );
      const matchYear = c.year && String(c.year).includes(q);
      const matchSource = c['container-title'] && c['container-title'].toLowerCase().includes(q);
      const matchDoi = c.DOI && c.DOI.toLowerCase().includes(q);
      return matchTitle || matchAuthor || matchYear || matchSource || matchDoi;
    });
  }, [citations, searchQuery]);

  const handleDelete = (id: string) => {
    citationService.deleteCitation(id);
    const updated = citationService.getCitations();
    setCitations(updated);
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showStatus('Reference removed from library.');
  };

  // Handle Quick Import from raw input (BibTeX or DOI)
  const handleParseAndAdd = () => {
    if (!rawInput.trim()) {
      setImportError('Please enter a BibTeX entry, DOI, or CSL-JSON string.');
      return;
    }
    setIsImporting(true);
    setImportError(null);
    try {
      const parsedItems = citationService.parseInput(rawInput);
      if (parsedItems.length === 0) {
        throw new Error('No valid citation items could be extracted.');
      }
      parsedItems.forEach((item) => {
        citationService.saveCitation(item);
      });
      const updated = citationService.getCitations();
      setCitations(updated);
      setSelectedItemIds(new Set(updated.map((c) => c.id)));
      setRawInput('');
      setActiveTab('library');
      showStatus(`Successfully imported ${parsedItems.length} reference${parsedItems.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse input.');
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Landmark Paper Preset Import
  const handleImportLandmark = (preset: typeof LANDMARK_PAPERS[0]) => {
    try {
      const parsed = citationService.parseInput(preset.bibtex);
      parsed.forEach((item) => citationService.saveCitation(item));
      const updated = citationService.getCitations();
      setCitations(updated);
      setSelectedItemIds(new Set(updated.map((c) => c.id)));
      showStatus(`Imported landmark reference: "${preset.title}"`);
      setActiveTab('library');
    } catch (err: any) {
      showStatus(`Error importing landmark: ${err.message}`);
    }
  };

  // Handle Manual Entry Submit
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      showStatus('Please provide a title for the reference.');
      return;
    }

    const authorList: Author[] = manualAuthor
      .split(/;|\band\b/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name) => {
        if (name.includes(',')) {
          const [family, given] = name.split(',').map((s) => s.trim());
          return { family, given, literal: `${given} ${family}`.trim() };
        }
        const parts = name.split(' ');
        if (parts.length > 1) {
          const family = parts.pop();
          const given = parts.join(' ');
          return { family, given, literal: name };
        }
        return { literal: name, family: name };
      });

    const parsedYear = manualYear.trim() ? parseInt(manualYear.trim(), 10) : undefined;

    const newItem: CitationItem = {
      id: `ref-${Date.now()}`,
      type: manualType,
      title: manualTitle.trim(),
      author: authorList.length > 0 ? authorList : [{ literal: 'Anonymous' }],
      year: parsedYear,
      issued: parsedYear ? { 'date-parts': [[parsedYear]] } : undefined,
      'container-title': manualJournal.trim() || undefined,
      volume: manualVolume.trim() || undefined,
      issue: manualIssue.trim() || undefined,
      page: manualPages.trim() || undefined,
      DOI: manualDoi.trim() || undefined,
      URL: manualUrl.trim() || undefined,
      dateAdded: new Date().toISOString()
    };

    citationService.saveCitation(newItem);
    const updated = citationService.getCitations();
    setCitations(updated);
    setSelectedItemIds(new Set(updated.map((c) => c.id)));

    // Reset fields
    setManualTitle('');
    setManualAuthor('');
    setManualJournal('');
    setManualVolume('');
    setManualIssue('');
    setManualPages('');
    setManualDoi('');
    setManualUrl('');

    setActiveTab('library');
    showStatus('Custom reference added successfully!');
  };

  // Insert in-text citation into note
  const handleInsertInText = (item: CitationItem) => {
    const inText = citationService.formatInText(item, styleMode);
    onInsertIntoNote(` ${inText} `);
    showStatus(`Inserted in-text citation "${inText}" into note.`);
  };

  // Insert single reference into note
  const handleInsertSingleRef = (item: CitationItem) => {
    const formatted = citationService.formatBibliography([item], styleMode);
    onInsertIntoNote(`\n\n> **Reference**: ${formatted.trim()}\n\n`);
    showStatus(`Inserted reference for "${item.title}" into note.`);
  };

  // Insert entire generated bibliography into note
  const handleInsertFullBibliography = () => {
    const activeItems = citations.filter((c) => selectedItemIds.has(c.id));
    if (activeItems.length === 0) {
      showStatus('No references selected for bibliography.');
      return;
    }
    const formatted = citationService.formatBibliography(activeItems, styleMode);
    const markdown = `\n\n## References (${styleMode.toUpperCase()})\n\n${formatted}\n\n`;
    onInsertIntoNote(markdown);
    showStatus(`Inserted ${activeItems.length} references as "## References" into note!`);
    onClose();
  };

  // Export as .bib file download
  const handleExportBibTeXFile = () => {
    const activeItems = citations.filter((c) => selectedItemIds.has(c.id));
    if (activeItems.length === 0) {
      showStatus('No references selected to export.');
      return;
    }
    const bibtex = citationService.exportToBibTeX(activeItems);
    const blob = new Blob([bibtex], { type: 'application/x-bibtex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `references-${new Date().toISOString().slice(0, 10)}.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus(`Exported ${activeItems.length} references to .bib file.`);
  };

  const generatedBiblioText = useMemo(() => {
    const activeItems = citations.filter((c) => selectedItemIds.has(c.id));
    return citationService.formatBibliography(activeItems, styleMode);
  }, [citations, selectedItemIds, styleMode]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card citation-studio-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92vw',
          maxWidth: '1160px',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          background: 'var(--bg-modal)'
        }}
      >
        {/* Header Bar */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(236, 72, 153, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Quote size={18} color="#ec4899" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Citation & Bibliography Studio
                  </span>
                  <span 
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(236, 72, 153, 0.12)',
                      color: '#ec4899',
                      fontWeight: 600
                    }}
                  >
                    Citation.js
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Manage academic references, BibTeX, DOI, and generate APA / Vancouver bibliographies
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-row-pill-group" style={{ marginLeft: '12px' }}>
              <button
                type="button"
                className={`tab-row-pill ${activeTab === 'library' ? 'active' : ''}`}
                onClick={() => setActiveTab('library')}
              >
                <BookMarked size={13} />
                <span>Reference Library ({citations.length})</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${activeTab === 'add' ? 'active' : ''}`}
                onClick={() => setActiveTab('add')}
              >
                <Plus size={13} />
                <span>Import & Add</span>
              </button>
              <button
                type="button"
                className={`tab-row-pill ${activeTab === 'bibliography' ? 'active' : ''}`}
                onClick={() => setActiveTab('bibliography')}
              >
                <Layers size={13} />
                <span>Bibliography Generator</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Citation Style Selector */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: 'var(--bg-secondary)',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                onClick={() => setStyleMode('apa')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: styleMode === 'apa' ? 'var(--accent-primary)' : 'transparent',
                  color: styleMode === 'apa' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                APA 7th
              </button>
              <button
                type="button"
                onClick={() => setStyleMode('vancouver')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: styleMode === 'vancouver' ? 'var(--accent-primary)' : 'transparent',
                  color: styleMode === 'vancouver' ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease'
                }}
              >
                Vancouver [1]
              </button>
            </div>

            <button 
              className="modal-close-btn" 
              onClick={onClose}
              title="Close Citation Studio"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status notice banner */}
        {statusNotice && (
          <div 
            style={{
              padding: '8px 20px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Check size={14} />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* =========================================================================
            TAB 1: REFERENCE LIBRARY
           ========================================================================= */}
        {activeTab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search & Bulk Action Bar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                gap: '12px'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  maxWidth: '480px',
                  background: 'var(--bg-surface)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <Search size={14} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search references by title, author, year, journal, or DOI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    width: '100%'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={() => {
                    const allSelected = citations.every((c) => selectedItemIds.has(c.id));
                    if (allSelected) {
                      setSelectedItemIds(new Set());
                    } else {
                      setSelectedItemIds(new Set(citations.map((c) => c.id)));
                    }
                  }}
                  title="Toggle select all references"
                >
                  <span style={{ fontSize: '11px' }}>
                    {citations.length > 0 && citations.every((c) => selectedItemIds.has(c.id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>

                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={handleExportBibTeXFile}
                  title="Export all selected references as a .bib BibTeX file"
                >
                  <Download size={13} />
                  <span style={{ fontSize: '11px', marginLeft: '4px' }}>Export .bib</span>
                </button>

                <button
                  type="button"
                  className="btn-new-note"
                  onClick={handleInsertFullBibliography}
                  style={{ padding: '6px 14px', fontSize: '12px', background: '#ec4899', borderColor: '#ec4899' }}
                  title="Insert formatted references section into active note"
                >
                  <BookOpen size={13} />
                  <span style={{ marginLeft: '4px' }}>Insert All to Note</span>
                </button>
              </div>
            </div>

            {/* Citations List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredCitations.length === 0 ? (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '240px',
                    color: 'var(--text-muted)',
                    gap: '12px'
                  }}
                >
                  <BookMarked size={40} strokeWidth={1.5} />
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>No citations found</div>
                  <div style={{ fontSize: '12px', maxWidth: '320px', textAlign: 'center' }}>
                    {searchQuery 
                      ? 'Try adjusting your search query.' 
                      : 'Your library is empty. Add a reference or import a landmark paper.'}
                  </div>
                  <button
                    type="button"
                    className="btn-new-note"
                    onClick={() => setActiveTab('add')}
                    style={{ fontSize: '12px', padding: '6px 14px', marginTop: '6px' }}
                  >
                    <Plus size={14} />
                    <span>Add First Reference</span>
                  </button>
                </div>
              ) : (
                filteredCitations.map((item, index) => {
                  const inTextCitation = citationService.formatInText(item, styleMode, index + 1);
                  const formattedBib = citationService.formatBibliography([item], styleMode);
                  const isSelected = selectedItemIds.has(item.id);

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 0 1px rgba(99, 102, 241, 0.2)' : 'none'
                      }}
                    >
                      {/* Top Row: Selection Checkbox, Title & Type Tag */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedItemIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            style={{ marginTop: '3px', cursor: 'pointer' }}
                            title="Select for bibliography inclusion"
                          />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {item.author.map((a) => a.family ? `${a.family}, ${a.given || ''}` : (a.literal || 'Anon')).join('; ')} 
                              {item.year ? ` • (${item.year})` : ''}
                              {item['container-title'] ? ` • ${item['container-title']}` : ''}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span 
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)',
                              textTransform: 'uppercase',
                              fontWeight: 600
                            }}
                          >
                            {item.type.replace('-', ' ')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="editor-icon-btn"
                            title="Delete reference"
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Formatted Reference Preview */}
                      <div 
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {formattedBib}
                      </div>

                      {/* Bottom Action Strip */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* In-Text Quick Insert */}
                          <button
                            type="button"
                            onClick={() => handleInsertInText(item)}
                            className="editor-icon-btn"
                            title="Insert in-text citation marker directly into active note at cursor"
                            style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.25)' }}
                          >
                            <Quote size={12} />
                            <span style={{ fontSize: '11px', fontWeight: 600, marginLeft: '4px' }}>
                              Insert In-Text: {inTextCitation}
                            </span>
                          </button>

                          {/* Full Reference Insert */}
                          <button
                            type="button"
                            onClick={() => handleInsertSingleRef(item)}
                            className="editor-icon-btn"
                            title="Insert this full reference entry into the note"
                          >
                            <FileText size={12} />
                            <span style={{ fontSize: '11px', marginLeft: '4px' }}>Insert Reference</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Copy BibTeX */}
                          <button
                            type="button"
                            onClick={() => {
                              const bib = citationService.exportToBibTeX([item]);
                              handleCopyText(bib, item.id);
                            }}
                            className="editor-icon-btn"
                            title="Copy BibTeX code to clipboard"
                          >
                            {copiedId === item.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                            <span style={{ fontSize: '11px', marginLeft: '4px' }}>
                              {copiedId === item.id ? 'Copied' : 'Copy BibTeX'}
                            </span>
                          </button>

                          {item.URL && (
                            <a
                              href={item.URL}
                              target="_blank"
                              rel="noreferrer"
                              className="editor-icon-btn"
                              title="Open original paper / resource URL"
                              style={{ textDecoration: 'none' }}
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: IMPORT & ADD CITATIONS
           ========================================================================= */}
        {activeTab === 'add' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Column: Raw Import (BibTeX / DOI) & Landmark Papers */}
            <div 
              style={{
                flex: 1,
                borderRight: '1px solid var(--border-color)',
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Quick Import via BibTeX, DOI, or CSL
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Paste a raw BibTeX block (e.g. <code>@article&#123;...&#125;</code>), DOI string (e.g. <code>10.1038/d41586-020-00502-w</code>), or CSL-JSON.
                </div>
              </div>

              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`@article{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and Shazeer, Noam and ...},\n  year={2017}\n}`}
                rows={7}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />

              {importError && (
                <div 
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    fontSize: '12px'
                  }}
                >
                  {importError}
                </div>
              )}

              <button
                type="button"
                className="btn-new-note"
                onClick={handleParseAndAdd}
                disabled={isImporting}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  alignSelf: 'flex-start',
                  background: '#ec4899',
                  borderColor: '#ec4899'
                }}
              >
                <Sparkles size={14} />
                <span style={{ marginLeft: '6px' }}>
                  {isImporting ? 'Parsing with Citation.js...' : 'Parse & Add to Library'}
                </span>
              </button>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

              {/* Landmark Papers Presets */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Or Instant Landmark Papers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {LANDMARK_PAPERS.map((landmark) => (
                    <div
                      key={landmark.title}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {landmark.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {landmark.authors} ({landmark.year}) • {landmark.container}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportLandmark(landmark)}
                        className="editor-icon-btn"
                        style={{ fontSize: '11px', whiteSpace: 'nowrap' }}
                      >
                        <Plus size={12} />
                        <span style={{ marginLeft: '4px' }}>Import</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Manual Entry Form */}
            <form 
              onSubmit={handleAddManual}
              style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: 'var(--bg-secondary)'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Manual Reference Entry
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Enter bibliographic details manually to generate standard CSL items.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Deep Residual Learning for Image Recognition"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Authors (separated by "and" or semicolons)
                  </label>
                  <input
                    type="text"
                    value={manualAuthor}
                    onChange={(e) => setManualAuthor(e.target.value)}
                    placeholder="e.g. Kaiming He, Xiangyu Zhang, Shaoqing Ren"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    placeholder="2024"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Type
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="article-journal">Journal Article</option>
                    <option value="paper-conference">Conference Paper</option>
                    <option value="book">Book / Textbook</option>
                    <option value="chapter">Book Chapter</option>
                    <option value="webpage">Webpage / Online</option>
                    <option value="thesis">Thesis / Dissertation</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Journal / Publication / Venue
                  </label>
                  <input
                    type="text"
                    value={manualJournal}
                    onChange={(e) => setManualJournal(e.target.value)}
                    placeholder="e.g. IEEE Conference on Computer Vision (CVPR)"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Volume
                  </label>
                  <input
                    type="text"
                    value={manualVolume}
                    onChange={(e) => setManualVolume(e.target.value)}
                    placeholder="e.g. 12"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Issue
                  </label>
                  <input
                    type="text"
                    value={manualIssue}
                    onChange={(e) => setManualIssue(e.target.value)}
                    placeholder="e.g. 4"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Pages
                  </label>
                  <input
                    type="text"
                    value={manualPages}
                    onChange={(e) => setManualPages(e.target.value)}
                    placeholder="e.g. 770-778"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    DOI
                  </label>
                  <input
                    type="text"
                    value={manualDoi}
                    onChange={(e) => setManualDoi(e.target.value)}
                    placeholder="10.1109/CVPR.2016.90"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    URL
                  </label>
                  <input
                    type="url"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://arxiv.org/abs/1512.03385"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-surface)',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-new-note"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  marginTop: '10px',
                  alignSelf: 'flex-start'
                }}
              >
                <Plus size={14} />
                <span style={{ marginLeft: '6px' }}>Save Reference to Library</span>
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BIBLIOGRAPHY GENERATOR
           ========================================================================= */}
        {activeTab === 'bibliography' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Options Bar */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Selected: {selectedItemIds.size} of {citations.length} references
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Format: <strong>{styleMode === 'apa' ? 'APA 7th Edition' : 'Vancouver (Numbered)'}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={() => handleCopyText(generatedBiblioText, 'biblio-preview')}
                  title="Copy bibliography text to clipboard"
                >
                  {copiedId === 'biblio-preview' ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span style={{ fontSize: '11px', marginLeft: '4px' }}>
                    {copiedId === 'biblio-preview' ? 'Copied' : 'Copy Text'}
                  </span>
                </button>

                <button
                  type="button"
                  className="editor-icon-btn"
                  onClick={handleExportBibTeXFile}
                  title="Download .bib BibTeX file"
                >
                  <FileCode size={13} />
                  <span style={{ fontSize: '11px', marginLeft: '4px' }}>Export .bib</span>
                </button>

                <button
                  type="button"
                  className="btn-new-note"
                  onClick={handleInsertFullBibliography}
                  style={{ padding: '6px 14px', fontSize: '12px', background: '#ec4899', borderColor: '#ec4899' }}
                  title="Insert formatted bibliography at cursor in active note"
                >
                  <ArrowRight size={13} />
                  <span style={{ marginLeft: '4px' }}>Insert as ## References in Note</span>
                </button>
              </div>
            </div>

            {/* Generated Output Preview */}
            <div 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 28px',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  References ({styleMode.toUpperCase()})
                </h3>

                {generatedBiblioText ? (
                  <div 
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.8,
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'inherit',
                      background: 'var(--bg-secondary)',
                      padding: '20px 24px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {generatedBiblioText}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    No references selected. Go to the Library tab to select citations.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
