/**
 * Procedural Web Audio Ambient Sound Synthesizer & Pomodoro Chime
 * 100% synthesized in-browser via AudioContext — zero external audio files needed!
 */

export type AmbientType = 'rain' | 'waves' | 'fireplace' | 'binaural' | 'brownNoise';

interface ActiveTrack {
  nodes: AudioNode[];
  gainNode: GainNode;
  cleanup?: () => void;
}

export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<AmbientType, ActiveTrack> = new Map();

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Generates a 5-second looped White Noise buffer
   */
  private createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Generates a 5-second looped Brown Noise buffer (integrated white noise)
   */
  private createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // boost level
    }
    return buffer;
  }

  /**
   * Play or stop a specific ambient sound track
   */
  public setTrackState(type: AmbientType, isPlaying: boolean, volume = 0.5): void {
    const ctx = this.initContext();

    if (!isPlaying) {
      const existing = this.tracks.get(type);
      if (existing) {
        existing.gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        setTimeout(() => {
          if (existing.cleanup) existing.cleanup();
          existing.nodes.forEach((n) => {
            try {
              if ('stop' in n) (n as AudioScheduledSourceNode).stop();
              n.disconnect();
            } catch {}
          });
          this.tracks.delete(type);
        }, 350);
      }
      return;
    }

    // Already playing? Just adjust volume
    if (this.tracks.has(type)) {
      this.setTrackVolume(type, volume);
      return;
    }

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, ctx.currentTime);
    trackGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
    trackGain.connect(this.masterGain!);

    const nodes: AudioNode[] = [trackGain];
    let cleanup: (() => void) | undefined;

    switch (type) {
      case 'rain': {
        // Filtered noise with raindrop resonance
        const noiseBuf = this.createWhiteNoiseBuffer(ctx);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuf;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(trackGain);
        noiseSource.start();
        nodes.push(noiseSource, filter);

        // Intermittent raindrops
        const dropInterval = setInterval(() => {
          if (this.ctx?.state !== 'running' || !this.tracks.has('rain')) return;
          try {
            const osc = ctx.createOscillator();
            const dropGain = ctx.createGain();
            osc.frequency.setValueAtTime(1400 + Math.random() * 800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
            dropGain.gain.setValueAtTime(0.03 * volume, ctx.currentTime);
            dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            osc.connect(dropGain);
            dropGain.connect(trackGain);
            osc.start();
            osc.stop(ctx.currentTime + 0.09);
          } catch {}
        }, 220);

        cleanup = () => clearInterval(dropInterval);
        break;
      }

      case 'waves': {
        // Brown noise modulated by slow LFO (ocean swell)
        const brownBuf = this.createBrownNoiseBuffer(ctx);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = brownBuf;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12 second wave cycle
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(320, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noiseSource.connect(filter);
        filter.connect(trackGain);

        noiseSource.start();
        lfo.start();
        nodes.push(noiseSource, filter, lfo, lfoGain);
        break;
      }

      case 'fireplace': {
        // Low rumble + crackle impulses
        const brownBuf = this.createBrownNoiseBuffer(ctx);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = brownBuf;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(trackGain);
        noiseSource.start();
        nodes.push(noiseSource, filter);

        const crackleInterval = setInterval(() => {
          if (!this.tracks.has('fireplace')) return;
          try {
            const crackle = ctx.createOscillator();
            const cGain = ctx.createGain();
            crackle.type = 'triangle';
            crackle.frequency.setValueAtTime(2000 + Math.random() * 3000, ctx.currentTime);
            cGain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);
            cGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
            crackle.connect(cGain);
            cGain.connect(trackGain);
            crackle.start();
            crackle.stop(ctx.currentTime + 0.025);
          } catch {}
        }, 150);

        cleanup = () => clearInterval(crackleInterval);
        break;
      }

      case 'binaural': {
        // Left 210 Hz, Right 220 Hz -> 10 Hz Alpha Focus Beat
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(210, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(220, ctx.currentTime);

        oscL.connect(merger, 0, 0); // Left channel
        oscR.connect(merger, 0, 1); // Right channel
        merger.connect(trackGain);

        oscL.start();
        oscR.start();
        nodes.push(oscL, oscR, merger);
        break;
      }

      case 'brownNoise': {
        const brownBuf = this.createBrownNoiseBuffer(ctx);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = brownBuf;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(trackGain);
        noiseSource.start();
        nodes.push(noiseSource, filter);
        break;
      }
    }

    this.tracks.set(type, { nodes, gainNode: trackGain, cleanup });
  }

  public setTrackVolume(type: AmbientType, volume: number): void {
    const track = this.tracks.get(type);
    if (track && this.ctx) {
      track.gainNode.gain.setValueAtTime(Math.max(0.001, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public stopAll(): void {
    Array.from(this.tracks.keys()).forEach((type) => {
      this.setTrackState(type, false);
    });
  }

  /**
   * Plays a pleasant synthesized notification chime on Pomodoro completion (C-major triad bell)
   */
  public playCompletionChime(): void {
    const ctx = this.initContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
  }
}

export const ambientAudio = new AmbientAudioEngine();
