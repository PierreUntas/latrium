/* L'Atrium : ambiance sonore générée avec la Web Audio API (aucun fichier audio).
   Une nappe douce en ré lydien, une boîte à musique aléatoire et quelques effets. */
(() => {
  'use strict';
  let ctx = null, master, musicBus, sfxBus, verb, started = false, muted = false;
  let musicTimer = 0, bellTimer = 0, chordIdx = 0;
  try { muted = localStorage.getItem('atrium.muted') === '1'; } catch (e) { /* stockage indisponible */ }

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  // ré lydien : D E F# G# A B C#
  const CHORDS = [[50, 57, 62, 64, 69], [47, 54, 57, 62, 66], [43, 50, 57, 61, 66], [45, 52, 57, 59, 64]];
  const BELL = [74, 76, 78, 81, 83, 85, 86, 88, 90, 93];

  function impulse(sec, decay){
    const len = ctx.sampleRate * sec, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++){ const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function init(){
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = impulse(3.2, 2.4);
    const wet = ctx.createGain(); wet.gain.value = .45; verb.connect(wet); wet.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = .16; musicBus.connect(master); musicBus.connect(verb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .5; sfxBus.connect(master); sfxBus.connect(verb);
    return true;
  }
  function tone(freq, t, dur, { type = 'sine', gain = .2, attack = .01, bus = sfxBus, to = null, filter = null } = {}){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o;
    if (filter){ const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .05);
  }
  function noise(t, dur, { gain = .1, freq = 1200, q = 1, type = 'bandpass' } = {}){
    const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t);
  }
  function bell(n, t, gain = .09, bus = musicBus){
    tone(midi(n), t, 2.4, { gain, attack: .005, bus });
    tone(midi(n) * 2.01, t, 1.2, { gain: gain * .35, attack: .005, bus });
  }

  // --- musique
  function padChord(){
    const t = ctx.currentTime, ch = CHORDS[chordIdx++ % CHORDS.length];
    ch.forEach((n, i) => {
      [-4, 4].forEach(det => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = i === 0 ? 'sine' : 'triangle'; o.frequency.value = midi(n); o.detune.value = det;
        f.type = 'lowpass'; f.frequency.value = 900;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + 3); g.gain.setValueAtTime(.05, t + 7); g.gain.linearRampToValueAtTime(0, t + 11.5);
        o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 12);
      });
    });
  }
  function scheduleBells(){
    const t = ctx.currentTime;
    if (Math.random() < .7) bell(BELL[Math.floor(Math.random() * BELL.length)], t + Math.random() * .2);
    if (Math.random() < .25) bell(BELL[Math.floor(Math.random() * BELL.length)] - 12, t + .45, .07);
    bellTimer = setTimeout(scheduleBells, 900 + Math.random() * 1800);
  }
  function startMusic(){ padChord(); musicTimer = setInterval(padChord, 8000); scheduleBells(); }

  // --- effets
  const FX = {
    blip(t){ tone(880 + Math.random() * 180, t, .05, { gain: .025, type: 'triangle' }); },
    select(t){ tone(660, t, .12, { gain: .07, type: 'triangle' }); tone(990, t + .05, .16, { gain: .05 }); },
    step(t){ noise(t, .06, { gain: .035, freq: 700 + Math.random() * 300, q: 2 }); },
    bubble(t){ tone(260, t, .5, { gain: .12, to: 900 }); },
    pop(t){ noise(t, .08, { gain: .18, freq: 2400, q: .8 }); tone(1200, t, .12, { gain: .06, to: 600 }); },
    gift(t){ [0, 4, 7, 12, 16].forEach((k, i) => bell(74 + k, t + i * .09, .08, sfxBus)); },
    ledger(t){ bell(81, t, .1, sfxBus); bell(88, t + .14, .09, sfxBus); bell(93, t + .28, .08, sfxBus); },
    grow(t){ [62, 66, 69, 73, 76, 78].forEach((n, i) => bell(n, t + i * .22, .07, sfxBus)); },
    theft(t){ [76, 72, 69, 64].forEach((n, i) => tone(midi(n), t + i * .16, .5, { gain: .09, type: 'triangle', filter: 1800 })); },
    fail(t){ tone(midi(57), t, .35, { gain: .08, type: 'triangle' }); tone(midi(56), t + .18, .5, { gain: .08, type: 'triangle' }); },
    end(t){ [62, 69, 74, 78, 81].forEach((n, i) => bell(n, t + i * .16, .09, sfxBus)); },
    meow(t){
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 3;
      o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(820, t + .18); o.frequency.linearRampToValueAtTime(480, t + .55);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .06); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
      o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + .65);
    },
  };

  const listeners = [];
  window.Sound = {
    start(){
      if (started) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
      if (!init()) return; started = true; startMusic();
    },
    sfx(name){ if (!started || muted || !FX[name]) return; try { FX[name](ctx.currentTime + .01); } catch (e) { /* ignore */ } },
    get muted(){ return muted; },
    toggle(){
      muted = !muted;
      try { localStorage.setItem('atrium.muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
      if (ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, .15);
      listeners.forEach(fn => fn(muted));
      return muted;
    },
    onChange(fn){ listeners.push(fn); },
  };
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
})();
