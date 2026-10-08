import * as THREE from 'three';

import { createAmbientLight } from "./createAmbientLight.js";
import { createDirectionalLight } from "./createDirectionalLight.js";
import { createHemisphereLight } from "./createHemisphereLight.js";

export function createLights(scene, settings = {}) {
    const lights = [];

    (settings.lights ?? []).forEach((lightSettings) => {
        let light = null;
        
        switch (lightSettings.type) {
            case 'ambient':
                light = createAmbientLight(lightSettings);
            break;
            case 'directional':
                light = createDirectionalLight(lightSettings);
            break;
            case 'hemisphere':
                light = createHemisphereLight(lightSettings);
            break;
        }

        if (!light) {
            return;
        }

        scene.add(light);
        
        if (light.target) {
            scene.add(light.target);
        }

        lights.push(light);
    });

    return lights;
}
