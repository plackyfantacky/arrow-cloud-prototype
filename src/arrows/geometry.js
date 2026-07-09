import * as THREE from "three";

const rectangularExtrusionFaceCount = 4;
const rectangularExtrusionVerticesPerFace = 2;
const rectangularExtrusionVerticesPerRing = rectangularExtrusionFaceCount * rectangularExtrusionVerticesPerFace;

export function createRectangularExtrusionGeometry(settings, divisions, getSweepState) {
    const halfWidth = settings.bodyWidth * 0.5;
    const halfDepth = settings.bodyDepth * 0.5;

    const vertices = [];
    const indices = [];

    for (let stepIndex = 0; stepIndex <= divisions; stepIndex++) {
        const progress = stepIndex / divisions;
        const sweepState = getSweepState(progress);

        addRectangularRingVertices(
            vertices,
            sweepState.position,
            sweepState.frame,
            halfWidth,
            halfDepth
        );
    }

    for (let stepIndex = 0; stepIndex < divisions; stepIndex++) {
        addRectangularRingConnectionIndices(indices, stepIndex);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

function addRectangularRingVertices(vertices, position, frame, halfWidth, halfDepth) {
    const corners = createRectangularRingCorners(
        position,
        frame,
        halfWidth,
        halfDepth
    );

    const faceCornerPairs = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0]
    ];

    faceCornerPairs.forEach(([firstCornerIndex, secondCornerIndex]) => {
        const firstCorner = corners[firstCornerIndex];
        const secondCorner = corners[secondCornerIndex];

        vertices.push(firstCorner.x, firstCorner.y, firstCorner.z);
        vertices.push(secondCorner.x, secondCorner.y, secondCorner.z);
    })
}

function addRectangularRingConnectionIndices(indices, stepIndex) {
    const currentRingStart = stepIndex * rectangularExtrusionVerticesPerRing;
    const nextRingStart = (stepIndex + 1) * rectangularExtrusionVerticesPerRing;

    for (let faceIndex = 0; faceIndex < rectangularExtrusionFaceCount; faceIndex++) {
        const currentFirst = currentRingStart + faceIndex * rectangularExtrusionVerticesPerFace;
        const currentSecond = currentFirst + 1;

        const nextFirst = nextRingStart + faceIndex * rectangularExtrusionVerticesPerFace;
        const nextSecond = nextFirst + 1;

        indices.push(
            currentFirst, nextSecond, currentSecond,
            currentFirst, nextFirst, nextSecond
        );
    }
}

function createRectangularRingCorners(position, frame, halfWidth, halfDepth) {
    return [
        position.clone()
            .add(frame.normal.clone().multiplyScalar(halfDepth))
            .add(frame.side.clone().multiplyScalar(halfWidth)),

        position.clone()
            .add(frame.normal.clone().multiplyScalar(halfDepth))
            .sub(frame.side.clone().multiplyScalar(halfWidth)),

        position.clone()
            .sub(frame.normal.clone().multiplyScalar(halfDepth))
            .sub(frame.side.clone().multiplyScalar(halfWidth)),

        position.clone()
            .sub(frame.normal.clone().multiplyScalar(halfDepth))
            .add(frame.side.clone().multiplyScalar(halfWidth)),
    ];
}