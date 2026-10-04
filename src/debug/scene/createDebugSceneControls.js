import debugSceneControlsTemplate from './debugSceneControls.html';

export function createDebugSceneControls({
    gridVisible = true,
    axesVisible = true,
    arrowNames = [],
    onGridVisibilityChange = () => {},
    onAxesVisibilityChange = () => {},
    onArrowVisibilityChange = () => {},
    onArrowOpacityChange = () => {}
}) {
    const template =
        document.createElement('template');

    template.innerHTML =
        debugSceneControlsTemplate;

    const container =
        template.content.firstElementChild.cloneNode(true);

    const toggleButton =
        container.querySelector(
            '[data-action="toggle"]'
        );

    const content =
        container.querySelector(
            '[data-content]'
        );

    const gridCheckbox =
        container.querySelector(
            '[data-control="grid"]'
        );

    const axesCheckbox =
        container.querySelector(
            '[data-control="axes"]'
        );

    const linesContainer =
        container.querySelector(
            '[data-lines]'
        );

    function renderArrowControls(
        nextArrowNames
    ) {
        linesContainer.replaceChildren();

        nextArrowNames.forEach((arrowName) => {
            const row =
                document.createElement('div');

            row.className =
                'debug-scene-controls__line';

            const visibilityCheckbox =
                document.createElement('input');

            visibilityCheckbox.type =
                'checkbox';

            visibilityCheckbox.checked =
                true;

            const nameLabel =
                document.createElement('span');

            nameLabel.textContent =
                arrowName;

            const opacityInput =
                document.createElement('input');

            opacityInput.type = 'range';
            opacityInput.min = '0';
            opacityInput.max = '1';
            opacityInput.step = '0.05';
            opacityInput.value = '1';

            const opacityValue =
                document.createElement('span');

            opacityValue.textContent =
                '100%';

            opacityInput.addEventListener(
                'input',
                () => {
                    const opacity =
                        Number(
                            opacityInput.value
                        );

                    opacityValue.textContent =
                        `${Math.round(
                            opacity * 100
                        )}%`;

                    onArrowOpacityChange(
                        arrowName,
                        opacity
                    );
                }
            );

            visibilityCheckbox.addEventListener(
                'change',
                () => {
                    onArrowVisibilityChange(
                        arrowName,
                        visibilityCheckbox.checked
                    );
                }
            );

            row.append(
                visibilityCheckbox,
                nameLabel,
                opacityInput,
                opacityValue
            );

            linesContainer.appendChild(row);
        });
    }

    toggleButton.addEventListener('click', () => {
        const isExpanded =
            toggleButton.getAttribute(
                'aria-expanded'
            ) === 'true';

        toggleButton.setAttribute(
            'aria-expanded',
            String(!isExpanded)
        );

        content.hidden = isExpanded;

        toggleButton.textContent =
            isExpanded
                ? 'Scene ▸'
                : 'Scene ▾';
    });

    gridCheckbox.checked =
        gridVisible;

    axesCheckbox.checked =
        axesVisible;

    gridCheckbox.addEventListener(
        'change',
        () => {
            onGridVisibilityChange(
                gridCheckbox.checked
            );
        }
    );

    axesCheckbox.addEventListener(
        'change',
        () => {
            onAxesVisibilityChange(
                axesCheckbox.checked
            );
        }
    );

    renderArrowControls(
        arrowNames
    );

    document.body.appendChild(container);

    return {
        setArrowNames(nextArrowNames) {
            renderArrowControls(nextArrowNames);
        },

        destroy() {
            container.remove();
        }
    };
}