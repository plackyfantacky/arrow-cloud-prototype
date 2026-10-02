import { createArrowCloudLabsScene } from "./createArrowCloudLabsScene.js";
import { loadArrowDataset } from "./loadArrowDataset.js";

async function initialise() {

    const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

    const dataset = await loadArrowDataset('labs');
    
    createArrowCloudLabsScene(
        mountElement, {
            dataset,
            animationSettings: {
                debugMode: true
            }
    });

}

initialise();
