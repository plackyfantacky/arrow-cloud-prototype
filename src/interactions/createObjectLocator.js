import * as THREE from "three";

export function createObjectLocator(scene, camera, element) {
    const raycaster = new THREE.Raycaster();
    const pointerPosition = new THREE.Vector2();
    const vertex = new THREE.Vector3();
    const modelViewMatrix = new THREE.Matrix4();

    function intersectMesh(object) {
        const perspective = object.userData.projection?.perspective ?? 1;

        modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld);

        const centreZ = modelViewMatrix.elements[14];

        if (!camera.isPerspectiveCamera || perspective === 1 || centreZ >= -0.0001) {
            return raycaster.intersectObject(object, false);
        }

        const geometry = object.geometry.clone();

        try {
            const positions = geometry.getAttribute("position");

            for (let i = 0; i < positions.count; i++) {
                vertex.fromBufferAttribute(positions, i);
                vertex.applyMatrix4(modelViewMatrix);

                const correction = perspective + ((1 - perspective) * vertex.z) / centreZ;

                vertex.x *= correction;
                vertex.y *= correction;

                vertex.applyMatrix4(camera.matrixWorld);

                positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
            }

            geometry.boundingBox = null;
            geometry.boundingSphere = null;

            const projectionMesh = new THREE.Mesh(geometry, object.material);

            projectionMesh.layers.mask = object.layers.mask;

            const hits = raycaster.intersectObject(projectionMesh, false);

            hits.forEach((hit) => {
                hit.object = object;
            });

            return hits;
        } finally {
            geometry.dispose();
        }
    }

    function getObjectAtPointer(event) {
        const bounds = element.getBoundingClientRect();

        if (
            bounds.width === 0 ||
            bounds.height === 0 ||
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
        ) {
            return null;
        }

        pointerPosition.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, 1 - ((event.clientY - bounds.top) / bounds.height) * 2);

        scene.updateMatrixWorld(true);
        camera.updateWorldMatrix(true, false);

        raycaster.layers.mask = camera.layers.mask;
        raycaster.setFromCamera(pointerPosition, camera);

        let nearestHit = null;

        function visit(object) {
            if (!object.visible || object.userData.editorHelper) {
                return;
            }

            if (object.isMesh) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];

                const isVisible = materials.some((material) => {
                    return material?.visible && (!material.transparent || material.opacity > 0);
                });

                if (isVisible) {
                    const hit = intersectMesh(object)[0];

                    if (hit && (!nearestHit || hit.distance < nearestHit.distance)) {
                        nearestHit = hit;
                    }
                }
            }

            object.children.forEach(visit);
        }

        visit(scene);

        return nearestHit?.object ?? null;
    }

    return getObjectAtPointer;
}
