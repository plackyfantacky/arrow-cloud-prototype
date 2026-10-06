import * as THREE from "three";

//TODO: at some point later rename/refactor this 'debug' system into an 'editor' or 'authoring' system.
import "./styles.css";

//camera
import { createCameraController } from './camera/createCameraController.js';
import { createCameraControls } from './camera/createCameraControls.js';

//scene
import { createAxesGauge } from './scene/createAxesGauge.js';
import { createSceneControls } from './scene/createSceneControls.js';
import { createArrowDisplayState } from './scene/createArrowDisplayState.js';

//paths
import { createDebugPathTools } from './path/createDebugPathTools.js';

//timeline
import { createDebugTimelineControls } from "./timeline/createDebugTimelineControls.js";

export function createArrowCloudEditor({
    camera,
    renderer,
    mountElement,
    scene,
    arrowPaths,
    animationSettings,
    initialCameraView,
    initialCameraDistance,
    getCameraTrack,
    getRenderedArrowItems,
    getArrows,
    rebuildArrowPaths,
    onDatasetChange
}) {

    const sidebar = document.createElement('aside');
    sidebar.className = 'editor-sidebar';
    document.body.append(sidebar);

    //main actions
    const cameraController = createCameraController({
        camera,
        renderer,
        mountElement,
        scene,
        getCameraTrack
    });

    cameraController.setViewPresetChangeHandler(() => {
        cameraControls.updateCameraViewButtons();
    });

    const cameraControls = createCameraControls({
        container: sidebar,
        getCameraMode() {
            return cameraController.getMode();
        },

        getCameraView() {
            return cameraController.getViewPreset();
        },

        onCameraModeChange(cameraMode) {
            cameraController.setMode(cameraMode);
        },

        onCameraViewChange(presetName) {
            cameraController.setViewPreset(presetName);
        },

        onResetCamera() {
            cameraController.reset();
        },

        onCopyCamera() {
            cameraController.copy();
        },

        onCameraTargetVisibilityChange(isVisible) {
            cameraController.setTargetMarkerVisible(isVisible);
        },

        onCameraUpVisibilityChange: (isVisible) => {
            cameraController.setUpMarkerVisible(isVisible);
        },

    });

    if (initialCameraView) {
        cameraController.setViewPreset(
            initialCameraView,
            initialCameraDistance
        );
    }

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

    const arrowDisplayState = createArrowDisplayState(pathTools.getArrowPaths());

    const gridHelper = new THREE.GridHelper(200, 200);
    gridHelper.userData.editorHelper = true;
    scene.add(gridHelper);

    const axesGauge = createAxesGauge({
        size: 2,
        labelOffset: 0.35,
    });

    axesGauge.position.set(0.1, 0.1, 0.1);
    axesGauge.userData.editorHelper = true;
    scene.add(axesGauge);

    const sceneControls = createSceneControls({
        container: sidebar,
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

        gridHelper.position.x = Math.round(camera.position.x);
        gridHelper.position.z = Math.round(camera.position.z);

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