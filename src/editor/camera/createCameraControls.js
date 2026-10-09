import cameraControlsTemplate from './cameraControls.html';

import { createPanelToggle } from "../editorUI";

export function createCameraControls({
    initialExpanded = true,
    onPanelExpandedChange = () => { },
    getCameraMode = () => 'orbital',
    getCameraView = () => null,
    onCameraModeChange = () => { },
    onCameraViewChange = () => { },
    onResetCamera = () => { },
    onCopyCamera = () => { },
    onCameraTargetVisibilityChange = () => { },
    onCameraUpVisibilityChange = () => { },
    container = document.body,
    cameraTargetVisible = true,
    cameraUpVisible = true,
} = {}) {

    const template = document.createElement('template');
    template.innerHTML = cameraControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle"]');
    const content = controlsContainer.querySelector('[data-content]');

    const panelToggle = createPanelToggle({
        button: toggleButton,
        content,
        label: 'Camera',
        initialExpanded,
        onExpandedChange: onPanelExpandedChange
    });

    const cameraModeButtons = [...controlsContainer.querySelectorAll('[data-camera-mode]')];
    const cameraViewButtons = [...controlsContainer.querySelectorAll('[data-camera-view]')];
    const resetCameraButton = controlsContainer.querySelector('[data-action="reset-camera"]');
    const copyCameraButton = controlsContainer.querySelector('[data-action="copy-camera"]');
    const cameraTargetVisibilityInput = controlsContainer.querySelector('[data-camera-target-visible]');
    const cameraUpVisibilityInput = controlsContainer.querySelector('[data-camera-up-visible]');

    function updateCameraModeButtons() {
        const cameraMode = getCameraMode();

        cameraModeButtons.forEach((button) => {
            button.disabled = button.dataset.cameraMode === cameraMode;
        });
    }

    function updateCameraViewButtons() {
        const cameraView = getCameraView();

        cameraViewButtons.forEach((button) => {
            button.disabled = button.dataset.cameraView === cameraView;
        });
    }

    cameraModeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onCameraModeChange(button.dataset.cameraMode);

            updateCameraModeButtons();
        });
    });

    cameraViewButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onCameraViewChange(button.dataset.cameraView);

            updateCameraModeButtons();
            updateCameraViewButtons();
        });
    });

    resetCameraButton.addEventListener('click', onResetCamera);
    copyCameraButton.addEventListener('click', onCopyCamera);

    cameraTargetVisibilityInput.addEventListener('change', () => {
        onCameraTargetVisibilityChange(cameraTargetVisibilityInput.checked);
    });

    cameraUpVisibilityInput.addEventListener('change', () => {
        onCameraUpVisibilityChange(cameraUpVisibilityInput.checked);
    });

    updateCameraModeButtons();
    updateCameraViewButtons();

    cameraTargetVisibilityInput.checked = cameraTargetVisible;
    cameraUpVisibilityInput.checked = cameraUpVisible;

    container.appendChild(controlsContainer);

    return {
        updateCameraModeButtons,
        updateCameraViewButtons,

        destroy() {
            controlsContainer.remove();
            panelToggle.destroy();
        }
    };
}