import * as THREE from "three";

import { applyFrameToObject } from "./frame.js";

export function createArrowHead(endPoint, frame, material, settings) {
    const geometry = createArrowHeadGeometry(settings);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(endPoint);
    applyFrameToObject(mesh, frame);

    return mesh;
}

export function createArrowHeadGeometry(settings) {
    const segments = settings.headMorphSegments ?? 36;

    const arrowGeometry = createMorphShapeGeometry(
        segments,
        createArrowHeadPointFactory(settings)
    );

    const compactDiscGeometry = createMorphShapeGeometry(
        segments,
        createDiscPointFactory(settings, {
            radius: settings.headDiscRadius * 0.2,
            centreX: settings.headDiscCentreX
        })
    );

    const fullDiscGeometry = createMorphShapeGeometry(
        segments,
        createDiscPointFactory(settings)
    );

    arrowGeometry.morphAttributes.position = [
        compactDiscGeometry.getAttribute('position'),
        fullDiscGeometry.getAttribute('position')
    ];

    arrowGeometry.morphAttributes.normal = [
        compactDiscGeometry.getAttribute('normal'),
        fullDiscGeometry.getAttribute('normal')
    ];

    arrowGeometry.morphTargetsRelative = false;

    compactDiscGeometry.dispose();
    fullDiscGeometry.dispose();

    return arrowGeometry;
}

function createMorphShapeGeometry(segments, getShapePoint) {
    const positions = [];
    const indices = [];

    for (let segmentIndex = 0; segmentIndex < segments; segmentIndex += 1) {
        const nextSegmentIndex = (segmentIndex + 1) % segments;

        const progress = segmentIndex / segments;
        const nextProgress = nextSegmentIndex / segments;

        const backCentreIndex = addPosition(
            positions,
            getShapePoint('backCentre', progress)
        );

        const backCurrentIndex = addPosition(
            positions,
            getShapePoint('backEdge', progress)
        );

        const backNextIndex = addPosition(
            positions,
            getShapePoint('backEdge', nextProgress)
        );

        indices.push(
            backCentreIndex,
            backNextIndex,
            backCurrentIndex,
        );

        const frontCentreIndex = addPosition(
            positions,
            getShapePoint('frontCentre', progress)
        );

        const frontCurrentIndex = addPosition(
            positions,
            getShapePoint('frontEdge', progress)
        );

        const frontNextIndex = addPosition(
            positions,
            getShapePoint('frontEdge', nextProgress)
        );

        indices.push(
            frontCentreIndex,
            frontCurrentIndex,
            frontNextIndex
        );

        const sideBackCurrentIndex = addPosition(
            positions,
            getShapePoint('backEdge', progress)
        );

        const sideBackNextIndex = addPosition(
            positions,
            getShapePoint('backEdge', nextProgress)
        );

        const sideFrontCurrentIndex = addPosition(
            positions,
            getShapePoint('frontEdge', progress)
        );

        const sideFrontNextIndex = addPosition(
            positions,
            getShapePoint('frontEdge', nextProgress)
        );

        indices.push(
            sideBackCurrentIndex,
            sideBackNextIndex,
            sideFrontNextIndex,

            sideBackCurrentIndex,
            sideFrontNextIndex,
            sideFrontCurrentIndex,
        );
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    geometry.setIndex(indices);

    const nonIndexedGeometry = geometry.toNonIndexed();

    geometry.dispose();

    nonIndexedGeometry.computeVertexNormals();

    return nonIndexedGeometry;
}

function createArrowHeadPointFactory(settings) {
    const halfDepth = settings.bodyDepth * 0.5;

    return (pointType, progress) => {
        const edgePoint = getTrianglePerimeterPoint(
            progress,
            settings.headLength,
            settings.headWidth
        );

        switch (pointType) {
            case 'backCentre':
                return new THREE.Vector3(
                    settings.headLength / 3,
                    -halfDepth,
                    0
                );

            case 'frontCentre':
                return new THREE.Vector3(
                    settings.headLength / 3,
                    halfDepth,
                    0
                );

            case 'backEdge':
                return new THREE.Vector3(
                    edgePoint.x,
                    -halfDepth,
                    edgePoint.y
                );

            case 'frontEdge':
                return new THREE.Vector3(
                    edgePoint.x,
                    halfDepth,
                    edgePoint.y
                );

            default:
                throw new Error(`Unknown arrowhead point type: ${pointType}`);
        }
    };
}

function createDiscPointFactory(
    settings,
    {
        radius = settings.headDiscRadius ?? settings.headWidth * 0.5,
        centreX = settings.headDiscCentreX ?? radius
    } = {}
) {
    const halfDepth = settings.bodyDepth * 0.5;

    return (pointType, progress) => {
        const angle = -progress * Math.PI * 2;

        const x = centreX + Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        switch (pointType) {
            case 'backCentre':
                return new THREE.Vector3(
                    centreX,
                    -halfDepth,
                    0
                );

            case 'frontCentre':
                return new THREE.Vector3(
                    centreX,
                    halfDepth,
                    0
                );

            case 'backEdge':
                return new THREE.Vector3(
                    x,
                    -halfDepth,
                    z
                );

            case 'frontEdge':
                return new THREE.Vector3(
                    x,
                    halfDepth,
                    z
                );

            default:
                throw new Error(`Unknown disc point type: ${pointType}`);
        }
    };
}

function getTrianglePerimeterPoint(progress, length, width) {
    const halfWidth = width * 0.5;

    const corners = [
        new THREE.Vector2(0, -halfWidth),
        new THREE.Vector2(0, halfWidth),
        new THREE.Vector2(length, 0)
    ];

    const edgeProgress = progress * corners.length;
    const edgeIndex = Math.floor(edgeProgress) % corners.length;
    const localProgress = edgeProgress - Math.floor(edgeProgress);

    const startPoint = corners[edgeIndex];
    const endPoint = corners[(edgeIndex + 1) % corners.length];

    return startPoint.clone().lerp(endPoint, localProgress);
}

function addPosition(positions, position) {
    const index = positions.length / 3;

    positions.push(
        position.x,
        position.y,
        position.z
    );

    return index;
}