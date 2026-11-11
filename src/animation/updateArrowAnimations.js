import { updateArrowReveal } from "../arrows/reveal.js";
import { updateArrowIdleMotion } from "../arrows/idle.js";
import { setPathComponentReveal } from "../arrows/createArrowPathComponents.js";

export function updateArrowAnimations({
    renderedArrowItems,
    currentTime,
    ambientTime
}) {
    renderedArrowItems.forEach((renderedArrowItem) => {
        const {
            arrow,
            motionGroup,
            componentMeshes
        } = renderedArrowItem;

        updateArrowReveal(arrow, currentTime);
        
        updateIdleMotion({
            arrow,
            motionGroup,
            currentTime,
            ambientTime
        });

        componentMeshes.forEach((componentMesh) => {
            const { delay, duration } = componentMesh.userData.timing;

            const revealProgress = duration > 0
                ? Math.min(1, Math.max(0, (currentTime - delay) / duration))
                : currentTime >= delay ? 1 : 0;

            setPathComponentReveal(componentMesh, revealProgress);
        });
    });
}

function updateIdleMotion({
    arrow,
    motionGroup,
    currentTime,
    ambientTime
}) {
    const idleSettings = motionGroup.userData.idle;

    if (!idleSettings) {
        return;
    }

    const revealEndTime = arrow.userData.timing.delay + arrow.userData.timing.duration;

    if (motionGroup.userData.idleStartTime === undefined && currentTime >= revealEndTime) {
        motionGroup.userData.idleStartTime = ambientTime;
    }

    const idleStartTime = motionGroup.userData.idleStartTime;

    if (!idleStartTime === undefined) {
        return;
    }

    updateArrowIdleMotion(
        motionGroup,
        idleSettings,
        ambientTime - idleStartTime
    );
}