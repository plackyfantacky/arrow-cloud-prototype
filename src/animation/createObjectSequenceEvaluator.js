import * as THREE from "three";

export function createObjectSequenceEvaluator(object, sequence, sequenceName, target = object.userData.poseGroup) {
    const keyframes = sequence.keyframes;

    if (!Array.isArray(keyframes) || keyframes.length < 2) {
        throw new Error(`Sequence "${sequenceName}" requires at least two keyframes.`);
    }

    const rotationSpace = sequence.rotationSpace;

    const animatesProjection = keyframes.some((keyframe) => {
        return keyframe.projection?.perspective !== undefined;
    });

    const duration = sequence.duration ?? keyframes[keyframes.length - 1].time;

    if (
        !Number.isFinite(duration) ||
        duration <= 0 ||
        !["world", "local"].includes(rotationSpace) ||
        keyframes[0].time !== 0 ||
        keyframes[keyframes.length - 1].time !== duration
    ) {
        throw new Error(
            `Sequence "${sequenceName}" requires a positive duration, ` + 'rotationSpace: "world" or "local", and keyframes spanning its duration.',
        );
    }

    keyframes.forEach((keyframe, index) => {
        if (!Number.isFinite(keyframe.time) || (index > 0 && keyframe.time <= keyframes[index - 1].time)) {
            throw new Error(`Keyframe times must increase in "${sequenceName}".`);
        }
    });

    const poseGroup = target;
    const projection = object.userData.projection;

    const modifierIds = new Set();

    keyframes.forEach((keyframe) => {
        Object.keys(keyframe.modifiers ?? {}).forEach((id) => {
            modifierIds.add(id);
        });
    });

    const modifiers = [...modifierIds].map((id) => {
        const state = object.userData.modifiers?.[id];

        if (!state) {
            throw new Error(`Unknown modifier "${id}" in "${sequenceName}".`);
        }

        return { id, state };
    });

    let previousRotation = rotationSpace === "world" ? poseGroup.getWorldQuaternion(new THREE.Quaternion()) : poseGroup.quaternion.clone();

    let previousPerspective = projection.perspective;
    let previousAmounts = modifiers.map(({ state }) => state.amount);

    const frames = keyframes.map((keyframe) => {
        const rotation = readRotation(keyframe.rotation, previousRotation);

        const perspective = readPerspective(keyframe.projection?.perspective, previousPerspective);

        const amounts = modifiers.map(({ id }, index) => {
            const amount = keyframe.modifiers?.[id]?.amount ?? previousAmounts[index];

            if (!Number.isFinite(amount)) {
                throw new Error(`Invalid amount for modifier "${id}".`);
            }

            return amount;
        });

        previousRotation = rotation;
        previousPerspective = perspective;
        previousAmounts = amounts;

        return {
            time: keyframe.time,
            rotation,
            perspective,
            amounts,
        };
    });

    const worldRotation = new THREE.Quaternion();
    const parentRotation = new THREE.Quaternion();

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
        const time = Math.max(0, Math.min(1, progress)) * duration;

        let nextIndex = 1;

        while (nextIndex < frames.length - 1 && time > frames[nextIndex].time) {
            nextIndex++;
        }

        const previousFrame = frames[nextIndex - 1];
        const nextFrame = frames[nextIndex];

        const segmentProgress = (time - previousFrame.time) / (nextFrame.time - previousFrame.time);
        const easedProgress = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

        worldRotation.slerpQuaternions(previousFrame.rotation, nextFrame.rotation, easedProgress);

        if (rotationSpace === "world") {
            poseGroup.parent.getWorldQuaternion(parentRotation);
            poseGroup.quaternion.copy(parentRotation.invert()).multiply(worldRotation);
        } else {
            poseGroup.quaternion.copy(worldRotation);
        }

        if (animatesProjection) {
            projection.perspective = previousFrame.perspective + (nextFrame.perspective - previousFrame.perspective) * easedProgress;
        }

        for (let i = 0; i < modifiers.length; i++) {
            modifiers[i].state.amount = previousFrame.amounts[i] + (nextFrame.amounts[i] - previousFrame.amounts[i]) * easedProgress;
        }
    }

    return {
        duration,
        apply,
    };
}
