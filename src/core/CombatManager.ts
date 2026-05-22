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
    const targetArray = Array.from(targets).filter((t) => t.healthPoints > 0);
    const collisionTargets = player.healthPoints > 0 ? [...targetArray, player] : targetArray;

    for (const enemy of enemies) {
      enemy.setCollisionTargets(collisionTargets);

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
    const aliveTargets = targets.filter((t) => t.healthPoints > 0);
    const blockerToBase = this.findBlockerOnPath(enemy, player, aliveTargets);

    if (blockerToBase) {
      return blockerToBase;
    }

    if (player.healthPoints > 0) {
      return player;
    }

    let bestTarget: Attackable | null = null;
    let minDistance = Infinity;

    for (const target of aliveTargets) {
      const distance = this.getDistance(
        enemy.sprite.x, enemy.sprite.y,
        target.sprite.x, target.sprite.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  private findBlockerOnPath(
    enemy: Enemy,
    player: Player,
    targets: Attackable[]
  ): Attackable | null {
    const ex = enemy.sprite.x;
    const ey = enemy.sprite.y;
    const px = player.sprite.x;
    const py = player.sprite.y;

    let nearest: Attackable | null = null;
    let nearestDist = Infinity;

    for (const target of targets) {
      const tx = target.sprite.x;
      const ty = target.sprite.y;
      const radius = Math.max(target.sprite.displayWidth, target.sprite.displayHeight) * 0.4;
      const segDist = this.distancePointToSegment(tx, ty, ex, ey, px, py);

      if (segDist > radius) continue;

      const dToEnemy = this.getDistance(ex, ey, tx, ty);
      if (dToEnemy < nearestDist) {
        nearestDist = dToEnemy;
        nearest = target;
      }
    }

    return nearest;
  }

  private distancePointToSegment(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const lenSq = vx * vx + vy * vy;
    if (lenSq <= 0.0001) return this.getDistance(px, py, x1, y1);

    const t = Phaser.Math.Clamp((wx * vx + wy * vy) / lenSq, 0, 1);
    const projX = x1 + t * vx;
    const projY = y1 + t * vy;
    return this.getDistance(px, py, projX, projY);
  }
}
