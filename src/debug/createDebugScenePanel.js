export function createDebugScenePanel({
    gridVisible = true,
    axesVisible = true,
    arrowNames = [],
    onGridVisibilityChange = () => {},
    onAxesVisibilityChange = () => {},
    onArrowVisibilityChange = () => {},
    onArrowOpacityChange = () => {}
}) {
    const container = document.createElement('div');

    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '10';
    container.style.display = 'grid';
    container.style.gap = '0.5rem';
    container.style.padding = '0.75rem';
    container.style.background = 'rgba(0, 0, 0, 0.72)';
    container.style.color = '#fff';
    container.style.fontFamily = 'system-ui, sans-serif';
    container.style.fontSize = '13px';
    container.style.borderRadius = '0.5rem';

    //grid toggle

    const gridLabel = document.createElement('label');
    const gridCheckbox = document.createElement('input');

    gridCheckbox.type = 'checkbox';
    gridCheckbox.checked = gridVisible;

    gridCheckbox.addEventListener('change', () => {
        onGridVisibilityChange(gridCheckbox.checked);
    });

    gridLabel.append(gridCheckbox, ' Grid');

    // axes toggle

    const axesLabel = document.createElement('label');
    const axesCheckbox = document.createElement('input');

    axesCheckbox.type = 'checkbox';
    axesCheckbox.checked = axesVisible;

    axesCheckbox.addEventListener('change', () => {
        onAxesVisibilityChange(axesCheckbox.checked);
    });

    axesLabel.append(axesCheckbox, ' Axis marker');

    // line list

    const linesHeading = document.createElement('strong');

    linesHeading.textContent = 'Lines';

    const linesContainer = document.createElement('div');

    linesContainer.style.display = 'grid';
    linesContainer.style.gap = '0.35rem';

    arrowNames.forEach((arrowName) => {
        const row = document.createElement('div');

        row.style.display = 'grid';
        row.style.gridTemplateColumns = 'auto 1fr 8rem 3rem';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'center';

        const visibilityCheckbox = document.createElement('input');

        visibilityCheckbox.type = 'checkbox';
        visibilityCheckbox.checked = true;

        const nameLabel = document.createElement('span');

        nameLabel.textContent = arrowName;

        const opacityInput = document.createElement('input');

        opacityInput.type = 'range';
        opacityInput.min = '0';
        opacityInput.max = '1';
        opacityInput.step = '0.05';
        opacityInput.value = '1';

        const opacityValue = document.createElement('span');

        opacityValue.textContent = '100%';
        opacityValue.style.fontVariantNumeric = 'tabular-nums';
        opacityValue.style.textAlign = 'right';

        opacityInput.addEventListener('input', () => {
            const opacity = Number(opacityInput.value);

            opacityValue.textContent = `${Math.round(opacity * 100)}%`;

            onArrowOpacityChange(
                arrowName,
                opacity
            );
        });

        visibilityCheckbox.addEventListener('change', () => {
            onArrowVisibilityChange(
                arrowName,
                visibilityCheckbox.checked
            );
        });

        row.append(
            visibilityCheckbox,
            nameLabel,
            opacityInput,
            opacityValue
        );

        linesContainer.appendChild(row);
    });


    //end of control definitions. add the controls to the panel below

    container.append(
        gridLabel,
        axesLabel,
        linesHeading,
        linesContainer
    );

    document.body.appendChild(container);

    return {
        destroy() {
            container.remove();
        }
    };
}