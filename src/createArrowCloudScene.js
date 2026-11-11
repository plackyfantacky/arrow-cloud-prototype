import * as THREE from "three";

import { getStageSize } from "./stage.js";
import { updateCameraTrack } from "./camera.js";

import { createPlaybackController } from "./animation/createPlaybackController.js";
import { updateArrowAnimations } from "./animation/updateArrowAnimations.js";
import { applyViewportOffset, handleResize as responsiveResize } from "./responsive.js";

import { renderArrowPaths } from "./arrows/renderArrowPaths.js";

import { arrowCloudSettings } from "./arrowCloudSettings.js";

export function createArrowCloudScene(mountElement, options = {}) {
    if (!mountElement) {
        throw new Error("createArrowCloudScene requires a mount element.");
    }

    const dataset = options.dataset;

    const animationSettings = {
        ...dataset.animationSettings,
        ...options.animationSettings,
    };

    const playback = createPlaybackController(animationSettings);

    const arrowPaths = options.arrowPaths || dataset.arrowPaths;
    const cameraTrack = options.cameraTrack || dataset.cameraTrack || null;
    const stageSize = getStageSize(mountElement);
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(45, stageSize.width / stageSize.height, 0.1, 100);

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

    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            pathLayoutCamera,
            mountElement,
            createArrowMaterial() {
                return arrowMaterial;
            },
            fieldSettings: arrowCloudSettings.field,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths,
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;
        pathComponentMeshes = renderState.pathComponentMeshes;
    }

    rebuildArrowPaths();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(4, 6, 8);
    scene.add(directionalLight);

    const timer = new THREE.Timer();
    let animationFrameId = null;
    let isDestroyed = false;

    function animate() {
        if (isDestroyed) {
            return;
        }

        animationFrameId = requestAnimationFrame(animate);
        timer.update();

        const currentTime = playback.update(timer.getDelta());

        if (cameraTrack) {
            updateCameraTrack(mountElement, cameraTrack, camera, currentTime);
        }

        updateArrowAnimations({
            renderedArrowItems,
            currentTime,
            ambientTime: timer.getElapsed(),
        });

        renderer.render(scene, camera);
    }

    function handleResize() {
        responsiveResize(mountElement, [camera, pathLayoutCamera], renderer);

        applyViewportOffset(camera, mountElement, dataset.viewport);

        applyViewportOffset(pathLayoutCamera, mountElement, dataset.viewport);

        rebuildArrowPaths();
    }

    window.addEventListener("resize", handleResize);

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

        renderer.dispose();

        if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
    }

    animate();

    return {
        resize: handleResize,
        destroy,
    };
}