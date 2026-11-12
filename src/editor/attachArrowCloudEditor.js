import { createArrowCloudEditor } from "./createArrowCloudEditor.js";

export function attachArrowCloudEditor(runtime, options = {}) {
    const editor = createArrowCloudEditor({
        playback: runtime.playback,
        camera: runtime.camera,
        renderer: runtime.renderer,
        mountElement: runtime.mountElement,
        scene: runtime.scene,
        arrowPaths: runtime.getArrowPaths(),

        initialCameraView: options.cameraView,
        initialCameraDistance: options.cameraDistance,
        initialCameraTarget: options.cameraTarget,

        getCameraTrack: runtime.getCameraTrack,
        getRenderedArrowItems: runtime.getRenderedArrowItems,
        getArrows: runtime.getArrows,

        onArrowPathsChange: runtime.setArrowPaths,
        onDatasetChange: options.onDatasetChange,
        onUIVisibilityChange(isVisible) {
            runtime.setInteractionsEnabled(!isVisible);
        },
    });

    const unsubscribeFrame = runtime.onFrame((frame) => {
        runtime.setCameraTrackEnabled(!editor.isCameraOverridden());

        editor.update(frame);
    });

    const unsubscribePaths = runtime.onPathsRebuilt(() => {
        editor.syncRenderedArrowItems();
    });

    const unsubscribeRender = runtime.onBeforeRender(() => {
        return editor.prepareRender();
    });

    editor.syncRenderedArrowItems();

    let isDestroyed = false;

    function destroy() {
        if (isDestroyed) {
            return;
        }

        isDestroyed = true;

        unsubscribeFrame();
        unsubscribePaths();
        unsubscribeRender();

        editor.destroy();
        runtime.setInteractionsEnabled(true);
        runtime.setCameraTrackEnabled(true);
    }

    return {
        destroy,
    };
}
