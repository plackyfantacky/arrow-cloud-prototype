import * as THREE from "three";

export function getResponsiveCameraDistance(container) {
    const width = container.clientWidth || window.innerWidth;

    if (width < 480) {
        return 18;
    }

    if (width < 768) {
        return 16;
    }

    return 12.2;
};

export function getCameraTrackState(cameraTrack, currentTime) {
    
    if (!cameraTrack.length) {
        return null;
    }

    let previousKeyframe = cameraTrack[0];
    let nextKeyframe = cameraTrack[cameraTrack.length - 1];

    for (let index = 0; index < cameraTrack.length - 1; index++) {
        const currentKeyframe = cameraTrack[index];
        const followingKeyframe = cameraTrack[index + 1];

        if (currentTime >= currentKeyframe.time && currentTime <= followingKeyframe.time) {
            previousKeyframe = currentKeyframe;
            nextKeyframe = followingKeyframe;
            break;
        }
    }

    const duration = nextKeyframe.time - previousKeyframe.time;
    const rawProgress = duration === 0
        ? 0
        : (currentTime - previousKeyframe.time) / duration;

    const progress = THREE.MathUtils.smoothstep(
        THREE.MathUtils.clamp(rawProgress, 0, 1),
        0, 1
    );

    return {
        position: {
            x: THREE.MathUtils.lerp(previousKeyframe.position.x, nextKeyframe.position.x, progress),
            y: THREE.MathUtils.lerp(previousKeyframe.position.y, nextKeyframe.position.y, progress),
            z: THREE.MathUtils.lerp(previousKeyframe.position.z, nextKeyframe.position.z, progress),
        },
        target: {
            x: THREE.MathUtils.lerp(previousKeyframe.target.x, nextKeyframe.target.x, progress),
            y: THREE.MathUtils.lerp(previousKeyframe.target.y, nextKeyframe.target.y, progress),
            z: THREE.MathUtils.lerp(previousKeyframe.target.z, nextKeyframe.target.z, progress)
        }
    }
};