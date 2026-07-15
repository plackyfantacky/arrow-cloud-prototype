import * as THREE from "three";

import { applyFrameToObject } from "./frame.js";

const rectangularExtrusionIndicesPerStep = 24;

export function createDrawRangeRevealPiece(piece, material, geometry, revealSteps, getRevealState) {
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

    const rawRevealProgress = THREE.MathUtils.clamp(
        (currentTime - delay) / duration,
        0, 1
    );

    const revealProgress = easeOutFinalSegment(rawRevealProgress);
    
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

function easeOutFinalSegment(progress, easingStart = 0.85) {
    if (progress <= easingStart) {
        return progress;
    }

    const easingRange = 1 - easingStart;
    const localProgress  = (progress - easingStart) / easingRange;

    const easedLocalProgress = THREE.MathUtils.smoothstep(
        localProgress, 
        0, 1
    );

    return easingStart + easedLocalProgress * easingRange;
}