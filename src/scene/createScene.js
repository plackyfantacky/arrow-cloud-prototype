import * as THREE from "three";

import { getStageSize } from "./stage.js";
import { updateCameraTrack } from "./camera.js";

import { createSceneObjects } from "./createSceneObjects.js";
import { createEnvironment } from "../environment/createEnvironment.js";
import { createLights } from "../lighting/createLights.js";
import { createShadowsController } from "../lighting/createShadowsController.js";
import { createBackgroundShader } from "../shaders/createBackgroundShader.js";

import { createEventBus } from "../events/createEventBus.js";
import { createPlaybackController } from "../animation/createPlaybackController.js";
import { createSceneObjectAnimations } from "../animation/createSceneObjectAnimations.js";

import { createObjectLocator } from "../interactions/createObjectLocator.js";
import { createObjectInteractions } from "../interactions/createObjectInteractions.js";

import { updateArrowAnimations } from "../animation/updateArrowAnimations.js";
import { applyViewportOffset, handleResize as responsiveResize, positionSceneObjectsForViewport } from "./responsive.js";

import { renderArrowPaths } from "../arrows/renderArrowPaths.js";

import { sceneSettings } from "./sceneSettings.js";

export function createScene(mountElement, options = {}) {
    if (!mountElement) {
        throw new Error("createArrowCloudScene requires a mount element.");
    }

    const dataset = options.dataset;

    const animationSettings = {
        ...dataset.animationSettings,
        ...options.animationSettings,
    };

    const events = createEventBus();
    const playback = createPlaybackController(animationSettings);

    let arrowPaths = options.arrowPaths || dataset.arrowPaths;
    const cameraTrack = options.cameraTrack || dataset.cameraTrack || null;
    const stageSize = getStageSize(mountElement);

    const scene = new THREE.Scene();

    createEnvironment(scene, dataset.environment);

    const backgroundShader = createBackgroundShader(scene, dataset.shaders?.background);

    if (backgroundShader) {
        const backgroundSettings = dataset.shaders.background;

        scene.fog = new THREE.Fog(backgroundSettings.horizonColour ?? "#FFE4D3", backgroundSettings.fogNear ?? 10, backgroundSettings.fogFar ?? 35);
    }

    const camera = new THREE.PerspectiveCamera(
        sceneSettings.camera.fieldOfView,
        stageSize.width / stageSize.height,
        sceneSettings.camera.near,
        sceneSettings.camera.far,
    );

    const staticCamera = dataset.staticCamera;

    if (staticCamera) {
        camera.position.set(staticCamera.position.x, staticCamera.position.y, staticCamera.position.z);

        camera.quaternion.set(staticCamera.quaternion.x, staticCamera.quaternion.y, staticCamera.quaternion.z, staticCamera.quaternion.w);
    } else {
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);
    }

    applyViewportOffset(camera, mountElement, dataset.viewport);

    const pathLayoutCamera = camera.clone();

    applyViewportOffset(pathLayoutCamera, mountElement, dataset.viewport);

    pathLayoutCamera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    createShadowsController(renderer, dataset);
    createLights(scene, dataset.lighting);

    const sceneObjects = createSceneObjects(scene, dataset.sceneObjects);

    positionSceneObjectsForViewport(sceneObjects, pathLayoutCamera, mountElement);
    const objectAnimations = createSceneObjectAnimations(sceneObjects, dataset.sequences, events);

    mountElement.appendChild(renderer.domElement);

    const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9d2a,
        roughness: 0.45,
        metalness: 0.15,
        flatShading: true,
        side: THREE.FrontSide,
    });

    const beforeRenderListeners = new Set();
    const frameListeners = new Set();
    const pathRebuildListeners = new Set();

    let cameraTrackEnabled = true;

    let renderedArrowItems = [];
    let arrows = [];

    rebuildArrowPaths();

    const getObjectAtPointer = createObjectLocator(
    scene,
    camera,
    renderer.domElement
);

    const objectInteractions = createObjectInteractions(
        renderer.domElement,
        {
            getObjectAtPointer,
            emit: events.emit,
        }
    );

    const timer = new THREE.Timer();
    let animationFrameId = null;
    let isDestroyed = false;

    // helpers
    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            pathLayoutCamera,
            mountElement,
            createArrowMaterial() {
                const material = arrowMaterial.clone();

                material.transparent = true;
                material.opacity = 1;

                return material;
            },
            fieldSettings: sceneSettings.field,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths,
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;

        pathRebuildListeners.forEach((listener) => {
            listener(renderedArrowItems);
        });
    }

    function animate() {
        if (isDestroyed) {
            return;
        }

        animationFrameId = requestAnimationFrame(animate);
        timer.update();

        const deltaTime = timer.getDelta();
        const currentTime = playback.update(deltaTime);
        const ambientTime = timer.getElapsed();

        frameListeners.forEach((listener) => {
            listener({
                deltaTime,
                currentTime,
                ambientTime,
            });
        });

        if (cameraTrack && cameraTrackEnabled) {
            updateCameraTrack(mountElement, cameraTrack, camera, currentTime);
        }

        updateArrowAnimations({
            renderedArrowItems,
            currentTime,
            ambientTime,
        });

        objectAnimations.update(currentTime, ambientTime);

        sceneObjects.forEach((object) => {
            object.userData.updateModifiers?.();
        });

        renderFrame();
    }

    function renderFrame() {
        const restoreCallbacks = [];

        try {
            beforeRenderListeners.forEach((listener) => {
                const restore = listener();

                if (typeof restore === "function") {
                    restoreCallbacks.push(restore);
                }
            });

            renderer.render(scene, camera);
        } finally {
            restoreCallbacks.reverse().forEach((restore) => {
                restore();
            });
        }
    }

    function handleResize() {
        responsiveResize(mountElement, [camera, pathLayoutCamera], renderer);

        applyViewportOffset(camera, mountElement, dataset.viewport);

        applyViewportOffset(pathLayoutCamera, mountElement, dataset.viewport);

        positionSceneObjectsForViewport(sceneObjects, pathLayoutCamera, mountElement);

        rebuildArrowPaths();
    }

    function destroy() {
        if (isDestroyed) {
            return;
        }

        events.clear();

        isDestroyed = true;
        frameListeners.clear();
        pathRebuildListeners.clear();
        beforeRenderListeners.clear();

        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        window.removeEventListener("resize", handleResize);

        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }

            if (Array.isArray(object.material)) {
                object.material.forEach((material) => {
                    material.dispose();
                });

                return;
            }

            if (object.material) {
                object.material.dispose();
            }
        });

        objectInteractions.destroy();
        objectAnimations.destroy();
        sceneObjects.clear();
        renderer.dispose();

        if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
    }

    window.addEventListener("resize", handleResize);
    animate();

    return {
        scene,
        camera,
        renderer,
        mountElement,
        on: events.on,
        emit: events.emit,
        playback,

        getArrowPaths() {
            return arrowPaths;
        },

        setArrowPaths(nextArrowPaths) {
            arrowPaths = nextArrowPaths;
            rebuildArrowPaths();
        },

        getRenderedArrowItems() {
            return renderedArrowItems;
        },

        getArrows() {
            return arrows;
        },

        getCameraTrack() {
            return cameraTrack;
        },

        setCameraTrackEnabled(isEnabled) {
            cameraTrackEnabled = isEnabled;
        },

        onFrame(listener) {
            frameListeners.add(listener);

            return () => {
                frameListeners.delete(listener);
            };
        },

        onPathsRebuilt(listener) {
            pathRebuildListeners.add(listener);

            return () => {
                pathRebuildListeners.delete(listener);
            };
        },

        onBeforeRender(listener) {
            beforeRenderListeners.add(listener);

            return () => {
                beforeRenderListeners.delete(listener);
            };
        },

        getSceneObject(objectId) {
            return sceneObjects.get(objectId) ?? null;
        },

        setInteractionsEnabled: objectInteractions.setEnabled,
        playAnimation: objectAnimations.play,

        resize: handleResize,
        destroy,
    };
}
