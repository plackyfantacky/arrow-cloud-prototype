import * as THREE from "three";

import { getDebugInfoSource } from "./createDebugControls.js";

export function createDebugSegmentSelector({ camera, renderer, getObjects, onSelect }) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function handlePointerDown(event) {
        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects(getObjects(), true);
        const debugInfoSource = intersections
            .map((intersection) => getDebugInfoSource(intersection.object))
            .find((sourceObject) => sourceObject?.visible);
        
        if (!debugInfoSource) {
            return;
        }

        onSelect(debugInfoSource.userData.debugInfo);
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    return {
        destroy() {
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        }
    };
}