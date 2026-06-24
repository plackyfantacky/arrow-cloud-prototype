import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/Addons.js";

import { arrowPaths } from "./arrows/arrowData.js";
import { createArrowPathSegments } from "./arrows/createArrowPaths.js";
import { createArrow, setArrowReveal } from "./arrows/createArrow.js";
import { createArrowRenderPieces } from "./arrows/createArrowRenderPieces.js";

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
    const pieces = createArrowRenderPieces(segments, {
        cornerRadius: 0.35,
        cornerSteps: 14,
        cornerOverlap: 0.04,
    });

    const arrow = createArrow(pieces, arrowMaterial);

    arrow.userData.name = arrowPath.name;
    arrow.userData.timing = {
        delay: arrowPath.timing?.delay || 0,
        duration: arrowPath.timing?.duration || 5,
    };

    scene.add(arrow);
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

    const elapsedTime = timer.getElapsed();

    arrows.forEach((arrow) => {
        const delay = arrow.userData.timing.delay;
        const duration = arrow.userData.timing.duration;
        
        const revealProgress = THREE.MathUtils.clamp(
            (elapsedTime - delay) / duration,
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

animate();