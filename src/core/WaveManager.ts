import { eventBus } from './EventBus';
import { settings } from './Settings';

export type GamePhase = 'gathering' | 'building' | 'wave' | 'boss' | 'gameover' | 'victory';

export const MAX_WAVES = 6;

export class WaveManager {
  private currentWave: number = 0;
  private currentPhase: GamePhase = 'gathering';
  private phaseTimer: number = 0;
  
  private gatheringDuration: number = 30000;
  private buildingDuration: number = 30000;
  private waveDuration: number = 60000;
  
  private enemiesCount: number = 10;
  private maxWaves: number = MAX_WAVES;
  
  private baseWaveDuration: number = 60000;
  private waveMultiplier: number = 1.1;
  private armageddon = false;

  constructor() {
    this.startPhase('gathering');
  }

  public enableArmageddon(): void {
    this.armageddon = true;
    this.startPhase('wave');
  }

  public update(delta: number): void {
    this.phaseTimer += delta;

    const duration = this.getCurrentPhaseDuration();
    
    if (this.phaseTimer >= duration) {
      this.phaseTimer = 0;
      this.transitionToNextPhase();
    }

    
    eventBus.emit('wave-update', {
      phase: this.currentPhase,
      waveNumber: this.currentWave,
      timeLeft: Math.max(0, duration - this.phaseTimer),
      waveDuration: duration,
      enemiesInWave: this.enemiesCount
    });
  }

  public completeWave(): void {
    if (this.currentPhase !== 'wave') return;

    this.transitionToNextPhase();
    const duration = this.getCurrentPhaseDuration();

    eventBus.emit('wave-update', {
      phase: this.currentPhase,
      waveNumber: this.currentWave,
      timeLeft: duration,
      waveDuration: duration,
      enemiesInWave: this.enemiesCount
    });
  }

  public skipPreparationPhase(): boolean {
    if (this.currentPhase !== 'gathering' && this.currentPhase !== 'building') return false;

    this.startPhase('wave');
    const duration = this.getCurrentPhaseDuration();

    eventBus.emit('wave-update', {
      phase: this.currentPhase,
      waveNumber: this.currentWave,
      timeLeft: duration,
      waveDuration: duration,
      enemiesInWave: this.enemiesCount
    });

    return true;
  }

  private startPhase(phase: GamePhase): void {
    this.currentPhase = phase;
    this.phaseTimer = 0;

    if (phase === 'wave') {
      this.currentWave++;
      this.calculateWaveParams();
    }
  }

  private calculateWaveParams(): void {
    const base = 10 + (this.currentWave - 1) * 3;
    const difficulty = settings.get().difficulty;
    let bonus = 0;
    if (difficulty === 'normal') {
      bonus = this.currentWave * 5;
    } else if (difficulty === 'hard') {
      bonus = this.currentWave * 10;
    }
    this.enemiesCount = base + bonus;

    if (this.armageddon) {
      this.enemiesCount = 50 + this.currentWave * 20;
      this.waveDuration = 120000;
      return;
    }

    const difficultyDurationMultiplier = difficulty === 'hard' ? 1.3 : difficulty === 'normal' ? 1.15 : 1.0;
    this.waveDuration = Math.floor(
      this.baseWaveDuration * Math.pow(this.waveMultiplier, this.currentWave - 1) * difficultyDurationMultiplier
    );
  }

  private transitionToNextPhase(): void {
    switch (this.currentPhase) {
      case 'gathering':
        this.startPhase('building');
        break;
      case 'building':
        this.startPhase('wave');
        break;
      case 'wave':
        if (this.armageddon) {
          this.startPhase('wave');
        } else if (this.currentWave >= this.maxWaves) {
          this.startPhase('victory');
        } else {
          this.startPhase('gathering');
        }
        break;
      case 'boss':
      case 'gameover':
      case 'victory':
        
        break;
    }
  }

  private getCurrentPhaseDuration(): number {
    switch (this.currentPhase) {
      case 'gathering':
        return this.gatheringDuration;
      case 'building':
        return this.buildingDuration;
      case 'wave':
        return this.waveDuration;
      default:
        return 0;
    }
  }

  public getEnemiesForWave(): number {
    return this.enemiesCount;
  }

  public getWaveDuration(): number {
    return this.waveDuration;
  }

  public getCurrentWave(): number {
    return this.currentWave;
  }

  public getPhase(): GamePhase {
    return this.currentPhase;
  }

  public getPhaseProgress(): number {
    return Math.min(1, this.phaseTimer / this.getCurrentPhaseDuration());
  }

  public transitionToBoss(): void {
    this.startPhase('boss');
  }

  public setGameOver(): void {
    this.currentPhase = 'gameover';
  }

  public setVictory(): void {
    this.currentPhase = 'victory';
  }
}

