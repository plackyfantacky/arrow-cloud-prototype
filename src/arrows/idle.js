import * as THREE from "three";

export function createArrowMotionGroup(arrow, arrowPath) {
    const motionGroup = new THREE.Group();

    const pivot = new THREE.Vector3(
        arrowPath.origin[0],
        arrowPath.origin[1],
        arrowPath.origin[2]
    );

    motionGroup.position.copy(pivot);

    arrow.position.sub(pivot);

    motionGroup.add(arrow);

    motionGroup.userData.basePosition = motionGroup.position.clone();

    return motionGroup;
}

export function updateArrowIdleMotion(motionGroup, idleSettings, currentTime) {
    if (!idleSettings) {
        return;
    }

    const position = idleSettings.position ?? {};
    const rotation = idleSettings.rotation ?? {};
    const speed = idleSettings.speed ?? 0.2;
    const phase = idleSettings.phase ?? 0;

    const motionTime = currentTime * speed;

    motionGroup.position.x = motionGroup.userData.basePosition.x + Math.sin(motionTime + phase) * (position.x ?? 0);
    motionGroup.position.y = motionGroup.userData.basePosition.y + Math.sin(motionTime * 0.73 + phase * 1.7) * (position.y ?? 0);
    motionGroup.position.z = motionGroup.userData.basePosition.z + Math.sin(motionTime * 0.51 + phase * 0.6) * (position.z ?? 0);

    motionGroup.rotation.x = Math.sin(motionTime * 0.61 + phase) * (rotation.x ?? 0);
    motionGroup.rotation.y = Math.sin(motionTime * 0.43 + phase * 1.3) * (rotation.y ?? 0);
    motionGroup.rotation.z = Math.sin(motionTime * 0.37 + phase * 0.8) * (rotation.z ?? 0);
}