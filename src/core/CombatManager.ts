import type { Attackable } from './Attackable';
import { Enemy } from '../enemies/Enemy';
import type { Player } from '../player/Player';

export class CombatManager {

  update(
    delta: number,
    enemies: Set<Enemy>,
    targets: Iterable<Attackable>,
    player: Player
  ): Enemy[] {
    const deadEnemies: Enemy[] = [];
    const targetArray = Array.from(targets);

    for (const enemy of enemies) {
      if (enemy.needsTarget()) {
        const target = this.findBestTarget(enemy, targetArray, player);
        if (target) {
          if (target === player) {
            enemy.setTarget(player.sprite.x, player.sprite.y);
          } else {
            enemy.setTarget(target.sprite.x, target.sprite.y);
          }
          enemy.setAttackTarget(target);
        }
      }

      enemy.update(delta);
      if (enemy.healthPoints <= 0) {
        deadEnemies.push(enemy);
      }
    }

    return deadEnemies;
  }

  private findBestTarget(
    enemy: Enemy,
    targets: Attackable[],
    player: Player
  ): Attackable | null {
    let bestTarget: Attackable | null = null;
    let minDistance = Infinity;

    for (const target of targets) {
      const distance = this.getDistance(
        enemy.sprite.x, enemy.sprite.y,
        target.sprite.x, target.sprite.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestTarget = target;
      }
    }

    const playerDist = this.getDistance(
      enemy.sprite.x, enemy.sprite.y,
      player.sprite.x, player.sprite.y
    );

    return playerDist < (minDistance === Infinity ? Infinity : minDistance)
      ? player
      : bestTarget;
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
}
