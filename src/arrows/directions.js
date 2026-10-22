import * as THREE from "three";

export const directions = {
    '+x': new THREE.Vector3(1, 0, 0),
    '+y': new THREE.Vector3(0, 1, 0),
    '+z': new THREE.Vector3(0, 0, 1),
    '-x': new THREE.Vector3(-1, 0, 0),
    '-y': new THREE.Vector3(0, -1, 0),
    '-z': new THREE.Vector3(0, 0, -1),
}

export function getDirectionVector(directionValue) {
    if (
        Array.isArray(directionValue) &&
        directionValue.length === 3 &&
        directionValue.every(Number.isFinite)
    ) {
        return new THREE.Vector3(...directionValue);
    }

    const direction = directions[directionValue];

    if(!direction) {
        throw new Error(`Unknown direction: ${directionValue}`);
    }

    return direction.clone();
}