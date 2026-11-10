import * as THREE from "three";

import { getStageSize } from "./stage.js";

import { createPlaybackController } from "./animation/createPlaybackController.js";
import { applyViewportOffset, handleResize as responsiveResize } from "./responsive.js";

import { renderArrowPaths } from "./arrows/renderArrowPaths.js";
import { setPathComponentReveal } from "./arrows/createArrowPathComponents.js";
import { updateArrowReveal } from "./arrows/reveal.js";
import { updateArrowIdleMotion } from "./arrows/idle.js";

import { arrowCloudLabsSettings } from "./arrowCloudLabsSettings.js";

import { createEnvironment } from "./environment/createEnvironment.js";
import { createLights } from "./lighting/createLights.js";
import { createShadowsController } from "./lighting/createShadowsController.js";
import { createBackgroundShader } from "./shaders/createBackgroundShader.js";

import { createArrowCloudEditor } from "./editor/createArrowCloudEditor.js";

export function createArrowCloudLabsScene(mountElement, options = {}) {
    if (!mountElement) {
        throw new Error("createArrowCloudScene requires a mount element.");
    }

    const dataset = options.dataset;
    //const loadDataset = options.loadDataset;

    const timer = new THREE.Timer();
    let animationFrameId = null;
    let isDestroyed = false;

    const animationSettings = {
        ...dataset.animationSettings,
        ...options.animationSettings,
    };

    const playback = createPlaybackController(animationSettings);

    let arrowPaths = options.arrowPaths || dataset.arrowPaths;
    let cameraTrack = options.cameraTrack || dataset.cameraTrack;
    const stageSize = getStageSize(mountElement);

    const scene = new THREE.Scene();
    const environment = createEnvironment(scene, dataset.environment);
    const backgroundShader = createBackgroundShader(scene, dataset.shaders?.background);

    if (environment) {
        environment.userData.cameraTargetCollision = false;
    }

    if (backgroundShader) {
        const backgroundSettings = dataset.shaders.background;

        scene.fog = new THREE.Fog(backgroundSettings.horizonColour ?? "#FFE4D3", backgroundSettings.fogNear ?? 10, backgroundSettings.fogFar ?? 35);
    }

    const camera = new THREE.PerspectiveCamera(45, stageSize.width / stageSize.height, 0.5, 500);

    const staticCamera = dataset.staticCamera;

    if (staticCamera) {
        camera.position.set(staticCamera.position.x, staticCamera.position.y, staticCamera.position.z);

        camera.quaternion.set(staticCamera.quaternion.x, staticCamera.quaternion.y, staticCamera.quaternion.z, staticCamera.quaternion.w);
    } else {
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);
    }

    applyViewportOffset(camera, mountElement, dataset.viewport);

    const referenceCamera = camera.clone();

    referenceCamera.updateProjectionMatrix();
    referenceCamera.updateMatrixWorld(true);

    const cameraHelper = new THREE.CameraHelper(referenceCamera);

    cameraHelper.userData.editorHelper = true;
    cameraHelper.visible = false;

    scene.add(cameraHelper);

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

    mountElement.appendChild(renderer.domElement);

    const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9d2a,
        roughness: 0.45,
        metalness: 0.15,
        flatShading: true,
        side: THREE.FrontSide,
    });

    let renderedArrowItems = [];
    let arrows = [];
    let pathComponentMeshes = [];

    const debug = animationSettings.debugMode
        ? createArrowCloudEditor({
              playback,
              camera,
              renderer,
              mountElement,
              scene,
              arrowPaths,
              animationSettings,
              initialCameraView: options.cameraView,
              initialCameraDistance: options.cameraDistance,
              initialCameraTarget: staticCamera?.target,
              hasInitialCameraState: Boolean(staticCamera),

              getCameraTrack() {
                  return cameraTrack;
              },

              getRenderedArrowItems() {
                  return renderedArrowItems;
              },

              getArrows() {
                  return arrows;
              },

              onArrowPathsChange(nextArrowPaths) {
                  arrowPaths = nextArrowPaths;
                  rebuildArrowPaths();
              },

              onDatasetChange(datasetName) {
                  return setDataset(datasetName);
              },
          })
        : null;

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
            fieldSettings: arrowCloudLabsSettings.field,
            initialRevealProgress: animationSettings.debugMode ? null : 0,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths,
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;
        pathComponentMeshes = renderState.pathComponentMeshes;

        debug?.syncRenderedArrowItems();
    }

    async function setDataset(datasetName) {
        const url = new URL(window.location.href);
        url.searchParams.set("dataset", datasetName);
        window.location.assign(url);
    }

    rebuildArrowPaths();

    function animate() {
        if (isDestroyed) {
            return;
        }

        animationFrameId = requestAnimationFrame(animate);
        timer.update();

        const deltaTime = timer.getDelta();

        const currentTime = playback.update(deltaTime);

        debug?.update({
            deltaTime,
            currentTime,
        });

        arrows.forEach((arrow) => {
            updateArrowReveal(arrow, currentTime);
        });

        renderedArrowItems.forEach((renderedArrowItem) => {
            const { arrow, motionGroup } = renderedArrowItem;
            const idleSettings = motionGroup.userData.idle;

            if (!idleSettings) {
                return;
            }

            const revealEndTime = arrow.userData.timing.delay + arrow.userData.timing.duration;

            const idleTime = Math.max(0, timer.getElapsed() - revealEndTime);

            if (currentTime < revealEndTime) {
                return;
            }

            updateArrowIdleMotion(motionGroup, idleSettings, idleTime);
        });

        pathComponentMeshes.forEach((componentMesh) => {
            const delay = componentMesh.userData.timing.delay;
            const duration = componentMesh.userData.timing.duration;

            const revealProgress = THREE.MathUtils.clamp((currentTime - delay) / duration, 0, 1);

            setPathComponentReveal(componentMesh, revealProgress);
        });

        if (document.body.classList.contains("editor-ui-hidden")) {
            renderScenePreview();
        } else {
            renderer.render(scene, camera);
        }
    }

    function renderScenePreview() {
        const helperVisibility = new Map();
        const highlightMaterials = new Map();

        scene.traverse((object) => {
            if (object.userData.editorHelper) {
                helperVisibility.set(object, object.visible);
                object.visible = false;
            }

            const originalMaterial = object.userData.pathHighlightOriginalMaterial;

            if (originalMaterial) {
                highlightMaterials.set(object, object.material);
                object.material = originalMaterial;
            }
        });

        try {
            renderer.render(scene, camera);
        } finally {
            helperVisibility.forEach((wasVisible, object) => {
                object.visible = wasVisible;
            });

            highlightMaterials.forEach((material, object) => {
                object.material = material;
            });
        }
    }

    function handleResize() {
        responsiveResize(mountElement, [camera, pathLayoutCamera], renderer);

        applyViewportOffset(camera, mountElement, dataset.viewport);

        applyViewportOffset(pathLayoutCamera, mountElement, dataset.viewport);

        rebuildArrowPaths();
    }

    function destroy() {
        if (isDestroyed) {
            return;
        }

        isDestroyed = true;

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

        debug?.destroy();

        renderer.dispose();

        if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
    }

    window.addEventListener("resize", handleResize);
    animate();

    return {
        resize: handleResize,
        destroy,
    };
}
