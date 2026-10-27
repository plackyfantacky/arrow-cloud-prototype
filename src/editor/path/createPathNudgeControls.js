import pathControlsTemplate from "./pathControls.html";
import { createPanelToggle } from "../editorUI.js";

export function createPathNudgeControls({ container = document.body, initialExpanded = true, onPanelExpandedChange = () => {}, onNudge, onCopy, onActionChange, onInsertMove, onDuplicateMove, onRemoveMove, onAddPath, onRemovePath }) {
    const state = {
        selectedPathInfo: null,
    };

    const template = document.createElement("template");
    template.innerHTML = pathControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle-panel"]');
    const content = controlsContainer.querySelector("[data-panel-content]");

    const viewportNotice = controlsContainer.querySelector("[data-viewport-notice]");

    const addPathButton = controlsContainer.querySelector('[data-action="add-path"]');
    const removePathButton = controlsContainer.querySelector('[data-action="remove-path"]');

    const pathOriginInputs = ["x", "y", "z"].map((axis) => {
        return controlsContainer.querySelector(`[data-control="path-origin-${axis}"]`);
    });

    const originSection = controlsContainer.querySelector("[data-origin-section]");
    const originLabel = controlsContainer.querySelector("[data-origin-label]");
    const originPosition = controlsContainer.querySelector("[data-origin-position]");

    const selectedLabel = controlsContainer.querySelector("[data-selected-label]");

    const currentActionSelect = controlsContainer.querySelector('[data-control="current-action"]');
    const newActionSelect = controlsContainer.querySelector('[data-control="new-action"]');

    const nudgeNegativeButton = controlsContainer.querySelector('[data-action="nudge-negative"]');
    const incrementSelect = controlsContainer.querySelector('[data-control="nudge-increment"]');
    const nudgePositiveButton = controlsContainer.querySelector('[data-action="nudge-positive"]');

    const trimStartButton = controlsContainer.querySelector('[data-action="trim-start"]');
    const removeButton = controlsContainer.querySelector('[data-action="remove"]');
    const trimEndButton = controlsContainer.querySelector('[data-action="trim-end"]');

    const insertBeforeButton = controlsContainer.querySelector('[data-action="insert-before"]');
    const duplicateButton = controlsContainer.querySelector('[data-action="duplicate"]');
    const insertAfterButton = controlsContainer.querySelector('[data-action="insert-after"]');

    const copyButton = controlsContainer.querySelector('[data-action="copy"]');

    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: "Path Editor",
        initialExpanded,
        onExpandedChange: onPanelExpandedChange,
    });

    function nudge(direction) {
        const increment = Number(incrementSelect.value);

        onNudge(direction * increment, "move:0");
    }

    addPathButton.addEventListener("click", () => {
        const origin = pathOriginInputs.map((input) => Number(input.value));

        if (origin.some((value) => !Number.isFinite(value))) {
            return;
        }

        onAddPath(origin);
    });

    removePathButton.addEventListener("click", onRemovePath);

    nudgeNegativeButton.addEventListener("click", () => nudge(-1));
    nudgePositiveButton.addEventListener("click", () => nudge(1));

    currentActionSelect.addEventListener("change", () => {
        onActionChange(currentActionSelect.value);
    });

    insertBeforeButton.addEventListener("click", () => {
        onInsertMove("before", newActionSelect.value);
    });

    insertAfterButton.addEventListener("click", () => {
        onInsertMove("after", newActionSelect.value);
    });

    duplicateButton.addEventListener("click", onDuplicateMove);

    removeButton.addEventListener("click", () => onRemoveMove("single"));
    trimStartButton.addEventListener("click", () => onRemoveMove("start"));
    trimEndButton.addEventListener("click", () => onRemoveMove("end"));

    copyButton.addEventListener("click", onCopy);

    function clearSelection() {
        removePathButton.disabled = true;

        state.selectedPathInfo = null;

        originSection.hidden = true;
        originLabel.textContent = "";
        originPosition.textContent = "";

        selectedLabel.textContent = "No segment selected";

        currentActionSelect.disabled = true;
        newActionSelect.disabled = true;

        [nudgeNegativeButton, nudgePositiveButton, insertBeforeButton, insertAfterButton, duplicateButton, removeButton, trimStartButton, trimEndButton, copyButton].forEach((button) => {
            button.disabled = true;
        });
    }

    function setSelectedOrigin(arrowName, position) {
        clearSelection();

        removePathButton.disabled = false;

        originSection.hidden = false;
        originLabel.textContent = arrowName;

        formatOriginPosition(position);

        copyButton.disabled = false;
    }

    function updateOriginPosition(position) {
        formatOriginPosition(position);
    }

    function formatOriginPosition(position) {
        return ["X", "Y", "Z"]
            .map((axis, index) => {
                return `${axis}: ${Number(position[index]).toFixed(3)}`;
            })
            .join("   ");
    }

    function setViewportOriginNoticeVisible(isVisible) {
        viewportNotice.hidden = !isVisible;
    }

    container.appendChild(controlsContainer);

    return {
        setSelectedPathInfo(
            selectedPathInfo, 
            isLastMove = false, 
            isFirstMove = false,
            canRemoveMove = false
        ) {
            removePathButton.disabled = false;
            originSection.hidden = true;

            state.selectedPathInfo = selectedPathInfo;
            selectedLabel.textContent = `${selectedPathInfo.arrowName} · Segment ${selectedPathInfo.segmentIndex + 1}`;

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
        },

        clearSelection,
        setSelectedOrigin,
        updateOriginPosition,
        setViewportOriginNoticeVisible,

        destroy() {
            panelToggle.destroy();
            controlsContainer.remove();
        },
    };
}
