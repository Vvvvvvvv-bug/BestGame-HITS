export class ResourcePanel {
    private text: Phaser.GameObjects.Text;

    constructor(scene:Phaser.Scene){
        this.text = scene.add.text(10,10,'Железо: 0',{
            fontSize: '20px',
            color: '#ffffff'
        })
        this.text.setDepth(1000);
    }

    update(amount: number){
        this.text.setText(`Железо: ${amount}`);
    }
}