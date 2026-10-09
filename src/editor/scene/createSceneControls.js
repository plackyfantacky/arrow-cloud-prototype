import { createPanelToggle } from "../editorUI";

import sceneControlsTemplate from './sceneControls.html';

export function createSceneControls({
    initialExpanded = true,
    onPanelExpandedChange = () => { },
    gridVisible = true,
    axesVisible = true,
    arrowNames = [],
    onGridVisibilityChange = () => { },
    onAxesVisibilityChange = () => { },
    onArrowVisibilityChange = () => { },
    onArrowOpacityChange = () => { },
    container = document.body
}) {
    const template = document.createElement('template');

    template.innerHTML = sceneControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle"]');
    const content = controlsContainer.querySelector('[data-content]');

    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: 'Scene',
        initialExpanded,
        onExpandedChange: onPanelExpandedChange
    });

    const gridCheckbox = controlsContainer.querySelector('[data-control="grid"]');
    const axesCheckbox = controlsContainer.querySelector('[data-control="axes"]');
    const linesContainer = controlsContainer.querySelector('[data-lines]');

    const lineTemplate = controlsContainer.querySelector('[data-line-template');

    function renderArrowControls(nextArrowNames) {

        linesContainer.replaceChildren();

        nextArrowNames.forEach((arrowName) => {

            const row = lineTemplate.content.firstElementChild.cloneNode(true);

            const visibilityCheckbox = row.querySelector('[data-control="visibility"]');
            const nameLabel = row.querySelector('[data-line-name]');
            const opacityInput = row.querySelector('[data-control="opacity"]');
            const opacityValue = row.querySelector('[data-opacity-value]');

            nameLabel.textContent = arrowName;

            opacityInput.addEventListener('input', () => {
                const opacity = Number(opacityInput.value);
                opacityValue.textContent = `${Math.round(opacity * 100)}%`;
                onArrowOpacityChange(arrowName, opacity);
            });

            visibilityCheckbox.addEventListener('change', () => {
                onArrowVisibilityChange(arrowName, visibilityCheckbox.checked);
            });

            linesContainer.appendChild(row);
        });
    }

    gridCheckbox.checked = gridVisible;
    axesCheckbox.checked = axesVisible;

    gridCheckbox.addEventListener('change', () => {
        onGridVisibilityChange(gridCheckbox.checked);
    });

    axesCheckbox.addEventListener('change', () => {
        onAxesVisibilityChange(axesCheckbox.checked);
    });

    renderArrowControls(arrowNames);

    container.appendChild(controlsContainer);

    return {
        setArrowNames(nextArrowNames) {
            renderArrowControls(nextArrowNames);
        },

        destroy() {
            panelToggle.destroy();
            controlsContainer.remove();
        }
    };
}