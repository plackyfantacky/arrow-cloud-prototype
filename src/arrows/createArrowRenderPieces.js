import * as THREE from 'three';
import { cloneFrame, getTwistAngleAtProgress } from "./helpers";

export function createArrowRenderPieces(segments, settings = {}) {
    const cornerRadius = settings.cornerRadius || 0;
    const pieces = [];

    segments.forEach((segment, segmentIndex) => {
        const previousSegment = segments[segmentIndex - 1] || null;
        const nextSegment = segments[segmentIndex + 1] || null;

        const segmentLength = getSegmentLength(segment);

        const shouldTrimStart = previousSegment
            ? shouldCreateCorner(previousSegment, segment)
            : false;

        const shouldTrimEnd = nextSegment
            ? shouldCreateCorner(segment, nextSegment)
            : false;

        const startTrim = shouldTrimStart
            ? getSafeTrim(cornerRadius, previousSegment, segment)
            : 0;

        const endTrim = shouldTrimEnd
            ? getSafeTrim(cornerRadius, segment, nextSegment)
            : 0;

        const safeStartTrim = Math.min(startTrim, segmentLength * 0.45);
        const safeEndTrim = Math.min(endTrim, segmentLength * 0.45);

        pieces.push(createSegmentRenderPiece(
            segment,
            safeStartTrim,
            safeEndTrim
        ));

        if (nextSegment && shouldTrimEnd && safeEndTrim > 0) {
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

    const segmentLength = getSegmentLength(segment);
    const nextSegmentLength = getSegmentLength(nextSegment);

    const startDistance = Math.max(segmentLength - radius, 0);
    const endDistance = Math.min(radius, nextSegmentLength);

    const startPoint = getSegmentPointAtDistance(segment, startDistance);
    const endPoint = getSegmentPointAtDistance(nextSegment, endDistance);

    return {
        type: 'corner',
        jointPoint,
        startPoint,
        endPoint,
        radius,
        startFrame: getSegmentFrameAtDistance(segment, startDistance),
        endFrame: getSegmentFrameAtDistance(nextSegment, endDistance),
        revealStartPoint: startPoint.clone(),
        revealEndPoint: endPoint.clone(),
        revealLength: radius * Math.PI * 0.5,
    };
}

function createSegmentRenderPiece(segment, startTrim, endTrim) {
    const segmentLength = getSegmentLength(segment);
    const startDistance = startTrim;
    const endDistance = segmentLength - endTrim;

    const startPoint = getSegmentPointAtDistance(segment, startDistance);
    const endPoint = getSegmentPointAtDistance(segment, endDistance);

    if (segment.actionName === 'twist') {
        const startProgress = getSegmentProgressAtDistance(segment, startDistance);
        const endProgress = getSegmentProgressAtDistance(segment, endDistance);
        const sourceTwistAngle = segment.twistAngle || 0;
        const startAngle = getTwistAngleAtProgress(sourceTwistAngle, startProgress);
        const endAngle = getTwistAngleAtProgress(sourceTwistAngle, endProgress);

        return {
            type: 'twist',
            startPoint,
            endPoint,
            startFrame: getSegmentFrameAtProgress(segment, startProgress),
            endFrame: getSegmentFrameAtProgress(segment, endProgress),
            twistAngle: endAngle - startAngle,
            sourceTwistAngle,
            sourceStartProgress: startProgress,
            sourceEndProgress: endProgress,
            sourceSegment: segment,
            startTrim,
            endTrim,
            revealStartPoint: startPoint.clone(),
            revealEndPoint: endPoint.clone(),
            revealLength: startPoint.distanceTo(endPoint),
        };
    }

    return {
        type: 'straight',
        startPoint,
        endPoint,
        frame: getSegmentFrameAtDistance(segment, startDistance),
        sourceSegment: segment,
        startTrim,
        endTrim,
    };
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

//helpers

function getSegmentLength(segment) {
    return segment.startPoint.distanceTo(segment.endPoint);
}

function getSegmentProgressAtDistance(segment, distance) {
    const segmentLength = getSegmentLength(segment);

    if (segmentLength <= 0) {
        return 0;
    }

    return THREE.MathUtils.clamp(
        distance / segmentLength,
        0, 1
    );
}

function getSegmentPointAtDistance(segment, distance) {
    const progress = getSegmentProgressAtDistance(segment, distance);

    return segment.startPoint.clone().lerp(
        segment.endPoint,
        progress
    );
}

function getSegmentFrameAtDistance(segment, distance) {
    const progress = getSegmentProgressAtDistance(segment, distance);

    return getSegmentFrameAtProgress(segment, progress);
}

function getSegmentFrameAtProgress(segment, progress) {
    if (segment.actionName !== 'twist') {
        return cloneFrame(segment.frame);
    }

    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    
    const angle = getTwistAngleAtProgress(
        segment.twistAngle || 0,
        clampedProgress
    )

    const forward = segment.startFrame.forward.clone().normalize();

    const normal = segment.startFrame.normal.clone()
        .applyAxisAngle(forward, angle)
        .normalize();

    const side = segment.startFrame.side.clone()
        .applyAxisAngle(forward, angle)
        .normalize();

    return {
        forward,
        normal,
        side,
    };
}

function shouldCreateCorner(segment, nextSegment) {
    if (!nextSegment) {
        return false;
    }

    const segmentExitFrame = getSegmentFrameAtDistance(
        segment,
        getSegmentLength(segment)
    );

    const nextSegmentEntryFrame = getSegmentFrameAtDistance(
        nextSegment, 0
    );

    return segmentExitFrame.forward.distanceToSquared(
        nextSegmentEntryFrame.forward
    ) > 0.000001;
}