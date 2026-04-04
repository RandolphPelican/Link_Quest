import Phaser from "phaser";
import { CLASSES } from "../../shared/index";

export class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    create() {
        this.add.text(400, 100, "LINK QUEST", { fontSize: "64px", color: "#fff" }).setOrigin(0.5);
        
        this.add.text(400, 200, "Select Your Class:", { fontSize: "24px", color: "#fff" }).setOrigin(0.5);

        let y = 250;
        Object.keys(CLASSES).forEach((classKey) => {
            const classDef = CLASSES[classKey];
            const btn = this.add.text(400, y, `${classDef.name} - ${classDef.description}`, { fontSize: "18px", color: "#0f0" })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btn.on("pointerdown", () => {
                this.scene.start("GameScene", { classType: classKey });
            });

            y += 40;
        });
    }
}
