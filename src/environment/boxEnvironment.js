import * as THREE from "three";

export function createBoxEnvironment(scene, settings) {
    const geometry = new THREE.BoxGeometry(
        settings.size.x,
        settings.size.y,
        settings.size.z
    );

    const material = new THREE.MeshStandardMaterial({
        color: settings.colour,
        side: THREE.BackSide
    });

    const environment = new THREE.Mesh(
        geometry,
        material
    );

    environment.receiveShadow = true;

    const position = settings.position ?? {};

    environment.position.set(
        position.x ?? 0,
        position.y ?? 0,
        position.z ?? 0
    );

    scene.add(environment);

    return environment;
}