/**
 * Vibe Music — generative audio engine
 * ---------------------------------------------------------------------------
 * The demo catalog ships without audio files, so playback is synthesised in the
 * browser with the Web Audio API. Every track has a deterministic "mood"
 * (tempo, root note, scale, density, warmth, texture) that the engine turns
 * into an endless, gently evolving arrangement.
 *
 * If a track defines `audioUrl`, `PlayerProvider` streams that file through an
 * <audio> element instead and this engine stays idle.
 */

import type { Mood } from "@/data/catalog";

const SCALES: Record<Mood["scale"], number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 2, 4, 7, 9],
};

/** chord degrees per scale, index into the scale array */
const PROGRESSIONS: Record<Mood["scale"], number[]> = {
  minor: [0, 5, 3, 4],
  major: [0, 5, 3, 4],
  dorian: [0, 3, 6, 4],
  pentatonic: [0, 3, 1, 4],
};

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface SchedulerState {
  mood: Mood;
  /** ctx time of the next scheduled step */
  nextStepTime: number;
  /** absolute step counter since the loop start */
  step: number;
  bar: number;
  beat: number;
  startedAt: number;
  offset: number;
}

class VibeEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private timer: number | null = null;
  private state: SchedulerState | null = null;
  private volume = 0.8;
  private muted = false;
  private mood: Mood | null = null;

  /** Lazily create the graph; must be called from a user gesture on iOS. */
  private ensureContext() {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : this.volume;
    master.connect(ctx.destination);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 3;
    comp.attack.value = 0.006;
    comp.release.value = 0.24;
    comp.connect(master);

    const dry = ctx.createGain();
    dry.gain.value = 0.86;
    dry.connect(comp);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulse(ctx, 2.8, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    reverb.connect(wet);
    wet.connect(comp);

    this.ctx = ctx;
    this.master = master;
    this.dry = dry;
    this.reverb = reverb;
    this.noiseBuffer = this.makeNoise(ctx);
    return ctx;
  }

  private makeImpulse(ctx: AudioContext, seconds: number, decay: number) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - t * 0.2);
      }
    }
    return buffer;
  }

  private makeNoise(ctx: AudioContext) {
    const length = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** Load a track mood. `offset` is the playback position in seconds. */
  load(mood: Mood, offset = 0) {
    this.mood = mood;
    const now = this.ctx?.currentTime ?? 0;
    const stepDur = 60 / mood.bpm / 4;
    this.state = {
      mood,
      nextStepTime: now + 0.08,
      // align the arrangement to the seek position so a scrub keeps the groove
      step: Math.floor(offset / stepDur),
      bar: 0,
      beat: 0,
      startedAt: now - offset,
      offset,
    };
  }

  async play() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();
    if (!this.state) {
      if (!this.mood) return;
      this.load(this.mood, 0);
    }
    if (!this.state) return;
    this.state.nextStepTime = ctx.currentTime + 0.06;
    this.state.startedAt = ctx.currentTime - this.state.offset;
    this.startScheduler();
  }

  pause() {
    if (this.ctx && this.state) {
      this.state.offset = this.ctx.currentTime - this.state.startedAt;
    }
    this.stopScheduler();
    void this.ctx?.suspend();
  }

  stop() {
    this.stopScheduler();
    this.state = null;
    void this.ctx?.suspend();
  }

  seek(seconds: number) {
    if (!this.mood) return;
    const wasPlaying = this.timer !== null;
    if (this.ctx && this.state) this.state.offset = seconds;
    this.load(this.mood, seconds);
    if (wasPlaying) void this.play();
  }

  setMood(mood: Mood) {
    this.mood = mood;
    if (this.state) this.load(mood, this.position());
  }

  position() {
    if (!this.ctx || !this.state) return 0;
    if (this.timer === null) return this.state.offset;
    return Math.max(0, this.ctx.currentTime - this.state.startedAt);
  }

  setVolume(value: number) {
    this.volume = clamp(value, 0, 1);
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.03);
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.setVolume(this.volume);
  }

  private startScheduler() {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  private stopScheduler() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    const ctx = this.ctx;
    const state = this.state;
    if (!ctx || !state) return;
    const stepDur = 60 / state.mood.bpm / 4;
    const horizon = ctx.currentTime + 0.18;
    let guard = 0;
    while (state.nextStepTime < horizon && guard < 32) {
      this.scheduleStep(state, state.step, state.nextStepTime, stepDur);
      state.step += 1;
      state.nextStepTime += stepDur;
      guard += 1;
    }
  }

  private scheduleStep(state: SchedulerState, step: number, time: number, stepDur: number) {
    const { mood } = state;
    const bar = Math.floor(step / 16) % 4;
    const inBar = step % 16;
    const scale = SCALES[mood.scale];
    const progression = PROGRESSIONS[mood.scale];
    const degree = progression[bar];
    const rootMidi = mood.root + scale[degree % scale.length];
    const third = mood.root + scale[(degree + 2) % scale.length];
    const fifth = mood.root + scale[(degree + 4) % scale.length];
    const humanize = () => time + (Math.random() - 0.5) * 0.012;
    const warmth = mood.warmth;

    // ---- bass: root on 1 and on the "and" of 3 -----------------------------
    if (inBar === 0 || inBar === 10) {
      this.bass(rootMidi - 12, humanize(), stepDur * 3.6, warmth);
    }

    // ---- harmony -----------------------------------------------------------
    if (inBar === 0) {
      const voicing = [rootMidi, third, fifth, rootMidi + 12];
      if (mood.texture === "pad") {
        this.pad(voicing, time, (60 / mood.bpm) * 4, warmth);
      } else if (mood.texture === "keys") {
        voicing.forEach((note, i) => this.keys(note, time + i * 0.035, (60 / mood.bpm) * 2, warmth));
      }
    }

    // ---- arpeggio / melody -------------------------------------------------
    const density = mood.density;
    const playArp = inBar % 2 === 0 && Math.random() < 0.55 + density * 0.35;
    if (playArp && mood.texture !== "pad") {
      const pool = [rootMidi + 12, third + 12, fifth + 12, rootMidi + 24, fifth + 12];
      const note = pool[Math.floor(Math.random() * pool.length)];
      if (mood.texture === "pluck") this.pluck(note, humanize(), 0.5 + warmth * 0.5, warmth);
      if (mood.texture === "pulse") this.pulse(note, humanize(), warmth);
      if (mood.texture === "keys" && Math.random() < 0.6) this.keys(note, humanize(), 0.9, warmth);
    }
    if (mood.texture === "pad" && inBar === 8 && Math.random() < 0.5) {
      this.pluck(rootMidi + 24, humanize(), 1.4, warmth);
    }

    // ---- drums -------------------------------------------------------------
    if (!mood.drums) return;
    if (inBar === 0 || inBar === 8 || (inBar === 14 && Math.random() < 0.3)) this.kick(time);
    if (inBar === 4 || inBar === 12) this.snare(time);
    if (inBar % 2 === 0 && Math.random() < 0.55 + density * 0.4) this.hat(time, inBar % 4 === 2 ? 0.16 : 0.09);
  }

  /* ----------------------------------------------------------------------- */
  /*  voices                                                                 */
  /* ----------------------------------------------------------------------- */

  private env(time: number, attack: number, decay: number, peak: number) {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
    return { gain, release: time + attack + decay };
  }

  private route(node: AudioNode, wetAmount: number) {
    node.connect(this.dry!);
    if (wetAmount > 0) {
      const send = this.ctx!.createGain();
      send.gain.value = wetAmount;
      node.connect(send);
      send.connect(this.reverb!);
    }
  }

  private pad(notes: number[], time: number, dur: number, warmth: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 700 + warmth * 1500;
    filter.Q.value = 0.6;
    const { gain } = this.env(time, dur * 0.35, dur * 0.8, 0.06);
    filter.connect(gain);
    this.route(gain, 0.55);
    notes.forEach((note, i) => {
      [-4, 4].forEach((detune) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "triangle" : "sawtooth";
        osc.frequency.value = midiToFreq(note);
        osc.detune.value = detune + (Math.random() - 0.5) * 6;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 0.5 : 0.22;
        osc.connect(g);
        g.connect(filter);
        osc.start(time);
        osc.stop(time + dur * 1.25);
      });
    });
  }

  private keys(note: number, time: number, dur: number, warmth: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = midiToFreq(note);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800 + warmth * 1600, time);
    filter.frequency.exponentialRampToValueAtTime(700, time + dur);
    const { gain } = this.env(time, 0.012, dur * 0.7, 0.09);
    osc.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.32);
    osc.start(time);
    osc.stop(time + dur);
  }

  private pluck(note: number, time: number, dur: number, warmth: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = midiToFreq(note);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600 + warmth * 1200, time);
    filter.frequency.exponentialRampToValueAtTime(900, time + dur * 0.6);
    const { gain } = this.env(time, 0.008, dur, 0.11);
    osc.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.4);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private pulse(note: number, time: number, warmth: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = midiToFreq(note);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000 + warmth * 1400, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.22);
    const { gain } = this.env(time, 0.005, 0.24, 0.055);
    osc.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.25);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private bass(note: number, time: number, dur: number, warmth: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = midiToFreq(note);
    const sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = midiToFreq(note - 12);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320 + warmth * 200;
    const { gain } = this.env(time, 0.015, dur, 0.18);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    osc.connect(filter);
    sub.connect(subGain);
    subGain.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.06);
    osc.start(time);
    sub.start(time);
    osc.stop(time + dur + 0.1);
    sub.stop(time + dur + 0.1);
  }

  private kick(time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(48, time + 0.14);
    const { gain } = this.env(time, 0.004, 0.3, 0.34);
    osc.connect(gain);
    this.route(gain, 0.1);
    osc.start(time);
    osc.stop(time + 0.36);
  }

  private snare(time: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1900;
    filter.Q.value = 0.8;
    const { gain } = this.env(time, 0.002, 0.16, 0.1);
    src.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.35);
    src.start(time);
    src.stop(time + 0.2);
  }

  private hat(time: number, peak: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7200;
    const { gain } = this.env(time, 0.001, 0.05, peak);
    src.connect(filter);
    filter.connect(gain);
    this.route(gain, 0.06);
    src.start(time);
    src.stop(time + 0.09);
  }
}

export const engine = new VibeEngine();
