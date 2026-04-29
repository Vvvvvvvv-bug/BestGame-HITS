import { Building } from "./Building";

export class Drill extends Building {
    static readonly COLOR = 0x00aaff;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, Drill.COLOR);
    }

    public update(delta: number): void {

    }

    public onPlace(): void {

    }
}
