import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { getStageSize } from "./stage.js";
import { updateCameraTrack } from "./camera.js";
import { handleResize as responsiveResize, positionArrowPathForViewport } from "./responsive.js";

import {
    animationSettings as defaultAnimationSettings,
    arrowPaths as defaultArrowPaths,
    cameraTrack as defaultCameraTrack
} from "./arrows/arrowData-labs.js";

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
import { createDebugPathEditor } from "./debug/createDebugPathEditor.js";
import { createDebugSegmentHighlight } from "./debug/createDebugSegmentHighlight.js";

const CAMERA_MODES = {
    TRACKED: 'tracked',
    ORBITAL: 'orbital'
};

export function createArrowCloudLabsScene(mountElement, options = {}) {
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
    let debugControls = null;

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

    const controls = animationSettings.debugMode
        ? new OrbitControls(camera, renderer.domElement)
        : null;

    if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);
        controls.enabled = true;
        controls.update();
        controls.saveState();
    }

    const orbitalCameraState = {
        position: camera.position.clone(),
        target: controls?.target.clone() ?? new THREE.Vector3()
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
    let debugSegmentHighlight = null;
    let cameraMode = CAMERA_MODES.ORBITAL;

    const pathEditor = createDebugPathEditor(arrowPaths);

    function rebuildArrowPaths() {
        const renderState = renderArrowPaths({
            scene,
            pathLayoutCamera,
            mountElement,
            arrowMaterial,
            animationSettings,
            previousRenderedArrowItems: renderedArrowItems,
            arrowPaths: pathEditor.getArrowPaths()
        });

        renderedArrowItems = renderState.renderedArrowItems;
        arrows = renderState.arrows;
        pathComponentMeshes = renderState.pathComponentMeshes;

        if (debugSegmentHighlight) {
            debugSegmentHighlight.setSelectedDebugInfo(
                pathEditor.getSelectedDebugInfo()
            );
        }
    }

    function copyCurrentPath() {
        const arrowPath = pathEditor.getSelectedArrowPath();

        if (!arrowPath) {
            console.warn('No debug segment selected.');
            return;
        }
        
        const output = JSON.stringify(arrowPath, null, 4);

        navigator.clipboard.writeText(output)
            .then(() => {
                console.log('Copied arrow path:');
                console.log(output);
            })
            .catch((error) => {
                console.warn('Could not copy arrow path to the clipboard.');
                console.log(output);
                console.error(error);
            });
    }

    rebuildArrowPaths();

    if (animationSettings.debugMode) {
        debugPathNudgeControls = createDebugPathNudgeControls({
            onNudge(amount, targetValue) {
                const didChangePath = pathEditor.nudgeSelectedPathValue(
                    amount,
                    targetValue
                );

                if (didChangePath) {
                    rebuildArrowPaths();
                }
            },
            onCopy: copyCurrentPath,
            onActionChange(actionName) {
                const didChangePath = pathEditor.changeSelectedMoveAction(actionName);

                if (didChangePath) {
                    rebuildArrowPaths();
                }
            },
            onInsertMove(position, actionName) {
                const didChangePath = pathEditor.insertMoveNearSelectedMove(
                    position,
                    actionName
                );

                if (didChangePath) {
                    rebuildArrowPaths();
                }
            },
            onDuplicateMove() {
                const didChangePath = pathEditor.duplicateSelectedMove();

                if (didChangePath) {
                    rebuildArrowPaths();
                }
            },
            onRemoveMove() {
                const didChangePath = pathEditor.removeSelectedMove();

                if (didChangePath) {
                    rebuildArrowPaths();
                }
            },
            onTargetChange(targetValue) {
                debugSegmentHighlight.setTargetValue(targetValue);
            }
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
                pathEditor.setSelectedDebugInfo(debugInfo);
                debugPathNudgeControls.setSelectedDebugInfo(debugInfo);
                debugSegmentHighlight.setSelectedDebugInfo(debugInfo);
            }
        });

        debugSegmentHighlight = createDebugSegmentHighlight({
            getObjects() {
                return arrows;
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

    const timer = new THREE.Timer();
    let animationFrameId = null;
    let isDestroyed = false;

    function setCameraMode(nextCameraMode) {
        if (
            cameraMode === CAMERA_MODES.ORBITAL &&
            nextCameraMode === CAMERA_MODES.TRACKED
        ) {
            orbitalCameraState.position.copy(camera.position);
            orbitalCameraState.target.copy(controls.target);
        }

        cameraMode = nextCameraMode;

        if (controls) {
            controls.enabled = cameraMode === CAMERA_MODES.ORBITAL;
        }

        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                cameraTrack,
                camera,
                debugControls?.state.currentTime ?? 0
            );
        }

        camera.position.copy(orbitalCameraState.position);
        controls.target.copy(orbitalCameraState.target);
        controls.update();
    }

    function toggleCameraMode() {
        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                cameraTrack,
                camera,
                0
            );

            return;
        }

        controls?.reset();
    }

    function resetCamera() {
        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                cameraTrack,
                camera,
                0
            );

            return;
        }

        controls.reset();

        orbitalCameraState.position.copy(camera.position);
        orbitalCameraState.target.copy(controls.target);
    }

    debugControls = animationSettings.debugMode
        ? createDebugControls(animationSettings, {
            getCameraMode() {
                return cameraMode
            },
            onToggleCameraMode: toggleCameraMode,
            onResetCamera: resetCamera
        })
        : null;

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
            updateCameraTrack(
                mountElement,
                cameraTrack,
                camera,
                currentTime
            );
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

        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                cameraTrack,
                camera,
                currentTime
            );
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

        if (controls && cameraMode === CAMERA_MODES.ORBITAL) {
            controls.update();
        }

        if (debugLineTooltip) {
            debugLineTooltip.update();
        }

        renderer.render(scene, camera);

    }

    function handleResize() {
        return responsiveResize(
            mountElement,
            [camera, pathLayoutCamera],
            renderer        );
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

        if (debugSegmentHighlight) {
            debugSegmentHighlight.destroy();
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

function createRenderedArrowPath({ scene, pathLayoutCamera, mountElement, arrowMaterial, animationSettings, arrowPath }) {
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

    let label;

    if (animationSettings.debugMode) {

        const labelText = createArrowDebugLabelText(positionedArrowPath);
        label = createArrowNameLabel(labelText, segments[0]);

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

function renderArrowPaths({ scene, pathLayoutCamera, mountElement, arrowMaterial, animationSettings, previousRenderedArrowItems, arrowPaths }) {
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

function formatVectorValues(values) {
    return values.map((value) => {
        return Number(value).toFixed(3);
    }).join(', ');
}

function createArrowDebugLabelText(arrowPath) {
    return [
        arrowPath.name,
        `(${formatVectorValues(arrowPath.origin)})`
    ].join('    ');
}