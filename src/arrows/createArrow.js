import * as THREE from "three";

import { applyFrameToObject } from "./frame.js";
import { createArrowHead } from "./arrowHead.js";
import { createRectangularExtrusionGeometry } from "./geometry.js";
import { getTwistFrame } from "./twist.js";
import { createDrawRangeRevealPiece } from "./reveal.js";

import {
    getCubicBezierCurveState,
    getQuadraticBezierPoint,
    getQuadraticBezierTangent,
} from "./bezier.js";

export function createArrow(pieces, material, settings) {
    const group = new THREE.Group();
    group.userData.revealPieces = [];

    pieces.forEach((piece) => {
        let pieceGroup;

        switch(true) {
            case piece.type === 'corner':
                pieceGroup = createCornerPiece(piece, material, settings);
            break;
            case piece.type === 'twist':
                pieceGroup = createTwistPiece(piece, material, settings);
            break;
            case piece.type === 'curve':
                pieceGroup = createCurvePiece(piece, material, settings);
            break;
            default:
                pieceGroup = createStraightPiece(
                    piece.startPoint,
                    piece.endPoint,
                    piece.frame,
                    material,
                    settings
                );
            break;
        };

        pieceGroup.userData.revealStartPoint = piece.revealStartPoint
            ? piece.revealStartPoint.clone()
            : piece.startPoint.clone();

        pieceGroup.userData.revealEndPoint = piece.revealEndPoint
            ? piece.revealEndPoint.clone()
            : piece.endPoint.clone();

        pieceGroup.userData.revealLength = piece.revealLength
            ?? pieceGroup.userData.pieceLength;

        pieceGroup.userData.segmentIndex = piece.segmentIndex;
        pieceGroup.userData.actionName = piece.actionName;
        pieceGroup.userData.segmentLength = piece.segmentLength;

        group.add(pieceGroup);
        group.userData.revealPieces.push(pieceGroup);
    });
    
    const finalPiece = pieces[pieces.length - 1];
    const finalFrame = finalPiece.frame || finalPiece.endFrame || finalPiece.startFrame;

    const head = createArrowHead(
        finalPiece.endPoint,
        finalFrame,
        material,
        settings
    );

    head.visible = false;

    group.add(head);

    group.userData.head = head;
    
    return group;
}

// straight pieces

function createStraightPiece(startPoint, endPoint, frame, material, settings) {
    const direction = endPoint.clone().sub(startPoint);
    const length = direction.length();

    const geometry = new THREE.BoxGeometry(
        length,
        settings.bodyDepth,
        settings.bodyWidth
    );
    
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group();
    
    group.position.copy(startPoint);
    applyFrameToObject(group, frame);

    mesh.position.x = length * 0.5;
    group.add(mesh);

    group.userData.revealMesh = mesh;
    group.userData.pieceLength = length;
    group.userData.startPoint = startPoint.clone();
    group.userData.endPoint = endPoint.clone();
    group.userData.frame = frame;

    return group;
}

//corners

function createCornerPiece(piece, material, settings) {
    return createDrawRangeRevealPiece(
        piece,
        material,
        createCornerGeometry(piece, settings),
        settings.cornerSteps || 16,
        getCornerRevealState
    );
}

function createCornerGeometry(piece, settings) {
    const divisions = settings.cornerSteps || 16;

    return createRectangularExtrusionGeometry(
        settings,
        divisions,
        (progress) => {
            return {
                position: getQuadraticBezierPoint(
                    piece.startPoint,
                    piece.jointPoint,
                    piece.endPoint,
                    progress
                ),
                frame: getInterpolatedFrame(piece, progress),
            }
        }
    );
}

function getInterpolatedFrame(piece, progress) {
    const forward = getQuadraticBezierTangent(
        piece.startPoint,
        piece.jointPoint,
        piece.endPoint,
        progress
    );

    const normalReference = piece.startFrame.normal.clone()
        .lerp(piece.endFrame.normal, progress)
        .normalize();

    let side = forward.clone()
        .cross(normalReference);

    if (side.lengthSq() < 0.000001) {
        side = piece.startFrame.side.clone()
            .lerp(piece.endFrame.side, progress)
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
        side
    }
}

function getCornerRevealState(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
    
    return {
        position: getQuadraticBezierPoint(
            piece.startPoint,
            piece.jointPoint,
            piece.endPoint,
            clampedProgress
        ),
        frame: getInterpolatedFrame(piece, clampedProgress),
    };
}

//twists

function createTwistPiece(piece, material, settings) {
    return createDrawRangeRevealPiece(
        piece,
        createSmoothExtrusionMaterial(material),
        createTwistGeometry(piece, settings),
        settings.twistSteps || settings.cornerSteps || 16,
        getTwistRevealState
    );
}

function createTwistGeometry(piece, settings) {
    const divisions = settings.twistSteps || 16;

    return createRectangularExtrusionGeometry(
        settings,
        divisions,
        (progress) => {
            return {
                position: getTwistPosition(piece, progress),
                frame: getTwistFrame(piece, progress),
            };
        }
    );
}

function getTwistPosition(piece, progress) {
    return piece.startPoint.clone().lerp(
        piece.endPoint,
        THREE.MathUtils.clamp(progress, 0, 1)
    );
}

function getTwistRevealState(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    return {
        position: getTwistPosition(piece, clampedProgress),
        frame: getTwistFrame(piece, clampedProgress),
    };
}

function getCurveSourceSegment(piece) {
    return piece.sourceSegment || piece;
}

function getCurveSourceProgress(piece, progress) {
    const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);

    if (
        typeof piece.sourceStartProgress === 'number' &&
        typeof piece.sourceEndProgress === 'number'
    ) {
        return THREE.MathUtils.lerp(
            piece.sourceStartProgress,
            piece.sourceEndProgress,
            clampedProgress
        );
    }

    return clampedProgress;
}

function getCurveState(piece, progress) {
    const sourceSegment = getCurveSourceSegment(piece);
    const sourceProgress = getCurveSourceProgress(piece, progress);

    return getCubicBezierCurveState(
        sourceSegment,
        sourceProgress
    );
}

function getCurveRevealState(piece, progress){
    return getCurveState(piece, progress);
}

function createCurvePiece(piece, material, settings) {
    return createDrawRangeRevealPiece(
        piece,
        createSmoothExtrusionMaterial(material),
        createCurveGeometry(piece, settings),
        settings.curveSteps || settings.cornerSteps || 32,
        getCurveRevealState
    );
}

function createCurveGeometry(piece, settings) {
    const divisions = settings.curveSteps || settings.cornerSteps || 32;

    return createRectangularExtrusionGeometry(
        settings,
        divisions,
        (progress) => {
            return getCurveState(piece, progress)
        }
    );
}

function createSmoothExtrusionMaterial(material) {
    const extrusionMaterial = material.clone();

    extrusionMaterial.flatShading = false;
    extrusionMaterial.needsUpdate = true;

    return extrusionMaterial;
}