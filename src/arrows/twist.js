import * as THREE from "three";



export function getTwistAngleAtProgress(twistAngle, progress) {
    return twistAngle * getTwistProgress(progress);
}

export function getTwistAngleForPiece(piece, progress) {
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

function getTwistProgress(progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    return THREE.MathUtils.smoothstep(
        clampedProgress,
        0, 1
    );
}

export function getTwistFrame(piece, progress) {
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