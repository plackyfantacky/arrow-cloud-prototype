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

/**
 * @deprecated Global viewport offsets are being retired.
 * Use object layout and sequence-controlled composition instead.
 */
export function applyViewportOffset(camera, container, viewport = {}) {
    const stageSize = getStageSize(container);

    const offsetX = stageSize.width * (viewport.offsetX ?? 0);
    const offsetY = stageSize.height * (viewport.offsetY ?? 0);

    if (offsetX === 0 && offsetY === 0) {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
        return;
    }

    camera.setViewOffset(stageSize.width, stageSize.height, -offsetX, -offsetY, stageSize.width, stageSize.height);

    camera.updateProjectionMatrix();
}

export function positionArrowPathForViewport(arrowPath, camera, container) {
    if (arrowPath.entry?.position !== "viewport") {
        return arrowPath;
    }

    if (!["left", "right"].includes(arrowPath.entry.side)) {
        return arrowPath;
    }

    if (!["left", "right"].includes(arrowPath.entry.side)) {
        return arrowPath;
    }

    const viewportBounds = getViewportBoundsAtZ(camera, container, arrowPath.origin[2]);

    const origin = [...arrowPath.origin];
    const margin = arrowPath.entry.margin ?? defaultEntryMargin;

    if (arrowPath.entry.side === "left") {
        origin[0] = viewportBounds.left - margin;
    }

    if (arrowPath.entry.side === "right") {
        origin[0] = viewportBounds.right + margin;
    }

    const straightUntil = arrowPath.entry.straightUntil ?? null;

    if (straightUntil === null) {
        return {
            ...arrowPath,
            origin,
        };
    }

    const entryDistance = Math.abs(straightUntil - origin[0]);

    return {
        ...arrowPath,
        origin,
        moves: [["forward", entryDistance], ...arrowPath.moves],
    };
}

function getViewportBoundsAtZ(camera, container, worldZ) {
    const distance = Math.abs(camera.position.z - worldZ);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const height = 2 * Math.tan(verticalFov / 2) * distance;
    const width = height * getContainerAspect(container);

    return {
        left: camera.position.x - width / 2,
        right: camera.position.x + width / 2,
    };
}

function getContainerAspect(container) {
    return container.clientWidth / Math.max(container.clientHeight, 1);
}

export function positionSceneObjectsForViewport(sceneObjects, camera, container) {
    const stageSize = getStageSize(container);
    const anchorPosition = new THREE.Vector3();

    camera.updateWorldMatrix(true, false);

    sceneObjects.forEach((object) => {
        const anchor = object.userData.viewportAnchor;
        const layout = anchor?.userData.viewportLayout;

        if (!layout) {
            return;
        }

        const distance = layout.distance ?? 6;
        const isTopLeft = layout.anchor === "top-left";

        let x = layout.x ?? 0.5;
        let y = layout.y ?? 0.5;
        let offsetX = 0;
        let offsetY = 0;

        anchor.scale.setScalar(1);

        if (isTopLeft) {
            if (layout.faceCamera === false) {
                throw new Error("Top-left layout requires faceCamera.");
            }

            const width = layout.width ?? 64;
            const insetX = layout.inset?.x ?? 24;
            const insetY = layout.inset?.y ?? 24;

            /* prettier-ignore */
            if (
                !Number.isFinite(width) || 
                width <= 0 || 
                !Number.isFinite(insetX) || 
                !Number.isFinite(insetY)
            ) {
                throw new Error("Invalid viewport width or inset.");
            }

            if (!object.geometry.boundingBox) {
                object.geometry.computeBoundingBox();
            }

            const bounds = object.geometry.boundingBox;
            const geometryWidth = bounds.max.x - bounds.min.x;

            if (geometryWidth <= 0) {
                throw new Error("Viewport objects require non-zero width.");
            }

            const worldUnitsPerPixel = (2 * distance) / (camera.projectionMatrix.elements[5] * stageSize.height);
            const layoutScale = (width * worldUnitsPerPixel) / geometryWidth;

            anchor.scale.setScalar(layoutScale);

            x = insetX / stageSize.width;
            y = insetY / stageSize.height;

            offsetX = -bounds.min.x * layoutScale;
            offsetY = -bounds.max.y * layoutScale;
        }

        /* prettier-ignore */
        if (
            !Number.isFinite(x) || 
            !Number.isFinite(y) || 
            !Number.isFinite(distance) || 
            distance <= 0
        ) {
            throw new Error("Invalid viewport layout coordinates or distance.");
        }

        /* prettier-ignore */
        anchorPosition.set(
            x * 2 - 1,
            1 - y * 2,
            0
        ).unproject(camera);

        camera.worldToLocal(anchorPosition);

        anchorPosition.multiplyScalar(distance / -anchorPosition.z);
        anchorPosition.x += offsetX;
        anchorPosition.y += offsetY;

        camera.localToWorld(anchorPosition);
        anchor.position.copy(anchorPosition);

        if (layout.faceCamera ?? true) {
            camera.getWorldQuaternion(anchor.quaternion);
        } else {
            anchor.quaternion.identity();
        }
    });
}
