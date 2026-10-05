import { createDebugPathEditor } from './createDebugPathEditor.js';
import { createDebugPathNudgeControls } from './createDebugPathNudgeControls.js';
import { createDebugLineTooltip } from './createDebugLineTooltip.js';
import { createDebugSegmentSelector } from './createDebugSegmentSelector.js';
import { createDebugSegmentHighlight } from './createDebugSegmentHighlight.js';
import { createArrowNameLabel } from "./createArrowNameLabel.js";

export function createDebugPathTools({
    camera,
    renderer,
    scene,
    arrowPaths,
    getArrows,
    onPathsChange
}) {
    const pathEditor = createDebugPathEditor(arrowPaths);

    let arrowNameLabels = [];
    let segmentHighlight = null;

    function rebuild() {
        segmentHighlight?.clear();
        onPathsChange();
    }

    function copyCurrentPath() {
        const arrowPath = pathEditor.getSelectedArrowPath();

        if (!arrowPath) {
            console.warn('No debug segment selected.');
            return;
        }

        const output = JSON.stringify(arrowPath, null, 4)
            .replace(
                /\[\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\s*\]/g,
                '["$1", $2]'
            );

        navigator.clipboard.writeText(output)
            .then(() => {
                console.log('Copied arrow path:');
                console.log(output);
            })
            .catch((error) => {
                console.warn('Could not copy arrow path to the clipboard.');
                console.log(output);
                console.error(error);
            });
    }

    const pathControls = createDebugPathNudgeControls({
        onNudge(amount, targetValue) {
            const didChangePath = pathEditor.nudgeSelectedPathValue(amount, targetValue);

            if (didChangePath) {
                rebuild();
            }
        },

        onCopy: copyCurrentPath,

        onActionChange(actionName) {
            const didChangePath = pathEditor.changeSelectedMoveAction(actionName);

            if (didChangePath) {
                rebuild();
            }
        },

        onInsertMove(position, actionName) {
            const didChangePath = pathEditor.insertMoveNearSelectedMove(position, actionName);

            if (didChangePath) {
                rebuild();
            }
        },

        onDuplicateMove() {
            const didChangePath = pathEditor.duplicateSelectedMove();

            if (didChangePath) {
                rebuild();
            }
        },

        onRemoveMove() {
            const didChangePath = pathEditor.removeSelectedMove();

            if (didChangePath) {
                rebuild();
            }
        },

        onTargetChange(targetValue) {
            segmentHighlight?.setTargetValue(targetValue);
        }
    });

    const lineTooltip = createDebugLineTooltip({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        }
    });

    const segmentSelector = createDebugSegmentSelector({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        },

        onSelect(debugInfo) {
            pathEditor.setSelectedDebugInfo(debugInfo);

            pathControls.setSelectedDebugInfo(debugInfo, pathEditor.isSelectedMoveLast());

            segmentHighlight.setSelectedDebugInfo(debugInfo);
        }
    });

    segmentHighlight = createDebugSegmentHighlight({
        getObjects() {
            return getArrows();
        }
    });

    function setArrowPaths(nextArrowPaths) {
        pathEditor.setArrowPaths(nextArrowPaths);
    }

    function getArrowPaths() {
        return pathEditor.getArrowPaths();
    }

    function getSelectedDebugInfo() {
        return pathEditor.getSelectedDebugInfo();
    }

    function formatVectorValues(values) {
        return values.map((value) => {
            return Number(value).toFixed(3);
        }).join(', ');
    }

    function createArrowDebugLabelText(arrowPath) {
        return [
            arrowPath.name,
            `(${formatVectorValues(arrowPath.origin)})`
        ].join('    ');
    }

    function clearArrowNameLabels() {
        arrowNameLabels.forEach((label) => {
            scene.remove(label);

            label.geometry?.dispose();
            
            if (label.material?.map) {
                label.material.map.dispose();
            }
        });

        arrowNameLabels = [];
    }

    function syncArrowNameLabels(renderedArrowItems) {
        clearArrowNameLabels();

        arrowNameLabels = renderedArrowItems.map((renderedArrowItem) => {
            const labelText = createArrowDebugLabelText(
                renderedArrowItem.positionedArrowPath
            );

            const label = createArrowNameLabel(
                labelText,
                renderedArrowItem.segments[0]
            );

            renderedArrowItem.label = label;

            scene.add(label);

            return label;
        });
    }

    function attachDebugInfo(renderedArrowItems) {
        renderedArrowItems.forEach((renderedArrowItem) => {
            renderedArrowItem.arrow.userData.revealPieces.forEach((revealPiece) => {
                revealPiece.userData.debugInfo = {
                    arrowName: renderedArrowItem.positionedArrowPath.name,
                    segmentIndex: revealPiece.userData.segmentIndex,
                    actionName: revealPiece.userData.actionName,
                    segmentLength: revealPiece.userData.segmentLength
                };
            });
        });

        segmentHighlight?.setSelectedDebugInfo(
            pathEditor.getSelectedDebugInfo()
        );
    }

    function update() {
        lineTooltip.update();
    }

    function destroy() {
        clearArrowNameLabels();

        pathControls.destroy();
        lineTooltip.destroy();
        segmentSelector.destroy();
        segmentHighlight.destroy();
    }

    return {
        setArrowPaths,
        getArrowPaths,
        getSelectedDebugInfo,
        attachDebugInfo,
        syncArrowNameLabels,
        update,
        destroy
    };
}