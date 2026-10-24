import * as THREE from 'three';

import { createAmbientLight } from "./createAmbientLight.js";
import { createDirectionalLight } from "./createDirectionalLight.js";
import { createHemisphereLight } from "./createHemisphereLight.js";

const defaultLights = [
    {
        type: 'hemisphere',
        skyColour: '#ffffff',
        groundColour: '#777777',
        intensity: 1.5
    },
    {
        type: 'directional',
        colour: '#ffffff',
        intensity: 2,
        position: {
            x: 10,
            y: 16,
            z: 8
        }
    }
];

export function createLights(scene, settings = {}) {
    const lights = [];

    const lightSettingsList = settings?.lights ?? defaultLights;

    lightSettingsList.forEach((lightSettings) => {
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
