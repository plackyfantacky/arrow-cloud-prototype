import * as THREE from 'three';

export function createHemisphereLight(settings) {
    return new THREE.HemisphereLight(
        settings.skyColour ?? '#ffffff',
        settings.groundColour ?? '#444444',
        settings.intensity ?? 1
    );
}