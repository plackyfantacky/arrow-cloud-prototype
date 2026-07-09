import * as THREE from "three";

export function createArrowHead(endPoint, frame, material, settings) {
    const geometry = createArrowHeadGeometry(settings);
    const mesh = new THREE.Mesh(geometry, material);

    const matrix = new THREE.Matrix4();

    matrix.makeBasis(
        frame.forward,
        frame.normal,
        frame.side
    );

    mesh.position.copy(endPoint);
    mesh.quaternion.setFromRotationMatrix(matrix);

    return mesh;
}

export function createArrowHeadGeometry(settings) {
    const length = settings.headLength;
    const halfWidth = settings.headWidth * 0.5;
    const halfDepth = settings.bodyDepth * 0.5;

    const backY = -halfDepth;
    const frontY = halfDepth;

    const vertices = new Float32Array([
        //back face
        0, backY, -halfWidth,
        0, backY, halfWidth,
        length, backY, 0,

        //front face
        0, frontY, -halfWidth,
        0, frontY, halfWidth,
        length, frontY, 0,
    ]);

    const indices = [
        //back triangle
        0, 2, 1,

        //front triangle
        3, 4, 5,

        //base edge face
        0, 4, 3,
        0, 1, 4,

        //right edge face
        1, 5, 4,
        1, 2, 5,

        //left edge face
        2, 3, 5,
        2, 0, 3
    ];

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(vertices, 3)
    );

    geometry.setIndex(indices);

    const nonIndexedGeometry = geometry.toNonIndexed();
    nonIndexedGeometry.computeVertexNormals();

    return nonIndexedGeometry;
}