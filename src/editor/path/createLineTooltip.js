import * as THREE from "three";

import { getPathInfoSource } from "./getPathInfoSource.js";

export function createLineTooltip({ camera, renderer, getObjects }) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const tooltip = document.createElement("div");

    tooltip.style.position = 'fixed';
    tooltip.style.left = '0';
    tooltip.style.top = '0';
    tooltip.style.zIndex = '20';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.padding = '0.4rem 0.55rem';
    tooltip.style.background = 'rgba(0, 0, 0, 0.82)';
    tooltip.style.color = '#fff';
    tooltip.style.fontFamily = 'system-ui, sans-serif';
    tooltip.style.fontSize = '12px';
    tooltip.style.lineHeight = '1.35';
    tooltip.style.borderRadius = '0.35rem';
    tooltip.style.whiteSpace = 'pre-line';
    tooltip.style.transform = 'translate(12px, 12px)';
    tooltip.style.display = 'none';

    document.body.appendChild(tooltip);

    let hasPointer = false;
    let pointerClientX = 0;
    let pointerClientY = 0;

    function hideTooltip() {
        hasPointer = false;
        tooltip.style.display = 'none';
    }

    function handlePointerMove(event) {
        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1);

        pointerClientX = event.clientX;
        pointerClientY = event.clientY;
        hasPointer = true;
    }

    function update() {
        if (!hasPointer) {
            return;
        }

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects(getObjects(), true);

        const pathInfoSource = intersections
            .map((intersection) => getPathInfoSource(intersection.object))
            .find((sourceObject) => sourceObject?.visible);

        if (!pathInfoSource) {
            tooltip.style.display = 'none';
            return;
        }

        const pathInfo = pathInfoSource.userData.pathInfo;

        tooltip.textContent = [
            `arrowName: ${pathInfo.arrowName}`,
            `segmentIndex: ${pathInfo.segmentIndex}`,
            `actionName: ${pathInfo.actionName}`,
            `segmentLength: ${pathInfo.segmentLength.toFixed(2)}`
        ].join('\n');

        tooltip.style.left = `${pointerClientX}px`;
        tooltip.style.top = `${pointerClientY}px`;
        tooltip.style.display = 'block';
    }

    function destroy() {
        renderer.domElement.removeEventListener('pointermove', handlePointerMove);
        renderer.domElement.removeEventListener('pointerleave', hideTooltip);
        tooltip.remove();
    }

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', hideTooltip);

    return {
        update,
        destroy
    };

}