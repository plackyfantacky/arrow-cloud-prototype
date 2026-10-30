import pathControlsTemplate from "./pathControls.html";
import { createPanelToggle } from "../editorUI.js";

export function createPathControls({
    container = document.body,
    initialExpanded = true,
    onPanelExpandedChange = () => {},
    onNudge,
    onCopy,
    onActionChange,
    onInsertMove,
    onDuplicateMove,
    onRemoveMove,
    onAddPath,
    onRemovePath,
    onSelectedOriginChange,
    onSelectedInitialDirectionChange,
}) {
    const state = {
        selectedPathInfo: null,
        selectionMode: "empty",
        editorMode: "empty",
    };

    const template = document.createElement("template");
    template.innerHTML = pathControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);
    const query = (selector) => controlsContainer.querySelector(selector);

    // Panel
    const toggleButton = query('[data-action="toggle-panel"]');
    const content = query("[data-panel-content]");
    const viewportNotice = query("[data-viewport-notice]");

    // Editor sections
    const editorHeading = query("[data-editor-heading]");
    const emptySection = query("[data-path-empty]");
    const createSection = query("[data-path-create]");
    const originSection = query("[data-origin-section]");
    const editSegmentSection = query("[data-edit-segment]");
    const addSegmentSection = query("[data-add-segment]");

    // Path creation
    const newPathButton = query('[data-action="new-path"]');
    const cancelPathButton = query('[data-action="cancel-path"]');
    const addPathButton = query('[data-action="add-path"]');
    const initialDirectionSelect = query('[data-control="path-initial-direction"]');

    const pathOriginInputs = ["x", "y", "z"].map((axis) => {
        return query(`[data-control="path-origin-${axis}"]`);
    });

    // Selected path
    const selectedOriginInputs = ["x", "y", "z"].map((axis) => {
        return query(`[data-control="selected-origin-${axis}"]`);
    });
    const selectedInitialDirectionSelect = query('[data-control="selected-initial-direction"]');
    const removePathButton = query('[data-action="remove-path"]');

    // Segment editing
    const currentActionSelect = query('[data-control="current-action"]');
    const nudgeNegativeButton = query('[data-action="nudge-negative"]');
    const incrementSelect = query('[data-control="nudge-increment"]');
    const nudgePositiveButton = query('[data-action="nudge-positive"]');

    const trimStartButton = query('[data-action="trim-start"]');
    const removeButton = query('[data-action="remove"]');
    const trimEndButton = query('[data-action="trim-end"]');

    // Segment insertion
    const toggleAddSegmentButton = query('[data-action="toggle-add-segment"]');
    const addSegmentContent = query("[data-add-segment-content]");
    const addSegmentIndicator = query("[data-add-segment-indicator]");

    const newActionSelect = query('[data-control="new-action"]');
    const insertBeforeButton = query('[data-action="insert-before"]');
    const insertAfterButton = query('[data-action="insert-after"]');
    const duplicateButton = query('[data-action="duplicate"]');
    const cancelAddSegmentButton = query('[data-action="cancel-add-segment"]');

    // Data Export
    const exportSection = query("[data-export-data]");
    const copyButton = query('[data-action="copy"]');

    // Path Actions
    const pathActionsSection = query("[data-path-actions]");

    // Panel setup
    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: "Path Editor",
        initialExpanded,
        onExpandedChange: onPanelExpandedChange,
    });

    // Event binding
    function bindPathCreationEvents() {
        // new path
        newPathButton.addEventListener("click", () => {
            showEditorMode("create");
        });

        // cancel
        cancelPathButton.addEventListener("click", () => {
            showEditorMode(state.selectionMode);
        });

        // add path
        addPathButton.addEventListener("click", () => {
            const origin = pathOriginInputs.map((input) => Number(input.value));

            if (origin.some((value) => !Number.isFinite(value))) {
                return;
            }

            onAddPath(origin, initialDirectionSelect.value);
            showEditorMode(state.selectionMode);
        });
    }

    function bindPathPropertyEvents() {
        selectedOriginInputs.forEach((input, axisIndex) => {
            input.addEventListener("change", () => {
                const value = input.valueAsNumber;

                if (state.selectionMode !== "path" || !Number.isFinite(value)) {
                    return;
                }

                onSelectedOriginChange(axisIndex, value);
            });
        });

        selectedInitialDirectionSelect.addEventListener("change", () => {
            if (state.selectionMode !== "path") {
                return;
            }

            onSelectedInitialDirectionChange(selectedInitialDirectionSelect.value);
        });
    }

    function bindSegmentEditingEvents() {
        // current action
        currentActionSelect.addEventListener("change", () => {
            onActionChange(currentActionSelect.value);
        });

        // adjust distance -/+
        nudgeNegativeButton.addEventListener("click", () => nudge(-1));
        nudgePositiveButton.addEventListener("click", () => nudge(1));

        //trim start
        trimStartButton.addEventListener("click", () => onRemoveMove("start"));

        //trim end
        trimEndButton.addEventListener("click", () => onRemoveMove("end"));

        //delete segment
        removeButton.addEventListener("click", () => onRemoveMove("single"));

        function nudge(direction) {
            const increment = Number(incrementSelect.value);
            onNudge(direction * increment, "move:0");
        }
    }

    function bindSegmentInsertionEvents() {
        // add segment toggle
        toggleAddSegmentButton.addEventListener("click", () => {
            setAddSegmentExpanded(addSegmentContent.hidden);
        });

        // cancel/collapse add segment panel
        cancelAddSegmentButton.addEventListener("click", () => {
            setAddSegmentExpanded(false);
            toggleAddSegmentButton.focus();
        });

        // insert after (and "Add segment")
        insertAfterButton.addEventListener("click", () => {
            onInsertMove("after", newActionSelect.value);
        });

        //insert before
        insertBeforeButton.addEventListener("click", () => {
            onInsertMove("before", newActionSelect.value);
        });

        //duplicate
        duplicateButton.addEventListener("click", onDuplicateMove);
    }

    function bindPathActionEvents() {
        // copy
        copyButton.addEventListener("click", onCopy);

        // delete
        removePathButton.addEventListener("click", onRemovePath);
    }

    // Selection functions
    function clearSelection() {
        state.selectedPathInfo = null;
        state.selectionMode = "empty";

        resetSelectedFields();
        disableSelectionControls();

        originSection.hidden = true;

        // clearing selection must not close new-path panel
        if (state.editorMode !== "create") {
            showEditorMode(state.selectionMode);
        }
    }

    function setSelectedOrigin(arrowName, position, initialDirection) {
        clearSelection();

        updateInitialDirection(initialDirection);
        selectedInitialDirectionSelect.disabled = false;

        editorHeading.textContent = arrowName;

        removePathButton.disabled = false;

        originSection.hidden = false;

        updateOriginPosition(position);

        copyButton.disabled = false;

        selectedOriginInputs.forEach((input) => {
            input.disabled = false;
        });

        state.selectionMode = "path";
        showEditorMode(state.selectionMode);
    }

    function setSelectedPathInfo(selectedPathInfo, isLastMove = false, isFirstMove = false, canRemoveMove = false) {
        removePathButton.disabled = false;
        originSection.hidden = true;

        state.selectedPathInfo = selectedPathInfo;
        editorHeading.textContent = `${selectedPathInfo.arrowName} · Segment ${selectedPathInfo.segmentIndex + 1}`;

        currentActionSelect.disabled = false;
        currentActionSelect.value = selectedPathInfo.actionName;

        newActionSelect.disabled = false;
        nudgeNegativeButton.disabled = false;
        nudgePositiveButton.disabled = false;
        insertBeforeButton.disabled = false;
        insertAfterButton.disabled = false;
        duplicateButton.disabled = false;
        removeButton.disabled = !canRemoveMove;
        copyButton.disabled = false;

        trimStartButton.disabled = isFirstMove || isLastMove;
        trimEndButton.disabled = isFirstMove || isLastMove;

        insertAfterButton.textContent = isLastMove ? "Add segment" : "Insert After";
        state.selectionMode = "segment";
        showEditorMode(state.selectionMode);
    }

    // Display helpers
    function resetSelectedFields() {
        editorHeading.textContent = "No path selected";
        selectedInitialDirectionSelect.value = "";

        selectedOriginInputs.forEach((input) => {
            input.value = "";
        });
    }

    function disableSelectionControls() {
        const selectionControls = [
            ...selectedOriginInputs,
            selectedInitialDirectionSelect,
            currentActionSelect,
            newActionSelect,
            nudgeNegativeButton,
            nudgePositiveButton,
            insertBeforeButton,
            insertAfterButton,
            duplicateButton,
            removeButton,
            trimStartButton,
            trimEndButton,
            copyButton,
            removePathButton,
        ];

        selectionControls.forEach((control) => {
            control.disabled = true;
        });
    }

    function showEditorMode(mode) {
        if (mode !== "segment" || state.editorMode !== "segment") {
            setAddSegmentExpanded(false);
        }
        state.editorMode = mode;
        emptySection.hidden = mode !== "empty";
        createSection.hidden = mode !== "create";
        originSection.hidden = mode !== "path";
        editSegmentSection.hidden = mode !== "segment";
        addSegmentSection.hidden = mode !== "segment";
        exportSection.hidden = mode !== "path" && mode !== "segment";
        pathActionsSection.hidden = mode !== "path" && mode !== "segment";
    }

    function setAddSegmentExpanded(isExpanded) {
        addSegmentContent.hidden = !isExpanded;
        toggleAddSegmentButton.setAttribute("aria-expanded", String(isExpanded));
        addSegmentIndicator.textContent = isExpanded ? "▴" : "▾";
    }

    function updateOriginPosition(position) {
        selectedOriginInputs.forEach((input, index) => {
            input.value = String(Number(position[index].toFixed(3)));
        });
    }

    function updateInitialDirection(initialDirection) {
        const axisDirections = [
            ["+x", [1, 0, 0]],
            ["-x", [-1, 0, 0]],
            ["+y", [0, 1, 0]],
            ["-y", [0, -1, 0]],
            ["+z", [0, 0, 1]],
            ["-z", [0, 0, -1]],
        ];

        let directionValue = initialDirection;

        if (Array.isArray(initialDirection)) {
            const length = Math.hypot(...initialDirection);

            directionValue = axisDirections.find(([, vector]) => {
                return vector.every((value, index) => {
                    return Math.abs(value - initialDirection[index] / length) < 1e-6;
                });
            })?.[0];
        }

        selectedInitialDirectionSelect.value = directionValue ?? "";
    }

    function setViewportOriginNoticeVisible(isVisible) {
        viewportNotice.hidden = !isVisible;
    }

    // Clean up
    function destroy() {
        panelToggle.destroy();
        controlsContainer.remove();
    }

    // Initialise
    bindPathCreationEvents();
    bindPathPropertyEvents();
    bindSegmentEditingEvents();
    bindSegmentInsertionEvents();
    bindPathActionEvents();

    showEditorMode(state.selectionMode);
    container.appendChild(controlsContainer);

    // Public API
    return {
        setSelectedPathInfo,
        clearSelection,
        setSelectedOrigin,
        updateOriginPosition,
        setViewportOriginNoticeVisible,
        destroy,
    };
}
