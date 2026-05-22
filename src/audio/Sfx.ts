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
  | 'phase-wave';

function tone(
  scene: Phaser.Scene,
  frequency: number,
  durationMs: number,
  volume = 0.035,
  type: OscillatorType = 'triangle'
): void {
  const soundManager = scene.sound as Phaser.Sound.NoAudioSoundManager | Phaser.Sound.HTML5AudioSoundManager | Phaser.Sound.WebAudioSoundManager;
  if (!('context' in soundManager) || !soundManager.context) return;
  const context = soundManager.context as AudioContext;

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
      tone(scene, 980, 45, 0.022, 'square');
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
    case 'phase-wave':
      tone(scene, 420, 100, 0.03, 'square');
      tone(scene, 560, 130, 0.028, 'square');
      break;
  }
}
