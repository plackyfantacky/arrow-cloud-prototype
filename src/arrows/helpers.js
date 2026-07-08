import * as THREE from 'three';

export function cloneFrame(frame) {
    return {
        forward: frame.forward.clone(),
        normal: frame.normal.clone(),
        side: frame.side.clone(),
    };
}

export function applyFrameToObject(object, frame) {
    const matrix = new THREE.Matrix4();

    matrix.makeBasis(
        frame.forward,
        frame.normal,
        frame.side
    );

    object.quaternion.setFromRotationMatrix(matrix);
}

export function getTwistProgress(progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    return THREE.MathUtils.smoothstep(
        clampedProgress,
        0, 1
    );
}

export function getTwistAngleAtProgress(twistAngle, progress) {
    return twistAngle * getTwistProgress(progress);
}