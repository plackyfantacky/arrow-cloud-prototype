import { createArrowCloudLabsScene } from "./createArrowCloudLabsScene.js";

const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

createArrowCloudLabsScene(mountElement, {
    animationSettings: {
        debugMode: true
    }
});