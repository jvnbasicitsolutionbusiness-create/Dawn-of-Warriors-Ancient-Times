let context,
  gain,
  nodes = [];
export function music(enabled, volume = 25) {
  if (!enabled) {
    if (gain) gain.gain.setTargetAtTime(0, context.currentTime, 0.4);
    return;
  }
  if (!gain) {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(context.destination);
    [110, 164.81, 220, 261.63, 329.63].forEach((freq, i) => {
      const o = context.createOscillator(),
        g = context.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = 0.07 / (i + 1);
      o.connect(g);
      g.connect(gain);
      o.start();
      nodes.push(o);
    });
  }
  context.resume();
  gain.gain.setTargetAtTime((volume / 100) * 0.7, context.currentTime, 0.7);
}
export function chime(volume = 50) {
  if (!volume) return;
  context ||= new (window.AudioContext || window.webkitAudioContext)();
  context.resume();
  const o = context.createOscillator(),
    g = context.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(440, context.currentTime);
  o.frequency.exponentialRampToValueAtTime(660, context.currentTime + 0.15);
  g.gain.setValueAtTime((volume / 100) * 0.035, context.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
  o.connect(g);
  g.connect(context.destination);
  o.start();
  o.stop(context.currentTime + 0.4);
}
