// Web Audio API wrapper with fallback to actual audio assets

import { siteAssetUrl } from './siteAssets';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let humOscillators: OscillatorNode[] = [];
let humGain: GainNode | null = null;
let humFilter: BiquadFilterNode | null = null;
let worldAmbienceGain: GainNode | null = null;
let worldAmbienceOscillators: OscillatorNode[] = [];
let worldNoiseSource: AudioBufferSourceNode | null = null;
let worldBeepOscillators = new Set<OscillatorNode>();
let worldAmbienceTimer: number | null = null;
let worldAmbienceRequested = false;
let worldAudioUnlockHandler: (() => void) | null = null;
let lastUiHoverSoundAt = 0;
let lastUiSelectSoundAt = 0;
let backgroundMusicRequested = false;
let backgroundMusicUnlockHandler: (() => void) | null = null;
let backgroundMusicElement: HTMLAudioElement | null = null;
let backgroundMusicVolume = 0.1;
let backgroundMusicVolumeHydrated = false;
let backgroundMusicFadeFrame: number | null = null;
const TITLE_LOGO_REVEAL_URL = siteAssetUrl('assets/audio/title-logo-reveal.mp3');
const TITLE_START_IMPACT_URL = siteAssetUrl('assets/audio/title-start-impact.mp3');
const BACKGROUND_MUSIC_FILE_URL = siteAssetUrl('assets/audio/mandatum-cinematic-bgm.mp3');
const BACKGROUND_MUSIC_FILE_OUTPUT = 0.52;
let titleRevealBuffersPromise: Promise<[AudioBuffer, AudioBuffer]> | null = null;

export const BACKGROUND_MUSIC_STATE_EVENT = 'mandatum:bgm-state';

function emitBackgroundMusicState() {
  window.dispatchEvent(new CustomEvent(BACKGROUND_MUSIC_STATE_EVENT, {
    detail: {
      enabled: backgroundMusicRequested,
      volume: backgroundMusicVolume,
    },
  }));
}

function hydrateBackgroundMusicVolume() {
  if (backgroundMusicVolumeHydrated) return;
  backgroundMusicVolumeHydrated = true;
  try {
    const storedValue = window.localStorage.getItem('mandatum_cinematic_bgm_volume');
    if (storedValue === null) return;
    const storedVolume = Number(storedValue);
    if (Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 1) {
      backgroundMusicVolume = storedVolume;
    }
  } catch {}
}

function isBackgroundMusicMuted() {
  try {
    return window.localStorage.getItem('mandatum_cinematic_bgm_muted') === 'true';
  } catch {
    return false;
  }
}

function getBackgroundMusicOutput() {
  return Math.min(1, BACKGROUND_MUSIC_FILE_OUTPUT * backgroundMusicVolume);
}

function cancelBackgroundMusicFade() {
  if (backgroundMusicFadeFrame === null) return;
  window.cancelAnimationFrame(backgroundMusicFadeFrame);
  backgroundMusicFadeFrame = null;
}

function fadeBackgroundMusicTo(targetVolume: number, durationMs: number) {
  if (!backgroundMusicElement) return;
  cancelBackgroundMusicFade();
  const music = backgroundMusicElement;
  const initialVolume = music.volume;
  const startedAt = performance.now();

  const updateVolume = (timestamp: number) => {
    const progress = Math.min(1, (timestamp - startedAt) / Math.max(1, durationMs));
    const easedProgress = progress * progress * (3 - 2 * progress);
    music.volume = Math.min(1, Math.max(
      0,
      initialVolume + (targetVolume - initialVolume) * easedProgress,
    ));
    if (progress < 1 && backgroundMusicRequested) {
      backgroundMusicFadeFrame = window.requestAnimationFrame(updateVolume);
    } else {
      backgroundMusicFadeFrame = null;
    }
  };

  backgroundMusicFadeFrame = window.requestAnimationFrame(updateVolume);
}

