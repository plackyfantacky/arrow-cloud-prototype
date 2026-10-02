import { createArrowCloudScene } from "./createArrowCloudScene.js";
import { loadArrowDataset } from "./loadArrowDataset.js";

async function initialise() {

    const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

    const dataset = await loadArrowDataset('demo');

    createArrowCloudScene(
        mountElement, {
            dataset
    });
}

initialise();