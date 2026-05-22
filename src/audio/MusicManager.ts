import Phaser from 'phaser';
import { settings } from '../core/Settings';

type MusicTrack = 'main' | 'victory' | 'defeat';

const TRACK_KEYS: Record<MusicTrack, string> = {
  main: 'music-main',
  victory: 'music-victory',
  defeat: 'music-defeat',
};

class MusicManager {
  private gameSound?: Phaser.Sound.BaseSoundManager;
  private current?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
  private currentKey?: string;
  private unsubscribeSettings?: () => void;

  public attach(game: Phaser.Game): void {
    this.gameSound = game.sound;
    this.unsubscribeSettings?.();
    this.unsubscribeSettings = settings.subscribe((s) => {
      this.setVolume(s.musicVolume);
    });
  }

  public play(track: MusicTrack, fadeMs = 800): void {
    if (!this.gameSound) return;
    const key = TRACK_KEYS[track];
    if (this.currentKey === key) return;

    const old = this.current;
    const oldKey = this.currentKey;

    const existing = this.asSound(this.gameSound.get(key));
    if (existing) {
      this.current = existing;
      this.currentKey = key;
      this.current.setVolume(settings.get().musicVolume);
      if (!this.current.isPlaying) this.current.play();
    } else {
      this.current = this.gameSound.add(key, { loop: true, volume: 0 }) as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;
      this.currentKey = key;
      this.current.play();
    }

    // fade in new
    if (this.current && fadeMs > 0) {
      const targetVol = settings.get().musicVolume;
      this.current.setVolume(0);
      this.fadeSound(this.current, targetVol, fadeMs);
    }

    // fade out old
    if (old && oldKey !== key) {
      if (fadeMs > 0) {
        this.fadeSound(old, 0, fadeMs, () => {
          old.stop();
          old.destroy();
        });
      } else {
        old.stop();
        old.destroy();
      }
    }
  }

  public stop(fadeMs = 800): void {
    if (!this.current) return;
    if (fadeMs > 0) {
      this.fadeSound(this.current, 0, fadeMs, () => {
        this.current?.stop();
        this.current?.destroy();
        this.current = undefined;
        this.currentKey = undefined;
      });
    } else {
      this.current.stop();
      this.current.destroy();
      this.current = undefined;
      this.currentKey = undefined;
    }
  }

  public setVolume(v: number): void {
    if (this.current && this.currentKey) {
      (this.current as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(v);
    }
  }

  private asSound(s: Phaser.Sound.BaseSound | null): Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | null {
    return s as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound | null;
  }

  private fadeSound(
    sound: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound,
    to: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const from = sound.volume;
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / duration);
      const val = from + (to - from) * t;
      sound.setVolume(val);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    requestAnimationFrame(tick);
  }
}

export const musicManager = new MusicManager();