function ensureBackgroundMusicElement() {
  if (backgroundMusicElement) return backgroundMusicElement;
  const element = new Audio(BACKGROUND_MUSIC_FILE_URL);
  element.loop = true;
  element.preload = 'auto';
  element.volume = 0;
  backgroundMusicElement = element;
  return element;
}

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.25; // 0.20 ~ 0.28
    masterGain.connect(audioContext.destination);
  }
}

function scheduleUiHoverTick(startTime: number) {
  if (!audioContext || !masterGain) return;
  const duration = 0.026;
  const bufferLength = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < bufferLength; index += 1) {
    const envelope = Math.exp(-index / Math.max(1, bufferLength * 0.16));
    samples[index] = (Math.random() * 2 - 1) * envelope;
  }

  const relay = audioContext.createBufferSource();
  const relayFilter = audioContext.createBiquadFilter();
  const relayGain = audioContext.createGain();
  relay.buffer = buffer;
  relayFilter.type = 'bandpass';
  relayFilter.frequency.value = 2_850;
  relayFilter.Q.value = 1.7;
  relayGain.gain.value = 0.095;
  relay.connect(relayFilter);
  relayFilter.connect(relayGain);
  relayGain.connect(masterGain);
  relay.start(startTime);

  const dataTick = audioContext.createOscillator();
  const dataFilter = audioContext.createBiquadFilter();
  const dataGain = audioContext.createGain();
  dataTick.type = 'square';
  dataTick.frequency.setValueAtTime(2_360, startTime);
  dataTick.frequency.exponentialRampToValueAtTime(1_540, startTime + 0.018);
  dataFilter.type = 'lowpass';
  dataFilter.frequency.value = 3_100;
  dataGain.gain.setValueAtTime(0.038, startTime);
  dataGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.022);
  dataTick.connect(dataFilter);
  dataFilter.connect(dataGain);
  dataGain.connect(masterGain);
  dataTick.start(startTime);
  dataTick.stop(startTime + 0.024);
}

function scheduleUiSelectionTick(startTime: number) {
  if (!audioContext || !masterGain) return;
  const duration = 0.086;
  const bufferLength = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const samples = buffer.getChannelData(0);
  let previousNoise = 0;
  for (let index = 0; index < bufferLength; index += 1) {
    const progress = index / bufferLength;
    const gate = progress < 0.18 || (progress > 0.42 && progress < 0.64) ? 1 : 0.16;
    const noise = Math.random() * 2 - 1;
    samples[index] = (noise - previousNoise * 0.72) * gate * Math.exp(-progress * 2.1);
    previousNoise = noise;
  }

  const packet = audioContext.createBufferSource();
  const packetFilter = audioContext.createBiquadFilter();
  const packetGain = audioContext.createGain();
  packet.buffer = buffer;
  packetFilter.type = 'bandpass';
  packetFilter.frequency.setValueAtTime(3_400, startTime);
  packetFilter.frequency.exponentialRampToValueAtTime(1_180, startTime + duration);
  packetFilter.Q.value = 1.25;
  packetGain.gain.setValueAtTime(0.13, startTime);
  packetGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  packet.connect(packetFilter);
  packetFilter.connect(packetGain);
  packetGain.connect(masterGain);
  packet.start(startTime);

  const decoder = audioContext.createOscillator();
  const decoderFilter = audioContext.createBiquadFilter();
  const decoderGain = audioContext.createGain();
  decoder.type = 'square';
  decoder.frequency.setValueAtTime(1_310, startTime);
  decoder.frequency.setValueAtTime(910, startTime + 0.019);
  decoder.frequency.setValueAtTime(1_070, startTime + 0.043);
  decoderFilter.type = 'lowpass';
  decoderFilter.frequency.value = 2_200;
  decoderGain.gain.setValueAtTime(0.052, startTime);
  decoderGain.gain.setValueAtTime(0.028, startTime + 0.02);
  decoderGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.074);
  decoder.connect(decoderFilter);
  decoderFilter.connect(decoderGain);
  decoderGain.connect(masterGain);
  decoder.start(startTime);
  decoder.stop(startTime + 0.078);

  const relayBody = audioContext.createOscillator();
  const relayBodyGain = audioContext.createGain();
  relayBody.type = 'sine';
  relayBody.frequency.setValueAtTime(148, startTime);
  relayBody.frequency.exponentialRampToValueAtTime(106, startTime + 0.065);
  relayBodyGain.gain.setValueAtTime(0.058, startTime);
  relayBodyGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.07);
  relayBody.connect(relayBodyGain);
  relayBodyGain.connect(masterGain);
  relayBody.start(startTime);
  relayBody.stop(startTime + 0.075);
}

