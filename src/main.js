import { createArrowCloudScene } from "./createArrowCloudScene.js";

const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

createArrowCloudScene(mountElement);