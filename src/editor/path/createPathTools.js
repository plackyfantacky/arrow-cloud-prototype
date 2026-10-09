import { createPathEditor } from './createPathEditor.js';
import { createPathNudgeControls } from './createPathNudgeControls.js';
import { createLineTooltip } from './createLineTooltip.js';
import { createPathSegmentSelector } from './createPathSegmentSelector.js';
import { createPathSegmentHighlight } from './createPathSegmentHighlight.js';
import { createArrowNameLabel } from "./createArrowNameLabel.js";

export function createPathTools({
    camera,
    renderer,
    scene,
    arrowPaths,
    getArrows,
    onPathsChange,
    container = document.body,
    initialExpanded,
    lineLabelsVisible = true,
    onPanelExpandedChange,
    onLineLabelsVisibilityChange
}) {
    const pathEditor = createPathEditor(arrowPaths);

    let arrowNameLabels = [];
    let segmentHighlight = null;

    function rebuild() {
        segmentHighlight?.clear();
        onPathsChange();
    }

    function copyCurrentPath() {
        const arrowPath = pathEditor.getSelectedArrowPath();

        if (!arrowPath) {
            console.warn('No path segment selected.');
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

    const pathControls = createPathNudgeControls({
        container,
        initialExpanded,
        lineLabelsVisible,
        onPanelExpandedChange,
        
        onLineLabelsVisibilityChange(isVisible) {
            setArrowNameLabelsVisible(isVisible);
            onLineLabelsVisibilityChange?.(isVisible);
        },

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

    const lineTooltip = createLineTooltip({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        }
    });

    const segmentSelector = createPathSegmentSelector({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        },

        onSelect(pathInfo) {
            pathEditor.setSelectedPathInfo(pathInfo);

            pathControls.setSelectedPathInfo(pathInfo, pathEditor.isSelectedMoveLast());

            segmentHighlight.setSelectedPathInfo(pathInfo);
        },

        onDeselect() {
            pathEditor.setSelectedPathInfo(null);
            pathControls.clearSelection();
            segmentHighlight.setSelectedPathInfo(null); 
        }
    });

    segmentHighlight = createPathSegmentHighlight({
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

    function getSelectedPathInfo() {
        return pathEditor.getSelectedPathInfo();
    }

    function formatVectorValues(values) {
        return values.map((value) => {
            return Number(value).toFixed(3);
        }).join(', ');
    }

    function createArrowPathLabelText(arrowPath) {
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
            const labelText = createArrowPathLabelText(
                renderedArrowItem.positionedArrowPath
            );

            const label = createArrowNameLabel(
                labelText,
                renderedArrowItem.segments[0]
            );
            
            label.visible = lineLabelsVisible;
            
            renderedArrowItem.label = label;

            scene.add(label);

            return label;
        });
    }

    function setArrowNameLabelsVisible(isVisible) {
        lineLabelsVisible = isVisible;

        arrowNameLabels.forEach((label) => {
            label.visible = isVisible;
        });
    }

    function attachPathInfo(renderedArrowItems) {
        renderedArrowItems.forEach((renderedArrowItem) => {
            renderedArrowItem.arrow.userData.revealPieces.forEach((revealPiece) => {
                revealPiece.userData.pathInfo = {
                    arrowName: renderedArrowItem.positionedArrowPath.name,
                    segmentIndex: revealPiece.userData.segmentIndex,
                    actionName: revealPiece.userData.actionName,
                    segmentLength: revealPiece.userData.segmentLength
                };
            });
        });

        segmentHighlight?.setSelectedPathInfo(
            pathEditor.getSelectedPathInfo()
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
        getSelectedPathInfo,
        attachPathInfo,
        syncArrowNameLabels,
        setArrowNameLabelsVisible,
        update,
        destroy
    };
}