const transformDefaults = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
};

export function createIdleMotion(target, settings) {
    const keyframes = settings.keyframes;

    if (!Array.isArray(keyframes) || keyframes.length < 2) {
        throw new Error("Idle motion requires at least two keyframes.");
    }

    keyframes.forEach((keyframe, index) => {
        if (!Number.isFinite(keyframe.time) || (index === 0 && keyframe.time !== 0) || (index > 0 && keyframe.time <= keyframes[index - 1].time)) {
            throw new Error("Idle keyframe times must start at zero and increase.");
        }

        Object.keys(transformDefaults).forEach((property) => {
            const values = keyframe[property];

            if (
                values !== undefined &&
                (!Array.isArray(values) ||
                    values.length !== 3 ||
                    !values.every(Number.isFinite) ||
                    (property === "scale" && values.some((value) => value <= 0)))
            ) {
                throw new Error(`Invalid idle keyframe ${property}.`);
            }
        });
    });

    const duration = keyframes[keyframes.length - 1].time;

    function update(ambientTime) {
        const cycleTime = ((ambientTime % duration) + duration) % duration;

        const nextIndex = keyframes.findIndex((keyframe) => {
            return keyframe.time > cycleTime;
        });

        const previousFrame = keyframes[nextIndex - 1];
        const nextFrame = keyframes[nextIndex];

        const progress = (cycleTime - previousFrame.time) / (nextFrame.time - previousFrame.time);

        const easedProgress = progress * progress * (3 - 2 * progress);

        Object.entries(transformDefaults).forEach(([property, defaults]) => {
            const previousValues = previousFrame[property] ?? defaults;
            const nextValues = nextFrame[property] ?? defaults;

            const values = previousValues.map((value, index) => {
                return value + (nextValues[index] - value) * easedProgress;
            });

            target[property].set(...values);
        });
    }

    update(0);

    return { update };
}
