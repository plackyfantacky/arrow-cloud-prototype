import * as THREE from "three";

import { createPathEditor } from "./createPathEditor.js";
import { createPathNudgeControls } from "./createPathNudgeControls.js";
import { createLineTooltip } from "./createLineTooltip.js";
import { createPathSegmentSelector } from "./createPathSegmentSelector.js";
import { createPathSegmentHighlight } from "./createPathSegmentHighlight.js";
import { createArrowNameLabel } from "./createArrowNameLabel.js";
import { createPathOriginMarkers } from "./createPathOriginMarkers.js";

export function createPathTools({
    container = document.body,
    initialExpanded,
    onPanelExpandedChange,
    camera,
    renderer,
    scene,
    arrowPaths,
    getArrows,
    onPathsChange,
    lineLabelsVisible = true,
    getPathVisibility = () => true,
    onPathCollectionChange = () => {},
    onOriginDragStateChange = () => {},
    onSelectionChange = () => {},
}) {
    const pathEditor = createPathEditor(arrowPaths);

    let arrowNameLabels = [];
    let segmentHighlight = null;
    let dragPosition = null;
    let selectedOriginArrowName = null;

    function rebuild() {
        segmentHighlight?.clear();
        onPathsChange();
        originMarkers.sync(pathEditor.getArrowPaths());
    }

    function copyCurrentPath() {
        const arrowPath = selectedOriginArrowName
            ? pathEditor.getArrowPaths().find((path) => {
                  return path.name === selectedOriginArrowName;
              })
            : pathEditor.getSelectedArrowPath();

        if (!arrowPath) {
            console.warn("No arrow path selected.");
            return;
        }

        const output = JSON.stringify(
            arrowPath,
            (key, value) => {
                if (typeof value === "number") {
                    return Number(value.toFixed(3));
                }

                return value;
            },
            4,
        )
            // Condense numeric arrays onto one line.
            .replace(
                /\[\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?:\s*,\s*-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)*)\s*\]/gi,
                (match, values) => `[${values.split(/\s*,\s*/).join(", ")}]`,
            )
            // Condense move arrays onto one line.
            .replace(/\[\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\s*\]/g, '["$1", $2]')
            // Indent the complete fragment by eight spaces.
            .replace(/^/gm, "        ");

        navigator.clipboard
            .writeText(output)
            .then(() => {
                console.log("Copied arrow path:");
                console.log(output);
            })
            .catch((error) => {
                console.warn("Could not copy arrow path to the clipboard.");
                console.log(output);
                console.error(error);
            });
    }

    function moveRenderedArrow(arrowName, position) {
        if (!dragPosition) {
            const arrowPath = pathEditor.getArrowPaths().find((path) => {
                return path.name === arrowName;
            });

            if (!arrowPath) {
                return;
            }

            dragPosition = new THREE.Vector3(...arrowPath.origin);
        }

        const movement = position.clone().sub(dragPosition);

        if (movement.lengthSq() === 0) {
            return;
        }

        const arrow = getArrows().find((object) => {
            return object.userData.revealPieces?.some((piece) => {
                return piece.userData.pathInfo?.arrowName === arrowName;
            });
        });

        if (arrow) {
            arrow.position.add(movement);
        }

        dragPosition.copy(position);
    }

    const originMarkers = createPathOriginMarkers({
        camera,
        renderer,
        scene,
        onDragStateChange(isDragging) {
            onOriginDragStateChange(isDragging);

            arrowNameLabels.forEach((label) => {
                label.visible = lineLabelsVisible && !isDragging;
            });
        },

        onSelect(arrowName, marker) {
            selectedOriginArrowName = arrowName;

            pathEditor.setSelectedPathInfo(null);
            syncSelection();

            const arrowPath = pathEditor.getArrowPaths().find((path) => {
                return path.name === arrowName;
            });

            pathControls.setSelectedOrigin(arrowName, marker.position.toArray(), arrowPath.initialDirection);
        },

        onOriginChange(arrowName, position) {
            dragPosition = null;

            if (pathEditor.setPathOrigin(arrowName, position)) {
                rebuild();
            }
        },

        onOriginMove(arrowName, position) {
            moveRenderedArrow(arrowName, position);

            if (selectedOriginArrowName === arrowName) {
                pathControls.updateOriginPosition(position.toArray());
            }
        },
    });

    originMarkers.sync(pathEditor.getArrowPaths());

    function setPathVisibility(pathName, isVisible) {
        originMarkers.setVisibility(pathName, isVisible);
        arrowNameLabels.forEach((label) => {
            if (label.userData.pathName === pathName) {
                label.visible = isVisible && lineLabelsVisible;
            }
        });
    }

    const pathControls = createPathNudgeControls({
        container,
        initialExpanded,
        lineLabelsVisible,
        onPanelExpandedChange,

        onAddPath(origin, initialDirection) {
            pathEditor.addPath(origin, initialDirection);
            rebuild();
            onPathCollectionChange(pathEditor.getArrowPaths());
        },

        onRemovePath: removeSelectedPath,
        onRemoveMove: removeSelectedMove,

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
                syncSelection();
            }
        },

        onDuplicateMove() {
            const didChangePath = pathEditor.duplicateSelectedMove();

            if (didChangePath) {
                rebuild();
            }
        },

        onSelectedOriginChange(axisIndex, value) {
            const arrowPath = pathEditor.getArrowPaths().find((path) => {
                return path.name === selectedOriginArrowName;
            });

            if (!arrowPath) {
                return;
            }

            const position = new THREE.Vector3(...arrowPath.origin);
            position.setComponent(axisIndex, value);

            if (pathEditor.setPathOrigin(arrowPath.name, position)) {
                rebuild();
            }

            pathControls.updateOriginPosition(arrowPath.origin);
        },
        
        onSelectedInitialDirectionChange(initialDirection) {
            if (pathEditor.setPathInitialDirection(selectedOriginArrowName, initialDirection)) {
                rebuild();
            }
        },
    });

    syncViewportOriginNotice();

    const lineTooltip = createLineTooltip({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        },
    });

    const segmentSelector = createPathSegmentSelector({
        camera,
        renderer,

        getObjects() {
            return getArrows();
        },

        onSelect(pathInfo) {
            selectedOriginArrowName = null;
            originMarkers.clearSelection();

            pathEditor.setSelectedPathInfo(pathInfo);
            syncSelection();
        },

        onDeselect() {
            selectedOriginArrowName = null;
            originMarkers.clearSelection();

            pathEditor.setSelectedPathInfo(null);
            syncSelection();
        },

        onSelectOrigin(clientX, clientY) {
            return originMarkers.selectAt(clientX, clientY);
        },

        shouldIgnoreClick() {
            return originMarkers.isGizmoActive();
        },
    });

    segmentHighlight = createPathSegmentHighlight({
        getObjects() {
            return getArrows();
        },
    });

    function setArrowPaths(nextArrowPaths) {
        selectedOriginArrowName = null;
        dragPosition = null;

        originMarkers.clearSelection();
        pathEditor.setArrowPaths(nextArrowPaths);
        originMarkers.sync(pathEditor.getArrowPaths());

        syncSelection();
        syncViewportOriginNotice();
    }

    function getArrowPaths() {
        return pathEditor.getArrowPaths();
    }

    function getSelectedPathInfo() {
        return pathEditor.getSelectedPathInfo();
    }

    function removeSelectedPath() {
        const pathName = selectedOriginArrowName ?? pathEditor.getSelectedPathInfo()?.arrowName;

        if (!pathName || !pathEditor.removePath(pathName)) {
            return false;
        }

        selectedOriginArrowName = null;
        dragPosition = null;

        originMarkers.clearSelection();
        pathControls.clearSelection();

        rebuild();
        onPathCollectionChange(pathEditor.getArrowPaths());
        syncSelection();

        return true;
    }

    function removeSelectedMove(mode = "single") {
        if (!pathEditor.removeMoves(mode)) {
            return false;
        }

        rebuild();
        syncSelection();

        return true;
    }

    function handleKeyDown(event) {
        if (!["Delete", "Backspace"].includes(event.key)) {
            return;
        }
        if (event.metaKey || event.ctrlKey || event.altKey) {
            return;
        }

        const target = event.target;

        if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) {
            return;
        }

        const selectedPathInfo = pathEditor.getSelectedPathInfo();

        if (selectedOriginArrowName) {
            event.preventDefault();
            removeSelectedPath();
            return;
        }

        if (!selectedPathInfo) {
            return;
        }

        event.preventDefault();

        if (pathEditor.canRemoveSelectedMove()) {
            removeSelectedMove();
        } else {
            removeSelectedPath();
        }
    }

    function createArrowPathLabelText(arrowPath) {
        let values = arrowPath.origin
            .map((value) => {
                return Number(value).toFixed(3);
            })
            .join(", ");

        return [arrowPath.name, values].join("    ");
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
            const labelText = createArrowPathLabelText(renderedArrowItem.positionedArrowPath);

            const label = createArrowNameLabel(labelText, renderedArrowItem.segments[0]);
            label.userData.pathName = renderedArrowItem.positionedArrowPath.name;

            label.visible = lineLabelsVisible;

            renderedArrowItem.label = label;

            scene.add(label);

            return label;
        });
    }

    function setArrowNameLabelsVisible(isVisible) {
        lineLabelsVisible = isVisible;

        arrowNameLabels.forEach((label) => {
            label.visible = isVisible && getPathVisibility(label.userData.pathName);
        });
    }

    function attachPathInfo(renderedArrowItems) {
        renderedArrowItems.forEach((renderedArrowItem) => {
            renderedArrowItem.arrow.userData.revealPieces.forEach((revealPiece) => {
                revealPiece.userData.pathInfo = {
                    arrowName: renderedArrowItem.positionedArrowPath.name,
                    segmentIndex: revealPiece.userData.segmentIndex,
                    actionName: revealPiece.userData.actionName,
                    segmentLength: revealPiece.userData.segmentLength,
                };
            });
        });

        segmentHighlight?.setSelectedPathInfo(pathEditor.getSelectedPathInfo());
    }

    function syncSelection() {
        const selectedPathInfo = pathEditor.getSelectedPathInfo();

        const selectedPathName = selectedOriginArrowName ?? selectedPathInfo?.arrowName ?? null;

        if (!selectedPathInfo) {
            pathControls.clearSelection();
            segmentHighlight?.setSelectedPathInfo(null);
            onSelectionChange(selectedPathName);
            return;
        }

        pathControls.setSelectedPathInfo(
            selectedPathInfo,
            pathEditor.isSelectedMoveLast(),
            pathEditor.isSelectedMoveFirst(),
            pathEditor.canRemoveSelectedMove(),
        );

        segmentHighlight?.setSelectedPathInfo(selectedPathInfo);

        onSelectionChange(selectedPathName);
    }

    function syncViewportOriginNotice() {
        const hasViewportOrigins = pathEditor.getArrowPaths().some((arrowPath) => {
            return arrowPath.entry?.position === "viewport";
        });

        pathControls.setViewportOriginNoticeVisible(hasViewportOrigins);
    }

    function update() {
        lineTooltip.update();
    }

    function destroy() {
        window.removeEventListener("keydown", handleKeyDown);

        clearArrowNameLabels();

        pathControls.destroy();
        originMarkers.destroy();
        lineTooltip.destroy();
        segmentSelector.destroy();
        segmentHighlight.destroy();
    }

    window.addEventListener("keydown", handleKeyDown);

    return {
        setArrowPaths,
        getArrowPaths,
        getSelectedPathInfo,
        attachPathInfo,
        syncArrowNameLabels,
        setArrowNameLabelsVisible,
        setPathVisibility,
        update,
        destroy,
    };
}
