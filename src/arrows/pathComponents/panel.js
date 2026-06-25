import * as THREE from 'three';
import { setupPathComponentMesh } from "./setupPathComponentMesh";

export function createPanelPathComponent(component) {
    const width = component.size?.width || 1;
    const height = component.size?.height || 1;
    const depth = component.size?.depth || 0.1;

    const geometry = new THREE.BoxGeometry(
        height,
        depth, 
        width
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0xff9d2a,
        roughness: 0.5,
        metalness: 0.1,
        flatShading: true
    });

    const mesh = new THREE.Mesh(geometry, material);

    const frameThickness = component.frameThickness ?? 0.12;

    const faceGeometry = new THREE.PlaneGeometry(
        Math.max(0.01, height - frameThickness * 2),
        Math.max(0.01, width - frameThickness * 2),
    );

    const faceMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);

    faceMesh.position.y = (depth * 0.5) + 0.002;
    faceMesh.rotation.x = -Math.PI * 0.5;

    mesh.add(faceMesh);

    return setupPathComponentMesh(mesh, component);
}