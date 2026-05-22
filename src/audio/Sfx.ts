import Phaser from 'phaser';

type SfxType =
  | 'ui-click'
  | 'ui-deny'
  | 'build'
  | 'unlock'
  | 'turret-shot'
  | 'explosion'
  | 'enemy-hit'
  | 'enemy-death'
  | 'enemy-attack'
  | 'enemy-roar'
  | 'enemy-chitter'
  | 'phase-wave';

function getContext(scene: Phaser.Scene): AudioContext | null {
  const soundManager = scene.sound as Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  if (!('context' in soundManager) || !soundManager.context) return null;
  return soundManager.context as AudioContext;
}

function tone(
  scene: Phaser.Scene,
  frequency: number,
  durationMs: number,
  volume = 0.035,
  type: OscillatorType = 'triangle'
): void {
  const context = getContext(scene);
  if (!context) return;

  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

function sweep(
  scene: Phaser.Scene,
  startHz: number,
  endHz: number,
  durationMs: number,
  volume = 0.04,
  type: OscillatorType = 'sawtooth'
): void {
  const context = getContext(scene);
  if (!context) return;

  const now = context.currentTime;
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startHz, now);
  osc.frequency.exponentialRampToValueAtTime(endHz, now + durationMs / 1000);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export interface CryoBeamSound {
  setActive(active: boolean): void;
  destroy(): void;
}

/**
 * Постоянный «бззз» крио-луча: низкая пила + квадрат-гармоника играют непрерывно,
 * громкость гейтится setActive (плавный фейд, без щелчков). Один на турель.
 */
export function createCryoBeam(scene: Phaser.Scene): CryoBeamSound {
  const context = getContext(scene);
  if (!context) {
    return { setActive() {}, destroy() {} };
  }

  const osc = context.createOscillator();
  const harm = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  // Мягкий низкий гул вместо резкой пилы: синус + тихая треугольная гармоника,
  // через lowpass, чтобы срезать высокие «царапающие» частоты.
  osc.type = 'sine';
  osc.frequency.value = 96;
  harm.type = 'triangle';
  harm.frequency.value = 144; // лёгкая расстройка для живости, но без резкости
  filter.type = 'lowpass';
  filter.frequency.value = 380;
  gain.gain.value = 0.0001;
  osc.connect(filter);
  harm.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  osc.start();
  harm.start();

  let active = false;
  return {
    setActive(a: boolean) {
      if (a === active) return;
      active = a;
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(a ? 0.01 : 0.0001, now + 0.12);
    },
    destroy() {
      try {
        osc.stop();
        harm.stop();
      } catch {
        /* уже остановлены */
      }
      gain.disconnect();
    },
  };
}

export function playSfx(scene: Phaser.Scene, type: SfxType): void {
  switch (type) {
    case 'ui-click':
      tone(scene, 760, 65, 0.03, 'square');
      break;
    case 'ui-deny':
      tone(scene, 210, 85, 0.035, 'sawtooth');
      break;
    case 'build':
      tone(scene, 320, 70, 0.032, 'triangle');
      tone(scene, 480, 95, 0.025, 'triangle');
      break;
    case 'unlock':
      tone(scene, 520, 70, 0.03, 'square');
      tone(scene, 700, 90, 0.026, 'square');
      break;
    case 'turret-shot':
      sweep(scene, 1500, 420, 85, 0.032, 'square');
      tone(scene, 860, 60, 0.02, 'triangle');
      break;
    case 'explosion':
      tone(scene, 110, 120, 0.055, 'sawtooth');
      tone(scene, 80, 180, 0.04, 'triangle');
      break;
    case 'enemy-hit':
      tone(scene, 260, 45, 0.02, 'sawtooth');
      break;
    case 'enemy-death':
      tone(scene, 240, 70, 0.028, 'sawtooth');
      tone(scene, 150, 110, 0.02, 'triangle');
      break;
    case 'enemy-attack':
      tone(scene, 180, 70, 0.03, 'sawtooth');
      tone(scene, 130, 90, 0.022, 'triangle');
      break;
    case 'enemy-roar':
      sweep(scene, 300, 160, 170, 0.02, 'triangle');
      tone(scene, 140, 120, 0.014, 'triangle');
      break;
    case 'enemy-chitter':
      tone(scene, 980, 45, 0.012, 'square');
      tone(scene, 1220, 38, 0.01, 'square');
      tone(scene, 860, 42, 0.01, 'square');
      break;
    case 'phase-wave':
      tone(scene, 420, 100, 0.03, 'square');
      tone(scene, 560, 130, 0.028, 'square');
      break;
  }
}
