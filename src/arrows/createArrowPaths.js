import * as THREE from 'three';
import { getDirectionVector } from "./directions.js";

const quarterTurn = Math.PI / 2;

export function createArrowPathSegments(arrowPath) {
    const segments = [];

    let currentPoint = new THREE.Vector3(...arrowPath.origin);
    let frame = {
        forward: getDirectionVector(arrowPath.initialDirection || '+x'),
        normal: getDirectionVector(arrowPath.initialNormal || '+y'),
    };

    frame.side = frame.forward.clone().cross(frame.normal).normalize();

    arrowPath.moves.forEach(([actionName, distance]) => {
        frame = updateFrame(frame, actionName);

        const nextPoint = currentPoint.clone().add(
            frame.forward.clone().multiplyScalar(distance)
        );

        segments.push({
            actionName,
            startPoint: currentPoint.clone(),
            endPoint: nextPoint.clone(),
            frame: {
                forward: frame.forward.clone(),
                normal: frame.normal.clone(),
                side: frame.side.clone(),
            },
        });

        currentPoint = nextPoint;
    });

    return segments;
}

function updateFrame(frame, actionName) {
    const nextFrame = {
        forward: frame.forward.clone(),
        normal: frame.normal.clone(),
        side: frame.side.clone(),       
    };

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

function rotateFrame(frame, axis, angle) {
    frame.forward.applyAxisAngle(axis, angle).normalize();
    frame.normal.applyAxisAngle(axis, angle).normalize();
    frame.side.applyAxisAngle(axis, angle).normalize();

    return frame;
}