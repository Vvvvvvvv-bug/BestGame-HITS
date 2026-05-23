type SettingsListener = (settings: GameSettings) => void;

export interface GameSettings {
  sfxVolume: number; 
  musicVolume: number; 
  graphicsQuality: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'normal' | 'hard';
}

const DEFAULTS: GameSettings = {
  sfxVolume: 1,
  musicVolume: 1,
  graphicsQuality: 'high',
  difficulty: 'normal',
};

class SettingsStore {
  private values: GameSettings = { ...DEFAULTS };
  private listeners: SettingsListener[] = [];

  public get(): GameSettings {
    return { ...this.values };
  }

  public setSfxVolume(v: number): void {
    this.values.sfxVolume = Math.max(0, Math.min(1, v));
    this.notify();
  }

  public setMusicVolume(v: number): void {
    this.values.musicVolume = Math.max(0, Math.min(1, v));
    this.notify();
  }

  public setGraphicsQuality(q: GameSettings['graphicsQuality']): void {
    this.values.graphicsQuality = q;
    this.notify();
  }

  public setDifficulty(d: GameSettings['difficulty']): void {
    this.values.difficulty = d;
    this.notify();
  }

  public subscribe(cb: SettingsListener): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    const snapshot = this.get();
    for (const cb of this.listeners) cb(snapshot);
  }
}

export const settings = new SettingsStore();
