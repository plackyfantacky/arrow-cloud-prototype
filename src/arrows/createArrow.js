import * as THREE from 'three';

const worldUp = new THREE.Vector3(0, 1, 0);

export function createArrow(pieces, material, settings) {

    const group = new THREE.Group();
    group.userData.revealPieces = [];

    pieces.forEach((piece) => {
        const pieceGroup = createStraightPiece(
            piece.startPoint,
            piece.endPoint,
            piece.frame,
            material,
            settings
        );

        pieceGroup.userData.revealStartPoint = piece.revealStartPoint
            ? piece.revealStartPoint.clone()
            : piece.startPoint.clone();

        pieceGroup.userData.revealEndPoint = piece.revealEndPoint
            ? piece.revealEndPoint.clone()
            : piece.endPoint.clone();

        pieceGroup.userData.revealLength = piece.revealLength
            ?? pieceGroup.userData.pieceLength;

        group.add(pieceGroup);
        group.userData.revealPieces.push(pieceGroup);
    });
    
    const finalPiece = pieces[pieces.length - 1];
    const head = createArrowHead(
        finalPiece.endPoint,
        finalPiece.frame,
        material,
        settings
    );

    head.visible = false;

    group.add(head);

    group.userData.head = head;
    
    return group;
}

function createStraightPiece(startPoint, endPoint, frame, material, settings) {
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
    group.userData.pieceLength = length;
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
    const revealPieces = arrow.userData.revealPieces || [];

    if (revealPieces.length === 0) {
        return;
    }

    const totalLength = revealPieces.reduce((sum, piece) => {
        return sum + piece.userData.revealLength;
    }, 0);

    const visibleLength = totalLength * clampedProgress;

    let consumedLength = 0;
    let activePiece = null;
    let activePieceProgress = 0;

    revealPieces.forEach((piece) => {
        const pieceLength = piece.userData.revealLength;
        const pieceStart = consumedLength;
        const pieceEnd = consumedLength + pieceLength;

        let pieceProgress = 0;

        if (visibleLength >= pieceEnd) {
            pieceProgress = 1;
        } else if (visibleLength > pieceStart) {
            pieceProgress = (visibleLength - pieceStart) / pieceLength;
        }

        if (pieceProgress > 0 && pieceProgress < 1) {
            activePiece = piece;
            activePieceProgress = pieceProgress;
        }

        if (pieceProgress === 1) {
            activePiece = piece;
            activePieceProgress = 1;
        }

        piece.scale.x = pieceProgress;
        piece.visible = pieceProgress > 0;

        consumedLength += pieceLength;
    });

    const head = arrow.userData.head;

    if (!head) {
        return;
    }

    if (!activePiece || clampedProgress <= 0) {
        head.visible = false;
        return;
    }

    const pieceLength = activePiece.userData.revealLength;
    const frame = activePiece.userData.frame;
    const revealStartPoint = activePiece.userData.revealStartPoint;
    const revealEndPoint = activePiece.userData.revealEndPoint;

    const revealDirection = revealEndPoint.clone()
        .sub(revealStartPoint)
        .normalize();

    head.visible = true;

    head.position.copy(
        revealStartPoint.clone().add(
            revealDirection.multiplyScalar(pieceLength * activePieceProgress)
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

export function updateArrowReveal(arrow, currentTime) {
    const delay = arrow.userData.timing.delay;
    const duration = arrow.userData.timing.duration;

    const revealProgress = THREE.MathUtils.clamp(
        (currentTime - delay) / duration,
        0, 1
    );

    setArrowReveal(arrow, revealProgress);

    const headMesh = arrow.userData.head;
    const headTiming = arrow.userData.headTiming;

    if (!headMesh || headTiming?.hideAt === null) {
        return;
    }

    if (currentTime < headTiming.hideAt) {
        headMesh.scale.set(1, 1, 1);
    }

    const hideProgress = THREE.MathUtils.clamp(
        (currentTime - headTiming.hideAt) / headTiming.hideDuration,
        0, 1
    );

    const easedHideProgress = THREE.MathUtils.smoothstep(
        hideProgress,
        0, 1
    );

    const headScale = 1 - easedHideProgress;

    headMesh.scale.set(
        headScale,
        headScale,
        headScale
    );

    if (hideProgress >= 1) {
        headMesh.visible = false;
    }
}