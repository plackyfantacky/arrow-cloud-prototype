import * as THREE from 'three';

export function createAmbientLight(settings) {
    return new THREE.AmbientLight(
        settings.colour ?? '#ffffff',
        settings.intensity ?? 1
    );
}