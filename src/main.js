import { createArrowCloudScene } from "./createArrowCloudScene";

const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

createArrowCloudScene(mountElement);