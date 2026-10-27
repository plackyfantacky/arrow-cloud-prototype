import { createPanelToggle } from "../editorUI";

import sceneControlsTemplate from "./sceneControls.html";

import datasetNames from "../../generated/datasets.json";

export function createSceneControls({
    initialExpanded = true,
    onPanelExpandedChange = () => {},
    getArrowVisibility = () => true,
    getArrowOpacity = () => 1,
    gridVisible = true,
    axesVisible = true,
    arrowNames = [],
    onGridVisibilityChange = () => {},
    onAxesVisibilityChange = () => {},
    onArrowVisibilityChange = () => {},
    onArrowOpacityChange = () => {},
    lineLabelsVisible = true,
    onLineLabelsVisibilityChange = () => {},
    onDatasetChange = () => {},
    container = document.body,
}) {
    const template = document.createElement("template");

    template.innerHTML = sceneControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle"]');
    const content = controlsContainer.querySelector("[data-content]");

    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: "Scene",
        initialExpanded,
        onExpandedChange: onPanelExpandedChange,
    });

    const datasetSelect = controlsContainer.querySelector('[data-control="dataset"]');
    const gridCheckbox = controlsContainer.querySelector('[data-control="grid"]');
    const axesCheckbox = controlsContainer.querySelector('[data-control="axes"]');
    const lineLabelsCheckbox = controlsContainer.querySelector('[data-control="line-labels"]');
    const linesContainer = controlsContainer.querySelector("[data-lines]");

    const lineTemplate = controlsContainer.querySelector("[data-line-template");
    
    let selectedPathName = null;

    function renderArrowControls(nextArrowNames) {
        linesContainer.replaceChildren();

        nextArrowNames.forEach((arrowName) => {
            const row = lineTemplate.content.firstElementChild.cloneNode(true);
            row.classList.toggle("is-selected", arrowName === selectedPathName);

            const visibilityCheckbox = row.querySelector('[data-control="visibility"]');
            const nameLabel = row.querySelector("[data-line-name]");
            const opacityInput = row.querySelector('[data-control="opacity"]');
            const opacityValue = row.querySelector("[data-opacity-value]");

            nameLabel.textContent = arrowName;

            visibilityCheckbox.checked = getArrowVisibility(arrowName);
            const opacity = getArrowOpacity(arrowName);

            opacityInput.value = opacity;
            opacityValue.textContent = `${Math.round(opacity * 100)}%`;

            opacityInput.addEventListener("input", () => {
                const opacity = Number(opacityInput.value);
                opacityValue.textContent = `${Math.round(opacity * 100)}%`;
                onArrowOpacityChange(arrowName, opacity);
            });

            visibilityCheckbox.addEventListener("change", () => {
                onArrowVisibilityChange(arrowName, visibilityCheckbox.checked);
            });

            linesContainer.appendChild(row);
        });
    }

    datasetSelect.addEventListener("change", async () => {
        await onDatasetChange(datasetSelect.value);
    });

    datasetNames.forEach((datasetName) => {
        const option = document.createElement("option");

        option.value = datasetName;
        option.textContent = datasetName.replace(/[-_]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

        datasetSelect.appendChild(option);
    });

    const searchParams = new URLSearchParams(window.location.search);
    datasetSelect.value = searchParams.get("dataset") || "labs";

    gridCheckbox.checked = gridVisible;
    axesCheckbox.checked = axesVisible;
    lineLabelsCheckbox.checked = lineLabelsVisible;

    gridCheckbox.addEventListener("change", () => {
        onGridVisibilityChange(gridCheckbox.checked);
    });

    axesCheckbox.addEventListener("change", () => {
        onAxesVisibilityChange(axesCheckbox.checked);
    });

    lineLabelsCheckbox.addEventListener("change", () => {
        onLineLabelsVisibilityChange(lineLabelsCheckbox.checked);
    });

    renderArrowControls(arrowNames);

    container.appendChild(controlsContainer);

    return {
        setArrowNames(nextArrowNames) {
            renderArrowControls(nextArrowNames);
        },

        setSelectedPathName(pathName) {
            selectedPathName = pathName;

            linesContainer.querySelectorAll("[data-line-name]").forEach((label) => {
                const row = label.closest("[data-path-row]");

                if (row) {
                    row.classList.toggle("is-selected", label.textContent === pathName);
                }
            });
        },

        destroy() {
            panelToggle.destroy();
            controlsContainer.remove();
        },
    };
}
