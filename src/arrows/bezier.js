import * as THREE from 'three';

// low level calculations

function getCubicBezierPoint(startPoint, controlPointStart, controlPointEnd, endPoint, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const inverseProgress = 1 - clampedProgress;

    return startPoint.clone()
        .multiplyScalar(inverseProgress * inverseProgress * inverseProgress)
        .add(
            controlPointStart.clone().multiplyScalar(
                3 * inverseProgress * inverseProgress * clampedProgress
            )
        )
        .add(
            controlPointEnd.clone().multiplyScalar(
                3 * inverseProgress * clampedProgress * clampedProgress
            )
        )
        .add(
            endPoint.clone().multiplyScalar(
                clampedProgress * clampedProgress * clampedProgress
            )
        );
}

function getCubicBezierTangent(startPoint, controlPointStart, controlPointEnd, endPoint, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const inverseProgress = 1 - clampedProgress;

    return controlPointStart.clone()
        .sub(startPoint)
        .multiplyScalar(3 * inverseProgress * inverseProgress)
        .add(
            controlPointEnd.clone()
                .sub(controlPointStart)
                .multiplyScalar(6 * inverseProgress * clampedProgress)
        )
        .add(
            endPoint.clone()
                .sub(controlPointEnd)
                .multiplyScalar(3 * clampedProgress * clampedProgress)
        )
        .normalize();
}

function getCubicBezierCurveTangent(curve, progress) {
    return getCubicBezierTangent(
        curve.startPoint,
        curve.controlPointStart,
        curve.controlPointEnd,
        curve.endPoint,
        progress
    );
}

// exported helpers

export function getQuadraticBezierPoint(startPoint, controlPoint, endPoint, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const inverseProgress = 1 - clampedProgress;

    return startPoint.clone()
        .multiplyScalar(inverseProgress * inverseProgress)
        .add(
            controlPoint.clone().multiplyScalar(
                2 * inverseProgress * clampedProgress
            )
        )
        .add(
            endPoint.clone().multiplyScalar(
                clampedProgress * clampedProgress
            )
        );
}

export function getQuadraticBezierTangent(startPoint, controlPoint, endPoint, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const inverseProgress = 1 - clampedProgress;

    return controlPoint.clone()
        .sub(startPoint)
        .multiplyScalar(2 * inverseProgress)
        .add(
            endPoint.clone()
                .sub(controlPoint)
                .multiplyScalar(2 * clampedProgress)
        )
        .normalize();
}

export function getCubicBezierCurvePoint(curve, progress) {
    return getCubicBezierPoint(
        curve.startPoint,
        curve.controlPointStart,
        curve.controlPointEnd,
        curve.endPoint,
        progress
    );
}

export function getCubicBezierCurveFrame(curve, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    const forward = getCubicBezierCurveTangent(curve, clampedProgress);

    const normalReference = curve.startFrame.normal.clone()
        .lerp(curve.endFrame.normal, clampedProgress)
        .normalize();

    let side = forward.clone().cross(normalReference);

    if (side.lengthSq() < 0.000001) {
        side = curve.startFrame.side.clone()
            .lerp(curve.endFrame.side, clampedProgress)
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
        side,
    };
}

export function getCubicBezierCurveState(curve, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    return {
        position: getCubicBezierCurvePoint(curve, clampedProgress),
        frame: getCubicBezierCurveFrame(curve, clampedProgress),
    };
}

