import * as THREE from "three";

import { createBoxEnvironment } from "./boxEnvironment";

export function createEnvironment(scene, environmentSettings) {
    if (!environmentSettings) {
        scene.background = new THREE.Color(0xFFFFFF);
        return null;
    }

    if (environmentSettings.type === 'box') {
        return createBoxEnvironment(
            scene,
            environmentSettings
        );
    }

    scene.background = new THREE.Color(0xFFFFFF);

    return null;
}