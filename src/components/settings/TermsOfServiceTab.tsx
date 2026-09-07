import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  HardDrive, 
  Globe, 
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const TermsOfServiceTab: React.FC = () => {
  return (
    <div className="settings-page-wrapper">
      {/* Hero Banner */}
      <div className="settings-page-hero">
        <div className="settings-page-hero-title">
          <div className="settings-page-hero-icon">
            <FileText size={20} />
          </div>
          <div className="settings-page-hero-text">
            <h3>Terms of Service &amp; Local License</h3>
            <p>Fair, transparent, and developer-friendly local-first terms of use</p>
          </div>
        </div>

        <div className="settings-hero-badges">
          <span className="settings-pill-badge success">
            <CheckCircle2 size={12} /> 100% Personal Ownership
          </span>
          <span className="settings-pill-badge accent">
            <Lock size={12} /> Zero-Cloud License
          </span>
          <span className="settings-pill-badge">
            Updated September 2026
          </span>
        </div>
      </div>

      <div className="legal-doc-container">
        {/* Section 1: Overview & Acceptance */}
        <div className="legal-section">
          <div className="legal-section-header">
            <UserCheck size={16} className="legal-section-icon" />
            <h4>1. Overview &amp; Acceptance of Terms</h4>
          </div>
          <div className="legal-body-text">
            <p>
              These Terms of Service ("Terms") govern your use of <strong>MiLEARNAPP</strong>, an enterprise local-first personal knowledge management, active-recall study studio, and multimodal learning workstation.
            </p>
            <p>
              By launching, accessing, or using MiLEARNAPP on your personal workstation or local network, you agree to be bound by these Terms. Because MiLEARNAPP operates <strong>without user accounts or logins</strong>, these terms apply to your local execution environment.
            </p>
            <div className="legal-callout-box success">
              <strong>Personal Workstation Philosophy:</strong> MiLEARNAPP is built to empower personal learning and scientific discovery without subscriptions, login walls, telemetry tracking, or centralized gatekeepers.
            </div>
          </div>
        </div>

        {/* Section 2: Intellectual Property & 100% User Ownership */}
        <div className="legal-section">
          <div className="legal-section-header">
            <ShieldCheck size={16} className="legal-section-icon" />
            <h4>2. Absolute Ownership of Your Notes &amp; Content</h4>
          </div>
          <div className="legal-body-text">
            <p>
              <strong>You retain 100% complete, unencumbered ownership</strong> of all notes, markdown documents, KaTeX equations, Mermaid diagrams, 3D models, vector drawings, flashcards, and citations that you create or import into MiLEARNAPP.
            </p>
            <ul>
              <li><strong>Zero Vendor Lock-in:</strong> Your data is stored in standard formats (Markdown, JSON, SQL, vector paths).</li>
              <li><strong>Zero Intellectual Claims:</strong> The creators of MiLEARNAPP assert no intellectual property rights, claims, or license over any data you produce.</li>
              <li><strong>Full Portability:</strong> You may freely export, migrate, or delete your entire vault at any time via the Backup &amp; Vault tab.</li>
            </ul>
          </div>
        </div>

        {/* Section 3: Permitted Use & Software License */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Lock size={16} className="legal-section-icon" />
            <h4>3. Permitted Use &amp; Local Execution</h4>
          </div>
          <div className="legal-body-text">
            <p>
              You are granted a perpetual, non-exclusive, worldwide right to install, execute, inspect, customize, and run MiLEARNAPP for:
            </p>
            <ul>
              <li>Personal knowledge management, research, academic learning, and journaling.</li>
              <li>Professional engineering, technical documentation, and software architecture diagrams.</li>
              <li>Running on personal desktop computers, local workstations, or private home-lab servers.</li>
            </ul>
            <p>
              You may not use MiLEARNAPP to distribute malicious code, bypass authorized local access controls, or infringe upon the intellectual property of others.
            </p>
          </div>
        </div>

        {/* Section 4: Local Storage & Backup Responsibility */}
        <div className="legal-section">
          <div className="legal-section-header">
            <HardDrive size={16} className="legal-section-icon" />
            <h4>4. Self-Managed Storage &amp; Backup Responsibility</h4>
          </div>
          <div className="legal-body-text">
            <p>
              Because MiLEARNAPP is strictly a <strong>local-first application</strong> without external cloud backup servers:
            </p>
            <ul>
              <li><strong>User Responsibility:</strong> You are solely responsible for backing up your local storage (browser IndexedDB cache and Docker PostgreSQL volumes).</li>
              <li><strong>Recommended Backup Workflow:</strong> We encourage generating regular vault backups via the <em>Download Vault JSON</em> feature and securing your Docker volume directories (<code>milearnapp_pgdata</code>).</li>
              <li><strong>Browser Cache Eviction:</strong> Be aware that clearing your browser site data or cookies for <code>localhost:5173</code> will clear IndexedDB. If PostgreSQL sync is enabled, your data remains safe in Docker.</li>
            </ul>
          </div>
        </div>

        {/* Section 5: Web Clipper & External Scraping */}
        <div className="legal-section">
          <div className="legal-section-header">
            <Globe size={16} className="legal-section-icon" />
            <h4>5. Web Content Clipper &amp; Third-Party Sites</h4>
          </div>
          <div className="legal-body-text">
            <p>
              MiLEARNAPP provides a built-in Web Clipper tool to convert web articles into clean markdown notes. When using this feature:
            </p>
            <ul>
              <li>You agree to comply with the terms of use and copyright restrictions of any third-party websites you clip or analyze.</li>
              <li>The Web Clipper operates directly from your machine or local server middleware; no proxy or intermediary servers are employed.</li>
              <li>You are responsible for ensuring that your extraction and storage of web content complies with applicable fair use and copyright laws.</li>
            </ul>
          </div>
        </div>

        {/* Section 6: Warranty Disclaimer & Limitation of Liability */}
        <div className="legal-section">
          <div className="legal-section-header">
            <AlertTriangle size={16} className="legal-section-icon" />
            <h4>6. Disclaimer of Warranty &amp; Limitation of Liability</h4>
          </div>
          <div className="legal-body-text">
            <p>
              MiLEARNAPP is provided on an <strong>"AS IS" and "AS AVAILABLE"</strong> basis, without warranties of any kind, either express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
            <p>
              In no event shall the authors or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including loss of data, hardware malfunction, or system downtime) arising out of the use or inability to use this software.
            </p>
            <div className="legal-callout-box warning">
              <strong>Data Protection Advice:</strong> Always maintain independent backups of vital research and notes before performing major OS updates or Docker prune operations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
