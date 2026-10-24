import { createArrowCloudLabsScene } from "./createArrowCloudLabsScene.js";
import { loadArrowDataset } from "./loadArrowDataset.js";
import datasetNames from "./generated/datasets.json";

async function initialise() {
    const mountElement = document.querySelector("[data-arrow-cloud]") || document.body;

    const searchParams = new URLSearchParams(window.location.search);

    const requestedDataset = searchParams.get("dataset") || "labs";

    const datasetName = datasetNames.includes(requestedDataset) ? requestedDataset : "labs";

    if (datasetName !== requestedDataset) {
        const url = new URL(window.location.href);

        url.searchParams.set("dataset", datasetName);
        window.history.replaceState(null, "", url);
    }

    const cameraView = searchParams.get("view");

    const cameraDistanceParam = Number(searchParams.get("distance"));
    const cameraDistance = Number.isFinite(cameraDistanceParam) ? cameraDistanceParam : null;

    const dataset = await loadArrowDataset(datasetName);

    createArrowCloudLabsScene(mountElement, {
        dataset,
        loadDataset: loadArrowDataset,
        cameraView,
        cameraDistance,
        animationSettings: {
            debugMode: true,
        },
    });
}

initialise();
