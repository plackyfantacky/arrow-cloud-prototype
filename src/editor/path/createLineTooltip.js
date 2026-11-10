import * as THREE from "three";

import { getPathInfoSource } from "./getPathInfoSource.js";
import lineTooltipTemplate from "./lineTooltip.html";

export function createLineTooltip({ camera, renderer, getObjects }) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const template = document.createElement("template");
    template.innerHTML = lineTooltipTemplate;

    const tooltip = template.content.firstElementChild.cloneNode(true);

    document.body.appendChild(tooltip);

    let hasPointer = false;
    let pointerClientX = 0;
    let pointerClientY = 0;

    function hideTooltip() {
        hasPointer = false;
        tooltip.hidden = true;
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
            tooltip.hidden = true;
            return;
        }

        const pathInfo = pathInfoSource.userData.pathInfo;

        tooltip.textContent = [
            `arrowName: ${pathInfo.arrowName}`,
            `segmentIndex: ${pathInfo.segmentIndex + 1}`,
            `actionName: ${pathInfo.actionName}`,
            `segmentLength: ${pathInfo.segmentLength.toFixed(2)}`
        ].join('\n');

        tooltip.style.left = `${pointerClientX}px`;
        tooltip.style.top = `${pointerClientY}px`;
        tooltip.hidden = false;
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