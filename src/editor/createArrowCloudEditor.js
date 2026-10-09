import * as THREE from "three";

//TODO: at some point later rename/refactor this 'debug' system into an 'editor' or 'authoring' system.
import "./styles.css";

//editor
import { createEditorPreferences } from "./editorUI.js";

//camera
import { createCameraController } from './camera/createCameraController.js';
import { createCameraControls } from './camera/createCameraControls.js';

//scene
import { createAxesGauge } from './scene/createAxesGauge.js';
import { createSceneControls } from './scene/createSceneControls.js';
import { createArrowDisplayState } from './scene/createArrowDisplayState.js';

//paths
import { createPathTools } from './path/createPathTools.js';

//timeline
import { createTimelineControls } from "./timeline/createTimelineControls.js";

export function createArrowCloudEditor({
    camera,
    renderer,
    mountElement,
    scene,
    arrowPaths,
    animationSettings,
    initialCameraView,
    initialCameraDistance,
    initialCameraTarget,
    getCameraTrack,
    getRenderedArrowItems,
    getArrows,
    rebuildArrowPaths,
    onDatasetChange
}) {

    const preferences = createEditorPreferences();

    const sidebar = document.createElement('aside');
    sidebar.className = 'editor-sidebar';
    document.body.append(sidebar);

    //main actions
    const cameraController = createCameraController({
        camera,
        renderer,
        mountElement,
        scene,
        initialCameraTarget,
        getCameraTrack
    });

    cameraController.setViewPresetChangeHandler(() => {
        cameraControls.updateCameraViewButtons();
    });

    const cameraControls = createCameraControls({
        container: sidebar,

        initialExpanded: preferences.get('cameraPanelExpanded'),
        cameraTargetVisible: preferences.get('cameraTargetVisible'),
        cameraUpVisible: preferences.get('cameraUpVisible'),

        onPanelExpandedChange(isExpanded) {
            preferences.set('cameraPanelExpanded', isExpanded);
        },

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
            preferences.set('cameraTargetVisible', isVisible);
        },

        onCameraUpVisibilityChange(isVisible) {
            cameraController.setUpMarkerVisible(isVisible);
            preferences.set('cameraUpVisible', isVisible);
        },

    });

    if (initialCameraView) {
        cameraController.setViewPreset(
            initialCameraView,
            initialCameraDistance
        );
    }

    cameraController.setTargetMarkerVisible(
        preferences.get('cameraTargetVisible')
    );

    cameraController.setUpMarkerVisible(
        preferences.get('cameraUpVisible')
    );

    const pathTools = createPathTools({
        camera,
        renderer,
        scene,
        arrowPaths,
        container: sidebar,

        initialExpanded: preferences.get('pathPanelExpanded'),
        lineLabelsVisible: preferences.get('lineLabelsVisible'),

        onPanelExpandedChange(isExpanded) {
            preferences.set('pathPanelExpanded', isExpanded);
        },

        onLineLabelsVisibilityChange(isVisible) {
            preferences.set('lineLabelsVisible', isVisible);
        },

        getArrows() {
            return getArrows();
        },

        onPathsChange() {
            rebuildArrowPaths();
        }
    });

    const arrowDisplayState = createArrowDisplayState(pathTools.getArrowPaths());

    const gridHelper = new THREE.GridHelper(200, 200);
    gridHelper.visible = preferences.get('gridVisible');
    gridHelper.userData.editorHelper = true;
    scene.add(gridHelper);

    const axesGauge = createAxesGauge({
        size: 2,
        labelOffset: 0.35,
    });

    axesGauge.position.set(0.1, 0.1, 0.1);
    axesGauge.visible = preferences.get('axesVisible');
    axesGauge.userData.editorHelper = true;
    scene.add(axesGauge);

    const sceneControls = createSceneControls({
        container: sidebar,
        gridVisible: gridHelper.visible,
        axesVisible: axesGauge.visible,
        initialExpanded: preferences.get('scenePanelExpanded'),

        onPanelExpandedChange(isExpanded) {
            preferences.set('scenePanelExpanded', isExpanded)
        },

        arrowNames: pathTools
            .getArrowPaths()
            .map((arrowPath) => arrowPath.name),

        onGridVisibilityChange(isVisible) {
            gridHelper.visible = isVisible;
            preferences.set('gridVisible', isVisible);
        },

        onAxesVisibilityChange(isVisible) {
            axesGauge.visible = isVisible;
            preferences.set('axesVisible', isVisible);
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

    const timelineControls = createTimelineControls(animationSettings, {
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

        pathTools.attachPathInfo(renderedArrowItems);
        pathTools.syncArrowNameLabels(renderedArrowItems);
        arrowDisplayState.apply(renderedArrowItems);

        pathTools.setArrowNameLabelsVisible(
            preferences.get('lineLabelsVisible')
        );
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