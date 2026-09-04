import { animate } from 'animejs';

/**
 * Service for fluid micro-animations powered by Anime.js v4
 */

export const triggerConfetti = (originX = window.innerWidth / 2, originY = window.innerHeight / 2) => {
  const container = document.createElement('div');
  container.className = 'animejs-confetti-container';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '999999';
  document.body.appendChild(container);

  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];
  const particleCount = 42;
  const particles: HTMLDivElement[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'animejs-confetti-particle';
    const size = Math.floor(Math.random() * 8) + 6;
    const isRound = Math.random() > 0.5;
    
    particle.style.position = 'absolute';
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.width = `${size}px`;
    particle.style.height = `${isRound ? size : size * 1.5}px`;
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.borderRadius = isRound ? '50%' : '2px';
    particle.style.opacity = '1';
    
    container.appendChild(particle);
    particles.push(particle);

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 180 + 70;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 30; // slight upward bias
    const rot = (Math.random() - 0.5) * 720;

    animate(particle, {
      translateX: destX,
      translateY: [0, destY, destY + 90], // arc trajectory with gravity drop
      rotate: rot,
      opacity: [1, 1, 0],
      scale: [0.5, 1.2, 0.4],
      duration: Math.random() * 800 + 700,
      ease: 'outQuad',
      onComplete: () => {
        particle.remove();
      }
    });
  }

  setTimeout(() => {
    container.remove();
  }, 1800);
};

export const springModalEnter = (modalEl: HTMLElement | null) => {
  if (!modalEl) return;
  animate(modalEl, {
    scale: [0.92, 1],
    opacity: [0, 1],
    duration: 320,
    ease: 'outBack'
  });
};

export const pulseAttention = (targetEl: HTMLElement | null) => {
  if (!targetEl) return;
  animate(targetEl, {
    scale: [1, 1.08, 1],
    duration: 400,
    ease: 'inOutQuad'
  });
};
