export type GameMode = 'normal' | 'armageddon';

export function setGameMode(mode: GameMode): void {
  (window as unknown as Record<string, unknown>).__gameMode = mode;
}

export function getGameMode(): GameMode {
  return ((window as unknown as Record<string, unknown>).__gameMode as GameMode) ?? 'normal';
}

export function setArmageddonMusic(track: string): void {
  (window as unknown as Record<string, unknown>).__armageddonMusic = track;
}

export function getArmageddonMusic(): string {
  return ((window as unknown as Record<string, unknown>).__armageddonMusic as string) ?? 'крутая';
}
