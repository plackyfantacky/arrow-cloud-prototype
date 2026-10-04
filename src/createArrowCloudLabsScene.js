import * as THREE from "three";

import { getStageSize } from "./stage.js";
import { handleResize as responsiveResize, positionArrowPathForViewport } from "./responsive.js";

import { arrowCloudLabsSettings } from "./arrowCloudLabsSettings.js";
import { createArrow } from "./arrows/createArrow.js";
import { createArrowRenderPieces } from "./arrows/createArrowRenderPieces.js";
import { createArrowPathSegments } from "./arrows/createArrowPaths.js";
import { createPathComponentMesh } from "./arrows/pathComponents/index.js";
import { createArrowPathComponents, setPathComponentReveal } from "./arrows/createArrowPathComponents.js";
import { setArrowReveal, updateArrowReveal } from "./arrows/reveal.js";

import { createArrowCloudDebug } from "./debug/createArrowCloudDebug.js";

export function createArrowCloudLabsScene(mountElement, options = {}) {
    if (!mountElement) {
        throw new Error('createArrowCloudScene requires a mount element.');
    }

    const dataset = options.dataset;
    const loadDataset = options.loadDataset;

    const animationSettings = {
        ...dataset.animationSettings,
        ...options.animationSettings
    };

    const arrowPaths = options.arrowPaths || dataset.arrowPaths;
    let cameraTrack = options.cameraTrack || dataset.cameraTrack;
    const stageSize = getStageSize(mountElement);
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0xFFFFFF);

    const camera = new THREE.PerspectiveCamera(
        45,
        stageSize.width / stageSize.height,
        0.1,
        100
    );

    const staticCamera = dataset.staticCamera;

    if (staticCamera) {
        camera.position.set(
            staticCamera.position.x,
            staticCamera.position.y,
            staticCamera.position.z
        );

        camera.quaternion.set(
            staticCamera.quaternion.x,
            staticCamera.quaternion.y,
            staticCamera.quaternion.z,
            staticCamera.quaternion.w
        );
    } else {
        camera.position.set(0, 5, 12);
        camera.lookAt(0, 0, 0);
    }

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

    const debug = animationSettings.debugMode
        ? createArrowCloudDebug({
            camera,
            renderer,
            mountElement,
            scene,
            arrowPaths,
            animationSettings,

            getCameraTrack() {
                return cameraTrack;
            },

            getRenderedArrowItems() {
                return renderedArrowItems;
            },

            getArrows() {
                return arrows;
            },

            rebuildArrowPaths,

            onDatasetChange(datasetName) {
                return setDataset(datasetName);
            }
        })
        : null;

    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            pathLayoutCamera,
            mountElement,
            arrowMaterial,
            animationSettings,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths: debug.getArrowPaths()
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;
        pathComponentMeshes = renderState.pathComponentMeshes;

        debug?.syncRenderedArrowItems();
    }

    async function setDataset(datasetName) {
        const nextDataset = await loadDataset(datasetName);

        cameraTrack = nextDataset.cameraTrack;

        debug.setArrowPaths(nextDataset.arrowPaths);

        debug.setAnimationSettings(nextDataset.animationSettings);

        rebuildArrowPaths();
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

        const deltaTime = timer.getDelta();


        const rawCurrentTime = timer.getElapsed() * animationSettings.speed;
        
        const currentTime = debug
            ? debug.update({ deltaTime })
            : animationSettings.isLooping
                ? rawCurrentTime % animationSettings.timelineDuration
                : rawCurrentTime;

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
        return responsiveResize(
            mountElement,
            [camera, pathLayoutCamera],
            renderer);
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

        debug?.destroy();

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

// arrow rendering helpers

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

function createRenderedArrowPath({ 
    scene, 
    pathLayoutCamera, 
    mountElement, 
    arrowMaterial, 
    animationSettings, 
    arrowPath 
}) {

    const renderedArrowMaterial = arrowMaterial.clone();

    renderedArrowMaterial.transparent = true;
    renderedArrowMaterial.opacity = 1;

    const positionedArrowPath = positionArrowPathForViewport(
        arrowPath,
        pathLayoutCamera,
        mountElement
    );

    const segments = createArrowPathSegments(positionedArrowPath);
    const pieces = createArrowRenderPieces(segments, arrowCloudLabsSettings.field);

    const arrow = createArrow(
        pieces,
        renderedArrowMaterial,
        arrowCloudLabsSettings.field
    );

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

    arrow.userData.headMorphTiming = {
        morphAt: positionedArrowPath.head?.morphAt ?? null,
        morphDuration: positionedArrowPath.head?.morphDuration ?? 0.75,
    };

    components.forEach((component) => {
        const componentMesh = createPathComponentMesh(component);

        scene.add(componentMesh);
        componentMeshes.push(componentMesh);
    });

    scene.add(arrow);

    if (!animationSettings.debugMode) {
        setArrowReveal(arrow, 0);
    }

    return {
        arrow,
        componentMeshes,
        positionedArrowPath,
        segments
    };

}

function renderArrowPaths({ 
    scene, 
    pathLayoutCamera, 
    mountElement, 
    arrowMaterial, 
    animationSettings, 
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
            animationSettings,
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

