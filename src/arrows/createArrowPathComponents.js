import * as THREE from 'three';

function getPlacementDistance(placement, segmentLength) {
    if (typeof placement.distance === 'number') {
        return THREE.MathUtils.clamp(
            placement.distance,
            0, 
            segmentLength
        );
    }

    if (placement.align === 'start') {
        return 0;
    }

    if (placement.align === 'centre') {
        return segmentLength * 0.5;
    }

    if (placement.align === 'end') {
        return segmentLength;
    }

    return 0;
}

export function createArrowPathComponents(arrowPath, segments) {
    return (arrowPath.components || []).map((component) => {
        const segment = segments[component.placement.segmentIndex];

        if (!segment) {
            throw new Error(
                `Component "${component.name}" references missing segment index ${component.placement.segmentIndex}.`
            );
        }

        const segmentLength = segment.startPoint.distanceTo(segment.endPoint);

        const distance = getPlacementDistance(
            component.placement,
            segmentLength
        );

        const placementOffset = component.placement.offset || {};

        const position = segment.startPoint.clone()
            .add(segment.frame.forward.clone().multiplyScalar(distance))
            .add(segment.frame.forward.clone().multiplyScalar(placementOffset.forward || 0 ))
            .add(segment.frame.normal.clone().multiplyScalar(placementOffset.normal || 0 ))
            .add(segment.frame.side.clone().multiplyScalar(placementOffset.side || 0 ));

        return {
            ...component,
            position,
            frame: {
                forward: segment.frame.forward.clone(),
                normal: segment.frame.normal.clone(),
                side: segment.frame.side.clone()
            },
        };
    });
}

export function setPathComponentReveal(componentMesh, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    componentMesh.visible = clampedProgress > 0;

    const easedProgress = THREE.MathUtils.smoothstep(
        clampedProgress,
        0, 1
    );

    componentMesh.scale.lerpVectors(
        componentMesh.userData.startScale,
        componentMesh.userData.targetScale,
        easedProgress
    );
}