import type { Attackable } from './Attackable';
import { Enemy } from '../enemies/Enemy';
import type { Player } from '../player/Player';

export class CombatManager {

  update(
    delta: number,
    enemies: Set<Enemy>,
    targets: Iterable<Attackable>,
    player: Player,
    lureTargets: Iterable<Attackable & { lureRadius: number }> = []
  ): Enemy[] {
    const deadEnemies: Enemy[] = [];
    const targetArray = Array.from(targets).filter((t) => t.healthPoints > 0);
    const lureTargetArray = Array.from(lureTargets).filter((t) => t.healthPoints > 0);

    for (const enemy of enemies) {
      const currentTarget = enemy.getAttackTarget();
      const lureTarget = this.findNearestLureTarget(enemy, lureTargetArray);

      if (lureTarget && currentTarget !== lureTarget) {
        enemy.setTarget(lureTarget.sprite.x, lureTarget.sprite.y);
        enemy.setAttackTarget(lureTarget);
      } else if (currentTarget && lureTargetArray.includes(currentTarget as Attackable & { lureRadius: number }) && currentTarget !== lureTarget) {
        enemy.clearTarget();
      }

      if (enemy.needsTarget()) {
        const target = this.findBestTarget(enemy, targetArray, player, lureTargetArray);
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
    player: Player,
    lureTargets: Array<Attackable & { lureRadius: number }>
  ): Attackable | null {
    const lureTarget = this.findNearestLureTarget(enemy, lureTargets);
    if (lureTarget) return lureTarget;

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

  private findNearestLureTarget(
    enemy: Enemy,
    lureTargets: Array<Attackable & { lureRadius: number }>
  ): Attackable | null {
    let bestTarget: Attackable | null = null;
    let minDistance = Infinity;

    for (const target of lureTargets) {
      const distance = this.getDistance(
        enemy.sprite.x, enemy.sprite.y,
        target.sprite.x, target.sprite.y
      );
      if (distance <= target.lureRadius && distance < minDistance) {
        minDistance = distance;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }
}
