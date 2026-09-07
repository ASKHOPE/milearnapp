import React from 'react';
import { 
  ShieldCheck, 
  EyeOff, 
  HardDrive, 
  Lock, 
  Radio, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Server
} from 'lucide-react';

export const PrivacyPolicyTab: React.FC = () => {
  return (
    <div className="settings-page-wrapper">
      {/* Hero Banner */}
      <div className="settings-page-hero">
        <div className="settings-page-hero-title">
          <div className="settings-page-hero-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="settings-page-hero-text">
            <h3>Privacy Policy &amp; Zero-Cloud Guarantee</h3>
            <p>Your notes and learning patterns stay 100% on your machine</p>
          </div>
        </div>

        <div className="settings-hero-badges">
          <span className="settings-pill-badge success">
            <EyeOff size={12} /> Zero Telemetry
          </span>
          <span className="settings-pill-badge accent">
            <Lock size={12} /> Zero-Knowledge
          </span>
          <span className="settings-pill-badge">
            No Ads or Cookies
          </span>
        </div>
      </div>

      {/* Visual Privacy Architecture Grid */}
      <div className="privacy-grid">
        <div className="privacy-card">
          <div className="privacy-card-title">
            <EyeOff size={15} color="#10b981" />
            <span>Zero Tracking &amp; Analytics</span>
          </div>
          <div className="privacy-card-desc">
            No Google Analytics, no Mixpanel, no Sentry telemetry, and no hidden tracking beacons. We do not know who you are or what you write.
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-title">
            <HardDrive size={15} color="#6366f1" />
            <span>100% Local Storage</span>
          </div>
          <div className="privacy-card-desc">
            Data resides strictly in your browser's IndexedDB and your local Docker PostgreSQL container on <code>localhost:5432</code>.
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-title">
            <Lock size={15} color="#8b5cf6" />
            <span>Client AES-256-GCM</span>
          </div>
          <div className="privacy-card-desc">
            Passphrase-protected notes use authenticated GCM encryption. Secret keys are generated in RAM with PBKDF2 (600,000 rounds) and never saved.
          </div>
        </div>

        <div className="privacy-card">
          <div className="privacy-card-title">
            <Radio size={15} color="#0ea5e9" />
            <span>Transparent Network</span>
          </div>
          <div className="privacy-card-desc">
            The application never makes unauthorized network calls. Outbound requests occur only when you trigger the Web Clipper on a URL.
          </div>
        </div>
      </div>

      <div className="legal-doc-container">
        {/* Section 1: Core Commitment */}
        <div className="legal-section">
          <div className="legal-section-header">
            <CheckCircle2 size={16} className="legal-section-icon" color="#10b981" />
            <h4>1. Our Fundamental Privacy Commitment</h4>
          </div>
          <div className="legal-body-text">
            <p>
              At <strong>MiLEARNAPP</strong>, we believe that your notes, thoughts, scientific deductions, and learning speed are among your most intimate personal assets. Modern commercial note-taking software frequently analyzes user content for model training, advertising profiling, or proprietary monetization.
            </p>
            <p>
              <strong>MiLEARNAPP takes the opposite approach:</strong> It is designed from the ground up as an offline-first, local-only personal workstation. We collect no personal data, require no accounts or passwords, and operate no cloud backend that receives your notes.
            </p>
          </div>
        </div>

        {/* Section 2: Data Storage Architecture */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Server size={16} className="legal-section-icon" />
            <h4>2. Where Your Data Lives</h4>
          </div>
          <div className="legal-body-text">
            <p>
              Every entity created inside MiLEARNAPP (workspaces, books, folders, notes, flashcards, typing statistics, and settings) exists exclusively within:
            </p>
            <ul>
              <li><strong>Browser IndexedDB:</strong> A dedicated, private, sandboxed relational object store maintained by your web browser on your physical hard drive.</li>
              <li><strong>Local PostgreSQL 16 (Docker):</strong> An isolated Docker container running on your local machine (<code>localhost:5432</code>), mounting to a local Docker volume (<code>milearnapp_pgdata</code>).</li>
            </ul>
            <p>
              No remote database or sync coordinator is ever contacted.
            </p>
          </div>
        </div>

        {/* Section 3: Keystroke Telemetry & Typing Metrics */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Sparkles size={16} className="legal-section-icon" />
            <h4>3. Keystroke Telemetry &amp; WPM Calculation</h4>
          </div>
          <div className="legal-body-text">
            <p>
              MiLEARNAPP features ambient keystroke telemetry that computes real-time words-per-minute (WPM) and typing rhythm displayed in the top header:
            </p>
            <ul>
              <li>All key press calculations are performed entirely in client-side JavaScript memory (RAM) via a rolling timestamp window.</li>
              <li>Keystroke timings are never stored as individual key logs or sent to any remote server.</li>
              <li>Historical typing sprint scores are saved solely in your local database for your personal progress visualization.</li>
            </ul>
          </div>
        </div>

        {/* Section 4: Cryptographic Guarantees */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Lock size={16} className="legal-section-icon" />
            <h4>4. Zero-Knowledge Cryptography for Locked Notes</h4>
          </div>
          <div className="legal-body-text">
            <p>
              If you choose to lock an individual note with a passphrase:
            </p>
            <ul>
              <li>The plaintext is encrypted using <strong>AES-256-GCM with Authenticated Associated Data (AAD)</strong> bound to the unique note ID.</li>
              <li>Keys are derived via <strong>PBKDF2-SHA256 with 600,000 iterations</strong> and a unique cryptographic salt.</li>
              <li>Your passphrase is never persisted in IndexedDB, PostgreSQL, or local storage. If you close your browser or lock the note, the key is immediately purged from memory.</li>
            </ul>
          </div>
        </div>

        {/* Section 5: External Network Traffic */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Radio size={16} className="legal-section-icon" />
            <h4>5. Outbound Network Transparency</h4>
          </div>
          <div className="legal-body-text">
            <p>
              To maintain absolute transparency, here are the only external connections the app will ever initiate:
            </p>
            <ul>
              <li><strong>Typography &amp; Fonts:</strong> Initial retrieval of Google Fonts (Inter and JetBrains Mono) and KaTeX math fonts (cached locally by your browser).</li>
              <li><strong>Web Content Clipper:</strong> When you paste an external article URL into the Web Clipper and click "Scrape &amp; Import", your local Vite dev server sends an HTTP GET request to that target website to fetch the HTML article.</li>
            </ul>
            <p>
              No other background phone-homes or third-party connections occur under any circumstances.
            </p>
          </div>
        </div>

        {/* Section 6: Right to Erasure & Data Portability */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Trash2 size={16} className="legal-section-icon" color="#ef4444" />
            <h4>6. Data Portability &amp; Instant Local Erasure</h4>
          </div>
          <div className="legal-body-text">
            <p>
              Because you control the hardware, you have absolute rights over your data:
            </p>
            <ul>
              <li><strong>Export Everything:</strong> Export your full vault in open JSON format anytime from the <em>Backup &amp; Vault</em> tab.</li>
              <li><strong>Instant Wipe:</strong> In the <em>Storage &amp; Beam</em> tab, you can execute a complete local wipe to purge IndexedDB, or run <code>docker compose down -v</code> to destroy the database container and volume.</li>
            </ul>
            <div className="legal-callout-box success">
              <strong>GDPR &amp; CCPA Compliance by Architecture:</strong> Because MiLEARNAPP collects zero personal data, there is no centralized database of user records to breach, inspect, or subpoena.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
