import * as THREE from 'three';

export function createDirectionalLight(settings) {
    const light = new THREE.DirectionalLight(
        settings.colour ?? '#ffffff',
        settings.intensity ?? 1
    );

    const position = settings.position ?? {};

    light.position.set(
        position.x ?? 0,
        position.y ?? 10,
        position.z ?? 0
    );

    const target = settings.target ?? {};

    light.target.position.set(
        target.x ?? 0,
        target.y ?? 0,
        target.z ?? 0
    );

    light.castShadow = settings.castShadow ?? false;

    if (light.castShadow) {
        configureDirectionalShadow(
            light,
            settings.shadow
        );
    }

    return light;
}

function configureDirectionalShadow(light, settings = {}) {
    const mapSize = settings.mapSize ?? 1024;
    const camera = settings.camera ?? {};

    light.shadow.mapSize.set(
        mapSize,
        mapSize
    );

    light.shadow.radius = settings.shadow?.radius ?? 4;
    light.shadow.blurSamples = settings.shadow?.blurSamples ?? 8;

    light.shadow.camera.near = camera.near ?? 0.5;
    light.shadow.camera.far = camera.far ?? 100;
    light.shadow.camera.left = camera.left ?? -20;
    light.shadow.camera.right = camera.right ?? 20;
    light.shadow.camera.top = camera.top ?? 20;
    light.shadow.camera.bottom = camera.bottom ?? -20;

    light.shadow.bias = settings.bias ?? 0;
    light.shadow.normalBias = settings.normalBias ?? 0;
}