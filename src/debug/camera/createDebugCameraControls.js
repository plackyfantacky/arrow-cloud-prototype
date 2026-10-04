import debugCameraControlsTemplate from './debugCameraControls.html';

export function createDebugCameraControls({
    getCameraMode = () => 'orbital',
    getCameraView = () => null,
    onCameraModeChange = () => { },
    onCameraViewChange = () => { },
    onResetCamera = () => { },
    onCopyCamera = () => { }
} = {}) {
    const template = document.createElement('template');
    template.innerHTML = debugCameraControlsTemplate;

    const container = template.content.firstElementChild.cloneNode(true);

    const cameraModeButtons = [
        ...container.querySelectorAll('[data-camera-mode]')
    ];

    const cameraViewButtons = [
        ...container.querySelectorAll('[data-camera-view]')
    ];

    const resetCameraButton = container.querySelector('[data-action="reset-camera"]');

    const copyCameraButton = container.querySelector('[data-action="copy-camera"]');

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
            onCameraModeChange(
                button.dataset.cameraMode
            );

            updateCameraModeButtons();
        });
    });

    cameraViewButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onCameraViewChange(
                button.dataset.cameraView
            );

            updateCameraModeButtons();
            updateCameraViewButtons();
        });
    });

    resetCameraButton.addEventListener(
        'click',
        onResetCamera
    );

    copyCameraButton.addEventListener(
        'click',
        onCopyCamera
    );

    updateCameraModeButtons();
    updateCameraViewButtons();

    document.body.appendChild(container);

    return {
        updateCameraModeButtons,
        updateCameraViewButtons,

        destroy() {
            container.remove();
        }
    };
}