import * as THREE from 'three';

export function setupPathComponentMesh(mesh, component) {
    const height = component.size?.height || 1;

    const matrix = new THREE.Matrix4();
    
    matrix.makeBasis(
        component.frame.forward,
        component.frame.normal,
        component.frame.side
    );

    const anchor = component.placement?.anchor || 'start';
    
    const anchorOffset = new THREE.Vector3();

    if (anchor === 'start') {
        anchorOffset.add(
            component.frame.forward.clone().multiplyScalar(height * 0.5)
        )
    }

    if (anchor === 'end') {
        anchorOffset.add(
            component.frame.forward.clone().multiplyScalar(height * -0.5)
        )
    }

    const offsetPosition = component.position.clone().add(anchorOffset);

    mesh.position.copy(offsetPosition);
    
    mesh.quaternion.setFromRotationMatrix(matrix);

    mesh.userData.pathComponent = component;

    mesh.userData.timing = {
        delay: component.timing?.delay || 0,
        duration: component.timing?.duration || 1
    };

    mesh.userData.startScale = new THREE.Vector3(
        0.05, 1, 0.2
    );

    mesh.userData.targetScale = new THREE.Vector3(
        1, 1, 1
    );

    mesh.scale.copy(mesh.userData.startScale);
    mesh.visible = false;

    return mesh;
}