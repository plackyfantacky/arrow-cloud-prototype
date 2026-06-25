import * as THREE from 'three';

export function createArrowNameLabel(text, segment) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 1024;
    canvas.height = 256;

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.font = '150px system-ui, sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'middle';

    context.fillStyle = '#FFFFFF';
    context.fillText(text, 48, canvas.height * 0.5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(2.4, 0.6);
    const mesh = new THREE.Mesh(geometry, material);

    const worldUp = new THREE.Vector3(0, 1, 0);

    const labelForward = segment.frame.forward.clone().normalize();

    const labelSide = new THREE.Vector3()
        .crossVectors(worldUp, labelForward)
        .normalize();

    const correctedForward = new THREE.Vector3()
        .crossVectors(labelSide, worldUp)
        .normalize();

    const position = segment.startPoint.clone()
        .add(correctedForward.clone().multiplyScalar(1.2))
        .add(worldUp.clone().multiplyScalar(0.055));

    const matrix = new THREE.Matrix4();
    matrix.makeBasis(
        correctedForward,
        labelSide,
        worldUp
    );

    mesh.position.copy(position);
    mesh.quaternion.setFromRotationMatrix(matrix);

    return mesh;
}