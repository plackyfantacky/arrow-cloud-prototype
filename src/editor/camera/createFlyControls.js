import * as THREE from 'three';

export function createFlyControls(camera, domElement) {
    const pressedKeys = new Set();

    const localForward = new THREE.Vector3(0, 0, -1);
    const localRight = new THREE.Vector3(1, 0, 0);
    const localUp = new THREE.Vector3(0, 1, 0);

    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    const rotation = new THREE.Quaternion();

    const controls = {
        enabled: false,
        moveSpeed: 5,
        rollSpeed: THREE.MathUtils.degToRad(75),
        lookSpeed: 0.002,

        update(deltaTime) {
            if (!controls.enabled) {
                return;
            }

            const moveDistance =
                controls.moveSpeed * deltaTime;

            const rollDistance =
                controls.rollSpeed * deltaTime;

            forward
                .copy(localForward)
                .applyQuaternion(camera.quaternion);

            right
                .copy(localRight)
                .applyQuaternion(camera.quaternion);

            up
                .copy(localUp)
                .applyQuaternion(camera.quaternion);

            if (pressedKeys.has('KeyW')) {
                camera.position.addScaledVector(
                    forward,
                    moveDistance
                );
            }

            if (pressedKeys.has('KeyS')) {
                camera.position.addScaledVector(
                    forward,
                    -moveDistance
                );
            }

            if (pressedKeys.has('KeyA')) {
                camera.position.addScaledVector(
                    right,
                    -moveDistance
                );
            }

            if (pressedKeys.has('KeyD')) {
                camera.position.addScaledVector(
                    right,
                    moveDistance
                );
            }

            if (pressedKeys.has('Space')) {
                camera.position.addScaledVector(
                    up,
                    moveDistance
                );
            }

            if (
                pressedKeys.has('ShiftLeft') ||
                pressedKeys.has('ShiftRight')
            ) {
                camera.position.addScaledVector(
                    up,
                    -moveDistance
                );
            }

            if (pressedKeys.has('KeyQ')) {
                rotation.setFromAxisAngle(
                    localForward,
                    -rollDistance
                );

                camera.quaternion.multiply(rotation);
            }

            if (pressedKeys.has('KeyE')) {
                rotation.setFromAxisAngle(
                    localForward,
                    rollDistance
                );

                camera.quaternion.multiply(rotation);
            }

            camera.quaternion.normalize();
        },

        dispose() {
            controls.enabled = false;

            document.removeEventListener(
                'pointerlockchange',
                handlePointerLockChange
            );

            document.removeEventListener(
                'mousemove',
                handleMouseMove
            );

            window.removeEventListener(
                'keydown',
                handleKeyDown
            );

            window.removeEventListener(
                'keyup',
                handleKeyUp
            );

            domElement.removeEventListener(
                'click',
                handleClick
            );
        }
    };

    let isPointerLocked = false;

    function handleClick() {
        if (!controls.enabled) {
            return;
        }

        domElement.requestPointerLock();
    }

    function handlePointerLockChange() {
        isPointerLocked =
            document.pointerLockElement === domElement;

        if (!isPointerLocked) {
            pressedKeys.clear();
        }
    }

    function handleMouseMove(event) {
        if (
            !controls.enabled ||
            !isPointerLocked
        ) {
            return;
        }

        rotation.setFromAxisAngle(
            localUp,
            -event.movementX * controls.lookSpeed
        );

        camera.quaternion.multiply(rotation);

        rotation.setFromAxisAngle(
            localRight,
            -event.movementY * controls.lookSpeed
        );

        camera.quaternion.multiply(rotation);

        camera.quaternion.normalize();
    }

    function handleKeyDown(event) {
        if (!controls.enabled) {
            return;
        }

        pressedKeys.add(event.code);

        if (event.code === 'Space') {
            event.preventDefault();
        }
    }

    function handleKeyUp(event) {
        pressedKeys.delete(event.code);
    }

    domElement.addEventListener(
        'click',
        handleClick
    );

    document.addEventListener(
        'pointerlockchange',
        handlePointerLockChange
    );

    document.addEventListener(
        'mousemove',
        handleMouseMove
    );

    window.addEventListener(
        'keydown',
        handleKeyDown
    );

    window.addEventListener(
        'keyup',
        handleKeyUp
    );

    return controls;
}