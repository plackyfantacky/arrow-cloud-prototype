import * as THREE from 'three';
import { cloneFrame, getTwistAngleAtProgress } from "./helpers.js";
import { 
    getCubicBezierCurvePoint, 
    getCubicBezierCurveFrame 
} from "./bezier.js";

const curveLengthSampleCount = 48;

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

    if (segment.actionName === 'curveTo') {
        const startProgress = getSegmentProgressAtDistance(segment, startDistance);
        const endProgress = getSegmentProgressAtDistance(segment, endDistance);

        return {
            type: 'curve',
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

    const firstLength = getSegmentLength(firstSegment);
    const secondLength = getSegmentLength(secondSegment);

    return Math.min(
        cornerRadius,
        firstLength * 0.45,
        secondLength * 0.45
    );
}

//helpers

function getSegmentLength(segment) {
    if (segment.actionName === 'curveTo') {
        const samples = getCurveLengthSamples(segment);    

        return samples[samples.length - 1].length;
    }
    
    return segment.startPoint.distanceTo(segment.endPoint);
}

function getSegmentProgressAtDistance(segment, distance) {
    const segmentLength = getSegmentLength(segment);

    if (segmentLength <= 0) {
        return 0;
    }

    const clampedDistance = THREE.MathUtils.clamp(
        distance, 0, segmentLength
    );

    if (segment.actionName === 'curveTo') {
        return getCurveProgressAtDistance(segment, clampedDistance);
    }

    return THREE.MathUtils.clamp(
        clampedDistance / segmentLength,
        0, 1
    );
}

function getSegmentPointAtDistance(segment, distance) {
    const progress = getSegmentProgressAtDistance(segment, distance);

    return getSegmentPointAtProgress(segment, progress);   
}

function getSegmentPointAtProgress(segment, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    if (segment.actionName === 'curveTo') {
        return getCubicBezierCurvePoint(segment, clampedProgress);
    }

    return segment.startPoint.clone().lerp(
        segment.endPoint,
        clampedProgress
    );
}

function getSegmentFrameAtDistance(segment, distance) {
    const progress = getSegmentProgressAtDistance(segment, distance);

    return getSegmentFrameAtProgress(segment, progress);
}


function getSegmentFrameAtProgress(segment, progress) {
    if (segment.actionName === 'curveTo') {
        return getCubicBezierCurveFrame(segment, progress);
    }

    if (segment.actionName === 'twist') {
        const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
        
        const angle = getTwistAngleAtProgress(
            segment.twistAngle || 0,
            clampedProgress
        );
    
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

    return cloneFrame(segment.frame);
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

function getCurveLengthSamples(segment) {
    if (segment.curveLengthSamples) {
        return segment.curveLengthSamples;
    }

    const samples = [];
    let previousPoint = getCubicBezierCurvePoint(segment, 0);
    let totalLength = 0;

    samples.push({
        progress: 0,
        point: previousPoint.clone(),
        length: 0
    });

    for (let stepIndex = 1; stepIndex <= curveLengthSampleCount; stepIndex++) {
        const progress = stepIndex / curveLengthSampleCount;
        const point = getCubicBezierCurvePoint(segment, progress);

        totalLength += previousPoint.distanceTo(point);

        samples.push({
            progress,
            point: point.clone(),
            length: totalLength
        });

        previousPoint = point;
    }

    segment.curveLengthSamples = samples;

    return samples;
}

function getCurveProgressAtDistance(segment, distance) {
    const samples = getCurveLengthSamples(segment);

    for (let sampleIndex = 1; sampleIndex < samples.length; sampleIndex++) {
        const previousSample = samples[sampleIndex - 1];
        const currentSample = samples[sampleIndex];

        if (distance <= currentSample.length) {
            const sampleDistance = currentSample.length - previousSample.length;

            if (sampleDistance <= 0) {
                return currentSample.progress;
            }

            const sampleProgress = (distance - previousSample.length) / sampleDistance;

            return THREE.MathUtils.lerp(
                previousSample.progress,
                currentSample.progress,
                sampleProgress
            );
        }
    }

    return 1;
}