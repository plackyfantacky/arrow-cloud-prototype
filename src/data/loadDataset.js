export async function loadArrowDataset(datasetName) {
    const response = await fetch(
        `./src/data/${datasetName}.json`
    );

    if (!response.ok) {
        throw new Error(
            `Could not load dataset: ${datasetName}` 
        );
    }

    return response.json();
}