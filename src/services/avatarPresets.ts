export interface AvatarMood {
  id: string;
  label: string;
  emoji: string;
  badgeColor: string;
}

export const AVATAR_MOODS: AvatarMood[] = [
  { id: 'focus', label: 'Deep Focus', emoji: '🧠', badgeColor: '#8b5cf6' },
  { id: 'energy', label: 'High Energy', emoji: '⚡', badgeColor: '#f59e0b' },
  { id: 'zen', label: 'Zen & Calm', emoji: '🧘', badgeColor: '#10b981' },
  { id: 'engineer', label: 'Engineering', emoji: '💻', badgeColor: '#0ea5e9' },
  { id: 'creative', label: 'Creative Flow', emoji: '🎨', badgeColor: '#ec4899' },
  { id: 'night', label: 'Night Owl', emoji: '🦉', badgeColor: '#6366f1' },
  { id: 'scholar', label: 'Scholar', emoji: '📚', badgeColor: '#14b8a6' },
  { id: 'shield', label: 'Privacy Guard', emoji: '🛡️', badgeColor: '#e11d48' },
  { id: 'chill', label: 'Chill & Relax', emoji: '☕', badgeColor: '#d97706' }
];

export interface AnimatedGifPreset {
  id: string;
  name: string;
  dataUrl: string;
}

export const ANIMATED_AVATARS: AnimatedGifPreset[] = [
  {
    id: 'cyber-nebula',
    name: 'Cyber Nebula',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%238b5cf6"><animate attributeName="stop-color" values="%238b5cf6;%23ec4899;%230ea5e9;%238b5cf6" dur="6s" repeatCount="indefinite"/></stop><stop offset="100%" stop-color="%230f172a"/></radialGradient></defs><rect width="120" height="120" rx="20" fill="%230f172a"/><circle cx="60" cy="60" r="45" fill="url(%23g)"><animate attributeName="r" values="38;46;38" dur="3s" repeatCount="indefinite"/></circle><circle cx="60" cy="60" r="16" fill="%23ffffff" opacity="0.9"><animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/></circle></svg>`
  },
  {
    id: 'quantum-core',
    name: 'Quantum Core',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="%2318181b"/><g transform="translate(60,60)"><rect x="-30" y="-30" width="60" height="60" fill="none" stroke="%2338bdf8" stroke-width="3" rx="8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite"/></rect><circle cx="0" cy="0" r="14" fill="%23f43f5e"><animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite"/></circle></g></svg>`
  },
  {
    id: 'zen-lotus',
    name: 'Zen Pulse',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="%23064e3b"/><circle cx="60" cy="60" r="40" fill="none" stroke="%2334d399" stroke-width="2" opacity="0.6"><animate attributeName="r" values="25;44;25" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0.2;0.8" dur="4s" repeatCount="indefinite"/></circle><circle cx="60" cy="60" r="22" fill="%2310b981"><animate attributeName="r" values="18;24;18" dur="4s" repeatCount="indefinite"/></circle></svg>`
  },
  {
    id: 'terminal-matrix',
    name: 'Matrix Beam',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="%23052e16"/><text x="24" y="55" font-family="monospace" font-size="28" fill="%2322c55e">&gt;_</text><rect x="65" y="32" width="10" height="26" fill="%2322c55e"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect><text x="60" y="90" font-family="monospace" font-size="11" fill="%2386efac" text-anchor="middle">ACTIVE</text></svg>`
  },
  {
    id: 'retro-synth',
    name: 'Retro Synth',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="%233b0764"/><circle cx="60" cy="52" r="32" fill="%23f43f5e"/><line x1="28" y1="52" x2="92" y2="52" stroke="%233b0764" stroke-width="3"/><line x1="33" y1="62" x2="87" y2="62" stroke="%233b0764" stroke-width="3"/><path d="M 10 110 L 60 75 L 110 110" stroke="%23c084fc" stroke-width="2" fill="none"/></svg>`
  }
];
