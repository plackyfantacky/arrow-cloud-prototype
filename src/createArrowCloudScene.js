import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { animationSettings, arrowPaths, cameraTrack } from "./arrows/arrowData.js";
import { arrowFieldSettings } from "./arrows/arrowFieldSettings.js";
import { createArrowPathSegments } from "./arrows/createArrowPaths.js";
import { createArrow, setArrowReveal, updateArrowReveal } from "./arrows/createArrow.js";
import { createArrowRenderPieces } from "./arrows/createArrowRenderPieces.js";
import { createDebugControls } from "./debug/createDebugControls.js";
import { createArrowNameLabel } from './debug/createArrowNameLabel.js';
import { createArrowPathComponents, setPathComponentReveal } from "./arrows/createArrowPathComponents.js";
import { createPathComponentMesh } from "./arrows/pathComponents/index.js";
import { positionArrowPathForViewport } from "./positionArrowPathForViewport.js";
import { getStageSize } from "./stage.js";
import { getResponsiveCameraDistance, getCameraTrackState } from "./camera.js";

export function createArrowCloudScene(mountElement) {
    if (!mountElement) {
        throw new Error('createArrowCloudScene requires a mount element.');
    }

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
    
    const pathComponentMeshes = [];
    
    const arrows = arrowPaths.map((arrowPath) => {
        const positionedArrowPath = positionArrowPathForViewport(
            arrowPath,
            camera,
            mountElement
        );
    
        const segments = createArrowPathSegments(positionedArrowPath);
        const pieces = createArrowRenderPieces(segments, arrowFieldSettings);
        const arrow = createArrow(pieces, arrowMaterial, arrowFieldSettings);
        const components = createArrowPathComponents(positionedArrowPath, segments);
    
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
            pathComponentMeshes.push(componentMesh);
        });
    
        scene.add(arrow);
    
        if (animationSettings.debugMode) {
            const label = createArrowNameLabel(positionedArrowPath.name, segments[0]);
            scene.add(label);        
        }
    
        setArrowReveal(arrow, 0);
    
        return arrow;
    });
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(4, 6, 8);
    scene.add(directionalLight);
    
    if (animationSettings.debugMode) {
        const gridHelper = new THREE.GridHelper(14, 14);
        scene.add(gridHelper);
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
            : rawCurrentTime
        
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
    
        renderer.render(scene, camera);
    
    }
    
    function handleResize() {
        const stageSize = getStageSize(mountElement);
    
        camera.aspect = stageSize.width / stageSize.height;
        camera.updateProjectionMatrix();
    
        renderer.setSize(stageSize.width, stageSize.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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