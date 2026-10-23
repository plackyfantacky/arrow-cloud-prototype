import * as THREE from "three";

import { TransformControls } from "three/addons/controls/TransformControls.js";

export function createPathOriginMarkers({
    camera,
    renderer,
    scene,
    onSelect = () => {},
    onDragStateChange = () => {},
    onOriginChange = () => {},
    onOriginMove = () => {},
}) {
    const geometry = new THREE.SphereGeometry(0.16, 12, 8);

    const material = new THREE.MeshBasicMaterial({
        color: 0xff9d2a,
        depthTest: false,
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const markers = new Map();

    const transformControls = new TransformControls(camera, renderer.domElement);

    transformControls.setMode("translate");
    transformControls.setSpace("world");

    transformControls.addEventListener("dragging-changed", (event) => {
        onDragStateChange(event.value);
    });

    transformControls.addEventListener("mouseUp", () => {
        if (!selectedMarker) {
            return;
        }

        onOriginChange(selectedMarker.userData.arrowName, selectedMarker.position.clone());
    });

    transformControls.addEventListener("objectChange", () => {
        if (!selectedMarker || !transformControls.dragging) {
            return;
        }

        onOriginMove(selectedMarker.userData.arrowName, selectedMarker.position.clone());
    });

    const transformHelper = transformControls.getHelper();
    transformHelper.userData.editorHelper = true;

    scene.add(transformHelper);

    let selectedMarker = null;

    function sync(arrowPaths) {
        const currentNames = new Set();

        arrowPaths.forEach((arrowPath) => {
            // Viewport entries cannot yet be edited in world space.
            if (arrowPath.entry?.position === "viewport") {
                return;
            }

            currentNames.add(arrowPath.name);

            let marker = markers.get(arrowPath.name);

            if (!marker) {
                marker = new THREE.Mesh(geometry, material);
                marker.userData.editorHelper = true;
                marker.userData.arrowName = arrowPath.name;
                marker.renderOrder = 100;

                markers.set(arrowPath.name, marker);
                scene.add(marker);
            }

            marker.position.fromArray(arrowPath.origin);
        });

        markers.forEach((marker, arrowName) => {
            if (!currentNames.has(arrowName)) {
                scene.remove(marker);
                markers.delete(arrowName);
            }
        });
    }

    function getMarkerAt(clientX, clientY) {
        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const intersections = raycaster.intersectObjects([...markers.values()], false);

        return intersections[0]?.object ?? null;
    }

    function selectAt(clientX, clientY) {
        const marker = getMarkerAt(clientX, clientY);

        if (!marker) {
            return false;
        }

        selectedMarker = marker;
        transformControls.attach(marker);

        onSelect(marker.userData.arrowName, marker);

        return true;
    }

    function isGizmoAt(clientX, clientY) {
        if (!selectedMarker) {
            return false;
        }

        const bounds = renderer.domElement.getBoundingClientRect();

        pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
        pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        return raycaster.intersectObject(transformHelper, true).length > 0;
    }

    function isOtherMarkerAt(clientX, clientY) {
        const marker = getMarkerAt(clientX, clientY);

        return marker !== null && marker !== selectedMarker;
    }

    function isDragging() {
        return transformControls.dragging;
    }

    function isGizmoActive() {
        return transformControls.dragging || transformControls.axis !== null;
    }

    function clearSelection() {
        selectedMarker = null;
        transformControls.detach();
    }

    function destroy() {
        clearSelection();

        scene.remove(transformHelper);
        transformControls.dispose();

        markers.forEach((marker) => {
            scene.remove(marker);
        });

        markers.clear();
        geometry.dispose();
        material.dispose();
    }

    return {
        sync,
        selectAt,
        getMarkerAt,
        isGizmoAt,
        isOtherMarkerAt,
        isDragging,
        isGizmoActive,
        clearSelection,
        destroy,
    };
}
