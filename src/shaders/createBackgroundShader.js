import { createAtmosphericSky } from './backgrounds/atmosphericSky.js';

export function createBackgroundShader(scene, settings) {
    if (!settings) {
        return null;
    }

    switch (settings.type) {
        case 'atmosphericSky': {
            const sky = createAtmosphericSky(settings);
            scene.add(sky);

            return sky;
        }

        default:
            return null;
    }
}