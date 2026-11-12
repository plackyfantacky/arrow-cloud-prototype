import * as THREE from "three";

export function createSceneObjectAnimations(sceneObjects, sequences = {}) {
    const controllers = [];

    sceneObjects.forEach((object) => {
        const scheduleBindings = Object.entries(object.userData.animation ?? {}).filter(([name, binding]) => {
            if (typeof binding === "string") {
                return false;
            }

            const hasAt = binding.at !== undefined;
            const hasOn = binding.on !== undefined;

            if (hasAt && hasOn) {
                console.warn(`Animation "${object.userData.sceneObjectId}.${name}" defines both "at" and "on". Automatic activation disabled.`);

                return false;
            }

            return hasAt;
        });

        if (scheduleBindings.length > 1) {
            throw new Error("Multiple scheduled bindings per object are not implemented yet.");
        }

        if (scheduleBindings.length === 0) {
            controllers.push({
                update(currentTime, ambientTime) {
                    object.userData.idleMotion?.update(ambientTime);
                },
            });

            return;
        }

        const [, binding] = scheduleBindings[0];
        const sequence = sequences[binding.play];

        if (!sequence) {
            throw new Error(`Unknown sequence: ${binding.play}`);
        }

        const duration = sequence.duration;
        const keyframes = sequence.keyframes;

        // this is a bit extreme - we should rework this
        if (
            !Number.isFinite(binding.at) ||
            binding.at < 0 ||
            !Number.isFinite(duration) ||
            duration <= 0 ||
            sequence.rotationSpace !== "world" ||
            !Array.isArray(keyframes) ||
            keyframes.length !== 2 ||
            keyframes[0].time !== 0 ||
            keyframes[1].time !== duration
        ) {
            throw new Error(`Sequence "${binding.play}" requires two endpoint keyframes, ` + 'a positive duration and rotationSpace: "world".');
        }

        const poseGroup = object.userData.poseGroup;
        const projection = object.userData.projection;

        const initialRotation = poseGroup.getWorldQuaternion(new THREE.Quaternion());
        const startRotation = readRotation(keyframes[0].rotation, initialRotation);
        const endRotation = readRotation(keyframes[1].rotation, startRotation);

        const startPerspective = readPerspective(keyframes[0].projection?.perspective, projection.perspective);
        const endPerspective = readPerspective(keyframes[1].projection?.perspective, startPerspective);

        const worldRotation = new THREE.Quaternion();
        const parentRotation = new THREE.Quaternion();

        let idleStartTime = null;

        controllers.push({
            update(currentTime, ambientTime) {
                const progress = Math.max(0, Math.min(1, (currentTime - binding.at) / duration));

                const easedProgress = progress * progress * (3 - 2 * progress);

                worldRotation.slerpQuaternions(startRotation, endRotation, easedProgress);

                poseGroup.parent.getWorldQuaternion(parentRotation);
                poseGroup.quaternion.copy(parentRotation.invert()).multiply(worldRotation);

                projection.perspective = startPerspective + (endPerspective - startPerspective) * easedProgress;

                if (progress === 1 && idleStartTime === null) {
                    idleStartTime = ambientTime;
                }

                if (idleStartTime !== null) {
                    object.userData.idleMotion?.update(ambientTime - idleStartTime);
                }
            },
        });

        //helpers
        function readRotation(values, fallback) {
            if (values === undefined) {
                return fallback.clone();
            }

            if (!Array.isArray(values) || values.length !== 3 || !values.every(Number.isFinite)) {
                throw new Error(`Invalid rotation in "${binding.play}".`);
            }

            return new THREE.Quaternion().setFromEuler(new THREE.Euler(...values));
        }

        function readPerspective(value, fallback) {
            const perspective = value ?? fallback;

            if (!Number.isFinite(perspective) || perspective < 0 || perspective > 1) {
                throw new Error(`Invalid perspective in "${binding.play}".`);
            }

            return perspective;
        }

    });

    //output
    return {
        update(currentTime, ambientTime) {
            controllers.forEach((controller) => {
                controller.update(currentTime, ambientTime);
            });
        },
    }
}
