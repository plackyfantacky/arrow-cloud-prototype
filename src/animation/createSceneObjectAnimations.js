import { createObjectSequenceEvaluator } from "./createObjectSequenceEvaluator.js";
import { resolveAnimationBindings } from "./resolveAnimationBindings.js";

export function createSceneObjectAnimations(sceneObjects, sequences = {}, events) {
    const controllers = [];
    const unsubscribeEvents = [];
    const activations = new Map();

    sceneObjects.forEach((object) => {
        const bindings = resolveAnimationBindings(object.userData.animation, object.userData.sceneObjectId);
        const bindingControllers = new Map();
        const objectActivations = new Map();

        const layers = new Map();

        activations.set(object.userData.sceneObjectId, objectActivations);

        bindings.forEach(({ name: bindingName, binding, hasAt, hasOn }) => {
            const sequence = sequences[binding.play];

            if (!sequence) {
                console.warn(
                    `Animation "${object.userData.sceneObjectId}.${bindingName}" ` + `references undefined sequence "${binding.play}". Binding skipped.`,
                );
                return;
            }

            const layerName = binding.layer ?? "primary";
            if (!["primary", "additive"].includes(layerName)) {
                throw new Error(`Unknown animation layer: ${layerName}`);
            }

            if (layerName === "additive" && sequence.rotationSpace !== "local") {
                throw new Error("Additive animation requires local rotation space.");
            }

            if (!layers.has(layerName)) {
                layers.set(layerName, {
                    activeBinding: null,
                    previousController: null,
                    scheduled: [],
                });
            }

            const layer = layers.get(layerName);
            const target = layerName === "additive" ? object.userData.motionGroup : object.userData.poseGroup;

            const evaluator = createObjectSequenceEvaluator(object, sequence, binding.play, target);

            const duration = evaluator.duration;

            let idleStartTime = null;
            let activationTime = null;
            let activationPending = false;

            function activate() {
                layer.activeBinding = bindingName;
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

                    if (binding.loop && hasAt && activationTime === null && currentTime >= binding.at) {
                        activationTime = ambientTime;
                    }

                    const elapsed = Math.max(0, elapsedTime);
                    const progress = binding.loop ? (elapsed % duration) / duration : Math.min(1, elapsed / duration);

                    evaluator.apply(progress);

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
                layer.scheduled.push({
                    at: binding.at,
                    controller,
                });
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

        layers.forEach((layer) => {
            layer.scheduled.sort((first, second) => {
                return first.at - second.at;
            });
        });

        controllers.push({
            update(currentTime, ambientTime) {
                layers.forEach((layer) => {
                    let controller;

                    if (layer.activeBinding !== null) {
                        controller = bindingControllers.get(layer.activeBinding);
                    } else {
                        controller = layer.scheduled[0]?.controller;

                        for (const scheduled of layer.scheduled) {
                            if (scheduled.at <= currentTime) {
                                controller = scheduled.controller;
                            }
                        }
                    }

                    if (!controller) {
                        return;
                    }

                    if (controller !== layer.previousController) {
                        object.userData.idleMotion?.update(0);
                        layer.previousController = controller;
                    }

                    controller.update(currentTime, ambientTime);
                });
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
