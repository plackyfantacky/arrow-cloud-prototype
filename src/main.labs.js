import { createArrowCloudLabsScene } from "./createArrowCloudLabsScene.js";
import { loadArrowDataset } from "./loadArrowDataset.js";

async function initialise() {

    const mountElement = document.querySelector('[data-arrow-cloud]') || document.body;

    const searchParams = new URLSearchParams(window.location.search);
    
    const datasetName = searchParams.get('dataset') || 'labs';
    const cameraView = searchParams.get('view');

    const cameraDistanceParam = Number(searchParams.get('distance'));
    const cameraDistance = Number.isFinite(cameraDistanceParam) ? cameraDistanceParam : null;

    const dataset = await loadArrowDataset(datasetName);

    createArrowCloudLabsScene(
        mountElement, {
        dataset,
        loadDataset: loadArrowDataset,
        cameraView,
        cameraDistance,
        animationSettings: {
            debugMode: true
        }
    });

}

initialise();
