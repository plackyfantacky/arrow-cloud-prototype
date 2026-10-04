import * as THREE from "three";

//camera
import { createDebugCameraController } from './camera/createDebugCameraController.js';
import { createDebugCameraControls } from './camera/createDebugCameraControls.js';

//scene
import { createDebugAxesGauge } from './scene/createDebugAxesGauge.js';
import { createDebugSceneControls } from './scene/createDebugSceneControls.js';
import { createDebugArrowDisplayState } from './scene/createDebugArrowDisplayState.js';

//paths
import { createDebugPathTools } from './path/createDebugPathTools.js';

//timeline
import { createDebugTimelineControls } from "./timeline/createDebugTimelineControls.js";

export function createArrowCloudDebug({
    camera,
    renderer,
    mountElement,
    scene,
    arrowPaths,
    animationSettings,
    getCameraTrack,
    getRenderedArrowItems,
    getArrows,
    rebuildArrowPaths,
    onDatasetChange
}) {

    //main actions
    const cameraController = createDebugCameraController({
        camera,
        renderer,
        mountElement,
        getCameraTrack
    });

    const cameraControls = createDebugCameraControls({
        getCameraMode() {
            return cameraController.getMode();
        },

        onCameraModeChange(cameraMode) {
            cameraController.setMode(
                cameraMode
            );
        },

        onCameraViewChange(presetName) {
            cameraController.setViewPreset(
                presetName
            );
        },

        onResetCamera() {
            cameraController.reset();
        },

        onCopyCamera() {
            cameraController.copy();
        }
    });

    const pathTools = createDebugPathTools({
        camera,
        renderer,
        scene,
        arrowPaths,

        getArrows() {
            return getArrows();
        },

        onPathsChange() {
            rebuildArrowPaths();
        }
    });

    const arrowDisplayState = createDebugArrowDisplayState(pathTools.getArrowPaths());

    const gridHelper = new THREE.GridHelper(14, 14);
    scene.add(gridHelper);

    const axesGauge = createDebugAxesGauge({
        size: 2,
        labelOffset: 0.35,
    });

    axesGauge.position.set(0.1, 0.1, 0.1);
    scene.add(axesGauge);

    const sceneControls = createDebugSceneControls({
        gridVisible: gridHelper.visible,
        axesVisible: axesGauge.visible,

        arrowNames: pathTools
            .getArrowPaths()
            .map((arrowPath) => arrowPath.name),

        onGridVisibilityChange(isVisible) {
            gridHelper.visible = isVisible;
        },

        onAxesVisibilityChange(isVisible) {
            axesGauge.visible = isVisible;
        },

        onArrowVisibilityChange(arrowName, isVisible) {
            arrowDisplayState.setVisibility(arrowName, isVisible);
            arrowDisplayState.apply(getRenderedArrowItems());
        },

        onArrowOpacityChange(arrowName, opacity) {
            arrowDisplayState.setOpacity(arrowName, opacity);
            arrowDisplayState.apply(getRenderedArrowItems());
        }
    });

    const timelineControls = createDebugTimelineControls(animationSettings, {
        onDatasetChange
    });

    //helpers

    function updateTimeline(deltaTime) {
        if (timelineControls.state.isPlaying) {
            timelineControls.state.currentTime += deltaTime * timelineControls.state.speed;

            if (timelineControls.state.isLooping) {
                timelineControls.state.currentTime %= timelineControls.state.timelineDuration;
            } else {
                timelineControls.state.currentTime = THREE.MathUtils.clamp(
                    timelineControls.state.currentTime,
                    0,
                    timelineControls.state.timelineDuration
                );
            }

            timelineControls.updateProgressInput();
        }

        return timelineControls.state.currentTime;
    }

    function setAnimationSettings(animationSettings) {
        timelineControls.setAnimationSettings(animationSettings);
    }

    //exposed output functions

    function update({ deltaTime }) {
        const currentTime = updateTimeline(deltaTime);

        cameraController.update(deltaTime, currentTime);
        pathTools.update();

        return currentTime;
    }

    function getArrowPaths() {
        return pathTools.getArrowPaths();
    }

    function setArrowPaths(arrowPaths) {
        pathTools.setArrowPaths(arrowPaths);

        arrowDisplayState.reset(arrowPaths);

        sceneControls.setArrowNames(
            arrowPaths.map((arrowPath) => arrowPath.name)
        );
    }

    function syncRenderedArrowItems() {
        const renderedArrowItems = getRenderedArrowItems();
        
        pathTools.attachDebugInfo(renderedArrowItems);
        pathTools.syncArrowNameLabels(renderedArrowItems);
        arrowDisplayState.apply(renderedArrowItems);
    }

    function destroy() {
        timelineControls.destroy();
        cameraControls.destroy();
        sceneControls.destroy();
        pathTools.destroy();
        cameraController.destroy();

        scene.remove(gridHelper);
        scene.remove(axesGauge);
    }

    //end output
    return {
        update,
        getArrowPaths,
        setArrowPaths,
        setAnimationSettings,
        syncRenderedArrowItems,
        destroy
    };

}