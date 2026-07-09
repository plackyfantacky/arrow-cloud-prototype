import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { getStageSize } from "./stage.js";
import { getResponsiveCameraDistance, getCameraTrackState } from "./camera.js";
import { positionArrowPathForViewport } from "./positionArrowPathForViewport.js";

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

import { createDebugControls } from "./debug/createDebugControls.js";
import { createArrowNameLabel } from "./debug/createArrowNameLabel.js";
import { createDebugLineTooltip } from "./debug/createDebugLineTooltip.js";
import { createDebugAxesGauge } from "./debug/createDebugAxesGauge.js";
import { createDebugSegmentSelector } from "./debug/createDebugSegmentSelector.js";
import { createDebugPathNudgeControls } from "./debug/createDebugPathNudgeControls.js";

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

    const renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    const debugControls = animationSettings.debugMode
        ? createDebugControls(animationSettings)
        : null;

    renderer.setSize(stageSize.width, stageSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountElement.appendChild(renderer.domElement);

    const controls = animationSettings.debugMode
        ? new OrbitControls(camera, renderer.domElement)
        : null;

    if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        controls.update();
    }

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
    let debugLineTooltip = null;
    let debugSegmentSelector = null;
    let debugPathNudgeControls = null;
    let selectedDebugInfo = null;

    let workingArrowPaths = arrowPaths.map(cloneArrowPath);

    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            camera,
            mountElement,
            arrowMaterial,
            animationSettings,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths: workingArrowPaths
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;
        pathComponentMeshes = renderState.pathComponentMeshes;
    }

    function findArrowPathIndexByName(arrowName) {
        return workingArrowPaths.findIndex((arrowPath) => {
            return arrowPath.name === arrowName;
        });
    }

    function copyCurrentMoves() {
        if (!selectedDebugInfo) {
            console.warn('No debug segment selected.');
            return;
        }

        const arrowPathIndex = findArrowPathIndexByName(selectedDebugInfo.arrowName);

        if (arrowPathIndex < 0) {
            console.warn(`Could not find arrow path: ${selectedDebugInfo.arrowName}`);
            return;
        }

        const arrowPath = workingArrowPaths[arrowPathIndex];
        const output = JSON.stringify(arrowPath.moves, null, 4);

        navigator.clipboard.writeText(output)
            .then(() => {
                console.log('Copied arrow moves:');
                console.log(output);
            })
            .catch((error) => {
                console.warn('Could not copy arrow moves to the clipboard.');
                console.log(output);
                console.error(error);
            });
    }

    rebuildArrowPaths();

    if (animationSettings.debugMode) {
        debugPathNudgeControls = createDebugPathNudgeControls({
            onNudge: nudgeSelectedMove,
            onCopy: copyCurrentMoves,
        });

        debugLineTooltip = createDebugLineTooltip({
            camera,
            renderer,
            getObjects() {
                return arrows;
            },
        });

        debugSegmentSelector = createDebugSegmentSelector({
            camera,
            renderer,
            getObjects() {
                return arrows;
            },
            onSelect(debugInfo) {
                selectedDebugInfo = debugInfo;
                debugPathNudgeControls.setSelectedDebugInfo(debugInfo);
            },
            onSelect(debugInfo) {
                selectedDebugInfo = debugInfo;
                debugPathNudgeControls.setSelectedDebugInfo(debugInfo);
            }
        });
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(4, 6, 8);
    scene.add(directionalLight);

    if (animationSettings.debugMode) {
        const gridHelper = new THREE.GridHelper(14, 14);
        scene.add(gridHelper);

        const axesGauge = createDebugAxesGauge({
            size: 2,
            labelOffset: 0.35,
        });

        axesGauge.position.set(0.1, 0.1, 0.1);
        scene.add(axesGauge);
    }

    const cameraTarget = new THREE.Vector3();

    function updateCameraTrack(currentTime) {
        const cameraTrackState = getCameraTrackState(cameraTrack, currentTime);

        if (!cameraTrackState) {
            return;
        }

        const responsiveDistance = getResponsiveCameraDistance(mountElement);
        const desktopDistance = 12.2;
        const distanceOffset = responsiveDistance - desktopDistance;

        camera.position.set(
            cameraTrackState.position.x,
            cameraTrackState.position.y,
            cameraTrackState.position.z + distanceOffset
        );

        cameraTarget.set(
            cameraTrackState.target.x,
            cameraTrackState.target.y,
            cameraTrackState.target.z
        );

        camera.lookAt(cameraTarget);
    }

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
        const rawCurrentTime = debugControls
            ? debugControls.state.currentTime
            : timer.getElapsed() * animationSettings.speed;

        const currentTime = !debugControls && animationSettings.isLooping
            ? rawCurrentTime % animationSettings.timelineDuration
            : rawCurrentTime;

        const shouldUseCameraTrack = !animationSettings.debugMode;

        if (shouldUseCameraTrack) {
            updateCameraTrack(currentTime);
        }

        if (debugControls) {
            if (debugControls.state.isPlaying) {
                debugControls.state.currentTime += deltaTime * debugControls.state.speed;

                if (debugControls.state.isLooping) {
                    debugControls.state.currentTime %= debugControls.state.timelineDuration;
                } else {
                    debugControls.state.currentTime = THREE.MathUtils.clamp(
                        debugControls.state.currentTime,
                        0,
                        debugControls.state.timelineDuration
                    );
                }

                debugControls.updateProgressInput();
            }
        }

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

        if (controls) {
            controls.update();
        }

        if (debugLineTooltip) {
            debugLineTooltip.update();
        }

        renderer.render(scene, camera);

    }

    function handleResize() {
        const stageSize = getStageSize(mountElement);

        camera.aspect = stageSize.width / stageSize.height;
        camera.updateProjectionMatrix();

        renderer.setSize(stageSize.width, stageSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    function nudgeSelectedMove(amount, targetOffset = 0) {
        if (!selectedDebugInfo) {
            return;
        }

        const arrowPathIndex = findArrowPathIndexByName(selectedDebugInfo.arrowName);

        if (arrowPathIndex < 0) {
            return;
        }

        const arrowPath = workingArrowPaths[arrowPathIndex];

        const sourceMoveIndex = getSourceMoveIndex(
            arrowPath,
            selectedDebugInfo.segmentIndex
        );

        const targetMoveIndex = sourceMoveIndex + targetOffset;

        if (targetMoveIndex < 0 || targetMoveIndex >= arrowPath.moves.length) {
            return;
        }

        const move = arrowPath.moves[targetMoveIndex];
        const [actionName, actionValue, options] = move;

        if (typeof actionValue !== 'number') {
            return;
        }

        const nextActionValue = Math.max(0, Number((actionValue + amount).toFixed(3)));

        arrowPath.moves[targetMoveIndex] = options
            ? [actionName, nextActionValue, options]
            : [actionName, nextActionValue];

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

        if (controls) {
            controls.dispose();
        }

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

        if (debugControls?.destroy) {
            debugControls.destroy();
        }

        if (debugLineTooltip) {
            debugLineTooltip.destroy();
        }

        if (debugSegmentSelector) {
            debugSegmentSelector.destroy();
        }

        if (debugPathNudgeControls) {
            debugPathNudgeControls.destroy();
        }

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


// debug helpers

function cloneArrowPath(arrowPath) {
    return {
        ...arrowPath,
        origin: [...arrowPath.origin],
        moves: arrowPath.moves.map((move) => {
            const [actionName, actionValue, options] = move;

            return options
                ? [actionName, actionValue, { ...options }]
                : [actionName, actionValue];
        }),
        timing: arrowPath.timing ? { ...arrowPath.timing } : undefined,
        head: arrowPath.head ? { ...arrowPath.head } : undefined,
        entry: arrowPath.entry ? { ...arrowPath.entry } : undefined,
    };
}

function getSourceMoveIndex(arrowPath, segmentIndex) {
    const hasGeneratedEntrySegment = Boolean(
        arrowPath.entry?.side
        && ['left', 'right'].includes(arrowPath.entry.side)
        && arrowPath.entry.straightUntil !== undefined
        && arrowPath.entry.straightUntil !== null
    );

    if (hasGeneratedEntrySegment) {
        return segmentIndex - 1;
    }

    return segmentIndex;
}

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

        if (renderedArrowItem.label) {
            scene.remove(renderedArrowItem.label);
            disposeRenderableObject(renderedArrowItem.label);
        }
    });
}

