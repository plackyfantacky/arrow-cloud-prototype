import * as THREE from 'three';

const worldUp = new THREE.Vector3(0, 1, 0);

const defaultConfig = {
    bodyWidth: 0.4,
    bodyDepth: 0.1,
    headLength: 0.8,
    headWidth: 0.9,
    cornerRadius: 0.35
};

export function createArrow(segments, material, config = {}) {
    const settings = {
        ...defaultConfig,
        ...config
    };

    const group = new THREE.Group();
    group.userData.revealSegments = [];

    segments.forEach((pathSegment) => {
        const segment = createStraightSegment(
            pathSegment.startPoint,
            pathSegment.endPoint,
            pathSegment.frame,
            material,
            settings
        );

        segment.userData.revealStartPoint = pathSegment.revealStartPoint
            ? pathSegment.revealStartPoint.clone()
            : pathSegment.startPoint.clone();

        segment.userData.revealEndPoint = pathSegment.revealEndPoint
            ? pathSegment.revealEndPoint.clone()
            : pathSegment.endPoint.clone();

        segment.userData.revealLength = pathSegment.revealLength
            ?? segment.userData.segmentLength;

        group.add(segment);
        group.userData.revealSegments.push(segment);
    });
    
    const finalSegment = segments[segments.length - 1];
    const head = createArrowHead(
        finalSegment.endPoint,
        finalSegment.frame,
        material,
        settings
    );

    head.visible = false;

    group.add(head);

    group.userData.head = head;
    
    return group;
}

function createStraightSegment(startPoint, endPoint, frame, material, settings) {
    const direction = endPoint.clone().sub(startPoint);
    const length = direction.length();

    const geometry = new THREE.BoxGeometry(
        length,
        settings.bodyDepth,
        settings.bodyWidth
    );
    
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    const matrix = new THREE.Matrix4();

    matrix.makeBasis(
        frame.forward,
        frame.normal,
        frame.side
    );
    
    group.position.copy(startPoint);
    group.quaternion.setFromRotationMatrix(matrix);

    mesh.position.x = length * 0.5;
    group.add(mesh);

    group.userData.revealMesh = mesh;
    group.userData.segmentLength = length;
    group.userData.startPoint = startPoint.clone();
    group.userData.endPoint = endPoint.clone();
    group.userData.frame = frame;

    return group;
}

function createArrowHead(endPoint, frame, material, settings) {
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

function createArrowHeadGeometry(settings) {
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

export function setArrowReveal(arrow, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const revealSegments = arrow.userData.revealSegments || [];

    if (revealSegments.length === 0) {
        return;
    }

    const totalLength = revealSegments.reduce((sum, segment) => {
        return sum + segment.userData.revealLength;
    }, 0);

    const visibleLength = totalLength * clampedProgress;

    let consumedLength = 0;
    let activeSegment = null;
    let activeSegmentProgress = 0;

    revealSegments.forEach((segment) => {
        const segmentLength = segment.userData.revealLength;
        const segmentStart = consumedLength;
        const segmentEnd = consumedLength + segmentLength;

        let segmentProgress = 0;

        if (visibleLength >= segmentEnd) {
            segmentProgress = 1;
        } else if (visibleLength > segmentStart) {
            segmentProgress = (visibleLength - segmentStart) / segmentLength;
        }

        if (segmentProgress > 0 && segmentProgress < 1) {
            activeSegment = segment;
            activeSegmentProgress = segmentProgress;
        }

        if (segmentProgress === 1) {
            activeSegment = segment;
            activeSegmentProgress = 1;
        }

        segment.scale.x = segmentProgress;
        segment.visible = segmentProgress > 0;

        consumedLength += segmentLength;
    });

    const head = arrow.userData.head;

    if (!head) {
        return;
    }

    if (!activeSegment || clampedProgress <= 0) {
        head.visible = false;
        return;
    }

    const segmentLength = activeSegment.userData.revealLength;
    const frame = activeSegment.userData.frame;
    const revealStartPoint = activeSegment.userData.revealStartPoint;
    const revealEndPoint = activeSegment.userData.revealEndPoint;

    const revealDirection = revealEndPoint.clone()
        .sub(revealStartPoint)
        .normalize();

    head.visible = true;

    head.position.copy(
        revealStartPoint.clone().add(
            revealDirection.multiplyScalar(segmentLength * activeSegmentProgress)
        )
    );

    const matrix = new THREE.Matrix4();

    matrix.makeBasis(
        frame.forward,
        frame.normal,
        frame.side
    );

    head.quaternion.setFromRotationMatrix(matrix);
}