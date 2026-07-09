import * as THREE from "three";

import { cloneFrame } from "./frame.js";
import { getTwistAngleAtProgress } from "./twist.js";
import { 
    getCubicBezierCurvePoint,
    getCubicBezierCurveFrame
 } from "./bezier.js";

const curveLengthSampleCount = 48;

export function getSegmentLength(segment) {
    if (segment.actionName === 'curveTo') {
        const samples = getCurveLengthSamples(segment);    

        return samples[samples.length - 1].length;
    }
    
    return segment.startPoint.distanceTo(segment.endPoint);
}

export function getSegmentProgressAtDistance(segment, distance) {
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

export function getSegmentPointAtDistance(segment, distance) {
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

export function getSegmentFrameAtDistance(segment, distance) {
    const progress = getSegmentProgressAtDistance(segment, distance);

    return getSegmentFrameAtProgress(segment, progress);
}


export function getSegmentFrameAtProgress(segment, progress) {
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

export function getCurveProgressAtDistance(segment, distance) {
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