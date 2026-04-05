/**
 * Web Audio API Sound Synthesizer for D&D Effects
 * Provides 100% reliable sound generation without external MP3 files.
 */

const getAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export const playSynthSound = (type: string, masterVolume: number = 1.0) => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const vol = masterVolume;

  switch (type) {
    case 'sword': {
      // Metallic Clash: White noise + filtered burst
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.1);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      break;
    }

    case 'magic': {
      // "Pirilin pim pim": Delicate magic sparkle arpeggio
      const notes = [1500, 1800, 2100, 2400]; 
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.2 * vol, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.15);
      });
      break;
    }

    case 'coin': {
      // Coin Jingle: High pitch triangle + fast decay
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(1600, now + 0.05);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
      break;
    }

    case 'success': {
      // Mario-Style Success: Upward arpeggio (C-E-G-C-E-G-C)
      const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
      break;
    }

    case 'error': {
      // Mario-Style Die: Downward slide whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.4);
      break;
    }
    
    case 'roar': {
      // Dragon Roar: Low noise with filter sweep
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      break;
    }

    case 'growl': {
      // Monster Growl: Low frequency rumble with modulation
      const bufferSize = ctx.sampleRate * 0.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(8, now); // 8Hz modulation
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(150, now);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now);
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      lfo.start();
      noise.start();
      break;
    }

    case 'slime': {
      // Slime/Squish: Sweeping low-pass filter with resonance
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(15, now);
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      break;
    }

    case 'skeleton': {
      // Skeleton/Bone Clack: High-pitched staccato ticks
      const count = 4;
      for (let i = 0; i < count; i++) {
        const time = now + i * 0.08;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200 + Math.random() * 500, time);
        g.gain.setValueAtTime(0.2, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
      }
      break;
    }
  }
};

// --- Ambience Engine ---
class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private currentType: string | null = null;

  startAmbience(type: string, volume: number = 0.5) {
    if (this.currentType === type) return;
    this.stopAmbience();

    this.ctx = getAudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 1);
    this.gain.connect(this.ctx.destination);

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate high-quality Brown Noise (smoother than white noise)
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise formula: integrated white noise with a leak
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      
      // Gain compensation for deep frequencies
      if (type === 'caverna') data[i] *= 4.0;
      else if (type === 'taverna') data[i] *= 2.5;
      else data[i] *= 3.0; 
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    if (type === 'taverna') {
      filter.type = 'lowpass';
      filter.frequency.value = 800;
    } else if (type === 'floresta') {
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
    } else if (type === 'caverna') {
      filter.type = 'lowpass';
      filter.frequency.value = 200;
    }

    this.source.connect(filter);
    
    // Add a secondary filter for smoother texture
    const filter2 = this.ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = type === 'caverna' ? 100 : 1500;
    filter.connect(filter2);

    // Apply LFO for "movement" (gusts of wind, changing chatter)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = type === 'floresta' ? 0.2 : 0.05; // Very slow
    lfoGain.gain.value = 0.1; // 10% volume oscillation
    
    lfo.connect(lfoGain);
    lfoGain.connect(this.gain.gain);
    lfo.start();

    filter2.connect(this.gain);
    this.source.start();
    this.currentType = type;
  }

  updateVolume(volume: number) {
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  stopAmbience() {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
    }
    this.currentType = null;
  }
}

export const ambienceEngine = new AmbienceEngine();
