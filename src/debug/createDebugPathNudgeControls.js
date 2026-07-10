export function createDebugPathNudgeControls({
    onNudge,
    onCopy,
    onActionChange,
    onInsertMove,
    onDuplicateMove,
    onRemoveMove,
    onTargetChange
}) {
    const state = {
        selectedDebugInfo: null,
        targetValue: 'move:0'
    };

    const container = document.createElement('div');

    container.style.position = 'fixed';
    container.style.right = '1rem';
    container.style.bottom = '1rem';
    container.style.zIndex = '10';
    container.style.display = 'grid';
    container.style.gap = '0.5rem';
    container.style.padding = '0.75rem';
    container.style.background = 'rgba(0, 0, 0, 0.72)';
    container.style.color = '#fff';
    container.style.fontFamily = 'system-ui, sans-serif';
    container.style.fontSize = '13px';
    container.style.borderRadius = '0.5rem';

    const selectedLabel = document.createElement('div');
    selectedLabel.textContent = 'No segment selected';

    const targetSelect = document.createElement('select');

    const actionLabel = document.createElement('label');
    actionLabel.textContent = 'Action';

    const actionSelect = document.createElement('select');
    actionSelect.disabled = true;

    const targets = [
        { label: 'Origin X', value: 'origin:x' },
        { label: 'Origin Y', value: 'origin:y' },
        { label: 'Origin Z', value: 'origin:z' },
        { label: 'Previous move', value: 'move:-1' },
        { label: 'Selected move', value: 'move:0' },
        { label: 'Next move', value: 'move:1' }
    ];

    const actionOptions = [
        { label: 'Forward', value: 'forward' },
        { label: 'Turn left', value: 'turnLeft' },
        { label: 'Turn right', value: 'turnRight' },
        { label: 'Bend up', value: 'bendUp' },
        { label: 'Bend down', value: 'bendDown' },
    ];

    targets.forEach((optionConfig) => {
        const option = document.createElement('option');
        option.value = optionConfig.value;
        option.textContent = optionConfig.label;

        if (optionConfig.value === 'move:0') {
            option.selected = true;
        }

        targetSelect.appendChild(option);
    });

    targetSelect.addEventListener('change', () => {
        state.targetValue = targetSelect.value;

        if (onTargetChange) {
            onTargetChange(state.targetValue);
        }
    });

    actionOptions.forEach((optionConfig) => {
        const option = document.createElement('option');

        option.value = optionConfig.value;
        option.textContent = optionConfig.label;

        actionSelect.appendChild(option);
    });

    actionSelect.addEventListener('change', () => {
        onActionChange(actionSelect.value);
    });

    const buttonRow = document.createElement('div');

    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '0.35rem';
    buttonRow.style.flexWrap = 'wrap';

    const nudgeAmounts = [-0.25, -0.1, -0.05, 0.05, 0.1, 0.25];

    nudgeAmounts.forEach((amount) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = amount > 0 ? `+${amount}` : String(amount);

        button.addEventListener('click', () => {
            onNudge(amount, state.targetValue);
        });

        buttonRow.appendChild(button);
    });

    const segmentButtonRow = document.createElement('div');

    segmentButtonRow.style.display = 'flex';
    segmentButtonRow.style.gap = '0.35rem';
    segmentButtonRow.style.flexWrap = 'wrap';

    const insertBeforeButton = document.createElement('button');
    insertBeforeButton.type = 'button';
    insertBeforeButton.textContent = 'Insert before';
    insertBeforeButton.addEventListener('click', () => {
        onInsertMove('before', actionSelect.value);
    });

    const insertAfterButton = document.createElement('button');
    insertAfterButton.type = 'button';
    insertAfterButton.textContent = 'Insert after';
    insertAfterButton.addEventListener('click', () => {
        onInsertMove('after', actionSelect.value);
    });

    const duplicateButton = document.createElement('button');
    duplicateButton.type = 'button';
    duplicateButton.textContent = 'Duplicate';
    duplicateButton.addEventListener('click', onDuplicateMove);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', onRemoveMove);

    segmentButtonRow.append(
        insertBeforeButton,
        insertAfterButton,
        duplicateButton,
        removeButton
    );

    const copyButton = document.createElement('button');

    copyButton.type = 'button';
    copyButton.textContent = 'Copy path';
    copyButton.addEventListener('click', onCopy);

    container.append(
        selectedLabel,
        targetSelect,
        actionLabel,
        actionSelect,
        buttonRow,
        segmentButtonRow,
        copyButton
    );

    document.body.appendChild(container);

    return {
        setSelectedDebugInfo(selectedDebugInfo) {
            state.selectedDebugInfo = selectedDebugInfo;

            selectedLabel.textContent = [
                `arrowName: ${selectedDebugInfo.arrowName}`,
                `segmentIndex: ${selectedDebugInfo.segmentIndex}`,
                `actionName: ${selectedDebugInfo.actionName}`,
            ].join(' | ');

            actionSelect.disabled = false;
            actionSelect.value = selectedDebugInfo.actionName;
        },

        destroy() {
            container.remove();
        }
    };
}