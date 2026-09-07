import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Copy, 
  Trash2, 
  Bug, 
  Terminal,
  Search
} from 'lucide-react';
import { debugLogger, type DiagnosticLogEntry, type SelfTestResult } from '../../services/debugLogger';
import { Button } from '../ui/Button';

export const DebuggerDiagnosticsTab: React.FC = () => {
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selfTestResults, setSelfTestResults] = useState<SelfTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe((updated) => {
      setLogs(updated);
    });
    return unsubscribe;
  }, []);

  const handleRunSelfTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await debugLogger.runSelfTests();
      setSelfTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCopyReport = async () => {
    const report = await debugLogger.generateDiagnosticReport();
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadReport = async () => {
    const report = await debugLogger.generateDiagnosticReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milearnapp-diagnostics-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSimulateError = () => {
    debugLogger.log('error', 'system', 'Simulated Diagnostic Exception: Verifying debugger error interception pipeline.', {
      simulated: true,
      timestamp: new Date().toISOString()
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const q = searchFilter.toLowerCase();
    const matchesSearch = !q || 
      log.message.toLowerCase().includes(q) || 
      log.subsystem.toLowerCase().includes(q);
    return matchesLevel && matchesSearch;
  });

  const passedTestsCount = selfTestResults.filter((r) => r.status === 'passed').length;

  return (
    <div className="settings-page-wrapper">
      {/* Hero Banner */}
      <div className="settings-page-hero">
        <div className="settings-page-hero-title">
          <div className="settings-page-hero-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
            <Bug size={20} />
          </div>
          <div className="settings-page-hero-text">
            <h3>System Diagnostics &amp; Live Debugger</h3>
            <p>Automated subsystem self-tests, runtime error interception, and latency telemetry</p>
          </div>
        </div>

        <div className="settings-hero-badges">
          <Button
            variant="primary"
            size="sm"
            isLoading={isRunningTests}
            onClick={handleRunSelfTests}
          >
            <Play size={13} style={{ marginRight: '6px' }} />
            Run Self-Test Suite
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyReport}
            title="Copy Diagnostic Bundle to Clipboard"
          >
            <Copy size={13} style={{ marginRight: '6px' }} />
            {copySuccess ? 'Copied!' : 'Copy Report'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            title="Download Full Diagnostic JSON"
          >
            <Download size={13} style={{ marginRight: '6px' }} />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Self-Test Results Panel */}
      <div className="settings-card-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="var(--accent-primary)" />
            Subsystem Health Diagnostics
          </h4>
          {selfTestResults.length > 0 && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '20px',
              background: passedTestsCount === selfTestResults.length ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: passedTestsCount === selfTestResults.length ? '#10b981' : '#ef4444'
            }}>
              {passedTestsCount} / {selfTestResults.length} Subsystems Healthy
            </span>
          )}
        </div>

        {selfTestResults.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-tertiary)',
            borderRadius: '8px',
            border: '1px dashed var(--border-color)',
            fontSize: '12.5px',
            color: 'var(--text-muted)'
          }}>
            Click <strong>"Run Self-Test Suite"</strong> above to benchmark IndexedDB latency, test PostgreSQL connection, verify AES-256-GCM tampering detection, and validate Zod schemas.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {selfTestResults.map((test) => (
              <div
                key={test.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  border: test.status === 'passed' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {test.name}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: test.status === 'passed' ? '#10b981' : '#ef4444'
                  }}>
                    {test.status === 'passed' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {test.status === 'passed' ? 'PASS' : 'FAIL'}
                    {test.latencyMs !== undefined && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({test.latencyMs}ms)
                      </span>
                    )}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {test.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Event & Error Log Monitor */}
      <div className="settings-card-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <h4 className="panel-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={15} color="var(--accent-primary)" />
            Live Diagnostic Event Stream ({filteredLogs.length})
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulateError}
              title="Trigger a test error to verify capture"
            >
              Simulate Test Error
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => debugLogger.clearLogs()}
              title="Clear event logs"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'error', 'warn', 'info', 'success'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(lvl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: filterLevel === lvl ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: filterLevel === lvl ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Log Stream Terminal Container */}
        <div style={{
          maxHeight: '260px',
          overflowY: 'auto',
          borderRadius: '6px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11.5px',
          padding: '8px'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No diagnostic events matching current filter.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const badgeColor = {
                error: '#ef4444',
                warn: '#f59e0b',
                info: '#0ea5e9',
                success: '#10b981'
              }[entry.level];

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '5px 8px',
                    borderRadius: '4px',
                    borderBottom: '1px solid var(--border-subtle, rgba(0,0,0,0.05))',
                    lineHeight: 1.45
                  }}
                >
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', whiteSpace: 'nowrap' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    color: '#ffffff',
                    background: badgeColor,
                    whiteSpace: 'nowrap'
                  }}>
                    {entry.level}
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    [{entry.subsystem}]
                  </span>
                  <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
