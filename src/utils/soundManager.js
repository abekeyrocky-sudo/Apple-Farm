// 🎵 Apple Farm Sound & Ambient Music Manager
// Uses Web Audio API for zero-latency, high-performance, and offline/Telegram-compatible audio without external asset loading delays.

class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.bgmGainNode = null;
    this.sfxGainNode = null;
    this.isMuted = localStorage.getItem('apple_farm_muted') === 'true';
    this.isBgmPlaying = false;
    this.bgmInterval = null;
    this.listenersAttached = false;
  }

  // AudioContext lazily initialize on first user gesture
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();

        // Master gains
        this.sfxGainNode = this.audioCtx.createGain();
        this.sfxGainNode.gain.value = this.isMuted ? 0 : 0.8;
        this.sfxGainNode.connect(this.audioCtx.destination);

        this.bgmGainNode = this.audioCtx.createGain();
        this.bgmGainNode.gain.value = this.isMuted ? 0 : 0.18; // gentle background volume
        this.bgmGainNode.connect(this.audioCtx.destination);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  // 🔊 Apple Harvest / Pluck Sound (Satisfying wooden pop & bubble)
  playHarvestSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary oscillator (Pop tone with fast pitch drop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch drop from 580Hz to 160Hz gives the juicy pluck feel
      osc.frequency.setValueAtTime(580 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.16);

      // Secondary wooden woody tap overtone
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(800 + Math.random() * 100, now);
      woodOsc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      woodGain.gain.setValueAtTime(0.4, now);
      woodGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      woodOsc.connect(woodGain);
      woodGain.connect(this.sfxGainNode);

      woodOsc.start(now);
      woodOsc.stop(now + 0.1);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 🖱️ UI Button Click Sound
  playClickSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.06);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 🎡 Spin Wheel Click Tick
  playSpinTick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // ✨ Success / Win / Claim Reward Sound (Ascending Chime)
  playSuccessSound() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGainNode);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // 🌾 Ambient Country Farm Music (Peaceful Procedural Farm Acoustic Soundtrack)
  startBackgroundMusic() {
    if (this.isBgmPlaying) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isBgmPlaying = true;

    // Pleasant relaxing pentatonic chord progression (G Major / E Minor farm vibes)
    const chords = [
      [392.00, 493.88, 587.33], // G major (G4, B4, D5)
      [329.63, 392.00, 493.88], // E minor (E4, G4, B4)
      [349.23, 440.00, 523.25], // F major (F4, A4, C5)
      [261.63, 329.63, 392.00], // C major (C4, E4, G4)
    ];

    let chordIndex = 0;

    const playChordStep = () => {
      if (!this.isBgmPlaying || this.isMuted) return;
      if (!this.audioCtx || this.audioCtx.state !== 'running') return;

      try {
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        // Warm pad synth
        currentChord.forEach((freq, i) => {
          const now = this.audioCtx.currentTime + i * 0.15;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

          osc.connect(gain);
          gain.connect(this.bgmGainNode);

          osc.start(now);
          osc.stop(now + 2.9);
        });

        // Occasional soft farm bird chirp effect
        if (Math.random() > 0.4) {
          const chirpNow = this.audioCtx.currentTime + 1.2 + Math.random();
          const birdOsc = this.audioCtx.createOscillator();
          const birdGain = this.audioCtx.createGain();

          birdOsc.type = 'sine';
          birdOsc.frequency.setValueAtTime(2400 + Math.random() * 400, chirpNow);
          birdOsc.frequency.exponentialRampToValueAtTime(3200, chirpNow + 0.08);
          birdOsc.frequency.exponentialRampToValueAtTime(2600, chirpNow + 0.16);

          birdGain.gain.setValueAtTime(0.025, chirpNow);
          birdGain.gain.exponentialRampToValueAtTime(0.001, chirpNow + 0.2);

          birdOsc.connect(birdGain);
          birdGain.connect(this.bgmGainNode);

          birdOsc.start(chirpNow);
          birdOsc.stop(chirpNow + 0.22);
        }
      } catch (err) {
        console.warn('BGM error:', err);
      }
    };

    // Play immediately and then repeat every 3 seconds
    playChordStep();
    this.bgmInterval = setInterval(playChordStep, 3000);
  }

  stopBackgroundMusic() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  // 🔇 Toggle Mute / Unmute
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('apple_farm_muted', this.isMuted ? 'true' : 'false');

    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.isMuted ? 0 : 0.8;
    }
    if (this.bgmGainNode) {
      this.bgmGainNode.gain.value = this.isMuted ? 0 : 0.18;
    }

    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }

    return this.isMuted;
  }

  // Auto-init on first user gesture anywhere
  initUserGestureListeners() {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const startAudio = () => {
      this.getAudioContext();
      if (!this.isMuted) {
        this.startBackgroundMusic();
      }
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
    };

    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true });
  }
}

export const soundManager = new SoundManager();
