import * as THREE from 'three';

export function createCameraUpMarker(
    scene,
    size = 0.5
) {
    const marker = new THREE.Group();

    const material = new THREE.LineBasicMaterial({
        color: 0x54D6C0,
        depthTest: false
    });

    const headLength = size * 0.2;
    const headWidth = size * 0.1;

    const shaftGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, size, 0)
    ]);

    const leftHeadGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, size, 0),
        new THREE.Vector3(-headWidth, size - headLength, 0)
    ]);

    const rightHeadGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, size, 0),
        new THREE.Vector3(headWidth, size - headLength, 0)
    ]);

    const shaft = new THREE.Line( shaftGeometry, material);
    const leftHead = new THREE.Line(leftHeadGeometry, material);
    const rightHead = new THREE.Line(rightHeadGeometry, material);

    marker.add(
        shaft,
        leftHead,
        rightHead
    );

    marker.renderOrder = 1000;
    marker.userData.editorHelper = true;

    scene.add(marker);

    function setPosition(position) {
        marker.position.copy(position);
    }

    function setDirection(direction) {
        marker.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
    }

    function setVisible(isVisible) {
        marker.visible = isVisible;
    }

    function destroy() {
        scene.remove(marker);

        shaftGeometry.dispose();
        leftHeadGeometry.dispose();
        rightHeadGeometry.dispose();
        material.dispose();
    }

    return {
        setPosition,
        setDirection,
        setVisible,
        destroy
    };
}