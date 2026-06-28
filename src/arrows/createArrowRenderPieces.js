import * as THREE from 'three';

export function createArrowRenderPieces(segments, settings = {}) {
    const cornerRadius = settings.cornerRadius || 0;
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

        if (nextSegment && safeEndTrim > 0) {
            pieces.push(createCornerRenderPiece(
                segment,
                nextSegment,
                safeEndTrim
            ));
        }
    });

    return pieces;
}

function createCornerRenderPiece(segment, nextSegment, radius) {
    const jointPoint = segment.endPoint.clone();

    const startPoint = jointPoint.clone().sub(
        segment.frame.forward.clone().multiplyScalar(radius)
    );

    const endPoint = jointPoint.clone().add(
        nextSegment.frame.forward.clone().multiplyScalar(radius)
    );

    return {
        type: 'corner',
        jointPoint,
        startPoint,
        endPoint,
        radius,
        startFrame: {
            forward: segment.frame.forward.clone(),
            normal: segment.frame.normal.clone(),
            side: segment.frame.side.clone(),
        },
        endFrame: {
            forward: nextSegment.frame.forward.clone(),
            normal: nextSegment.frame.normal.clone(),
            side: nextSegment.frame.side.clone()
        },
        revealStartPoint: startPoint.clone(),
        revealEndPoint: endPoint.clone(),
        revealLength: radius * Math.PI * 0.5,
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