function createRenderedArrowPath({ scene, camera, mountElement, arrowMaterial, animationSettings, arrowPath }) {
    const positionedArrowPath = positionArrowPathForViewport(
        arrowPath,
        camera,
        mountElement
    );

    const segments = createArrowPathSegments(positionedArrowPath);
    const pieces = createArrowRenderPieces(segments, arrowFieldSettings);
    const arrow = createArrow(pieces, arrowMaterial, arrowFieldSettings);
    const components = createArrowPathComponents(positionedArrowPath, segments);
    const componentMeshes = [];

    arrow.userData.revealPieces.forEach((revealPiece) => {
        revealPiece.userData.debugInfo = {
            arrowName: positionedArrowPath.name,
            segmentIndex: revealPiece.userData.segmentIndex,
            actionName: revealPiece.userData.actionName,
            segmentLength: revealPiece.userData.segmentLength
        };
    });

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

    if (animationSettings.debugMode) {
        const label = createArrowNameLabel(positionedArrowPath.name, segments[0]);
        scene.add(label);

        return {
            arrow,
            componentMeshes,
            label,
        };
    }

    setArrowReveal(arrow, 0);

    return {
        arrow,
        componentMeshes,
        label: null,
    };

}

function renderArrowPaths({ scene, camera, mountElement, arrowMaterial, animationSettings, previousRenderedArrowItems, arrowPaths }) {
    clearRenderedArrowItems(scene, previousRenderedArrowItems);

    const renderedArrowItems = arrowPaths.map((arrowPath) => {
        return createRenderedArrowPath({
            scene,
            camera,
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

