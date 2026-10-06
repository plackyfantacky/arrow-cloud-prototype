import * as THREE from 'three';

export function createCameraTargetMarker(scene, size = 0.5) {

    const normalColour = 0x000000;
    const intersectColour = 0xFFD84D;

    const halfSize = size / 2;

    const armDefinitions = {
        positiveX: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(halfSize, 0, 0)
        ],
        negativeX: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(-halfSize, 0, 0)
        ],
        positiveY: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, halfSize, 0)
        ],
        negativeY: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -halfSize, 0)
        ],
        positiveZ: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, halfSize)
        ],
        negativeZ: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -halfSize)
        ]
    };

    const marker = new THREE.Group();
    const arms = {};

    Object.entries(armDefinitions).forEach(([armName, points]) => {
        const geometry =
            new THREE.BufferGeometry().setFromPoints(points);

        const material = new THREE.LineBasicMaterial({
            color: normalColour,
            depthTest: false
        });

        const arm = new THREE.Line(
            geometry,
            material
        );

        arm.renderOrder = 1000;

        marker.add(arm);
        arms[armName] = arm;
    });

    scene.add(marker);

    function setPosition(position) {
        marker.position.copy(position);
    }

    function setVisible(isVisible) {
        marker.visible = isVisible;
    }

    function setArmIntersecting(armName, isIntersecting) {
        const arm = arms[armName];

        if (!arm) {
            return;
        }

        arm.material.color.setHex(
            isIntersecting
                ? intersectColour
                : normalColour
        );
    }

    function destroy() {
        scene.remove(marker);
        
        Object.values(arms).forEach((arm) => {
            arm.geometry.dispose();
            arm.material.dispose();
        });   
    }

    return {
        setPosition,
        setVisible,
        setArmIntersecting,
        destroy
    };
}