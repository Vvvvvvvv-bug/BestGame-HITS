import { eventBus } from './EventBus';

export type GamePhase = 'gathering' | 'building' | 'wave' | 'boss' | 'gameover' | 'victory';

export const MAX_WAVES = 6;

export class WaveManager {
  private currentWave: number = 0;
  private currentPhase: GamePhase = 'gathering';
  private phaseTimer: number = 0;
  
  private gatheringDuration: number = 30000; // 30 сек для сбора ресурсов
  private buildingDuration: number = 30000;  // 30 сек для строительства
  private waveDuration: number = 60000;      // 60 сек для волны
  
  private enemiesCount: number = 3; // Количество враго в первой волне
  private maxWaves: number = MAX_WAVES;
  
  private baseWaveDuration: number = 60000;
  private waveMultiplier: number = 1.1; // На каждую волну время +10%

  constructor() {
    this.startPhase('gathering');
  }

  public update(delta: number): void {
    this.phaseTimer += delta;

    const duration = this.getCurrentPhaseDuration();
    
    if (this.phaseTimer >= duration) {
      this.phaseTimer = 0;
      this.transitionToNextPhase();
    }

    // Отправляем событие для обновления UI
    eventBus.emit('wave-update', {
      phase: this.currentPhase,
      waveNumber: this.currentWave,
      timeLeft: Math.max(0, duration - this.phaseTimer),
      enemiesInWave: this.enemiesCount
    });
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
    // Увеличиваем параметры волны
    this.enemiesCount = Math.floor(3 + this.currentWave * 1.5);
    this.waveDuration = Math.floor(this.baseWaveDuration * Math.pow(this.waveMultiplier, this.currentWave - 1));
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
        // После волны проверяем, не последняя ли это была волна
        if (this.currentWave >= this.maxWaves) {
          this.startPhase('victory');
        } else {
          this.startPhase('gathering');
        }
        break;
      case 'boss':
      case 'gameover':
      case 'victory':
        // Игра закончилась, не переходим
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
