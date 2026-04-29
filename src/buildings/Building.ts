export abstract class Building{
    sprite: Phaser.GameObjects.Rectangle;
    gridX: number;
    gridY: number;

    constructor(scene: Phaser.Scene, x: number, y: number, color: number){
        this.gridX = x;
        this.gridY = y;
        this.sprite = scene.add.rectangle(
            x*32+1,
            y*32+1,
            30,30,
            color
        );
        this.sprite.setOrigin(0,0);
        this.sprite.setDepth(10);
    }

    abstract update(delta: number): void;
    abstract onPlace(): void;

    public destroy(){
        this.sprite.destroy();
    }
}