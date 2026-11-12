import * as THREE from "three";

export function createObjectSequenceEvaluator(object, sequence, sequenceName) {
    const duration = sequence.duration;
    const keyframes = sequence.keyframes;

    // this is a bit extreme - we should rework this
    if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        sequence.rotationSpace !== "world" ||
        !Array.isArray(keyframes) ||
        keyframes.length !== 2 ||
        keyframes[0].time !== 0 ||
        keyframes[1].time !== duration
    ) {
        throw new Error(`Sequence "${sequenceName}" requires two endpoint keyframes, ` + 'a positive duration and rotationSpace: "world".');
    }

    const poseGroup = object.userData.poseGroup;
    const projection = object.userData.projection;

    const initialRotation = poseGroup.getWorldQuaternion(new THREE.Quaternion());
    const startRotation = readRotation(keyframes[0].rotation, initialRotation);
    const endRotation = readRotation(keyframes[1].rotation, startRotation);

    const startPerspective = readPerspective(keyframes[0].projection?.perspective, projection.perspective);
    const endPerspective = readPerspective(keyframes[1].projection?.perspective, startPerspective);

    const startModifiers = keyframes[0].modifiers ?? {};
    const endModifiers = keyframes[1].modifiers ?? {};

    const modifierIds = new Set([...Object.keys(startModifiers), ...Object.keys(endModifiers)]);

    const modifierTransitions = [...modifierIds].map((id) => {
        const state = object.userData.modifiers?.[id];

        if (!state) {
            throw new Error(`Unknown modifier "${id}" in "${sequenceName}".`);
        }

        const startAmount = startModifiers[id]?.amount ?? state.amount;
        const endAmount = endModifiers[id]?.amount ?? startAmount;

        if (!Number.isFinite(startAmount) || !Number.isFinite(endAmount)) {
            throw new Error(`Invalid amount for modifier "${id}".`);
        }

        return {
            state,
            startAmount,
            endAmount,
        };
    });

    const worldRotation = new THREE.Quaternion();
    const parentRotation = new THREE.Quaternion();

    //helpers
    function readRotation(values, fallback) {
        if (values === undefined) {
            return fallback.clone();
        }

        if (!Array.isArray(values) || values.length !== 3 || !values.every(Number.isFinite)) {
            throw new Error(`Invalid rotation in "${sequenceName}".`);
        }

        return new THREE.Quaternion().setFromEuler(new THREE.Euler(...values));
    }

    function readPerspective(value, fallback) {
        const perspective = value ?? fallback;

        if (!Number.isFinite(perspective) || perspective < 0 || perspective > 1) {
            throw new Error(`Invalid perspective in "${sequenceName}".`);
        }

        return perspective;
    }

    function apply(progress) {
        const easedProgress = progress * progress * (3 - 2 * progress);

        worldRotation.slerpQuaternions(startRotation, endRotation, easedProgress);

        poseGroup.parent.getWorldQuaternion(parentRotation);
        poseGroup.quaternion.copy(parentRotation.invert()).multiply(worldRotation);

        projection.perspective = startPerspective + (endPerspective - startPerspective) * easedProgress;

        modifierTransitions.forEach(({ state, startAmount, endAmount }) => {
            state.amount = startAmount + (endAmount - startAmount) * easedProgress;
        });
    }

    return {
        duration,
        apply,
    };
}
