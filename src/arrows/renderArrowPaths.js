import { positionArrowPathForViewport } from "../responsive.js";
import { createArrow } from "./createArrow.js";
import { createArrowRenderPieces } from "./createArrowRenderPieces.js";
import { createArrowPathSegments } from "./createArrowPaths.js";
import { createPathComponentMesh } from "./pathComponents/index.js";
import { createArrowPathComponents } from "./createArrowPathComponents.js";
import { setArrowReveal } from "./reveal.js";
import { createArrowMotionGroup } from "./idle.js";

// arrow rendering helpers

function disposeRenderableObject(object) {
    object.traverse((childObject) => {
        if (childObject.geometry) {
            childObject.geometry.dispose();
        }

        if (Array.isArray(childObject.material)) {
            childObject.material.forEach((material) => {
                material.dispose();
            });

            return;
        }

        if (childObject.material) {
            if (childObject.material.map) {
                childObject.material.map.dispose();
            }

            childObject.material.dispose();
        }
    });
}

function clearRenderedArrowItems(scene, renderedArrowItems) {
    renderedArrowItems.forEach((renderedArrowItem) => {
        scene.remove(renderedArrowItem.motionGroup);
        disposeRenderableObject(renderedArrowItem.motionGroup);
    });
}

function createRenderedArrowPath({
    scene,
    pathLayoutCamera,
    mountElement,
    createArrowMaterial,
    fieldSettings,
    initialRevealProgress,
    arrowPath
}) {

    const renderedArrowMaterial = createArrowMaterial();

    renderedArrowMaterial.transparent = true;
    renderedArrowMaterial.opacity = 1;

    const positionedArrowPath = positionArrowPathForViewport(
        arrowPath,
        pathLayoutCamera,
        mountElement
    );

    const segments = createArrowPathSegments(positionedArrowPath);
    const pieces = createArrowRenderPieces(segments, fieldSettings);

    const arrow = createArrow(
        pieces,
        renderedArrowMaterial,
        fieldSettings
    );

    const components = createArrowPathComponents(positionedArrowPath, segments);
    const componentMeshes = [];

    arrow.userData.name = positionedArrowPath.name;

    arrow.userData.timing = {
        delay: positionedArrowPath.timing?.delay || 0,
        duration: positionedArrowPath.timing?.duration || 5,
    };

    arrow.userData.headTiming = {
        hideAt: positionedArrowPath.head?.hideAt ?? null,
        hideDuration: positionedArrowPath.head?.hideDuration ?? 0.25,
    };

    arrow.userData.headMorphTiming = {
        morphAt: positionedArrowPath.head?.morphAt ?? null,
        morphDuration: positionedArrowPath.head?.morphDuration ?? 0.75,
    };

    components.forEach((component) => {
        const componentMesh = createPathComponentMesh(component);

        componentMeshes.push(componentMesh);
    });

    const motionGroup = createArrowMotionGroup(arrow, positionedArrowPath);

    motionGroup.userData.idle = positionedArrowPath.idle ?? null;

    componentMeshes.forEach((componentMesh) => {
        componentMesh.position.sub(motionGroup.userData.basePosition);

        motionGroup.add(componentMesh);
    });

    scene.add(motionGroup);

    if (initialRevealProgress !== null) {
        setArrowReveal(arrow, initialRevealProgress);
    }

    return {
        arrow,
        motionGroup,
        componentMeshes,
        positionedArrowPath,
        segments
    };

}

export function renderArrowPaths({
    scene,
    pathLayoutCamera,
    mountElement,
    createArrowMaterial,
    fieldSettings,
    initialRevealProgress = 0,
    previousRenderedArrowItems,
    arrowPaths
}) {
    clearRenderedArrowItems(scene, previousRenderedArrowItems);

    const renderedArrowItems = arrowPaths.map((arrowPath) => {
        return createRenderedArrowPath({
            scene,
            pathLayoutCamera,
            mountElement,
            createArrowMaterial,
            fieldSettings,
            initialRevealProgress,
            arrowPath,
        });
    });

    return {
        renderedArrowItems,
        arrows: renderedArrowItems.map((renderedArrowItem) => {
            return renderedArrowItem.arrow;
        }),
        pathComponentMeshes: renderedArrowItems.flatMap((renderedArrowItem) => {
            return renderedArrowItem.componentMeshes;
        }),
    };
}