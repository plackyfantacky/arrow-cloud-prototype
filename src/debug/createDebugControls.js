import debugControlsTemplate from './debugControls.html';

export function createDebugControls(
    {
        currentTime = 0,
        timelineDuration = 8,
        speed = 1,
        isPlaying = true,
        isLooping = true
    },
    {
        getCameraMode = () => 'orbital',
        onCameraModeChange = () => { },
        onResetCamera = () => { },
        onCopyCamera = () => { }
    } = {}
) {
    const state = {
        currentTime,
        timelineDuration,
        speed,
        isPlaying,
        isLooping,
    };

    const template = document.createElement('template');

    template.innerHTML = debugControlsTemplate;

    const container = template.content.firstElementChild.cloneNode(true);

    const playPauseButton =
        container.querySelector('[data-action="play-pause"]');

    const rewindButton =
        container.querySelector('[data-action="rewind"]');

    const loopCheckbox =
        container.querySelector('[data-control="loop"]');

    const progressInput =
        container.querySelector('[data-control="time"]');

    const timeValue =
        container.querySelector('[data-value="time"]');

    const speedInput =
        container.querySelector('[data-control="speed"]');

    const speedValue =
        container.querySelector('[data-value="speed"]');

    const resetCameraButton =
        container.querySelector('[data-action="reset-camera"]');

    const copyCameraButton =
        container.querySelector('[data-action="copy-camera"]');

    const cameraModeButtons = [
        ...container.querySelectorAll(
            '[data-camera-mode]'
        )
    ];

    function updateCameraModeButtons() {
        const cameraMode = getCameraMode();

        cameraModeButtons.forEach((button) => {
            button.disabled =
                button.dataset.cameraMode === cameraMode;
        });

        resetCameraButton.hidden =
            cameraMode !== 'orbital';
    }

    function updatePlayPauseButton() {
        playPauseButton.textContent = state.isPlaying
            ? 'Pause'
            : 'Play';
    }

    function updateProgressInput() {
        progressInput.value = String(state.currentTime);
        timeValue.textContent = `${state.currentTime.toFixed(2)}s`;
    }

    playPauseButton.addEventListener('click', () => {
        const isStartingPlayback = !state.isPlaying;

        if (
            isStartingPlayback &&
            state.currentTime >= state.timelineDuration
        ) {
            state.currentTime = 0;
            updateProgressInput();
        }

        state.isPlaying = !state.isPlaying;
        updatePlayPauseButton();
    });

    rewindButton.addEventListener('click', () => {
        state.currentTime = 0;
        updateProgressInput();
    });

    resetCameraButton.addEventListener('click', () => {
        onResetCamera();
    });

    loopCheckbox.addEventListener('change', () => {
        state.isLooping = loopCheckbox.checked;
    });

    progressInput.addEventListener('input', () => {
        state.currentTime = Number(progressInput.value);
        timeValue.textContent = `${state.currentTime.toFixed(2)}s`;
    });

    speedInput.addEventListener('input', () => {
        state.speed = Number(speedInput.value);
        speedValue.textContent = `${state.speed.toFixed(1)}x`;
    });

    copyCameraButton.addEventListener('click', () => {
        onCopyCamera();
    });

    cameraModeButtons.forEach((button) => {
        button.addEventListener('click', () => {
            onCameraModeChange(
                button.dataset.cameraMode
            );

            updateCameraModeButtons();
        });
    });

    loopCheckbox.checked = state.isLooping;

    progressInput.value =
        String(state.currentTime);

    progressInput.max =
        String(state.timelineDuration);

    speedInput.value =
        String(state.speed);

    updatePlayPauseButton();
    updateProgressInput();
    updateCameraModeButtons();

    speedValue.textContent =
        `${state.speed.toFixed(1)}x`;

    document.body.appendChild(container);

    return {
        state,
        updateProgressInput,
        updatePlayPauseButton,
        destroy() {
            container.remove();
        }
    };
}

export function getDebugInfoSource(object) {
    let currentObject = object;

    while (currentObject) {
        if (currentObject.userData?.debugInfo) {
            return currentObject;
        }

        currentObject = currentObject.parent;
    }

    return null;
}