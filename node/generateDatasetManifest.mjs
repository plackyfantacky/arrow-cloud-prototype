import { readdir, mkdir, readFile, writeFile, watch } from "node:fs/promises";
import { dirname } from "node:path";

const dataDirectory = "src/data";
const manifestPath = "src/generated/datasets.json";

async function generateManifest() {
    const files = await readdir(dataDirectory);

    const datasetNames = files
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => fileName.slice(0, -5))
        .sort();

    const contents = JSON.stringify(datasetNames, null, 4) + "\n";

    await mkdir(dirname(manifestPath), { recursive: true });

    const previousContents = await readFile(manifestPath, "utf8").catch((error) => {
        if (error.code === "ENOENT") {
            return null;
        }

        throw error;
    });

    if (previousContents === contents) {
        return;
    }

    await writeFile(manifestPath, contents);

    console.log(`Updated dataset manifest: ${datasetNames.length} datasets`);
}

await generateManifest();

if (process.argv.includes("--watch")) {
    console.log(`Watching ${dataDirectory} for dataset changes`);

    for await (const event of watch(dataDirectory)) {
        if (event.filename && !event.filename.endsWith(".json")) {
            continue;
        }

        try {
            await generateManifest();
        } catch (error) {
            console.error("Failed to update dataset manifest:", error);
        }
    }
}
