import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { arrowPaths } from "./arrows/arrowData.js";
import { arrowFieldSettings } from "./arrows/arrowFieldSettings.js";
import { createArrowPathSegments } from "./arrows/createArrowPaths.js";
import { createArrow, setArrowReveal } from "./arrows/createArrow.js";
import { createArrowRenderPieces } from "./arrows/createArrowRenderPieces.js";
import { createDebugControls } from "./debug/createDebugControls.js";
import { createArrowNameLabel } from './debug/createArrowNameLabel.js';

const scene = new THREE.Scene();

scene.background = new THREE.Color(0xFFFFFF);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 5, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0, 0);
controls.update();

const arrowMaterial = new THREE.MeshStandardMaterial({
    color: 0xff9d2a,
    roughness: 0.45,
    metalness: 0.15,
    flatShading: true,
    side: THREE.FrontSide,
});

const arrows = arrowPaths.map((arrowPath) => {
    const segments = createArrowPathSegments(arrowPath);
    const label = createArrowNameLabel(arrowPath.name, segments[0]);
    const pieces = createArrowRenderPieces(segments, arrowFieldSettings);
    const arrow = createArrow(pieces, arrowMaterial, arrowFieldSettings);

    arrow.userData.name = arrowPath.name;
    arrow.userData.timing = {
        delay: arrowPath.timing?.delay || 0,
        duration: arrowPath.timing?.duration || 5,
    };

    scene.add(arrow);
    scene.add(label);
    setArrowReveal(arrow, 0);

    return arrow;
});


const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(4, 6, 8);
scene.add(directionalLight);

const gridHelper = new THREE.GridHelper(14, 14);
scene.add(gridHelper);

const timer = new THREE.Timer();

function animate() {
    timer.update();

    const deltaTime = timer.getDelta();

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

    arrows.forEach((arrow) => {
        const delay = arrow.userData.timing.delay;
        const duration = arrow.userData.timing.duration;

        const revealProgress = THREE.MathUtils.clamp(
            (debugControls.state.currentTime - delay) / duration,
            0, 1
        );

        setArrowReveal(arrow, revealProgress);
    });

    controls.update();

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', handleResize);

//debug controls
const debugControls = createDebugControls({
    timelineDuration: 8,
    speed: 1,
    isPlaying: true,
    isLooping: false,
});



animate();