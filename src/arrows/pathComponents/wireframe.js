import * as THREE from 'three';
import { setupPathComponentMesh } from "./setupPathComponentMesh";

export function createWireframePathComponent(component) {
    const width = component.size?.width || 1;
    const height = component.size?.height || 1;
    const depth = component.size?.depth || 0.1;

    const geometry = new THREE.BoxGeometry(
        height,
        depth, 
        width
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    return setupPathComponentMesh(mesh, component);
}