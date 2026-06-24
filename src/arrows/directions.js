import * as THREE from 'three';

export const directions = {
    '+x': new THREE.Vector3(1, 0, 0),
    '+y': new THREE.Vector3(0, 1, 0),
    '+z': new THREE.Vector3(0, 0, 1),
    '-x': new THREE.Vector3(-1, 0, 0),
    '-y': new THREE.Vector3(0, -1, 0),
    '-z': new THREE.Vector3(0, 0, -1),
}

export function getDirectionVector(directionName) {
    const direction = directions[directionName];

    if(!direction) {
        throw new Error(`Unknown direction: ${directionName}`);
    }

    return direction.clone();
}