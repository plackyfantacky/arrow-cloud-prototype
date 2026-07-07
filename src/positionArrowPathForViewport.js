import * as THREE from 'three';

const defaultEntryMargin = 1.5;

export function positionArrowPathForViewport(arrowPath, camera, container) {
    if (!arrowPath.entry?.side) {
        return arrowPath;
    }

    if (!['left', 'right'].includes(arrowPath.entry.side)) {
        return arrowPath;
    }

    const viewportBounds = getViewportBoundsAtZ(camera, container, arrowPath.origin[2]);
    const origin = [...arrowPath.origin];
    const margin = arrowPath.entry.margin ?? defaultEntryMargin;

    if (arrowPath.entry.side === 'left') {
        origin[0] = viewportBounds.left - margin;
    }

    if (arrowPath.entry.side === 'right') {
        origin[0] = viewportBounds.right + margin;
    }

    const straightUntil = arrowPath.entry.straightUntil ?? null;

    if (straightUntil === null) {
        return {
            ...arrowPath,
            origin
        }
    }

    const entryDistance = Math.abs(straightUntil - origin[0]);

    return {
        ...arrowPath,
        origin,
        moves: [
            ['forward', entryDistance],
            ...arrowPath.moves
        ],
    }
}

function getViewportBoundsAtZ(camera, container, worldZ) {
    const distance = Math.abs(camera.position.z - worldZ);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(verticalFov / 2) * distance;
    const width = height * getContainerAspect(container);

    return {
        left: camera.position.x - width / 2,
        right: camera.position.x + width / 2
    };
}

function getContainerAspect(container) {
    return container.clientWidth / Math.max(container.clientHeight, 1);
}