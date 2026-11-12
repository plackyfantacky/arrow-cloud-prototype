import { createObjectSequenceEvaluator } from "./createObjectSequenceEvaluator.js";
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

            const evaluator = createObjectSequenceEvaluator(object, sequence, binding.play);

            const duration = evaluator.duration;

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
                scheduledControllers.push({
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
