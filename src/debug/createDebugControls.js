export function createDebugControls({
    currentTime = 0,
    timelineDuration = 8,
    speed = 1,
    isPlaying = true,
    isLooping = true
}) {
    const state = {
        currentTime,
        timelineDuration,
        speed,
        isPlaying,
        isLooping,
    };

    const container = document.createElement('div');

    container.style.position = 'fixed';
    container.style.left = '1rem';
    container.style.bottom = '1rem';
    container.style.zIndex = '10';
    container.style.display = 'flex';
    container.style.gap = '0.5rem';
    container.style.alignItems = 'center';
    container.style.padding = '0.75rem';
    container.style.background = 'rgba(0, 0, 0, 0.72)';
    container.style.color = '#fff';
    container.style.fontFamily = 'system-ui, sans-serif';
    container.style.fontSize = '13px';
    container.style.borderRadius = '0.5rem';

    const playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.textContent = state.isPlaying ? 'Pause' : 'Play';

    const rewindButton = document.createElement('button');
    rewindButton.type = 'button';
    rewindButton.textContent = 'Rewind';

    const loopLabel = document.createElement('label');
    const loopCheckbox = document.createElement('input');

    loopCheckbox.type = 'checkbox';
    loopCheckbox.checked = state.isLooping;

    loopLabel.append(loopCheckbox, ' Loop');

    const progressLabel = document.createElement('label');
    progressLabel.textContent = 'Time ';

    const progressInput = document.createElement('input');
    progressInput.type = 'range';
    progressInput.min = '0';
    progressInput.max = String(state.timelineDuration);
    progressInput.step = '0.01';
    progressInput.value = String(state.currentTime);

    const timeValue = document.createElement('span');
    timeValue.textContent = `${state.currentTime.toFixed(2)}s`;

    progressLabel.append(progressInput, ' ', timeValue);

    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed ';

    const speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = '0.1';
    speedInput.max = '2';
    speedInput.step = '0.1';
    speedInput.value = String(state.speed);

    const speedValue = document.createElement('span');
    speedValue.textContent = `${state.speed.toFixed(1)}x`;

    speedLabel.append(speedInput, ' ', speedValue);

    playButton.addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        playButton.textContent = state.isPlaying ? 'Pause' : 'Play';
    });

    rewindButton.addEventListener('click', () => {
        state.currentTime = 0;
        progressInput.value = String(state.currentTime);
        timeValue.textContent = `${state.currentTime.toFixed(2)}s`;
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

    container.append(
        playButton,
        rewindButton,
        loopLabel,
        progressLabel,
        speedLabel
    );

    document.body.appendChild(container);

    return {
        state,
        updateProgressInput() {
            progressInput.value = String(state.currentTime);
            timeValue.textContent = `${state.currentTime.toFixed(2)}s`;
        },
    };
}