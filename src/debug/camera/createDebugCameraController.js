import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { createFlyControls } from './createFlyControls.js';
import { updateCameraTrack } from "../../camera.js";

const CAMERA_MODES = {
    TRACKED: 'tracked',
    ORBITAL: 'orbital',
    FLY: 'fly'
};

const VIEW_PRESETS = {
    front: [0, 0, 1],
    back: [0, 0, -1],
    left: [-1, 0, 0],
    right: [1, 0, 0],
    top: [0, 1, 0.0001],
    bottom: [0, -1, -0.0001]
};

export function createDebugCameraController({
    camera,
    renderer,
    mountElement,
    getCameraTrack
}) {

    let cameraMode = CAMERA_MODES.ORBITAL;
    let currentViewPreset = null;

    let isApplyingViewPreset = false;
    let onViewPresetChange = () => { };

    const orbitControls =
        new OrbitControls(
            camera,
            renderer.domElement
        );

    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.set(0, 0, 0);
    orbitControls.enabled = true;
    orbitControls.update();
    orbitControls.saveState();

    const orbitalCameraState = {
        position: camera.position.clone(),
        target: orbitControls.target.clone()
    };

    const flyControls =
        createFlyControls(
            camera,
            renderer.domElement
        );

    flyControls.enabled = false;

    function getMode() {
        return cameraMode;
    }

    function setMode(nextCameraMode) {
        if (cameraMode === nextCameraMode) {
            return;
        }

        const previousCameraMode = cameraMode;

        if (previousCameraMode === CAMERA_MODES.ORBITAL) {
            orbitalCameraState.position.copy(
                camera.position
            );

            orbitalCameraState.target.copy(
                orbitControls.target
            );
        }

        cameraMode = nextCameraMode;

        if (cameraMode !== CAMERA_MODES.ORBITAL) {
            clearViewPreset();
        }

        orbitControls.enabled =
            cameraMode === CAMERA_MODES.ORBITAL;

        flyControls.enabled =
            cameraMode === CAMERA_MODES.FLY;

        if (cameraMode === CAMERA_MODES.ORBITAL) {
            camera.position.copy(
                orbitalCameraState.position
            );

            orbitControls.target.copy(
                orbitalCameraState.target
            );

            orbitControls.update();
        }
    }

    function setViewPreset(presetName) {
        const preset = VIEW_PRESETS[presetName];

        if (!preset) {
            return;
        }
        
        setMode(CAMERA_MODES.ORBITAL);

        const target = new THREE.Vector3(0, 0, 0);
        const distance = Math.max(camera.position.distanceTo(target), 1);
        
        const direction = new THREE.Vector3(...preset).normalize();
            
        isApplyingViewPreset = true;
        
        camera.up.set(0, 1, 0);
        
        camera.position.copy(
            direction.multiplyScalar(distance)
        );

        orbitControls.target.copy(target);
        camera.lookAt(target);
        orbitControls.update();

        orbitalCameraState.position.copy(camera.position);
        orbitalCameraState.target.copy(orbitControls.target);

        currentViewPreset = presetName;
        isApplyingViewPreset = false;

        onViewPresetChange();
    }

    function getViewPreset() {
        return currentViewPreset;
    }

    function setViewPresetChangeHandler(handler) {
        onViewPresetChange = handler;
    }

    function clearViewPreset() {
        if (!currentViewPreset) {
            return;
        }

        currentViewPreset = null;
        onViewPresetChange();
    }

    function handleOrbitChange() {
        if (
            cameraMode === CAMERA_MODES.ORBITAL &&
            !isApplyingViewPreset
        ) {
            clearViewPreset();
        }
    }

    orbitControls.addEventListener('change', handleOrbitChange);

    function reset() {
        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                getCameraTrack(),
                camera,
                0
            );

            return;
        }

        orbitControls.reset();

        orbitalCameraState.position.copy(camera.position);
        orbitalCameraState.target.copy(orbitControls.target);
    }

    function copy() {
        const output = {
            position: {
                x: Number(camera.position.x.toFixed(3)),
                y: Number(camera.position.y.toFixed(3)),
                z: Number(camera.position.z.toFixed(3))
            },
            quaternion: {
                x: Number(camera.quaternion.x.toFixed(6)),
                y: Number(camera.quaternion.y.toFixed(6)),
                z: Number(camera.quaternion.z.toFixed(6)),
                w: Number(camera.quaternion.w.toFixed(6))
            }
        };

        const json = JSON.stringify(
            output,
            null,
            4
        );

        navigator.clipboard.writeText(json)
            .then(() => {
                console.log(
                    'Copied static camera:'
                );

                console.log(json);
            })
            .catch((error) => {
                console.warn(
                    'Could not copy static camera.'
                );

                console.log(json);
                console.error(error);
            });
    }

    function update(
        deltaTime,
        currentTime
    ) {
        if (cameraMode === CAMERA_MODES.TRACKED) {
            updateCameraTrack(
                mountElement,
                getCameraTrack(),
                camera,
                currentTime
            );

            return;
        }

        if (cameraMode === CAMERA_MODES.FLY) {
            flyControls.update(
                deltaTime
            );

            return;
        }

        orbitControls.update();
    }

    function destroy() {
        orbitControls.removeEventListener('change', handleOrbitChange);
        orbitControls.dispose();
        flyControls.dispose();
    }


    return {
        getMode,
        getViewPreset,
        setMode,
        setViewPreset,
        setViewPresetChangeHandler,
        reset,
        update,
        copy,
        destroy
    };
}