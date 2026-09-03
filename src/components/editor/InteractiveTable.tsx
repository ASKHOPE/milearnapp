import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';

interface InteractiveTableProps {
  tableLines: string[];
  startIndex: number;
  onUpdateTableLines: (startIndex: number, oldLength: number, newLines: string[]) => void;
  isReadOnly?: boolean;
}

export const InteractiveTable: React.FC<InteractiveTableProps> = ({
  tableLines,
  startIndex,
  onUpdateTableLines,
  isReadOnly = false
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Parse markdown lines into headers, alignments, and rows
  const headerLine = tableLines[0] || '';
  const rowLines = tableLines.slice(2);

  const parseCells = (line: string): string[] => {
    return line
      .split('|')
      .slice(1, -1) // remove outer empty segments from leading/trailing pipes
      .map((c) => c.trim());
  };

  const headers = parseCells(headerLine);
  const rows = rowLines.map((r) => parseCells(r));

  // Build markdown table from headers and rows
  const serializeTable = (newHeaders: string[], newRows: string[][]): string[] => {
    const colCount = Math.max(newHeaders.length, ...newRows.map((r) => r.length), 1);
    
    // Normalize headers
    const paddedHeaders = Array.from({ length: colCount }, (_, i) => newHeaders[i] || `Header ${i + 1}`);
    const separator = Array.from({ length: colCount }, () => '---');
    
    const lines: string[] = [];
    lines.push(`| ${paddedHeaders.join(' | ')} |`);
    lines.push(`| ${separator.join(' | ')} |`);

    for (const row of newRows) {
      const paddedRow = Array.from({ length: colCount }, (_, i) => row[i] || '');
      lines.push(`| ${paddedRow.join(' | ')} |`);
    }

    return lines;
  };

  const handleStartEdit = (row: number, col: number, initialText: string) => {
    if (isReadOnly) return;
    setEditingCell({ row, col });
    setEditValue(initialText);
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;

    if (row === -1) {
      // Editing a header
      const newHeaders = [...headers];
      newHeaders[col] = editValue.trim() || `Header ${col + 1}`;
      const newLines = serializeTable(newHeaders, rows);
      onUpdateTableLines(startIndex, tableLines.length, newLines);
    } else {
      // Editing a body cell
      const newRows = rows.map((r) => [...r]);
      if (newRows[row]) {
        newRows[row][col] = editValue.trim();
        const newLines = serializeTable(headers, newRows);
        onUpdateTableLines(startIndex, tableLines.length, newLines);
      }
    }
    setEditingCell(null);
  };

  const handleAddRow = () => {
    if (isReadOnly) return;
    const newRow = Array.from({ length: headers.length }, () => '');
    const newRows = [...rows, newRow];
    const newLines = serializeTable(headers, newRows);
    onUpdateTableLines(startIndex, tableLines.length, newLines);
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (isReadOnly) return;
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    const newLines = serializeTable(headers, newRows);
    onUpdateTableLines(startIndex, tableLines.length, newLines);
  };

  const handleAddColumn = () => {
    if (isReadOnly) return;
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map((r) => [...r, '']);
    const newLines = serializeTable(newHeaders, newRows);
    onUpdateTableLines(startIndex, tableLines.length, newLines);
  };

  return (
    <div className="interactive-table-wrapper">
      <div className="interactive-table-container">
        <table className="rich-data-table">
          <thead>
            <tr>
              {headers.map((h, colIdx) => (
                <th key={`h-${colIdx}`} onClick={() => handleStartEdit(-1, colIdx, h)}>
                  {editingCell?.row === -1 && editingCell?.col === colIdx ? (
                    <div className="cell-edit-box">
                      <input
                        type="text"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveCell}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCell();
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                      />
                      <button onClick={handleSaveCell}><Check size={11} /></button>
                    </div>
                  ) : (
                    <div className="table-header-cell">
                      <span>{h}</span>
                      {!isReadOnly && <Edit2 size={10} className="cell-edit-icon" />}
                    </div>
                  )}
                </th>
              ))}
              {!isReadOnly && <th className="col-action-th" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={`r-${rowIdx}`} className="table-data-row">
                {headers.map((_, colIdx) => {
                  const cellText = row[colIdx] || '';
                  const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;

                  return (
                    <td
                      key={`c-${rowIdx}-${colIdx}`}
                      onClick={() => handleStartEdit(rowIdx, colIdx, cellText)}
                    >
                      {isEditing ? (
                        <div className="cell-edit-box">
                          <input
                            type="text"
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveCell}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCell();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                          <button onClick={handleSaveCell}><Check size={11} /></button>
                        </div>
                      ) : (
                        <div className="table-body-cell">
                          <span>{cellText || <em style={{ opacity: 0.35 }}>Empty</em>}</span>
                        </div>
                      )}
                    </td>
                  );
                })}
                {!isReadOnly && (
                  <td className="row-action-td">
                    <button
                      className="btn-table-delete-row"
                      onClick={() => handleDeleteRow(rowIdx)}
                      title="Delete this row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Action Controls */}
      {!isReadOnly && (
        <div className="interactive-table-actions">
          <button className="btn-table-action" onClick={handleAddRow}>
            <Plus size={12} />
            <span>Add Row</span>
          </button>
          <button className="btn-table-action" onClick={handleAddColumn}>
            <Plus size={12} />
            <span>Add Column</span>
          </button>
        </div>
      )}
    </div>
  );
};
