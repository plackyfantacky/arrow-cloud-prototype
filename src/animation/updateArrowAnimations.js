import { updateArrowReveal } from "../arrows/reveal.js";
import { updateArrowIdleMotion } from "../arrows/idle.js";
import { setPathComponentReveal } from "../arrows/createArrowPathComponents.js";

export function updateArrowAnimations({ renderedArrowItems, currentTime }) {
    renderedArrowItems.forEach((renderedArrowItem) => {
        const { arrow, motionGroup, componentMeshes } = renderedArrowItem;

        updateArrowReveal(arrow, currentTime);

        const idleSettings = motionGroup.userData.idle;

        if (idleSettings) {
            const revealEndTime = arrow.userData.timing.delay + arrow.userData.timing.duration;

            if (currentTime < revealEndTime) {
                motionGroup.position.copy(motionGroup.userData.basePosition);
                motionGroup.rotation.set(0, 0, 0);
            } else {
                updateArrowIdleMotion(motionGroup, idleSettings, currentTime - revealEndTime);
            }
        }

        componentMeshes.forEach((componentMesh) => {
            const { delay, duration } = componentMesh.userData.timing;

            const revealProgress = duration > 0
                ? Math.min(1, Math.max(0, (currentTime - delay) / duration))
                : currentTime >= delay ? 1 : 0;

            setPathComponentReveal(componentMesh, revealProgress);
        });
    });
}
