import * as THREE from 'three';

const quarterTurn = Math.PI / 2;

export function createArrowRenderPieces(segments, settings = {}) {
    const cornerRadius = settings.cornerRadius || 0;
    const cornerSteps = settings.cornerSteps || 8;
    const cornerOverlap = settings.cornerOverlap || 0;
    const pieces = [];

    segments.forEach((segment, segmentIndex) => {
        const previousSegment = segments[segmentIndex - 1] || null;
        const nextSegment = segments[segmentIndex + 1] || null;

        const segmentLength = segment.startPoint.distanceTo(segment.endPoint);

        const startTrim = previousSegment
            ? getSafeTrim(cornerRadius, previousSegment, segment)
            : 0;

        const endTrim = nextSegment
            ? getSafeTrim(cornerRadius, segment, nextSegment)
            : 0;

        const safeStartTrim = Math.min(startTrim, segmentLength * 0.45);
        const safeEndTrim = Math.min(endTrim, segmentLength * 0.45);

        const startPoint = segment.startPoint.clone().add(
            segment.frame.forward.clone().multiplyScalar(safeStartTrim)
        );

        const endPoint = segment.endPoint.clone().sub(
            segment.frame.forward.clone().multiplyScalar(safeEndTrim)
        );

        pieces.push({
            type: 'straight',
            startPoint,
            endPoint,
            frame: segment.frame,
            sourceSegment: segment,
            startTrim: safeStartTrim,
            endTrim: safeEndTrim
        });

        if (nextSegment && cornerRadius > 0) {
            const cornerPieces = createCornerPieces(
                segment,
                nextSegment,
                safeEndTrim,
                cornerSteps,
                cornerOverlap
            );

            pieces.push(...cornerPieces);
        }
    });

    return pieces;
}

function createCornerPieces(previousSegment, nextSegment, radius, cornerSteps, cornerOverlap) {
     const rotation = getCornerRotation(previousSegment, nextSegment);

     if (!rotation) {
        return [];
     }

     const cornerPoint = previousSegment.endPoint.clone();

     const arcCentre = cornerPoint.clone()
        .sub(previousSegment.frame.forward.clone().multiplyScalar(radius))
        .add(nextSegment.frame.forward.clone().multiplyScalar(radius));

    const startRadial = nextSegment.frame.forward.clone()
        .multiplyScalar(-radius);
    
    const points = [];
    const frames = [];

    for (let stepIndex = 0; stepIndex <= cornerSteps; stepIndex += 1) {
        const progress = stepIndex / cornerSteps;
        const angle = rotation.angle * progress;

        const frame = rotateFrame(previousSegment.frame, rotation.axis, angle);
        const radial = startRadial.clone().applyAxisAngle(rotation.axis, angle);
        const point = arcCentre.clone().add(radial);

        points.push(point);
        frames.push(frame);
    }

    const pieces = [];

    for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex += 1) {
        const rawStartPoint = points[pointIndex];
        const rawEndPoint = points[pointIndex + 1];
        const referenceFrame = frames[pointIndex];

        const stepDirection = rawEndPoint.clone()
            .sub(rawStartPoint)
            .normalize();

        const startPoint = rawStartPoint.clone().sub(
            stepDirection.clone().multiplyScalar(cornerOverlap)
        );

        const endPoint = rawEndPoint.clone().add(
            stepDirection.clone().multiplyScalar(cornerOverlap)
        );

        const frame = createFrameFromForward(stepDirection, referenceFrame);

        pieces.push({
            type: 'corner-step',
            startPoint,
            endPoint,
            revealStartPoint: rawStartPoint.clone(),
            revealEndPoint: rawEndPoint.clone(),
            revealLength: rawStartPoint.distanceTo(rawEndPoint),
            frame,
            sourceSegment: nextSegment,
        });        
    }

    return pieces;

}

function getCornerRotation(previousSegment, nextSegment) {
    if (previousSegment.frame.forward.equals(nextSegment.frame.forward)) {
        return null;
    }

    if (nextSegment.actionName === 'turnLeft') {
        return {
            axis: previousSegment.frame.normal.clone(),
            angle: quarterTurn,
        }
    }

    if (nextSegment.actionName === 'turnRight') {
        return {
            axis: previousSegment.frame.normal.clone(),
            angle: -quarterTurn,
        }
    }

    if (nextSegment.actionName === 'bendUp') {
        return {
            axis: previousSegment.frame.side.clone(),
            angle: quarterTurn,
        }
    }

    if (nextSegment.actionName === 'bendDown') {
        return {
            axis: previousSegment.frame.side.clone(),
            angle: -quarterTurn,
        }
    }

    return null;
}

function rotateFrame(frame, axis, angle) {
    return {
        forward: frame.forward.clone().applyAxisAngle(axis, angle).normalize(),
        normal: frame.normal.clone().applyAxisAngle(axis, angle).normalize(),
        side: frame.side.clone().applyAxisAngle(axis, angle).normalize(),
    }
}

function getSafeTrim(cornerRadius, firstSegment, secondSegment) {
    if (cornerRadius <= 0) {
        return 0;
    }

    const firstLength = firstSegment.startPoint.distanceTo(firstSegment.endPoint);
    const secondLength = secondSegment.startPoint.distanceTo(secondSegment.endPoint);

    return Math.min(
        cornerRadius,
        firstLength * 0.45,
        secondLength * 0.45
    );
}

function createFrameFromForward(forward, referenceFrame) {
    let normal = referenceFrame.normal.clone()
        .projectOnPlane(forward)
        .normalize();
    
    if (normal.lengthSq() < 0.000001) {
        normal = referenceFrame.side.clone()
            .projectOnPlane(forward)
            .normalize();
    }

    const side = forward.clone().cross(normal).normalize();

    return {
        forward: forward.clone(),
        normal,
        side
    };
}