import * as THREE from "three";

const selectedColour = new THREE.Color(0x00ffff);
const affectedColour = new THREE.Color(0xff3333);

export function createDebugSegmentHighlight({ getObjects }) {
    const state = {
        selectedDebugInfo: null,
        targetValue: 'move:0'
    };

    const highlightedMeshes = [];

    function clear() {
        highlightedMeshes.forEach((mesh) => {
            if (!mesh.userData.debugHighlightOriginalMaterial) {
                return;
            }

            mesh.material.dispose();
            mesh.material = mesh.userData.debugHighlightOriginalMaterial;

            delete mesh.userData.debugHighlightOriginalMaterial;

        });

        highlightedMeshes.length = 0;
    }

    function refresh() {
        clear();

        if (!state.selectedDebugInfo) {
            return;
        }

        const affectedCornerPiece = findAffectedCornerPiece(
            getObjects(),
            state.selectedDebugInfo,
            state.targetValue
        );

        const selectedPiece = findRevealPiece(
            getObjects(),
            state.selectedDebugInfo
        );

        if (affectedCornerPiece && affectedCornerPiece !== selectedPiece) {
            applyHighlight(affectedCornerPiece, affectedColour);
        }

        if (selectedPiece) {
            applyHighlight(selectedPiece, selectedColour);
        }
    }

    function setSelectedDebugInfo(selectedDebugInfo) {
        state.selectedDebugInfo = selectedDebugInfo;
        refresh();
    }

    function setTargetValue(targetValue) {
        state.targetValue = targetValue;
        refresh();
    }

    function applyHighlight(piece, colour) {
        piece.traverse((object) => {
            if (!object.isMesh || !object.material) {
                return;
            }

            if (object.userData.debugHighlightOriginalMaterial) {
                return;
            }

            object.userData.debugHighlightOriginalMaterial = object.material;
            object.material = createHighlightMaterial(object.material, colour);

            highlightedMeshes.push(object);
        });
    }

    function destroy() {
        clear();
    }

    return {
        setSelectedDebugInfo,
        setTargetValue,
        clear,
        destroy
    };
}

function findRevealPiece(arrows, selectedDebugInfo) {
    for (const arrow of arrows) {
        const revealPieces = arrow.userData.revealPieces || [];

        const revealPiece = revealPieces.find((piece) => {
            const debugInfo = piece.userData.debugInfo;

            return debugInfo
                && debugInfo.arrowName === selectedDebugInfo.arrowName
                && debugInfo.segmentIndex === selectedDebugInfo.segmentIndex;
        });

        if (revealPiece) {
            return revealPiece;
        }
    }

    return null;
}

function findAffectedCornerPiece(arrows, selectedDebugInfo, targetValue) {
    if (!targetValue.startsWith('move:')) {
        return null;
    }

    const targetOffset = Number(targetValue.replace('move:', ''));

    if (Number.isNaN(targetOffset)) {
        return null;
    }

    const affectedCornerSegmentIndex = getAffectedCornerSegmentIndex(
        selectedDebugInfo.segmentIndex,
        targetOffset
    );

    if (affectedCornerSegmentIndex < 0) {
        return null;
    }

    for (const arrow of arrows) {
        const revealPieces = arrow.userData.revealPieces || [];

        const affectedCornerPiece = revealPieces.find((piece) => {
            const debugInfo = piece.userData.debugInfo;

            return debugInfo
                && piece.userData.pieceType === 'corner'
                && debugInfo.arrowName === selectedDebugInfo.arrowName
                && debugInfo.segmentIndex === affectedCornerSegmentIndex;
        });

        if (affectedCornerPiece) {
            return affectedCornerPiece;
        }
    }

    return null;
}

function getAffectedCornerSegmentIndex(segmentIndex, targetOffset) {
    if (targetOffset < 0) {
        return segmentIndex - 1;
    }

    return segmentIndex;
}

function createHighlightMaterial(material, colour) {
    const highlightMaterial = material.clone();

    if (highlightMaterial.color) {
        highlightMaterial.color.copy(colour);
    }

    if (highlightMaterial.emissive) {
        highlightMaterial.emissive.copy(colour);
        highlightMaterial.emissiveIntensity = 0.45;
    }

    highlightMaterial.needsUpdate = true;

    return highlightMaterial;
}