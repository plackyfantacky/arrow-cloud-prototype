import * as THREE from "three";

const quarterTurn = Math.PI / 2;

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

export function updateFrame(frame, actionName) {
    const nextFrame = cloneFrame(frame);

    if (actionName === 'forward') {
        return nextFrame;
    }

    if (actionName === 'turnLeft') {
        return rotateFrame(nextFrame, nextFrame.normal, quarterTurn);
    }

    if (actionName === 'turnRight') {
        return rotateFrame(nextFrame, nextFrame.normal, -quarterTurn);
    }

    if (actionName === 'bendUp') {
        return rotateFrame(nextFrame, nextFrame.side, quarterTurn);
    }

    if (actionName === 'bendDown') {
        return rotateFrame(nextFrame, nextFrame.side, -quarterTurn);
    }

    throw new Error(`Unknown arrow action: ${actionName}`);
}

export function rotateFrame(frame, axis, angle) {
    frame.forward.applyAxisAngle(axis, angle).normalize();
    frame.normal.applyAxisAngle(axis, angle).normalize();
    frame.side.applyAxisAngle(axis, angle).normalize();

    return frame;
}