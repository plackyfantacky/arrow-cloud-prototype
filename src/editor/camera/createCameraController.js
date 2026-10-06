import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { updateCameraTrack } from "../../camera.js";
import { createFlyControls } from './createFlyControls.js';
import { createCameraTargetMarker } from './createCameraTargetMarker.js';
import { createCameraUpMarker } from './createCameraUpMarker.js';

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

export function createCameraController({
    camera,
    renderer,
    mountElement,
    scene,
    getCameraTrack
}) {

    let cameraMode = CAMERA_MODES.ORBITAL;
    let currentViewPreset = null;

    let isApplyingViewPreset = false;
    let onViewPresetChange = () => { };

    let orbitControls = createOrbitControls();

    const cameraPivot = new THREE.Vector3(0, 0, 0);
    const cameraDirection = new THREE.Vector3();
    const cameraUp = new THREE.Vector3();

    let orbitDistance = camera.position.distanceTo(orbitControls.target);

    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.target.copy(cameraPivot);
    orbitControls.enabled = true;
    orbitControls.update();
    orbitControls.saveState();

    const initialCameraPosition = camera.position.clone();
    const initialCameraQuaternion = camera.quaternion.clone();
    const initialCameraUp = camera.up.clone();
    const initialOrbitTarget = orbitControls.target.clone();

    const flyControls = createFlyControls(camera, renderer.domElement);

    flyControls.enabled = false;

    let cameraTargetDistance = camera.position.distanceTo(orbitControls.target);

    const cameraTargetMarker = createCameraTargetMarker(scene);
    const cameraUpMarker = createCameraUpMarker(scene);

    cameraTargetMarker.setPosition(orbitControls.target);
    cameraUpMarker.setPosition(orbitControls.target);

    const targetRaycaster = new THREE.Raycaster();
    const targetDirections = {
        positiveX: new THREE.Vector3(1, 0, 0),
        negativeX: new THREE.Vector3(-1, 0, 0),
        positiveY: new THREE.Vector3(0, 1, 0),
        negativeY: new THREE.Vector3(0, -1, 0),
        positiveZ: new THREE.Vector3(0, 0, 1),
        negativeZ: new THREE.Vector3(0, 0, -1)
    };

    //helper functions

    function createOrbitControls() {
        const controls = new OrbitControls(camera, renderer.domElement);

        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enabled = cameraMode === CAMERA_MODES.ORBITAL;

        controls.addEventListener('change', handleOrbitChange);

        return controls;
    }

    function rebuildOrbitControls(target) {
        orbitControls.removeEventListener('change', handleOrbitChange);
        orbitControls.dispose();

        orbitControls = createOrbitControls();

        orbitControls.target.copy(target);
        cameraPivot.copy(target);

        orbitControls.update();
    }

    function handleOrbitChange() {
        cameraPivot.copy(orbitControls.target);

        if (cameraMode === CAMERA_MODES.ORBITAL && !isApplyingViewPreset) {
            clearViewPreset();
        }
    }

    function updateCameraTargetIntersections() {
        const intersectables = getCameraTargetIntersectables();

        const originalMaterialSides = new Map();

        intersectables.forEach((object) => {
            const materials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            materials.forEach((material) => {
                if (!material) {
                    return;
                }

                originalMaterialSides.set(
                    material,
                    material.side
                );

                material.side = THREE.DoubleSide;
            });
        });

        Object.entries(targetDirections).forEach(
            ([armName, direction]) => {
                targetRaycaster.set(
                    orbitControls.target,
                    direction
                );

                targetRaycaster.far = 0.25;

                const intersections = targetRaycaster.intersectObjects(
                    intersectables,
                    false
                );

                cameraTargetMarker.setArmIntersecting(
                    armName,
                    intersections.length > 0
                );
            }
        );
    }

    function getCameraTargetIntersectables() {
        const intersectables = [];

        scene.traverse((object) => {
            if (!object.isMesh || !object.visible) {
                return;
            }

            let currentObject = object;

            while (currentObject) {
                if (currentObject.userData.editorHelper) {
                    return;
                }

                if (currentObject.userData.cameraTargetCollision === false) {
                    return;
                }

                currentObject = currentObject.parent;
            }

            intersectables.push(object);
        });

        return intersectables;
    }

    function clearViewPreset() {
        if (!currentViewPreset) {
            return;
        }

        currentViewPreset = null;
        onViewPresetChange();
    }

    //exported functions

    function getMode() {
        return cameraMode;
    }

    function setMode(nextCameraMode) {
        if (cameraMode === nextCameraMode) {
            return;
        }

        const previousCameraMode = cameraMode;

        if (previousCameraMode === CAMERA_MODES.ORBITAL) {
            orbitDistance = camera.position.distanceTo(orbitControls.target);
        }

        cameraMode = nextCameraMode;

        if (cameraMode !== CAMERA_MODES.ORBITAL) {
            clearViewPreset();
        }

        orbitControls.enabled = cameraMode === CAMERA_MODES.ORBITAL;
        flyControls.enabled = cameraMode === CAMERA_MODES.FLY;

        if (cameraMode === CAMERA_MODES.ORBITAL && previousCameraMode === CAMERA_MODES.FLY) {
            camera.getWorldDirection(cameraDirection);

            cameraUp
                .set(0, 1, 0)
                .applyQuaternion(camera.quaternion)
                .normalize();

            camera.up.copy(cameraUp);

            const target = camera.position
                .clone()
                .addScaledVector(
                    cameraDirection,
                    orbitDistance
                );
            
            rebuildOrbitControls(target);
        }
    }

    function setViewPreset(presetName, distanceOverride = null) {
        const preset = VIEW_PRESETS[presetName];

        if (!preset) {
            return;
        }

        setMode(CAMERA_MODES.ORBITAL);

        const target = orbitControls.target.clone();

        const currentDistance = camera.position.distanceTo(target);
        const distance = Math.max(distanceOverride ?? currentDistance, 1);
        const direction = new THREE.Vector3(...preset).normalize();

        isApplyingViewPreset = true;

        camera.up.set(0, 1, 0);

        camera.position
            .copy(target)
            .addScaledVector(
                direction,
                distance
            );

        camera.lookAt(target);

        rebuildOrbitControls(target);

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

    function setTargetMarkerVisible(isVisible) {
        cameraTargetMarker.setVisible(isVisible);
    }

    function setUpMarkerVisible(isVisible) {
        cameraUpMarker.setVisible(isVisible);
    }

    function reset() {
        cameraMode = CAMERA_MODES.ORBITAL;
        flyControls.enabled = false;

        camera.position.copy(initialCameraPosition);
        camera.quaternion.copy(initialCameraQuaternion);
        camera.up.copy(initialCameraUp);

        rebuildOrbitControls(initialOrbitTarget);
        orbitControls.enabled = true;
        orbitDistance = camera.position.distanceTo(initialOrbitTarget);
        cameraTargetDistance = orbitDistance;

        clearViewPreset();
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

        const json = JSON.stringify(output, null, 4);

        navigator.clipboard.writeText(json)
            .then(() => {
                console.log('Copied static camera:');
                console.log(json);
            })
            .catch((error) => {
                console.warn('Could not copy static camera.');
                console.log(json);
                console.error(error);
            });
    }

    function update(deltaTime, currentTime) {
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
            flyControls.update(deltaTime);

            camera.getWorldDirection(cameraDirection);

            orbitControls.target
                .copy(camera.position)
                .addScaledVector(
                    cameraDirection,
                    cameraTargetDistance
                );
        } else {
            orbitControls.update();

            cameraTargetDistance = camera.position.distanceTo(
                orbitControls.target
            );
        }

        cameraTargetMarker.setPosition(
            orbitControls.target
        );

        cameraUp
            .set(0, 1, 0)
            .applyQuaternion(camera.quaternion)
            .normalize();

        cameraUpMarker.setPosition(orbitControls.target);
        cameraUpMarker.setDirection(cameraUp);

        updateCameraTargetIntersections();
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
        setTargetMarkerVisible,
        setUpMarkerVisible,
        reset,
        update,
        copy,
        destroy
    };
}