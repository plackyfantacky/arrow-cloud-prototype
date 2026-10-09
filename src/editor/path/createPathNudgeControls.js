import pathControlsTemplate from './pathControls.html';
import { createPanelToggle } from '../editorUI.js';

export function createPathNudgeControls({
    onNudge,
    onCopy,
    onActionChange,
    onInsertMove,
    onDuplicateMove,
    onRemoveMove,
    onTargetChange,
    onLineLabelsVisibilityChange = () => {},
    onPanelExpandedChange = () => {},
    lineLabelsVisible = true,
    initialExpanded = true,
    container = document.body
}) {
    const state = {
        selectedPathInfo: null,
        targetValue: 'move:0'
    };

    const template = document.createElement('template');
    template.innerHTML = pathControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle-panel"]');
    const content = controlsContainer.querySelector('[data-panel-content]');
    const selectedLabel = controlsContainer.querySelector('[data-selected-label]');
    const targetSelect = controlsContainer.querySelector('[data-control="target"]');
    const actionSelect = controlsContainer.querySelector('[data-control="action"]');
    const lineLabelsCheckbox = controlsContainer.querySelector('[data-control="line-labels"]');

    const buttonRow = controlsContainer.querySelector('[data-nudge-buttons]');

    const insertBeforeButton = controlsContainer.querySelector('[data-action="insert-before"]');
    const insertAfterButton = controlsContainer.querySelector('[data-action="insert-after"]');
    const duplicateButton = controlsContainer.querySelector('[data-action="duplicate"]');
    const removeButton = controlsContainer.querySelector('[data-action="remove"]');
    const copyButton = controlsContainer.querySelector('[data-action="copy"]');

    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: 'Path Editor',
        initialExpanded,
        onExpandedChange: onPanelExpandedChange
    });

    lineLabelsCheckbox.checked = lineLabelsVisible;

    lineLabelsCheckbox.addEventListener('change', () => {
        onLineLabelsVisibilityChange(lineLabelsCheckbox.checked);
    });

    targetSelect.addEventListener('change', () => {
        state.targetValue = targetSelect.value;
        onTargetChange?.(state.targetValue);
    });

    actionSelect.addEventListener('change', () => {
        onActionChange(actionSelect.value);
    });

    const nudgeAmounts = [-1, -0.5, -0.25, -0.1, 0.1, 0.25, 0.5, 1];

    nudgeAmounts.forEach((amount) => {
        const button = document.createElement('button');

        button.type = 'button';
        button.textContent = amount > 0
            ? `+${amount}`
            : String(amount);

        button.addEventListener('click', () => {
            onNudge(amount, state.targetValue);
        });

        buttonRow.appendChild(button);
    });

    insertBeforeButton.addEventListener('click', () => {
        onInsertMove('before', actionSelect.value);
    });

    insertAfterButton.addEventListener('click', () => {
        onInsertMove('after', actionSelect.value);
    });

    duplicateButton.addEventListener('click', onDuplicateMove);
    removeButton.addEventListener('click', onRemoveMove);
    copyButton.addEventListener('click', onCopy);

    function clearSelection() {
        state.selectedPathInfo = null;

        selectedLabel.textContent = 'No segment selected';
        actionSelect.disabled = true;
        insertAfterButton.textContent = 'Insert After';
    }

    container.appendChild(controlsContainer);

    return {
        setSelectedPathInfo(selectedPathInfo, isLastMove = false) {
            state.selectedPathInfo = selectedPathInfo;

            selectedLabel.textContent = [
                `arrowName: ${selectedPathInfo.arrowName}`,
                `segmentIndex: ${selectedPathInfo.segmentIndex}`,
                `actionName: ${selectedPathInfo.actionName}`
            ].join(' | ');

            actionSelect.disabled = false;
            actionSelect.value = selectedPathInfo.actionName;

            insertAfterButton.textContent = isLastMove
                ? 'Add Segment'
                : 'Insert After';
        },

        clearSelection,

        destroy() {
            panelToggle.destroy();
            controlsContainer.remove();
        }
    };
}