type EventMap = {
  'resource-mined': { type: 'iron' | 'stone'; amount: number };
  'wave-update': {
    phase: 'gathering' | 'building' | 'wave' | 'boss' | 'gameover' | 'victory';
    waveNumber: number;
    timeLeft: number;
    waveDuration: number;
    enemiesInWave: number;
  };
  'enemies-remaining-update': { enemiesRemaining: number };
};

class EventBus {
  private listeners: {
    [K in keyof EventMap]?: Array<(payload: EventMap[K]) => void>;
  } = {};

  on<K extends keyof EventMap>(
    event: K,
    callback: (payload: EventMap[K]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  off<K extends keyof EventMap>(
    event: K,
    callback: (payload: EventMap[K]) => void
  ): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      this.listeners[event] = callbacks.filter((cb) => cb !== callback) as typeof callbacks;
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const callbacks = this.listeners[event];
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  }
}

export const eventBus = new EventBus();
