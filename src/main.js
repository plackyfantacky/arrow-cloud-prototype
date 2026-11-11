import { createScene } from "./scene/createScene.js";
import { loadArrowDataset } from "./data/loadDataset.js";

async function initialise() {
    const mountElement = document.querySelector("[data-arrow-cloud]") || document.body;

    const searchParams = new URLSearchParams(window.location.search);
    const defaultDatasetName = "flatpack2";

    let datasetName = searchParams.get("dataset") || defaultDatasetName;
    let editorModule = null;

    if (__ARROW_CLOUD_DEV__) {
        const { editorConfig } = await import("./editor/editorConfig.js");

        if (editorConfig.enabled) {
            const stylesheet = document.createElement("link");

            stylesheet.rel = "stylesheet";
            stylesheet.href = new URL(
                "./main.css",
                import.meta.url
            ).href;

            document.head.appendChild(stylesheet);

            const { default: datasetNames } = await import("./generated/datasets.json");

            if (!datasetNames.includes(datasetName)) {
                datasetName = defaultDatasetName;

                const url = new URL(window.location.href);
                url.searchParams.set("dataset", datasetName);
                window.history.replaceState(null, "", url);
            }

            editorModule = await import("./editor/attachArrowCloudEditor.js");
        }
    }

    const dataset = await loadArrowDataset(datasetName);

    const runtime = createScene(mountElement, {
        dataset,
    });

    let editorAttachment = null;

    if (editorModule) {
        const distanceParam = searchParams.get("distance");
        const cameraDistance = distanceParam === null ? null : Number(distanceParam);

        editorAttachment = editorModule.attachArrowCloudEditor(runtime, {
            cameraView: searchParams.get("view"),
            cameraDistance: Number.isFinite(cameraDistance) ? cameraDistance : null,
            cameraTarget: dataset.staticCamera?.target,

            onDatasetChange(nextDatasetName) {
                const url = new URL(window.location.href);

                url.searchParams.set("dataset", nextDatasetName);
                window.location.assign(url);
            },
        });
    }

    window.addEventListener(
        "pagehide",
        () => {
            editorAttachment?.destroy();
            runtime.destroy();
        },
        { once: true },
    );
}

initialise();
