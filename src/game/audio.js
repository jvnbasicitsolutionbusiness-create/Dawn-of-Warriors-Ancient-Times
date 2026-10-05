// Dawn of Warriors: Ancient Times - Dynamic Web Audio Engine
// Provides procedural orchestral ancient soundtrack + authentic clicking, tasking, and combat SFX.

let context = null;
let masterMusicGain = null;
let masterSfxGain = null;
let musicDroneNodes = [];
let musicSequencerTimer = null;
let currentMood = "ambient"; // "ambient", "battle", "victory", "menu"
let currentScene = "lobby";
let musicIsActive = false;
let lastClickTime = 0;
const soundtrackProfiles = {
  auth: {
    drones: [73.42, 110, 146.83, 174.61],
    notes: [293.66, 349.23, 392, 440, 523.25, 440, 392, 349.23],
    melodySteps: [0, 4, 7, 11],
    pulseSteps: [0, 8],
    melodyVolume: 0.24,
    droneVolume: 0.055,
  },
  lobby: {
    drones: [82.41, 123.47, 164.81, 196],
    notes: [246.94, 293.66, 329.63, 392, 440, 392, 329.63, 293.66],
    melodySteps: [0, 3, 7, 10, 13],
    pulseSteps: [0, 10],
    melodyVolume: 0.2,
    droneVolume: 0.05,
  },
  gameplay: {
    drones: [73.42, 98, 146.83, 185],
    notes: [220, 261.63, 293.66, 349.23, 392, 349.23, 293.66, 261.63],
    melodySteps: [0, 2, 5, 8, 10, 13],
    pulseSteps: [0, 4, 8, 12],
    melodyVolume: 0.28,
    droneVolume: 0.06,
  },
};

function getAudioContext() {
  if (!context && typeof window !== "undefined") {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      context = new AudioCtx();
    }
  }
  if (context && context.state === "suspended") {
    context.resume().catch(() => {});
  }
  return context;
}

// -------------------------------------------------------------
// SOUNDTRACK / MUSIC SYSTEM
// -------------------------------------------------------------
export function music(enabled, volume = 30, mood = "ambient") {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!masterMusicGain) {
    masterMusicGain = ctx.createGain();
    masterMusicGain.gain.value = 0;
    masterMusicGain.connect(ctx.destination);
  }

  currentMood = mood;

  if (!enabled || volume <= 0) {
    musicIsActive = false;
    masterMusicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    if (musicSequencerTimer) {
      clearInterval(musicSequencerTimer);
      musicSequencerTimer = null;
    }
    return;
  }

  musicIsActive = true;
  const targetGain = (Math.max(1, Math.min(100, volume)) / 100) * 0.62;
  masterMusicGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.6);

  // Initialize atmospheric chords and melodic step sequence if not already running
  if (musicDroneNodes.length === 0) {
    initSoundtrackSynths(ctx);
  }

  if (!musicSequencerTimer) {
    startMusicSequencer();
  }
}

export function setMusicMood(mood) {
  if (currentMood === mood) return;
  currentMood = mood;
}

export function setMusicScene(scene) {
  if (soundtrackProfiles[scene]) currentScene = scene;
}

function initSoundtrackSynths(ctx) {
  const profile = soundtrackProfiles[currentScene];
  musicDroneNodes = [];

  profile.drones.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = idx % 2 === 0 ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Warm low-pass filter
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320 + idx * 80, ctx.currentTime);

    // Subtle LFO drift
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.12 + idx * 0.05, ctx.currentTime);
    lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
    lfo.connect(osc.frequency);
    lfo.start();

    g.gain.setValueAtTime(profile.droneVolume / (idx + 1), ctx.currentTime);

    osc.connect(filter);
    filter.connect(g);
    g.connect(masterMusicGain);

    osc.start();
    musicDroneNodes.push({ osc, gain: g, filter });
  });
}

