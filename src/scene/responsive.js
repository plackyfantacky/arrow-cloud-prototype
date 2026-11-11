import * as THREE from "three";
import { getStageSize } from "./stage";

const defaultEntryMargin = 1.5;

export function handleResize(mountElement, cameras, renderer) {
    const stageSize = getStageSize(mountElement);

    if (Array.isArray(cameras)) {
        cameras.forEach((camera) => {
            camera.aspect = stageSize.width / stageSize.height;
            camera.updateProjectionMatrix();
        });
    }

    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

export function applyViewportOffset(camera, container, viewport = {}) {
    const stageSize = getStageSize(container);

    const offsetX = stageSize.width * (viewport.offsetX ?? 0);
    const offsetY = stageSize.height * (viewport.offsetY ?? 0);

    if (offsetX === 0 && offsetY === 0) {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
        return;
    }

    camera.setViewOffset(
        stageSize.width,
        stageSize.height,
        -offsetX,
        -offsetY,
        stageSize.width,
        stageSize.height
    );

    camera.updateProjectionMatrix();
}

export function positionArrowPathForViewport(arrowPath, camera, container) {
    if (arrowPath.entry?.position !== 'viewport') {
        return arrowPath;
    }

    if (!['left', 'right'].includes(arrowPath.entry.side)) {
        return arrowPath;
    }

    if (!['left', 'right'].includes(arrowPath.entry.side)) {
        return arrowPath;
    }

    const viewportBounds = getViewportBoundsAtZ(
        camera,
        container,
        arrowPath.origin[2]
    );


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
        };
    }

    const entryDistance = Math.abs(straightUntil - origin[0]);

    return {
        ...arrowPath,
        origin,
        moves: [
            ['forward', entryDistance],
            ...arrowPath.moves
        ],
    };
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

export function updateSceneObjectLayout(sceneObjects, camera) {
    camera.updateWorldMatrix(true, false);

    const anchorPosition = new THREE.Vector3();

    sceneObjects.forEach((object) => {
        const anchor = object.parent;
        const layout = anchor?.userData.viewportLayout;

        if (!layout) {
            return;
        }

        const x = layout.x ?? 0.5;
        const y = layout.y ?? 0.5;
        const distance = layout.distance ?? 6;

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(distance) ||
            distance <= 0
        ) {
            throw new Error("Invalid viewport layout coordinates or distance.");
        }

        anchorPosition.set(
            x * 2 - 1,
            1 - y * 2,
            0
        ).unproject(camera);

        camera.worldToLocal(anchorPosition);

        anchorPosition.multiplyScalar(
            distance / -anchorPosition.z
        );

        camera.localToWorld(anchorPosition);
        anchor.position.copy(anchorPosition);

        if (layout.faceCamera ?? true) {
            camera.getWorldQuaternion(anchor.quaternion);
        } else {
            anchor.quaternion.identity();
        }
    });
}