export function playUiHoverSound() {
  const now = performance.now();
  if (now - lastUiHoverSoundAt < 45) return;
  lastUiHoverSoundAt = now;
  initAudio();
  if (!audioContext || audioContext.state !== 'running') return;
  scheduleUiHoverTick(audioContext.currentTime);
}

export async function playUiSelectSound() {
  const now = performance.now();
  if (now - lastUiSelectSoundAt < 75) return;
  lastUiSelectSoundAt = now;
  initAudio();
  if (!audioContext) return;
  if (audioContext.state === 'suspended') {
    try { await audioContext.resume(); } catch {}
  }
  if (audioContext.state !== 'running') return;
  scheduleUiSelectionTick(audioContext.currentTime);
}

async function playBuffer(url: string, volume = 1) {
  if (!audioContext || !masterGain) return false;
  try {
    const response = await fetch(url);
    if (!response.ok) return false;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    const gain = audioContext.createGain();
    gain.gain.value = volume;
    
    source.connect(gain);
    gain.connect(masterGain);
    
    source.start(0);
    return true;
  } catch (e) {
    return false;
  }
}

async function loadTitleRevealBuffers() {
  if (!audioContext) return null;
  if (!titleRevealBuffersPromise) {
    const context = audioContext;
    titleRevealBuffersPromise = Promise.all(
      [TITLE_LOGO_REVEAL_URL, TITLE_START_IMPACT_URL].map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to load title sound: ${url}`);
        return context.decodeAudioData(await response.arrayBuffer());
      }),
    ).then(
      ([logoReveal, startImpact]) => [logoReveal, startImpact] as [AudioBuffer, AudioBuffer],
    );
    titleRevealBuffersPromise.catch(() => {
      titleRevealBuffersPromise = null;
    });
  }
  return titleRevealBuffersPromise;
}

function scheduleCinematicAsset(
  buffer: AudioBuffer,
  targetTime: number,
  volume: number,
  maximumDuration: number,
) {
  if (!audioContext || !masterGain) return;

  const startTime = Math.max(targetTime, audioContext.currentTime + 0.015);
  const offset = Math.max(0, startTime - targetTime);
  const duration = Math.min(buffer.duration - offset, maximumDuration - offset);
  if (duration <= 0.05) return;

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const fadeInEnd = startTime + Math.min(0.035, duration * 0.2);
  const fadeOutStart = startTime + Math.max(0.05, duration - 0.55);
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, fadeInEnd);
  gain.gain.setValueAtTime(volume, fadeOutStart);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(gain);
  gain.connect(masterGain);
  source.start(startTime, offset, duration);
}

function scheduleSubtitleSlideSound(startTime: number) {
  if (!audioContext || !masterGain) return;

  const duration = 0.78;
  const bufferLength = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, bufferLength, audioContext.sampleRate);
  const noiseData = buffer.getChannelData(0);
  let softenedNoise = 0;
  for (let index = 0; index < bufferLength; index += 1) {
    const progress = index / bufferLength;
    softenedNoise += ((Math.random() * 2 - 1) - softenedNoise) * 0.24;
    noiseData[index] = softenedNoise * Math.sin(Math.PI * progress);
  }

  const sweep = audioContext.createBufferSource();
  const sweepFilter = audioContext.createBiquadFilter();
  const sweepGain = audioContext.createGain();
  const sweepPan = audioContext.createStereoPanner();
  sweep.buffer = buffer;
  sweepFilter.type = 'bandpass';
  sweepFilter.frequency.setValueAtTime(520, startTime);
  sweepFilter.frequency.exponentialRampToValueAtTime(2_150, startTime + 0.52);
  sweepFilter.frequency.exponentialRampToValueAtTime(980, startTime + duration);
  sweepFilter.Q.value = 0.72;
  sweepGain.gain.setValueAtTime(0.0001, startTime);
  sweepGain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.18);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  sweepPan.pan.setValueAtTime(-0.52, startTime);
  sweepPan.pan.linearRampToValueAtTime(0.52, startTime + duration);
  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(sweepPan);
  sweepPan.connect(masterGain);
  sweep.start(startTime);
  sweep.stop(startTime + duration);

  const glide = audioContext.createOscillator();
  const glideGain = audioContext.createGain();
  glide.type = 'sine';
  glide.frequency.setValueAtTime(196, startTime);
  glide.frequency.exponentialRampToValueAtTime(349.23, startTime + 0.58);
  glideGain.gain.setValueAtTime(0.0001, startTime);
  glideGain.gain.exponentialRampToValueAtTime(0.055, startTime + 0.16);
  glideGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.72);
  glide.connect(glideGain);
  glideGain.connect(masterGain);
  glide.start(startTime);
  glide.stop(startTime + 0.75);
}

export async function playTitleRevealSequence() {
  initAudio();
  if (!audioContext || !masterGain) return;

  if (audioContext.state === 'suspended') {
    try { await audioContext.resume(); } catch {}
  }
  if (audioContext.state !== 'running') return;

  const sequenceStart = audioContext.currentTime;
  scheduleSubtitleSlideSound(sequenceStart + 2.7);

  try {
    const buffers = await loadTitleRevealBuffers();
    if (!buffers) return;
    scheduleCinematicAsset(buffers[0], sequenceStart + 0.8, 1.45, 3.4);
    scheduleCinematicAsset(buffers[1], sequenceStart + 2, 1.15, 2.25);
  } catch {
    // A missing asset should fail silently instead of falling back to a cheap synthesized cue.
  }
}

export async function playStartMechanical() {
  initAudio();
  if (!audioContext || !masterGain) return;
  const hasFile = await playBuffer(siteAssetUrl('assets/audio/start_mechanical.wav'));
  if (hasFile) return;

  const t = audioContext.currentTime;

  // Layer 1: Mechanical Click (short noise burst)
  const bufferSize = audioContext.sampleRate * 0.05; // 50ms
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 4000;
  
  const noiseGain = audioContext.createGain();
  noiseGain.gain.setValueAtTime(1, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start(t);

  // Layer 2: Bass Impact (sine 60-90Hz with pitch drop)
  const bass = audioContext.createOscillator();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(120, t);
  bass.frequency.exponentialRampToValueAtTime(40, t + 0.15);

  const bassGain = audioContext.createGain();
  bassGain.gain.setValueAtTime(1.5, t); // Slightly higher gain for impact
  bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

  bass.connect(bassGain);
  bassGain.connect(masterGain);
  bass.start(t);
  bass.stop(t + 0.15);
}

export async function startEngineHum() {
  initAudio();
  if (!audioContext || !masterGain) return;
  // File fallback can't easily sync progress, so we only use Web Audio for hum

  const t = audioContext.currentTime;

  humGain = audioContext.createGain();
  humGain.gain.setValueAtTime(0.01, t);
  humGain.gain.linearRampToValueAtTime(0.4, t + 1);

  humFilter = audioContext.createBiquadFilter();
  humFilter.type = 'lowpass';
  humFilter.frequency.setValueAtTime(100, t); // start low

  humGain.connect(humFilter);
  humFilter.connect(masterGain);

  humOscillators = [55, 56].map(freq => {
    const osc = audioContext!.createOscillator();
    osc.type = 'sawtooth'; // richer harmonic
    osc.frequency.value = freq;
    osc.connect(humGain!);
    osc.start();
    return osc;
  });
}

export async function playRelayTick() {
  initAudio();
  if (!audioContext || !masterGain) return;
  const hasFile = await playBuffer(siteAssetUrl('assets/audio/relay.wav'));
  if (hasFile) return;

  const t = audioContext.currentTime;
  
  const osc = audioContext.createOscillator();
  osc.type = 'square';
  // Slight random pitch for each tick
  osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.03);

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.03);
}

export function updateCoreCharge(progress: number) {
  if (!audioContext || !humFilter || !humOscillators.length) return;
  const t = audioContext.currentTime;
  
  // As progress goes from 0 to 100
  // Filter cutoff goes from 100Hz to 800Hz
  humFilter.frequency.setTargetAtTime(100 + (progress / 100) * 700, t, 0.1);
  
  // Pitch rises slightly
  humOscillators[0].frequency.setTargetAtTime(55 + (progress / 100) * 20, t, 0.1);
  humOscillators[1].frequency.setTargetAtTime(56 + (progress / 100) * 20, t, 0.1);
}

export async function playCoreLock() {
  initAudio();
  if (!audioContext || !masterGain) return;
  const hasFile = await playBuffer(siteAssetUrl('assets/audio/core_lock.wav'));
  if (hasFile) return;

  const t = audioContext.currentTime;

  // 1. Low Impact
  const bass = audioContext.createOscillator();
  bass.type = 'triangle';
  bass.frequency.setValueAtTime(80, t);
  bass.frequency.exponentialRampToValueAtTime(30, t + 0.2);
  
  const bassGain = audioContext.createGain();
  bassGain.gain.setValueAtTime(1.2, t);
  bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
  
  bass.connect(bassGain);
  bassGain.connect(masterGain);
  bass.start(t);
  bass.stop(t + 0.2);

  // 2. Metal Lock
  const lock = audioContext.createOscillator();
  lock.type = 'square';
  lock.frequency.setValueAtTime(300, t);
  
  const lockGain = audioContext.createGain();
  lockGain.gain.setValueAtTime(0.5, t);
  lockGain.gain.setTargetAtTime(0.01, t, 0.05);

  lock.connect(lockGain);
  lockGain.connect(masterGain);
  lock.start(t);
  lock.stop(t + 0.1);
}

export async function playSystemOnline() {
  initAudio();
  if (!audioContext || !masterGain) return;
  const hasFile = await playBuffer(siteAssetUrl('assets/audio/system_online.wav'));
  if (hasFile) return;

  const t = audioContext.currentTime;

  // Confirmation Chime
  const chime = audioContext.createOscillator();
  chime.type = 'sine';
  chime.frequency.setValueAtTime(440, t); // A4
  chime.frequency.setValueAtTime(554.37, t + 0.15); // C#5

  const chimeGain = audioContext.createGain();
  chimeGain.gain.setValueAtTime(0, t);
  chimeGain.gain.linearRampToValueAtTime(0.4, t + 0.05);
  chimeGain.gain.setValueAtTime(0.4, t + 0.15);
  chimeGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

  chime.connect(chimeGain);
  chimeGain.connect(masterGain);
  chime.start(t);
  chime.stop(t + 0.4);

  // Bring hum down
  if (humGain && humFilter) {
    humGain.gain.setTargetAtTime(0.2, t, 0.5);
    humFilter.frequency.setTargetAtTime(200, t, 0.5);
  }
}

export async function playRelease() {
  initAudio();
  if (!audioContext || !masterGain) return;
  const hasFile = await playBuffer(siteAssetUrl('assets/audio/release.wav'));
  if (hasFile) return;

  const t = audioContext.currentTime;

  // Servo Release / Pneumatic Hiss
  const bufferSize = audioContext.sampleRate * 0.3; 
  const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;
  
  const noiseFilter = audioContext.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2000;
  
  const noiseGain = audioContext.createGain();
  noiseGain.gain.setValueAtTime(0.2, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start(t);
}

function playWorldServerBeep(frequency: number, startTime: number, duration = 0.055) {
  if (!audioContext || !worldAmbienceGain) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.91, startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.28, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(worldAmbienceGain);
  worldBeepOscillators.add(oscillator);
  oscillator.onended = () => worldBeepOscillators.delete(oscillator);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.01);
}

function scheduleWorldServerBeep() {
  if (!worldAmbienceRequested || !audioContext || !worldAmbienceGain) return;

  const now = audioContext.currentTime + 0.03;
  const baseFrequency = 680 + Math.random() * 520;
  playWorldServerBeep(baseFrequency, now, 0.05);
  if (Math.random() > 0.42) {
    playWorldServerBeep(baseFrequency * (1.22 + Math.random() * 0.18), now + 0.13, 0.045);
  }

  worldAmbienceTimer = window.setTimeout(
    scheduleWorldServerBeep,
    4_200 + Math.random() * 4_800,
  );
}

function beginWorldServerAmbience() {
  if (
    !worldAmbienceRequested
    || !audioContext
    || !masterGain
    || worldAmbienceGain
  ) return;

  const now = audioContext.currentTime;
  worldAmbienceGain = audioContext.createGain();
  worldAmbienceGain.gain.setValueAtTime(0.0001, now);
  worldAmbienceGain.gain.exponentialRampToValueAtTime(0.35, now + 0.6);
  worldAmbienceGain.connect(masterGain);

  const toneGain = audioContext.createGain();
  const toneFilter = audioContext.createBiquadFilter();
  toneGain.gain.value = 0.045;
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 310;
  toneFilter.Q.value = 0.8;
  toneGain.connect(toneFilter);
  toneFilter.connect(worldAmbienceGain);

  worldAmbienceOscillators = [43, 86].map((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    oscillator.type = index === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 0 ? -4 : 5;
    oscillator.connect(toneGain);
    oscillator.start();
    return oscillator;
  });

  const noiseLength = Math.floor(audioContext.sampleRate * 1.5);
  const noiseBuffer = audioContext.createBuffer(1, noiseLength, audioContext.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < noiseLength; index += 1) {
    noiseData[index] = Math.random() * 2 - 1;
  }

  const noiseFilter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 180;
  noiseFilter.Q.value = 0.55;
  noiseGain.gain.value = 0.035;
  worldNoiseSource = audioContext.createBufferSource();
  worldNoiseSource.buffer = noiseBuffer;
  worldNoiseSource.loop = true;
  worldNoiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(worldAmbienceGain);
  worldNoiseSource.start();

  playWorldServerBeep(920, now + 0.12, 0.055);
  playWorldServerBeep(1_240, now + 0.25, 0.045);
  playWorldServerBeep(720, now + 0.49, 0.065);
  worldAmbienceTimer = window.setTimeout(scheduleWorldServerBeep, 5_600);
}

export async function startWorldServerAmbience() {
  worldAmbienceRequested = true;
  initAudio();
  if (!audioContext) return;

  if (audioContext.state === 'suspended') {
    if (!worldAudioUnlockHandler) {
      worldAudioUnlockHandler = () => {
        if (!audioContext || !worldAmbienceRequested) return;
        void audioContext.resume().then(beginWorldServerAmbience).catch(() => undefined);
        worldAudioUnlockHandler = null;
      };
      window.addEventListener('pointerdown', worldAudioUnlockHandler, { once: true });
    }
    return;
  }

  beginWorldServerAmbience();
}

export function stopWorldServerAmbience() {
  worldAmbienceRequested = false;
  if (worldAmbienceTimer !== null) {
    window.clearTimeout(worldAmbienceTimer);
    worldAmbienceTimer = null;
  }
  if (worldAudioUnlockHandler) {
    window.removeEventListener('pointerdown', worldAudioUnlockHandler);
    worldAudioUnlockHandler = null;
  }

  const activeGain = worldAmbienceGain;
  const activeOscillators = worldAmbienceOscillators;
  const activeNoise = worldNoiseSource;
  const activeBeeps = Array.from(worldBeepOscillators);
  worldAmbienceGain = null;
  worldAmbienceOscillators = [];
  worldNoiseSource = null;
  worldBeepOscillators = new Set<OscillatorNode>();

  if (activeGain && audioContext) {
    const now = audioContext.currentTime;
    activeGain.gain.cancelScheduledValues(now);
    activeGain.gain.setValueAtTime(Math.max(activeGain.gain.value, 0.0001), now);
    activeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  }

  window.setTimeout(() => {
    activeOscillators.forEach((oscillator) => {
      try { oscillator.stop(); } catch {}
    });
    activeBeeps.forEach((oscillator) => {
      try { oscillator.stop(); } catch {}
    });
    try { activeNoise?.stop(); } catch {}
    activeGain?.disconnect();
  }, 180);
}

export function getBackgroundMusicEnabled() {
  return backgroundMusicRequested;
}

export function getBackgroundMusicVolume() {
  hydrateBackgroundMusicVolume();
  return backgroundMusicVolume;
}

export function setBackgroundMusicVolume(nextVolume: number) {
  hydrateBackgroundMusicVolume();
  backgroundMusicVolume = Math.min(1, Math.max(0, nextVolume));
  try {
    window.localStorage.setItem(
      'mandatum_cinematic_bgm_volume',
      String(backgroundMusicVolume),
    );
  } catch {}

  if (backgroundMusicElement && backgroundMusicRequested) {
    fadeBackgroundMusicTo(getBackgroundMusicOutput(), 180);
  }
  emitBackgroundMusicState();
  return backgroundMusicVolume;
}

export async function startBackgroundMusic(force = false, fadeInMs = 2_400) {
  hydrateBackgroundMusicVolume();
  if (!force && isBackgroundMusicMuted()) {
    emitBackgroundMusicState();
    return false;
  }

  backgroundMusicRequested = true;
  emitBackgroundMusicState();
  const music = ensureBackgroundMusicElement();
  cancelBackgroundMusicFade();
  music.volume = 0;
  try {
    await music.play();
    fadeBackgroundMusicTo(getBackgroundMusicOutput(), fadeInMs);
    return true;
  } catch {}

  if (!backgroundMusicUnlockHandler) {
    backgroundMusicUnlockHandler = () => {
      if (!backgroundMusicRequested) return;
      const unlockedMusic = ensureBackgroundMusicElement();
      unlockedMusic.volume = 0;
      void unlockedMusic.play().then(() => {
        fadeBackgroundMusicTo(getBackgroundMusicOutput(), fadeInMs);
      }).catch(() => undefined);
      backgroundMusicUnlockHandler = null;
    };
    window.addEventListener('pointerdown', backgroundMusicUnlockHandler, { once: true });
  }
  return true;
}

export function stopBackgroundMusic(rememberMuted = false) {
  backgroundMusicRequested = false;
  if (rememberMuted) {
    try { window.localStorage.setItem('mandatum_cinematic_bgm_muted', 'true'); } catch {}
  }
  if (backgroundMusicUnlockHandler) {
    window.removeEventListener('pointerdown', backgroundMusicUnlockHandler);
    backgroundMusicUnlockHandler = null;
  }
  cancelBackgroundMusicFade();
  backgroundMusicElement?.pause();
  emitBackgroundMusicState();
}

export function toggleBackgroundMusic() {
  if (backgroundMusicRequested) {
    stopBackgroundMusic(true);
    return false;
  }
  try { window.localStorage.setItem('mandatum_cinematic_bgm_muted', 'false'); } catch {}
  void startBackgroundMusic(true, 900);
  return true;
}

export function stopAllAudio() {
  stopWorldServerAmbience();
  if (humOscillators) {
    humOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
    });
    humOscillators = [];
  }
  if (humGain && audioContext) {
    humGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
  }
}
