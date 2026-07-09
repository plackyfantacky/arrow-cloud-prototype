import * as THREE from "three";
import { cloneFrame,  } from "./frame.js";

import { getTwistAngleAtProgress } from './twist.js';

import { 
    getSegmentLength,
    getSegmentFrameAtDistance,
    getSegmentPointAtDistance,
    getSegmentProgressAtDistance,
    getSegmentFrameAtProgress,

 } from './segmentState.js';

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
            segmentIndex,
            safeStartTrim,
            safeEndTrim
        ));

        if (nextSegment && shouldTrimEnd && safeEndTrim > 0) {
            pieces.push(createCornerRenderPiece(
                segment,
                segmentIndex,
                nextSegment,
                safeEndTrim
            ));
        }
    });

    return pieces;
}

function createCornerRenderPiece(segment, segmentIndex, nextSegment, radius) {
    const jointPoint = segment.endPoint.clone();

    const segmentLength = getSegmentLength(segment);
    const nextSegmentLength = getSegmentLength(nextSegment);

    const startDistance = Math.max(segmentLength - radius, 0);
    const endDistance = Math.min(radius, nextSegmentLength);

    const startPoint = getSegmentPointAtDistance(segment, startDistance);
    const endPoint = getSegmentPointAtDistance(nextSegment, endDistance);

    return {
        type: 'corner',
        segmentIndex,
        actionName: segment.actionName,
        segmentLength,
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

function createSegmentRenderPiece(segment, segmentIndex, startTrim, endTrim) {
    const segmentLength = getSegmentLength(segment);
    const startDistance = startTrim;
    const endDistance = segmentLength - endTrim;

    const startPoint = getSegmentPointAtDistance(segment, startDistance);
    const endPoint = getSegmentPointAtDistance(segment, endDistance);

    if (segment.actionName === 'curveTo') {
        const startProgress = getSegmentProgressAtDistance(segment, startDistance);
        const endProgress = getSegmentProgressAtDistance(segment, endDistance);

        return {
            type: 'curve',
            segmentIndex,
            actionName: segment.actionName,
            segmentLength,
            startPoint,
            endPoint,
            startFrame: getSegmentFrameAtProgress(segment, startProgress),
            endFrame: getSegmentFrameAtProgress(segment, endProgress),
            sourceSegment: segment,
            sourceStartProgress: startProgress,
            sourceEndProgress: endProgress,
            startTrim,
            endTrim,
            revealStartPoint: startPoint.clone(),
            revealEndPoint: endPoint.clone(),
            revealLength: endDistance - startDistance,
        };
    }

    if (segment.actionName === 'twist') {
        const startProgress = getSegmentProgressAtDistance(segment, startDistance);
        const endProgress = getSegmentProgressAtDistance(segment, endDistance);
        const sourceTwistAngle = segment.twistAngle || 0;
        const startAngle = getTwistAngleAtProgress(sourceTwistAngle, startProgress);
        const endAngle = getTwistAngleAtProgress(sourceTwistAngle, endProgress);

        return {
            type: 'twist',
            segmentIndex,
            actionName: segment.actionName,
            segmentLength,
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
        segmentIndex,
        actionName: segment.actionName,
        segmentLength,
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

    const firstLength = getSegmentLength(firstSegment);
    const secondLength = getSegmentLength(secondSegment);

    return Math.min(
        cornerRadius,
        firstLength * 0.45,
        secondLength * 0.45
    );
}

//helpers


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

