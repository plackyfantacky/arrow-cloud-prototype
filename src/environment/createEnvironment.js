import * as THREE from "three";

import { createBoxEnvironment } from "./boxEnvironment.js";
import { createGradientEnvironment } from "./gradientEnvironment.js";

export function createEnvironment(scene, environmentSettings) {
    if (!environmentSettings) {
        scene.background = new THREE.Color(0xFFFFFF);
        return null;
    }

    const fogSettings = environmentSettings.fog;

    scene.fog = fogSettings
        ? new THREE.Fog(
            fogSettings.colour ?? '#FFE4D3',
            fogSettings.near ?? 10,
            fogSettings.far ?? 35
        )
        : null;

    switch (environmentSettings.type) {
        case "box":
            return createBoxEnvironment(scene, environmentSettings);
        
        case "gradient":
            return createGradientEnvironment(scene, environmentSettings);
        
        default:
            scene.background = new THREE.Color(0xffffff);
            return null;
    }
}