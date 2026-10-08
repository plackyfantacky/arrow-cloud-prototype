import * as THREE from "three";

const selectedColour = new THREE.Color(0x00ffff);
const affectedColour = new THREE.Color(0xff3333);

export function createPathSegmentHighlight({ getObjects }) {
    const state = {
        selectedPathInfo: null,
        targetValue: 'move:0'
    };

    const highlightedMeshes = [];

    function clear() {
        highlightedMeshes.forEach((mesh) => {
            if (!mesh.userData.pathHighlightOriginalMaterial) {
                return;
            }

            mesh.material.dispose();
            mesh.material = mesh.userData.pathHighlightOriginalMaterial;

            delete mesh.userData.pathHighlightOriginalMaterial;

        });

        highlightedMeshes.length = 0;
    }

    function refresh() {
        clear();

        if (!state.selectedPathInfo) {
            return;
        }

        const affectedCornerPiece = findAffectedCornerPiece(
            getObjects(),
            state.selectedPathInfo,
            state.targetValue
        );

        const selectedPiece = findRevealPiece(
            getObjects(),
            state.selectedPathInfo
        );

        if (affectedCornerPiece && affectedCornerPiece !== selectedPiece) {
            applyHighlight(affectedCornerPiece, affectedColour);
        }

        if (selectedPiece) {
            applyHighlight(selectedPiece, selectedColour);
        }
    }

    function setSelectedPathInfo(selectedPathInfo) {
        state.selectedPathInfo = selectedPathInfo;
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

            if (object.userData.pathHighlightOriginalMaterial) {
                return;
            }

            object.userData.pathHighlightOriginalMaterial = object.material;
            object.material = createHighlightMaterial(object.material, colour);

            highlightedMeshes.push(object);
        });
    }

    function destroy() {
        clear();
    }

    return {
        setSelectedPathInfo,
        setTargetValue,
        clear,
        destroy
    };
}

function findRevealPiece(arrows, selectedPathInfo) {
    for (const arrow of arrows) {
        const revealPieces = arrow.userData.revealPieces || [];

        const revealPiece = revealPieces.find((piece) => {
            const pathInfo = piece.userData.pathInfo;

            return pathInfo
                && pathInfo.arrowName === selectedPathInfo.arrowName
                && pathInfo.segmentIndex === selectedPathInfo.segmentIndex;
        });

        if (revealPiece) {
            return revealPiece;
        }
    }

    return null;
}

function findAffectedCornerPiece(arrows, selectedPathInfo, targetValue) {
    if (!targetValue.startsWith('move:')) {
        return null;
    }

    const targetOffset = Number(targetValue.replace('move:', ''));

    if (Number.isNaN(targetOffset)) {
        return null;
    }

    const affectedCornerSegmentIndex = getAffectedCornerSegmentIndex(
        selectedPathInfo.segmentIndex,
        targetOffset
    );

    if (affectedCornerSegmentIndex < 0) {
        return null;
    }

    for (const arrow of arrows) {
        const revealPieces = arrow.userData.revealPieces || [];

        const affectedCornerPiece = revealPieces.find((piece) => {
            const pathInfo = piece.userData.pathInfo;

            return pathInfo
                && piece.userData.pieceType === 'corner'
                && pathInfo.arrowName === selectedPathInfo.arrowName
                && pathInfo.segmentIndex === affectedCornerSegmentIndex;
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