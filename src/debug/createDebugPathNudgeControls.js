export function createDebugPathNudgeControls({ onNudge, onCopy }) {
    const state = {
        selectedDebugInfo: null,
        targetOffset: 0
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

    const moves = [
        { label: 'Previous move', value: '-1' },
        { label: 'Selected move', value: '0' },
        { label: 'Next move', value: '1' }
    ];

    moves.forEach((optionConfig) => {
        const option = document.createElement('option');
        option.value = optionConfig.value;
        option.textContent = optionConfig.label;

        if (optionConfig.value === '0') {
            option.selected = true;
        }

        targetSelect.appendChild(option);
    });

    targetSelect.addEventListener('change', () => {
        state.targetOffset = Number(targetSelect.value);
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
            onNudge(amount, state.targetOffset);
        });

        buttonRow.appendChild(button);
    });

    const copyButton = document.createElement('button');

    copyButton.type = 'button';
    copyButton.textContent = 'Copy moves';
    copyButton.addEventListener('click', onCopy);

    container.append(
        selectedLabel,
        targetSelect,
        buttonRow,
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
        },

        destroy() {
            container.remove();
        }
    };
}