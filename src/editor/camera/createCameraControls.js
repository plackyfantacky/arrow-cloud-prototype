import cameraControlsTemplate from './cameraControls.html';

export function createCameraControls({
    getCameraMode = () => 'orbital',
    getCameraView = () => null,
    onCameraModeChange = () => { },
    onCameraViewChange = () => { },
    onResetCamera = () => { },
    onCopyCamera = () => { },
    onCameraTargetVisibilityChange = () => { },
    container = document.body
} = {}) {
    const template = document.createElement('template');
    template.innerHTML = cameraControlsTemplate;

    const controlsContainer = template.content.firstElementChild.cloneNode(true);

    const toggleButton = controlsContainer.querySelector('[data-action="toggle"]');
    const content = controlsContainer.querySelector('[data-content]');

    toggleButton.addEventListener('click', () => {
    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

    toggleButton.setAttribute('aria-expanded', String(!isExpanded));

    content.hidden = isExpanded;

    toggleButton.textContent = isExpanded
        ? 'Camera ▸'
        : 'Camera ▾';
    });

    const cameraModeButtons = [...controlsContainer.querySelectorAll('[data-camera-mode]')];
    const cameraViewButtons = [...controlsContainer.querySelectorAll('[data-camera-view]')];
    const resetCameraButton = controlsContainer.querySelector('[data-action="reset-camera"]');
    const copyCameraButton = controlsContainer.querySelector('[data-action="copy-camera"]');
    const cameraTargetVisibilityInput = controlsContainer.querySelector('[data-camera-target-visible]');

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
    }
);

    updateCameraModeButtons();
    updateCameraViewButtons();

    container.appendChild(controlsContainer);

    return {
        updateCameraModeButtons,
        updateCameraViewButtons,

        destroy() {
            controlsContainer.remove();
        }
    };
}