import { createArrowCloudScene } from "./createArrowCloudScene.js";
import { attachArrowCloudEditor } from "./editor/attachArrowCloudEditor.js";

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

    const runtime = createArrowCloudScene(mountElement, {
        dataset,
    });

    const editorAttachment = attachArrowCloudEditor(runtime, {
        cameraView,
        cameraDistance,
        cameraTarget: dataset.staticCamera?.target,

        onDatasetChange(nextDatasetName) {
            const url = new URL(window.location.href);

            url.searchParams.set("dataset", nextDatasetName);
            window.location.assign(url);
        },
    });

    window.addEventListener("pagehide", () => {
        editorAttachment.destroy();
        runtime.destroy();
    }, { once: true });
}

initialise();
