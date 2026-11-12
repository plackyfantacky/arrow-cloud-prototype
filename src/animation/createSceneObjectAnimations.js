import * as THREE from "three";

import { resolveAnimationBindings } from "./resolveAnimationBindings.js";

export function createSceneObjectAnimations(sceneObjects, sequences = {}, events) {
    const controllers = [];
    const unsubscribeEvents = [];
    const activations = new Map();

    sceneObjects.forEach((object) => {
        const bindings = resolveAnimationBindings(object.userData.animation, object.userData.sceneObjectId);

        const bindingControllers = new Map();
        const scheduledControllers = [];
        const objectActivations = new Map();

        let activeBinding = null;
        let previousController = null;

        activations.set(object.userData.sceneObjectId, objectActivations);

        bindings.forEach(({ name: bindingName, binding, hasAt, hasOn }) => {

            const sequence = sequences[binding.play];

            if (!sequence) {
                console.warn(
                    `Animation "${object.userData.sceneObjectId}.${bindingName}" ` + `references undefined sequence "${binding.play}". Binding skipped.`,
                );
                return;
            }

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
                throw new Error(`Sequence "${binding.play}" requires two endpoint keyframes, ` + 'a positive duration and rotationSpace: "world".');
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
                    throw new Error(`Unknown modifier "${id}" in "${binding.play}".`);
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

            let idleStartTime = null;
            let activationTime = null;
            let activationPending = false;

            function activate() {
                activeBinding = bindingName;
                activationPending = true;
            }

            objectActivations.set(bindingName, activate);

            if (hasOn) {
                unsubscribeEvents.push(events.on(binding.on, activate));
            }

            const controller = {
                update(currentTime, ambientTime) {
                    if (activationPending) {
                        activationPending = false;
                        activationTime = ambientTime;
                        idleStartTime = null;

                        object.userData.idleMotion?.update(0);
                    }

                    let elapsedTime;

                    if (activationTime !== null) {
                        elapsedTime = ambientTime - activationTime;
                    } else if (hasAt) {
                        elapsedTime = currentTime - binding.at;
                    } else {
                        return;
                    }

                    const progress = Math.max(0, Math.min(1, elapsedTime / duration));

                    const easedProgress = progress * progress * (3 - 2 * progress);

                    worldRotation.slerpQuaternions(startRotation, endRotation, easedProgress);

                    poseGroup.parent.getWorldQuaternion(parentRotation);
                    poseGroup.quaternion.copy(parentRotation.invert()).multiply(worldRotation);

                    projection.perspective = startPerspective + (endPerspective - startPerspective) * easedProgress;

                    modifierTransitions.forEach(({ state, startAmount, endAmount }) => {
                        state.amount = startAmount + (endAmount - startAmount) * easedProgress;
                    });

                    if (progress === 1 && idleStartTime === null) {
                        idleStartTime = ambientTime;
                    }

                    if (idleStartTime !== null) {
                        object.userData.idleMotion?.update(ambientTime - idleStartTime);
                    }
                },
            };

            bindingControllers.set(bindingName, controller);

            if (hasAt) {
                scheduledControllers.push({
                    at: binding.at,
                    controller,
                });
            }

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

        if (bindingControllers.size === 0) {
            controllers.push({
                update(_currentTime, ambientTime) {
                    object.userData.idleMotion?.update(ambientTime);
                },
            });

            return;
        }

        scheduledControllers.sort((first, second) => {
            return first.at - second.at;
        });

        controllers.push({
            update(currentTime, ambientTime) {
                let controller;

                if (activeBinding !== null) {
                    controller = bindingControllers.get(activeBinding);
                } else {
                    controller = scheduledControllers[0]?.controller;

                    for (const scheduled of scheduledControllers) {
                        if (scheduled.at <= currentTime) {
                            controller = scheduled.controller;
                        }
                    }
                }

                if (!controller) {
                    return;
                }

                if (controller !== previousController) {
                    object.userData.idleMotion?.update(0);
                    previousController = controller;
                }

                controller.update(currentTime, ambientTime);
            },
        });
    });

    //output
    return {
        play(objectId, bindingName) {
            const activate = activations.get(objectId)?.get(bindingName);

            if (!activate) {
                throw new Error(`Unknown animation binding: ${objectId}.${bindingName}`);
            }

            activate();
        },
        update(currentTime, ambientTime) {
            controllers.forEach((controller) => {
                controller.update(currentTime, ambientTime);
            });
        },
        destroy() {
            unsubscribeEvents.forEach((unsubscribe) => {
                unsubscribe();
            });
            activations.clear();
            controllers.length = 0;
        },
    };
}
