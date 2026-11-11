import { rm, writeFile } from 'node:fs/promises';
import { analyzeMetafile, build, context } from 'esbuild';
import { getBuildInfo } from './getBuildInfo.mjs';

const target = process.argv[2];
const watch = process.argv.includes('--watch');

if (!["development","production"].includes(target)) {
    throw new Error(`Unknown build target: ${target}`);
}

const isDevelopment = target === "development";
const buildInfo = getBuildInfo();

const options = {
    entryPoints: ["src/main.js"],
    outfile: "dist/main.js",
    bundle: true,
    format: "esm",
    minify: !isDevelopment,
    sourcemap: isDevelopment,
    metafile: true,
    logLevel: 'info',
    ...(isDevelopment ? {
        loader: {
            ".html": "text"
        }
    } : {}),
    define: {
        __ARROW_CLOUD_BUILD__: JSON.stringify(buildInfo),
        __ARROW_CLOUD_DEV__: JSON.stringify(isDevelopment),
    },
};

await rm("dist", {
    recursive: true,
    force: true,
});

if (watch) {
    const buildContext = await context(options);
    await buildContext.watch();
} else {
    const result = await build(options);

    if (!isDevelopment) {
        const editorInputs = Object.keys(result.metafile.inputs).filter(
            (inputPath) => inputPath.replaceAll('\\', '/').includes('src/editor/')
        );

        if (editorInputs.length > 0) {
            throw new Error(
                `Production includes editor modules:\n${editorInputs.join('\n')}`
            );
        }

        console.log('Production check passed: no editor modules included.');

        await writeFile('dist/main.meta.json', JSON.stringify(result.metafile));

        console.log(
            await analyzeMetafile(result.metafile, {
                verbose: true,
            })
        )
    }
}

console.log(`Arrow Cloud ${buildInfo.identifier} (${buildInfo.branch})`);