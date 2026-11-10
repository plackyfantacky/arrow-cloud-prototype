export function createPlaybackController({
    currentTime = 0,
    timelineDuration = 8,
    speed = 1,
    isPlaying = true,
    isLooping = true
} = {}) {
    const state = {
        currentTime,
        timelineDuration,
        speed,
        isPlaying,
        isLooping
    };

    function update(deltaTime) {
        if (!state.isPlaying) {
            return state.currentTime;
        }

        if (state.timelineDuration <= 0) {
            state.currentTime = 0;
            return state.currentTime;
        }

        const nextTime = state.currentTime + deltaTime * state.speed;

        state.currentTime = state.isLooping
            ? (
                (nextTime % state.timelineDuration) +
                state.timelineDuration
            ) % state.timelineDuration
            : Math.min(
                state.timelineDuration,
                Math.max(0, nextTime)
            );

        return state.currentTime;
    }

    return {
        state,
        update,
    };
}