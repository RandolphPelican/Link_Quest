export interface AnimationParams {
    limbSwingAmplitude: number;
    limbSwingFrequency: number;
    bodyBobAmplitude: number;
    bodyBobFrequency: number;
}

export const ANIMATION_STATES: Record<string, AnimationParams> = {
    idle: {
        limbSwingAmplitude: 0.1,
        limbSwingFrequency: 2,
        bodyBobAmplitude: 2,
        bodyBobFrequency: 2
    },
    walk: {
        limbSwingAmplitude: 0.6,
        limbSwingFrequency: 10,
        bodyBobAmplitude: 4,
        bodyBobFrequency: 20
    },
    attack: {
        limbSwingAmplitude: 1.2,
        limbSwingFrequency: 15,
        bodyBobAmplitude: 6,
        bodyBobFrequency: 30
    },
    hurt: {
        limbSwingAmplitude: 0.8,
        limbSwingFrequency: 25,
        bodyBobAmplitude: 10,
        bodyBobFrequency: 50
    }
};
