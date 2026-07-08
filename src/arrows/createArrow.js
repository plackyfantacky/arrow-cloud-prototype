import * as THREE from 'three';
import { applyFrameToObject, getTwistAngleAtProgress } from "./helpers";

const rectangularExtrusionFaceCount = 4;
const rectangularExtrusionVerticesPerFace = 2;
const rectangularExtrusionVerticesPerRing = rectangularExtrusionFaceCount * rectangularExtrusionVerticesPerFace;
const rectangularExtrusionIndicesPerStep = 24;

export function createArrow(pieces, material, settings) {
    const group = new THREE.Group();
    group.userData.revealPieces = [];

    pieces.forEach((piece) => {
        let pieceGroup;

        switch(true) {
            case piece.type === 'corner':
                pieceGroup = createCornerPiece(piece, material, settings);
            break;
            case piece.type === 'twist':
                pieceGroup = createTwistPiece(piece, material, settings);
            break;
            default:
                pieceGroup = createStraightPiece(
                    piece.startPoint,
                    piece.endPoint,
                    piece.frame,
                    material,
                    settings
                );
            break;
        };

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
    const finalFrame = finalPiece.frame || finalPiece.endFrame || finalPiece.startFrame;

    const head = createArrowHead(
        finalPiece.endPoint,
        finalFrame,
        material,
        settings
    );

    head.visible = false;

    group.add(head);

    group.userData.head = head;
    
    return group;
}

// straight pieces

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
    
    group.position.copy(startPoint);
    applyFrameToObject(group, frame);

    mesh.position.x = length * 0.5;
    group.add(mesh);

    group.userData.revealMesh = mesh;
    group.userData.pieceLength = length;
    group.userData.startPoint = startPoint.clone();
    group.userData.endPoint = endPoint.clone();
    group.userData.frame = frame;

    return group;
}

//corners

function createCornerPiece(piece, material, settings) {
    return createDrawRangeRevealPiece(
        piece,
        material,
        createCornerGeometry(piece, settings),
        settings.cornerSteps || 16,
        getCornerRevealState
    );
}

function createCornerGeometry(piece, settings) {
    const divisions = settings.cornerSteps || 16;

    return createRectangularExtrusionGeometry(
        settings,
        divisions,
        (progress) => {
            return {
                position: getQuadraticBezierPoint(
                    piece.startPoint,
                    piece.jointPoint,
                    piece.endPoint,
                    progress
                ),
                frame: getInterpolatedFrame(piece, progress),
            }
        }
    );
}

function getQuadraticBezierPoint(startPoint, controlPoint, endPoint, progress) {
    const inverseProgress = 1 - progress;

    return startPoint.clone()
        .multiplyScalar(inverseProgress * inverseProgress)
        .add(
            controlPoint.clone().multiplyScalar(
                2 * inverseProgress * progress
            )
        )
        .add(
            endPoint.clone().multiplyScalar(progress * progress)
        );
}

function getQuadraticBezierTangent(startPoint, controlPoint, endPoint, progress) {
    const inverseProgress = 1 - progress;

    return controlPoint.clone()
        .sub(startPoint)
        .multiplyScalar(2 * inverseProgress)
        .add(
            endPoint.clone()
                .sub(controlPoint)
                .multiplyScalar(2 * progress)
        )
        .normalize()
}

function getInterpolatedFrame(piece, progress) {
    const forward = getQuadraticBezierTangent(
        piece.startPoint,
        piece.jointPoint,
        piece.endPoint,
        progress
    );

    const normalReference = piece.startFrame.normal.clone()
        .lerp(piece.endFrame.normal, progress)
        .normalize();

    let side = forward.clone()
        .cross(normalReference);

    if (side.lengthSq() < 0.000001) {
        side = piece.startFrame.side.clone()
            .lerp(piece.endFrame.side, progress)
            .normalize();
    } else {
        side.normalize();
    }

    const normal = side.clone()
        .cross(forward)
        .normalize();

    return {
        forward,
        normal,
        side
    }
}

function getCornerRevealState(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    
    return {
        position: getQuadraticBezierPoint(
            piece.startPoint,
            piece.jointPoint,
            piece.endPoint,
            clampedProgress
        ),
        frame: getInterpolatedFrame(piece, clampedProgress),
    };
}

//twists

function createTwistPiece(piece, material, settings) {
    const twistMaterial = material.clone();

    twistMaterial.flatShading = false;
    twistMaterial.needsUpdate = true;

    return createDrawRangeRevealPiece(
        piece,
        twistMaterial,
        createTwistGeometry(piece, settings),
        settings.twistSteps || settings.cornerSteps || 16,
        getTwistRevealState
    );
}

function createTwistGeometry(piece, settings) {
    const divisions = settings.twistSteps || 16;

    return createRectangularExtrusionGeometry(
        settings,
        divisions,
        (progress) => {
            return {
                position: getTwistPosition(piece, progress),
                frame: getTwistFrame(piece, progress),
            };
        }
    );
}

function getTwistPosition(piece, progress) {
    return piece.startPoint.clone().lerp(
        piece.endPoint,
        THREE.MathUtils.clamp(progress, 0, 1)
    );
}

function getTwistFrame(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const angle = getTwistAngleForPiece(piece, clampedProgress);

    const forward = piece.startFrame.forward.clone().normalize();

    const normal = piece.startFrame.normal.clone()
        .applyAxisAngle(forward, angle)
        .normalize();

    const side = piece.startFrame.side.clone()
        .applyAxisAngle(forward, angle)
        .normalize();

    return {
        forward,
        normal,
        side
    };
}

function getTwistAngleForPiece(piece, progress) {
    if (
        typeof piece.sourceTwistAngle === 'number' &&
        typeof piece.sourceStartProgress === 'number' &&
        typeof piece.sourceEndProgress === 'number'
    ) {
        const sourceProgress = THREE.MathUtils.lerp(
            piece.sourceStartProgress,
            piece.sourceEndProgress,
            progress
        );

        const startAngle = getTwistAngleAtProgress(
            piece.sourceTwistAngle,
            piece.sourceStartProgress
        );

        const currentAngle = getTwistAngleAtProgress(
            piece.sourceTwistAngle,
            sourceProgress
        );

        return currentAngle - startAngle;
    }

    return getTwistAngleAtProgress(
        piece.twistAngle || 0,
        progress
    );
}

function getTwistRevealState(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    return {
        position: getTwistPosition(piece, clampedProgress),
        frame: getTwistFrame(piece, clampedProgress),
    };
}

//arrowheads

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
        
        if (piece.userData.revealMode === 'drawRange') {
            piece.userData.setRevealProgress(pieceProgress);
            piece.visible = pieceProgress > 0;
        } else {
            piece.scale.x = pieceProgress;
            piece.visible = pieceProgress > 0;
        }

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

    let headPosition;
    let frame;

    if (activePiece.userData.getRevealState) {
        const revealState = activePiece.userData.getRevealState(
            activePieceProgress
        );

        headPosition = revealState.position;
        frame = revealState.frame;
    } else {
        const pieceLength = activePiece.userData.revealLength;
        const revealStartPoint = activePiece.userData.revealStartPoint;
        const revealEndPoint = activePiece.userData.revealEndPoint;

        const revealDirection = revealEndPoint.clone()
            .sub(revealStartPoint)
            .normalize();
        
        headPosition = revealStartPoint.clone().add(
            revealDirection.multiplyScalar(pieceLength * activePieceProgress)
        );

        frame = activePiece.userData.frame;        
    }

    head.visible = true;
    head.position.copy(headPosition);
    applyFrameToObject(head, frame);
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
        return;
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

//geometry helpers

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

function createDrawRangeRevealPiece(piece, material, geometry, revealSteps, getRevealState) {
    const mesh = new THREE.Mesh(geometry, material);
    const indicesPerStep = rectangularExtrusionIndicesPerStep;

    mesh.visible = false;

    mesh.userData.pieceLength = piece.revealLength;
    mesh.userData.frame = piece.startFrame;
    mesh.userData.revealMode = 'drawRange';

    mesh.userData.setRevealProgress = (progress) => {
        const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
        const visibleSteps = Math.ceil(clampedProgress * revealSteps);

        geometry.setDrawRange(
            0,
            visibleSteps * indicesPerStep
        );
    };

    mesh.userData.getRevealState = (progress) => {
        return getRevealState(piece, progress);
    };

    mesh.userData.setRevealProgress(0);

    return mesh;
}

function createRectangularExtrusionGeometry(settings, divisions, getSweepState) {
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