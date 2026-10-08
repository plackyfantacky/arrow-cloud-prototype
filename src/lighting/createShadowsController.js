import * as THREE from 'three';

export function createShadowsController(renderer, dataset) {
    renderer.shadowMap.enabled = dataset.lighting?.shadows ?? false;

    renderer.shadowMap.type = THREE.VSMShadowMap;

    //more coming later
}