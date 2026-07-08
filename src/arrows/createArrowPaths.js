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
        const [actionName, actionValue, options = {}] = move;
       
        if (actionName === 'twist') {
            const twistSegment = createTwistSegment(
                currentPoint,
                frame,
                actionValue,
                typeof options === 'number' ? options : 0
            );

            segments.push(twistSegment.segment);

            currentPoint = twistSegment.nextPoint;
            frame = twistSegment.nextFrame;

            return;
        }

        if (actionName === 'curveTo') {
            const curveSegment = createCurveToSegment(
                currentPoint,
                frame,
                actionValue,
                options
            );

            segments.push(curveSegment.segment);

            currentPoint = curveSegment.nextPoint;
            frame = curveSegment.nextFrame;

            return;
        }
        
        frame = updateFrame(frame, actionName);

        const nextPoint = currentPoint.clone().add(
            frame.forward.clone().multiplyScalar(actionValue)
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

function createTwistSegment(currentPoint, frame, distance, angleDegrees = 0) {
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

function createCurveToSegment(currentPoint, frame, targetCoordinates, options = {}) {
    const startFrame = cloneFrame(frame);

    const endPoint = currentPoint.clone().add(
        getLocalOffsetVector(startFrame, targetCoordinates)
    );

    let endFrame = getCurveEndFrame(
        startFrame,
        options.endAngle || 0,
        options.angleAxis || 'side'
    );

    if (typeof options.endRoll === 'number') {
        endFrame = rotateFrame(
            endFrame,
            endFrame.forward,
            THREE.MathUtils.degToRad(options.endRoll)
        );
    }

    const curveDistance = currentPoint.distanceTo(endPoint);
    const handleScale = options.handleScale ?? 0.35;

    const startHandleDistance = options.startHandleDistance
        ?? curveDistance * handleScale;

    const endHandleDistance = options.endHandleDistance
        ?? curveDistance * handleScale;

    const controlPointStart = currentPoint.clone().add(
        startFrame.forward.clone().multiplyScalar(startHandleDistance)
    );

    const controlPointEnd = endPoint.clone().sub(
        endFrame.forward.clone().multiplyScalar(endHandleDistance)
    );

    return {
        segment: {
            actionName: 'curveTo',
            startPoint: currentPoint.clone(),
            endPoint: endPoint.clone(),
            startFrame,
            endFrame,
            controlPointStart,
            controlPointEnd,
            frame: cloneFrame(endFrame),
        },
        nextPoint: endPoint.clone(),
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

function getLocalOffsetVector(frame, coordinates) {
    return frame.forward.clone().multiplyScalar(coordinates.x || 0)
        .add(frame.normal.clone().multiplyScalar(coordinates.y || 0))
        .add(frame.side.clone().multiplyScalar(coordinates.z || 0));
}

function getCurveEndFrame(startFrame, endAngleDegrees, angleAxisName) {
    const endFrame = cloneFrame(startFrame);
    const angle = THREE.MathUtils.degToRad(endAngleDegrees);

    if (angleAxisName === 'normal') {
        return rotateFrame(endFrame, endFrame.normal, angle);
    }

    if (angleAxisName === 'side') {
        return rotateFrame(endFrame, endFrame.side, angle);
    }

    throw new Error(`Unknown curveTo angle axis: ${angleAxisName}`);
}