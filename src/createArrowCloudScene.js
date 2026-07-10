import * as THREE from "three";

import { getStageSize } from "./stage.js";
import { updateCameraTrack } from "./camera.js";
import { handleResize as responsiveResize, positionArrowPathForViewport } from "./responsive.js";

import {
    animationSettings as defaultAnimationSettings,
    arrowPaths as defaultArrowPaths,
    cameraTrack as defaultCameraTrack
} from "./arrows/arrowData.js";

import { arrowFieldSettings } from "./arrows/arrowFieldSettings.js";
import { createArrow } from "./arrows/createArrow.js";
import { createArrowRenderPieces } from "./arrows/createArrowRenderPieces.js";
import { createArrowPathSegments } from "./arrows/createArrowPaths.js";
import { createPathComponentMesh } from "./arrows/pathComponents/index.js";
import { createArrowPathComponents, setPathComponentReveal } from "./arrows/createArrowPathComponents.js";
import { setArrowReveal, updateArrowReveal } from "./arrows/reveal.js";

export function createArrowCloudScene(mountElement, options = {}) {
    if (!mountElement) {
        throw new Error('createArrowCloudScene requires a mount element.');
    }

    const animationSettings = {
        ...defaultAnimationSettings,
        ...options.animationSettings
    };

    const arrowPaths = options.arrowPaths || defaultArrowPaths;
    const cameraTrack = options.cameraTrack || defaultCameraTrack;

    const stageSize = getStageSize(mountElement);

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0xFFFFFF);

    const camera = new THREE.PerspectiveCamera(
        45,
        stageSize.width / stageSize.height,
        0.1,
        100
    );

    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, 0);

    const pathLayoutCamera = camera.clone();
    pathLayoutCamera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountElement.appendChild(renderer.domElement);

    const arrowMaterial = new THREE.MeshStandardMaterial({
        color: 0xff9d2a,
        roughness: 0.45,
        metalness: 0.15,
        flatShading: true,
        side: THREE.FrontSide
    });

    let renderedArrowItems = [];
    let arrows = [];
    let pathComponentMeshes = [];

    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            pathLayoutCamera,
            mountElement,
            arrowMaterial,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths
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

        const rawCurrentTime = timer.getElapsed() * animationSettings.speed;

        const currentTime = animationSettings.isLooping
            ? rawCurrentTime % animationSettings.timelineDuration
            : rawCurrentTime;

        updateCameraTrack(
            mountElement,
            cameraTrack,
            camera,
            currentTime
        );

        arrows.forEach((arrow) => {
            updateArrowReveal(arrow, currentTime);
        });

        pathComponentMeshes.forEach((componentMesh) => {
            const delay = componentMesh.userData.timing.delay;
            const duration = componentMesh.userData.timing.duration;

            const revealProgress = THREE.MathUtils.clamp(
                (currentTime - delay) / duration,
                0, 1
            );

            setPathComponentReveal(componentMesh, revealProgress);
        });

        renderer.render(scene, camera);
    }

    function handleResize() {
        responsiveResize(
            mountElement,
            [camera, pathLayoutCamera],
            renderer
        );

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

        window.removeEventListener('resize', handleResize);

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

    window.addEventListener('resize', handleResize);

    animate();

    return {
        resize: handleResize,
        destroy
    };
}

// render helpers

function disposeRenderableObject(object) {
    object.traverse((childObject) => {
        if (childObject.geometry) {
            childObject.geometry.dispose();
        }

        if (Array.isArray(childObject.material)) {
            childObject.material.forEach((material) => {
                material.dispose();
            });

            return;
        }

        if (childObject.material) {
            if (childObject.material.map) {
                childObject.material.map.dispose();
            }

            childObject.material.dispose();
        }
    });
}

function clearRenderedArrowItems(scene, renderedArrowItems) {
    renderedArrowItems.forEach((renderedArrowItem) => {
        scene.remove(renderedArrowItem.arrow);
        disposeRenderableObject(renderedArrowItem.arrow);

        renderedArrowItem.componentMeshes.forEach((componentMesh) => {
            scene.remove(componentMesh);
            disposeRenderableObject(componentMesh);
        });
    });
}

function createRenderedArrowPath({ scene, pathLayoutCamera, mountElement, arrowMaterial, arrowPath }) {
    const positionedArrowPath = positionArrowPathForViewport(
        arrowPath,
        pathLayoutCamera,
        mountElement
    );

    const segments = createArrowPathSegments(positionedArrowPath);
    const pieces = createArrowRenderPieces(segments, arrowFieldSettings);
    const arrow = createArrow(pieces, arrowMaterial, arrowFieldSettings);
    const components = createArrowPathComponents(positionedArrowPath, segments);
    const componentMeshes = [];

    arrow.userData.name = positionedArrowPath.name;

    arrow.userData.timing = {
        delay: positionedArrowPath.timing?.delay || 0,
        duration: positionedArrowPath.timing?.duration || 5,
    };

    arrow.userData.headTiming = {
        hideAt: positionedArrowPath.head?.hideAt ?? null,
        hideDuration: positionedArrowPath.head?.hideDuration ?? 0.25,
    };

    components.forEach((component) => {
        const componentMesh = createPathComponentMesh(component);

        scene.add(componentMesh);
        componentMeshes.push(componentMesh);
    });

    scene.add(arrow);

    setArrowReveal(arrow, 0);

    return {
        arrow,
        componentMeshes
    };
}

function renderArrowPaths({ 
    scene, 
    pathLayoutCamera, 
    mountElement, 
    arrowMaterial, 
    previousRenderedArrowItems, 
    arrowPaths 
}) {

    clearRenderedArrowItems(scene, previousRenderedArrowItems);

    const renderedArrowItems = arrowPaths.map((arrowPath) => {
        return createRenderedArrowPath({
            scene,
            pathLayoutCamera,
            mountElement,
            arrowMaterial,
            arrowPath,
        });
    });

    return {
        renderedArrowItems,
        arrows: renderedArrowItems.map((renderedArrowItem) => {
            return renderedArrowItem.arrow;
        }),
        pathComponentMeshes: renderedArrowItems.flatMap((renderedArrowItem) => {
            return renderedArrowItem.componentMeshes;
        }),
    };
}