function startMusicSequencer() {
  const ctx = getAudioContext();
  if (!ctx) return;

  let step = 0;

  musicSequencerTimer = setInterval(() => {
    if (!musicIsActive || !ctx || ctx.state !== "running") return;

    step = (step + 1) % 16;
    const profile = soundtrackProfiles[currentScene];

    // In battle mood: trigger deep war percussion cadence
    if (currentMood === "battle") {
      if (step % 2 === 0) {
        triggerPercussion(ctx, step % 8 === 0 ? "war_kick" : "war_tom", 0.6);
      }
      if (step % 4 === 2) {
        triggerPercussion(ctx, "snare_rim", 0.4);
      }
    } else {
      if (profile.pulseSteps.includes(step)) {
        triggerPercussion(ctx, "ambient_pulse", 0.25);
      }
    }

    const shouldPlayNote =
      currentMood === "battle"
        ? step % 2 === 0
        : profile.melodySteps.includes(step);
    if (shouldPlayNote) {
      const freq = profile.notes[(step + 1) % profile.notes.length];
      triggerMelodyNote(
        ctx,
        freq,
        currentMood === "battle" ? 0.35 : profile.melodyVolume,
      );
    }
  }, 380);
}

function triggerMelodyNote(ctx, freq, amp = 0.2) {
  if (!masterMusicGain) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = currentMood === "battle" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(freq, now);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(currentMood === "battle" ? 1400 : 900, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.9);

  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(amp * 0.27, now + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

  osc.connect(filter);
  filter.connect(g);
  g.connect(masterMusicGain);

  osc.start(now);
  osc.stop(now + 0.9);
}

function triggerPercussion(ctx, type, amp = 0.5) {
  if (!masterMusicGain) return;
  const now = ctx.currentTime;

  if (type === "war_kick" || type === "ambient_pulse") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.28);

    g.gain.setValueAtTime(amp * 0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(g);
    g.connect(masterMusicGain);
    osc.start(now);
    osc.stop(now + 0.36);
  } else if (type === "war_tom") {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);

    g.gain.setValueAtTime(amp * 0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(g);
    g.connect(masterMusicGain);
    osc.start(now);
    osc.stop(now + 0.23);
  } else if (type === "snare_rim") {
    // Filtered noise snap
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(2.0, now);

    const g = ctx.createGain();
    g.gain.setValueAtTime(amp * 0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(g);
    g.connect(masterMusicGain);
    noise.start(now);
    noise.stop(now + 0.13);
  }
}

// -------------------------------------------------------------
// SOUND EFFECTS (SFX) SYSTEM
// -------------------------------------------------------------
export function playSfx(type = "click", volume = 65) {
  if (!volume || volume <= 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!masterSfxGain) {
    masterSfxGain = ctx.createGain();
    masterSfxGain.connect(ctx.destination);
  }
  const sfxVol = Math.max(0.05, Math.min(1.0, volume / 100));
  masterSfxGain.gain.setValueAtTime(sfxVol, ctx.currentTime);

  const now = ctx.currentTime;

  switch (type) {
    // --- CLICKING & UI SOUNDS ---
    case "click":
    case "button": {
      if (now - lastClickTime < 0.035) return;
      lastClickTime = now;
      // Crisp stone/wood mechanical tap
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
      break;
    }

    case "select": {
      // High ancient coin / armor ring
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.09);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case "deselect": {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.07);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.09);
      break;
    }

    // --- TASKING & ORDERS ---
    case "order":
    case "march": {
      // Ancient military horn signal + boots cadence
      // Horn 1: Fifth interval
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      const g = ctx.createGain();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";
      horn1.frequency.setValueAtTime(220, now);
      horn1.frequency.exponentialRampToValueAtTime(330, now + 0.18);
      horn2.frequency.setValueAtTime(221, now);
      horn2.frequency.exponentialRampToValueAtTime(331, now + 0.18);

      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(700, now);

      g.gain.setValueAtTime(0.01, now);
      g.gain.linearRampToValueAtTime(0.28, now + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      horn1.connect(f);
      horn2.connect(f);
      f.connect(g);
      g.connect(masterSfxGain);

      horn1.start(now);
      horn2.start(now);
      horn1.stop(now + 0.38);
      horn2.stop(now + 0.38);
      break;
    }

    case "task":
    case "work": {
      // Hammer striking timber
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }

    case "build": {
      // Masonry / stone placement
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(450, now);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(f);
      f.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
      break;
    }

    case "complete": {
      // Victorious building/expansion fanfare (major triad: C5 - E5 - G5)
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.01, now + idx * 0.08);
        g.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(g);
        g.connect(masterSfxGain);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });
      break;
    }

    case "recruit": {
      // Military muster bugle (D4 - F#4 - A4 - D5)
      [293.66, 370.0, 440.0, 587.33].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(1100, now);

        g.gain.setValueAtTime(0.01, now + idx * 0.07);
        g.gain.linearRampToValueAtTime(0.2, now + idx * 0.07 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);

        osc.connect(f);
        f.connect(g);
        g.connect(masterSfxGain);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.3);
      });
      break;
    }

    case "research": {
      // Ancient temple gong / chime
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.5);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.75);
      break;
    }

    case "gather_wood": {
      // Sharp axe strike
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case "gather_stone":
    case "gather_gold": {
      // Pickaxe metal ping
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case "gather_food": {
      // Scythe rustle
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.setValueAtTime(1800, now);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(f);
      f.connect(g);
      g.connect(masterSfxGain);
      noise.start(now);
      noise.stop(now + 0.13);
      break;
    }

    // --- BATTLING & COMBAT ---
    case "clash":
    case "hit": {
      // Steel blade clash + shield impact
      // 1. High metallic ring
      const blade = ctx.createOscillator();
      const bladeGain = ctx.createGain();
      blade.type = "sine";
      blade.frequency.setValueAtTime(2400 + Math.random() * 400, now);
      blade.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      bladeGain.gain.setValueAtTime(0.3, now);
      bladeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      blade.connect(bladeGain);
      bladeGain.connect(masterSfxGain);
      blade.start(now);
      blade.stop(now + 0.18);

      // 2. Shield crunch noise
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(800, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(f);
      f.connect(noiseGain);
      noiseGain.connect(masterSfxGain);
      noise.start(now);
      noise.stop(now + 0.09);
      break;
    }

    case "arrow": {
      // Whistling arrow release
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.14);
      g.gain.setValueAtTime(0.2, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g);
      g.connect(masterSfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
      break;
    }

    case "horn":
    case "warhorn": {
      // Deep war horn echoing over the battlefield
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      const g = ctx.createGain();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";
      horn1.frequency.setValueAtTime(130.81, now); // C3
      horn1.frequency.linearRampToValueAtTime(164.81, now + 0.35); // E3
      horn2.frequency.setValueAtTime(131.5, now);
      horn2.frequency.linearRampToValueAtTime(165.5, now + 0.35);

      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(650, now);

      g.gain.setValueAtTime(0.01, now);
      g.gain.linearRampToValueAtTime(0.4, now + 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      horn1.connect(f);
      horn2.connect(f);
      f.connect(g);
      g.connect(masterSfxGain);

      horn1.start(now);
      horn2.start(now);
      horn1.stop(now + 0.75);
      horn2.stop(now + 0.75);
      break;
    }

    case "victory": {
      // Regal victory fanfare
      [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
        g.gain.setValueAtTime(0.01, now + idx * 0.11);
        g.gain.linearRampToValueAtTime(0.25, now + idx * 0.11 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.6);
        osc.connect(g);
        g.connect(masterSfxGain);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.65);
      });
      break;
    }

    case "defeat": {
      // Somber defeat horn descent
      [220.0, 196.0, 174.61, 146.83].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.2);
        const f = ctx.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.setValueAtTime(450, now);
        g.gain.setValueAtTime(0.01, now + idx * 0.2);
        g.gain.linearRampToValueAtTime(0.22, now + idx * 0.2 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.2 + 0.5);
        osc.connect(f);
        f.connect(g);
        g.connect(masterSfxGain);
        osc.start(now + idx * 0.2);
        osc.stop(now + idx * 0.2 + 0.55);
      });
      break;
    }

    default: {
      // Default notification chime
      chime(volume);
      break;
    }
  }
}

// Retain backward-compatible chime function
export function chime(volume = 50) {
  if (!volume) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(440, now);
  o.frequency.exponentialRampToValueAtTime(660, now + 0.15);
  g.gain.setValueAtTime((volume / 100) * 0.035, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(now);
  o.stop(now + 0.4);
}
