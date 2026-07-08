import * as THREE from 'three';
import { cloneFrame } from "./helpers.js";
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

    arrowPath.moves.forEach((move) => {
        const [actionName, distance, angleDegrees = 0] = move;
       
        if (actionName === 'twist') {
            const twistSegment = createTwistSegment(
                currentPoint,
                frame,
                distance,
                angleDegrees
            );

            segments.push(twistSegment.segment);

            currentPoint = twistSegment.nextPoint;
            frame = twistSegment.nextFrame;

            return;
        }
        
        frame = updateFrame(frame, actionName);

        const nextPoint = currentPoint.clone().add(
            frame.forward.clone().multiplyScalar(distance)
        );

        segments.push({
            actionName,
            startPoint: currentPoint.clone(),
            endPoint: nextPoint.clone(),
            frame: cloneFrame(frame),
        });

        currentPoint = nextPoint;
    });

    return segments;
}

function createTwistSegment(currentPoint, frame, distance, angleDegrees) {
    const startFrame = cloneFrame(frame);
    const twistAngle = THREE.MathUtils.degToRad(angleDegrees);

    const endFrame = rotateFrame(
        cloneFrame(startFrame),
        startFrame.forward,
        twistAngle
    );

    const nextPoint = currentPoint.clone().add(
        startFrame.forward.clone().multiplyScalar(distance)
    );

    return {
        segment: {
            actionName: 'twist',
            startPoint: currentPoint.clone(),
            endPoint: nextPoint.clone(),
            startFrame,
            endFrame,
            frame: cloneFrame(endFrame),
            twistAngle
        },
        nextPoint,
        nextFrame: cloneFrame(endFrame),
    };
}

function updateFrame(frame, actionName) {
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

function rotateFrame(frame, axis, angle) {
    frame.forward.applyAxisAngle(axis, angle).normalize();
    frame.normal.applyAxisAngle(axis, angle).normalize();
    frame.side.applyAxisAngle(axis, angle).normalize();

    return frame;
}