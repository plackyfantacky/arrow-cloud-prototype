import * as THREE from "three";

import { applyObjectProjection } from "../shaders/applyObjectProjection.js";

import { createGeometry } from "../primitives/geometry/createGeometry.js";
import { createIdleMotion } from "../animation/createIdleMotion.js";

import { createGeometryModifiers } from "../primitives/geometry/createGeometryModifiers.js";

export function createSceneObjects(scene, definitions = []) {
    const objectsById = new Map();

    definitions.forEach((definition) => {
        if (typeof definition.id !== "string" || definition.id.trim() === "") {
            throw new Error("Scene objects require a non-empty id.");
        }

        if (objectsById.has(definition.id)) {
            throw new Error(`Duplicate scene object id: ${definition.id}`);
        }

        if (definition.type !== "mesh") {
            throw new Error(`Unsupported scene object type: ${definition.type}`);
        }

        const geometry = createGeometry(definition.geometry);
        const geometryModifiers = createGeometryModifiers(geometry, definition.modifiers);

        const materialSettings = definition.material ?? {};
        const opacity = materialSettings.opacity ?? 1;

        const material = new THREE.MeshStandardMaterial({
            color: materialSettings.colour ?? "#FF9D2A",
            roughness: materialSettings.roughness ?? 0.45,
            metalness: materialSettings.metalness ?? 0.15,
            opacity,
            transparent: opacity < 1,
        });

        const mesh = new THREE.Mesh(geometry, material);
        if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
        }

        mesh.userData.layoutBounds = geometry.boundingBox.clone();

        applyObjectProjection(mesh, definition.projection);

        mesh.name = definition.name ?? definition.id;
        mesh.userData.sceneObjectId = definition.id;

        mesh.userData.modifiers = geometryModifiers.states;
        mesh.userData.updateModifiers = geometryModifiers.update;

        mesh.position.fromArray(definition.position ?? [0, 0, 0]);
        mesh.rotation.set(...(definition.rotation ?? [0, 0, 0]));
        mesh.scale.fromArray(definition.scale ?? [1, 1, 1]);

        mesh.visible = definition.visible ?? true;
        mesh.castShadow = definition.castShadow ?? true;
        mesh.receiveShadow = definition.receiveShadow ?? true;

        const poseGroup = new THREE.Group();
        const motionGroup = new THREE.Group();

        poseGroup.add(motionGroup);
        motionGroup.add(mesh);

        mesh.userData.poseGroup = poseGroup;
        mesh.userData.motionGroup = motionGroup;
        
        mesh.userData.animation = definition.animation ?? {};
        mesh.userData.interactions = definition.interactions ?? {};

        if (definition.idle) {
            mesh.userData.idleMotion = createIdleMotion(motionGroup, definition.idle);
        }

        if (definition.layout?.space === "viewport") {
            const anchor = new THREE.Group();

            anchor.userData.viewportLayout = definition.layout;
            anchor.add(poseGroup);

            mesh.userData.viewportAnchor = anchor;

            scene.add(anchor);
        } else {
            scene.add(poseGroup);
        }

        objectsById.set(definition.id, mesh);
    });

    return objectsById;
}
