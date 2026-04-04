import Phaser from "phaser";
import { ANIMATION_STATES } from "../../shared/index";

export interface ICharacterAnimator {
    update(delta: number, state: string, direction: string): void;
    destroy(): void;
}

export class ProceduralAnimator extends Phaser.GameObjects.Container implements ICharacterAnimator {
    private head: Phaser.GameObjects.Rectangle;
    private torso: Phaser.GameObjects.Rectangle;
    private leftArm: Phaser.GameObjects.Rectangle;
    private rightArm: Phaser.GameObjects.Rectangle;
    private leftLeg: Phaser.GameObjects.Rectangle;
    private rightLeg: Phaser.GameObjects.Rectangle;
    
    private time: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff) {
        super(scene, x, y);

        // Simple humanoid built from rectangles
        this.torso = scene.add.rectangle(0, 0, 16, 20, color);
        this.head = scene.add.rectangle(0, -15, 12, 12, color);
        this.leftArm = scene.add.rectangle(-10, -2, 4, 12, color);
        this.rightArm = scene.add.rectangle(10, -2, 4, 12, color);
        this.leftLeg = scene.add.rectangle(-4, 12, 4, 10, color);
        this.rightLeg = scene.add.rectangle(4, 12, 4, 10, color);

        this.add([this.torso, this.head, this.leftArm, this.rightArm, this.leftLeg, this.rightLeg]);
        scene.add.existing(this);
    }

    update(delta: number, state: string, _direction: string) {
        this.time += delta / 1000;
        const params = ANIMATION_STATES[state] || ANIMATION_STATES.idle;

        // Limb swinging
        const swing = Math.sin(this.time * params.limbSwingFrequency) * params.limbSwingAmplitude;
        this.leftLeg.y = 12 + swing * 5;
        this.rightLeg.y = 12 - swing * 5;
        this.leftArm.y = -2 - swing * 3;
        this.rightArm.y = -2 + swing * 3;

        // Body bobbing
        const bob = Math.cos(this.time * params.bodyBobFrequency) * params.bodyBobAmplitude;
        this.y += bob * (delta / 1000);
        
        // Tilt based on swing
        this.angle = swing * 5;
    }
}
