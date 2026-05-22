export interface Attackable {
    sprite: Phaser.GameObjects.Sprite;
    healthPoints: number;
    takeDamage(amount: number): boolean;
    destroy(): void;
}
