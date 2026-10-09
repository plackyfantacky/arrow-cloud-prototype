import * as THREE from "three";

import { createBoxEnvironment } from "./boxEnvironment.js";
import { createGradientEnvironment } from "./gradientEnvironment.js";

export function createEnvironment(scene, environmentSettings) {
    if (!environmentSettings) {
        scene.background = new THREE.Color(0xFFFFFF);
        return null;
    }

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