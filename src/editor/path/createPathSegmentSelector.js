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

    function handlePointerDown(event) {
        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects(getObjects(), true);
        const pathInfoSource = intersections
            .map((intersection) => getPathInfoSource(intersection.object))
            .find((sourceObject) => sourceObject?.visible);
        
        if (!pathInfoSource) {
            onDeselect?.();
            return;
        }

        onSelect(pathInfoSource.userData.pathInfo);
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    return {
        destroy() {
            renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        }
    };
}