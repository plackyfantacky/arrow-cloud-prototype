import pathControlsTemplate from "./pathControls.html";
import { createPanelToggle } from "../editorUI.js";

// Helper functions
function getInitialDirectionValue(initialDirection) {
    if (!Array.isArray(initialDirection)) {
        return initialDirection ?? "";
    }

    const axisDirections = [
        ["+x", [1, 0, 0]],
        ["-x", [-1, 0, 0]],
        ["+y", [0, 1, 0]],
        ["-y", [0, -1, 0]],
        ["+z", [0, 0, 1]],
        ["-z", [0, 0, -1]],
    ];

    const length = Math.hypot(...initialDirection);

    if (!Number.isFinite(length) || length === 0) {
        return "";
    }

    const matchingDirection = axisDirections.find(([, vector]) => {
        return vector.every((value, index) => {
            return Math.abs(value - initialDirection[index] / length) < 1e-6;
        });
    });

    return matchingDirection?.[0] ?? "";
}

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
        isCreatingPath: false,
    };

    const template = document.createElement("template");
    template.innerHTML = pathControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);
    const query = (selector) => controlsContainer.querySelector(selector);

    // Panel
    const toggleButton = query('[data-action="toggle-panel"]');
    const closePathCreateButton = query('[data-action="close-path-create"]');
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
            setPathCreationOpen(true);
        });

        // close "x" button
        closePathCreateButton.addEventListener("click", () => {
            setPathCreationOpen(false);
        });

        // cancel
        cancelPathButton.addEventListener("click", () => {
            setPathCreationOpen(false);
        });

        // add path
        addPathButton.addEventListener("click", () => {
            const origin = pathOriginInputs.map((input) => input.valueAsNumber);

            if (origin.some((value) => !Number.isFinite(value))) {
                return;
            }

            onAddPath(origin, initialDirectionSelect.value);
            setPathCreationOpen(false);
        });

        function handleEscape(event) {
            if (event.key !== "Escape" || !state.isCreatingPath) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            setPathCreationOpen(false);
        }

        function handleResize() {
            if (state.isCreatingPath) {
                positionPathCreationPanel();
            }
        }

        window.addEventListener("keydown", handleEscape, true);
        window.addEventListener("resize", handleResize);

        return function unbindPathCreationEvents() {
            window.removeEventListener("keydown", handleEscape, true);
            window.removeEventListener("resize", handleResize);
        };
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
        updateSelectionControls();

        showEditorMode(state.selectionMode);
    }

    function setSelectedOrigin(arrowName, position, initialDirection) {
        clearSelection();
        state.selectionMode = "path";

        editorHeading.textContent = arrowName;
        updateInitialDirection(initialDirection);
        updateOriginPosition(position);

        updateSelectionControls();
        showEditorMode(state.selectionMode);
    }

    function setSelectedPathInfo(selectedPathInfo, isLastMove = false, isFirstMove = false, canRemoveMove = false) {
        state.selectedPathInfo = selectedPathInfo;
        state.selectionMode = "segment";

        editorHeading.textContent = `${selectedPathInfo.arrowName} · Segment ${selectedPathInfo.segmentIndex + 1}`;
        currentActionSelect.value = selectedPathInfo.actionName;
        insertAfterButton.textContent = isLastMove ? "Add segment" : "Insert After";

        updateSelectionControls({ isFirstMove, isLastMove, canRemoveMove });
        showEditorMode(state.selectionMode);
    }

    // Display helpers
    function setPathCreationOpen(isOpen) {
        if (isOpen === state.isCreatingPath) {
            return;
        }

        if (isOpen) {
            createSection.showPopover();
            positionPathCreationPanel();
            initialDirectionSelect.focus();
        } else {
            createSection.hidePopover();
            newPathButton.focus();
        }

        state.isCreatingPath = isOpen;
        newPathButton.setAttribute("aria-expanded", String(isOpen));
    }

    function positionPathCreationPanel() {
        const openerBounds = newPathButton.getBoundingClientRect();
        const panelBounds = createSection.getBoundingClientRect();
        const margin = 16;
        const gap = 20;

        const maximumLeft = window.innerWidth - panelBounds.width - margin;
        const maximumTop = window.innerHeight - panelBounds.height - margin;

        const left = Math.max(margin, Math.min(openerBounds.right + gap, maximumLeft));

        const top = Math.max(margin, Math.min(openerBounds.top, maximumTop));

        createSection.style.left = `${left}px`;
        createSection.style.top = `${top}px`;
    }

    function resetSelectedFields() {
        editorHeading.textContent = "No path selected";
        selectedInitialDirectionSelect.value = "";

        selectedOriginInputs.forEach((input) => {
            input.value = "";
        });
    }

    function updateSelectionControls({ isFirstMove = false, isLastMove = false, canRemoveMove = false } = {}) {
        const isPathSelected = state.selectionMode === "path";
        const isSegmentSelected = state.selectionMode === "segment";
        const hasSelection = isPathSelected || isSegmentSelected;

        selectedOriginInputs.forEach((input) => {
            input.disabled = !isPathSelected;
        });

        selectedInitialDirectionSelect.disabled = !isPathSelected;

        const segmentControls = [
            currentActionSelect,
            newActionSelect,
            nudgeNegativeButton,
            nudgePositiveButton,
            insertBeforeButton,
            insertAfterButton,
            duplicateButton,
        ];

        segmentControls.forEach((control) => {
            control.disabled = !isSegmentSelected;
        });

        removeButton.disabled = !isSegmentSelected || !canRemoveMove;
        trimStartButton.disabled = !isSegmentSelected || isFirstMove || isLastMove;
        trimEndButton.disabled = !isSegmentSelected || isFirstMove || isLastMove;

        copyButton.disabled = !hasSelection;
        removePathButton.disabled = !hasSelection;
    }

    function showEditorMode(mode) {
        if (mode !== "segment" || state.editorMode !== "segment") {
            setAddSegmentExpanded(false);
        }
        state.editorMode = mode;
        emptySection.hidden = mode !== "empty";
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
        selectedInitialDirectionSelect.value = getInitialDirectionValue(initialDirection);
    }

    function setViewportOriginNoticeVisible(isVisible) {
        viewportNotice.hidden = !isVisible;
    }

    // Clean up
    function destroy() {
        panelToggle.destroy();
        controlsContainer.remove();
        unbindPathCreationEvents();
    }

    // Initialise
    const unbindPathCreationEvents = bindPathCreationEvents();
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
