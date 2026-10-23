import * as THREE from "three";

import { getPathInfoSource } from "./getPathInfoSource.js";

export function createPathSegmentSelector({
    camera,
    renderer,
    getObjects,
    onSelect,
    onDeselect
}) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const clickThreshold = 5;

    let pointerDownPosition = null;
    let activePointerId = null;

    function handlePointerDown(event) {
        if (event.button !== 0 || activePointerId !== null) {
            return;
        }

        activePointerId = event.pointerId;

        pointerDownPosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    function handlePointerUp(event) {
        if (
            event.pointerId !== activePointerId ||
            !pointerDownPosition
        ) {
            return;
        }

        const distance = Math.hypot(
            event.clientX - pointerDownPosition.x,
            event.clientY - pointerDownPosition.y
        );

        resetPointer();

        if (distance > clickThreshold) {
            return;
        }

        selectAtPosition(event.clientX, event.clientY);
    }

    function selectAtPosition(clientX, clientY) {
        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -(((clientY - bounds.top) / bounds.height) * 2 - 1);

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects(getObjects(), true);

        const pathInfoSource = intersections
            .map((intersection) => getPathInfoSource(intersection.object))
            .find((sourceObject) => sourceObject?.visible);

        if (!pathInfoSource) {
            onDeselect?.();
            return;
        }

        onSelect?.(pathInfoSource.userData.pathInfo);
    }

    function resetPointer() {
        pointerDownPosition = null;
        activePointerId = null;
    }

    renderer.domElement.addEventListener(
        "pointerdown",
        handlePointerDown
    );

    renderer.domElement.addEventListener(
        "pointerup",
        handlePointerUp
    );

    renderer.domElement.addEventListener(
        "pointercancel",
        resetPointer
    );

    return {
        destroy() {
            renderer.domElement.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            renderer.domElement.removeEventListener(
                "pointerup",
                handlePointerUp
            );

            renderer.domElement.removeEventListener(
                "pointercancel",
                resetPointer
            );
        }
    };
}