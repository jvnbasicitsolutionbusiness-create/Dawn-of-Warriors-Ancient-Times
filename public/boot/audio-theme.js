// Dawn of Warriors: Ancient Times - Universal Web Soundtrack & SFX Engine
// Provides authentic ancient soundtrack and interactive sounds to all pages.

(function () {
  if (typeof window === "undefined") return;

  const STORAGE_KEY = "dow_audio_config";
  const tracks = {
    auth: {
      drones: [73.42, 110, 146.83, 174.61],
      notes: [293.66, 349.23, 392, 440, 523.25, 440, 392, 349.23],
      melodySteps: [0, 4, 7, 11],
      pulseSteps: [0, 8],
      pulseFrequency: 78,
      volume: 0.045,
    },
    lobby: {
      drones: [82.41, 123.47, 164.81, 196],
      notes: [246.94, 293.66, 329.63, 392, 440, 392, 329.63, 293.66],
      melodySteps: [0, 3, 7, 10, 13],
      pulseSteps: [0, 10],
      pulseFrequency: 68,
      volume: 0.04,
    },
    gameplay: {
      drones: [73.42, 98, 146.83, 185],
      notes: [220, 261.63, 293.66, 349.23, 392, 349.23, 293.66, 261.63],
      melodySteps: [0, 2, 5, 8, 10, 13],
      pulseSteps: [0, 4, 8, 12],
      pulseFrequency: 58,
      volume: 0.055,
    },
  };
  const scene = document.body.dataset.audioScene || "auth";
  const track = tracks[scene] || tracks.auth;
  let config = {
    music: true,
    sfx: true,
    volume: 35,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) Object.assign(config, JSON.parse(saved));
  } catch (e) {}

  let ctx = null;
  let musicGain = null;
  let sfxGain = null;
  let musicTimer = null;
  let isRunning = false;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
        musicGain = ctx.createGain();
        sfxGain = ctx.createGain();
        musicGain.connect(ctx.destination);
        sfxGain.connect(ctx.destination);
        updateGains();
      }
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function updateGains() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const mVol = config.music ? (config.volume / 100) * 0.55 : 0;
    const sVol = config.sfx ? 0.45 : 0;
    if (musicGain) musicGain.gain.setTargetAtTime(mVol, now, 0.4);
    if (sfxGain) sfxGain.gain.setTargetAtTime(sVol, now, 0.2);
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {}
    updateGains();
    updateUi();
  }

  // Melodic ancient modal synthesizer
  function startMusicLoop() {
    const context = getCtx();
    if (!context || isRunning) return;
    isRunning = true;

    track.drones.forEach((freq, idx) => {
      const osc = context.createOscillator();
      const g = context.createGain();
      const filter = context.createBiquadFilter();

      osc.type = idx % 2 === 0 ? "sawtooth" : "sine";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 320 + idx * 60;

      g.gain.value = track.volume / (idx + 1);
      osc.connect(filter);
      filter.connect(g);
      g.connect(musicGain);
      osc.start();
    });

    let step = 0;

    musicTimer = setInterval(() => {
      if (!config.music || !ctx || ctx.state !== "running") return;
      step = (step + 1) % 16;

      if (track.pulseSteps.includes(step)) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(track.pulseFrequency, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.35);
        g.gain.setValueAtTime(0.28, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(g);
        g.connect(musicGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      }

      if (track.melodySteps.includes(step)) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(track.notes[(step + 1) % track.notes.length], now);
        f.type = "lowpass";
        f.frequency.setValueAtTime(900, now);
        f.frequency.exponentialRampToValueAtTime(250, now + 0.9);

        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        osc.connect(f);
        f.connect(g);
        g.connect(musicGain);
        osc.start(now);
        osc.stop(now + 0.9);
      }
    }, 450);
    updateUi();
  }

  // Crisp clicking sound effect
  function playClick() {
    if (!config.sfx) return;
    const context = getCtx();
    if (!context) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  function playOrderSound() {
    if (!config.sfx) return;
    const context = getCtx();
    if (!context) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.15);
    const f = context.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 650;
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(f);
    f.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Create elegant top-right floating music toggle
  let btnEl = null;
  function createAudioUi() {
    if (document.getElementById("dow-audio-widget")) return;

    const wrap = document.createElement("div");
    wrap.id = "dow-audio-widget";
    wrap.style.cssText = `
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(14, 24, 27, 0.88);
      border: 1px solid rgba(229, 197, 122, 0.4);
      border-radius: 20px;
      padding: 6px 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      color: #e5c57a;
      font-family: 'Segoe UI', sans-serif;
      font-size: 12px;
      letter-spacing: 0.05em;
      user-select: none;
      backdrop-filter: blur(8px);
      transition: all 0.25s ease;
    `;

    wrap.innerHTML = `
      <button id="dow-music-toggle" style="background:none; border:none; color:#e5c57a; cursor:pointer; display:flex; align-items:center; gap:5px; font-weight:600; font-size:12px; padding:0;">
        <span id="dow-music-icon">🎵</span>
        <span id="dow-music-label">MUSIC ON</span>
      </button>
      <span style="opacity:0.3;">|</span>
      <button id="dow-sfx-toggle" style="background:none; border:none; color:#d9d0be; cursor:pointer; font-size:11px; padding:0;" title="Toggle SFX">
        <span id="dow-sfx-label">SFX: ON</span>
      </button>
    `;

    document.body.appendChild(wrap);

    const musicBtn = wrap.querySelector("#dow-music-toggle");
    const sfxBtn = wrap.querySelector("#dow-sfx-toggle");

    musicBtn.addEventListener("click", () => {
      getCtx();
      config.music = !config.music || !isRunning;
      if (config.music) startMusicLoop();
      saveConfig();
      playClick();
    });

    sfxBtn.addEventListener("click", () => {
      getCtx();
      config.sfx = !config.sfx;
      saveConfig();
      playClick();
    });

    updateUi();
  }

  function updateUi() {
    const icon = document.getElementById("dow-music-icon");
    const label = document.getElementById("dow-music-label");
    const sfxLabel = document.getElementById("dow-sfx-label");
    if (label)
      label.textContent = !config.music
        ? "MUSIC OFF"
        : isRunning
          ? "MUSIC ON"
          : "START MUSIC";
    if (icon) icon.textContent = config.music ? "🎵" : "🔇";
    if (sfxLabel) sfxLabel.textContent = config.sfx ? "SFX: ON" : "SFX: OFF";
    const musicBtn = document.getElementById("dow-music-toggle");
    if (musicBtn) musicBtn.style.opacity = config.music ? "1" : "0.6";
  }

  // Auto-bind sound effects and gesture activation
  function attachInteractions() {
    document.addEventListener("click", (e) => {
      // Check if clicked element or parent is a button or interactive
      const target = e.target.closest("button, a, input[type='submit'], .btn, [role='button'], .catalog-card, .recruit-card, .tech-card, .minimap");
      if (!target?.closest("#dow-audio-widget")) {
        getCtx();
        if (config.music && !isRunning) startMusicLoop();
      }
      if (target && !target.closest("#dow-audio-widget")) {
        if (target.dataset?.sound === "order" || target.textContent?.includes("March") || target.textContent?.includes("Recruit")) {
          playOrderSound();
        } else {
          playClick();
        }
      }
    }, true);
  }

  // Initialize once DOM is ready
  function init() {
    if (document.getElementById("root") && window.__DOW_APP_LOADED__) return;
    createAudioUi();
    attachInteractions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose on window
  window.DawnAudio = {
    playClick,
    playOrderSound,
    startMusic: () => {
      getCtx();
      config.music = true;
      startMusicLoop();
      saveConfig();
    },
    stopMusic: () => {
      config.music = false;
      if (musicGain && ctx) {
        musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      }
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
      isRunning = false;
      saveConfig();
    },
  };
})();
