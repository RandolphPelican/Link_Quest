import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }

    preload() {
        // Load some basic assets or placeholders
        this.load.image("logo", "https://labs.phaser.io/assets/sprites/phaser3-logo.png");
        
        // Creating placeholders for procedural animator if needed
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture("white_square", 32, 32);
        graphics.clear();

        graphics.fillStyle(0x00ff00, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture("green_circle", 32, 32);
        graphics.clear();
        
        graphics.destroy();
    }

    create() {
        this.scene.start("MenuScene");
    }
}
