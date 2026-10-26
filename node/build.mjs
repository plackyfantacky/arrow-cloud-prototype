import { writeFile } from 'node:fs/promises';
import { analyzeMetafile, build, context } from 'esbuild';
import { getBuildInfo } from './getBuildInfo.mjs';

const configurations = {
    production: {
        entryPoints: ['src/main.js'],
        outfile: 'dist/main.js',
        bundle: true,
        minify: true,
        metafile: true,
    },
    labs: {
        entryPoints: ['src/main.labs.js'],
        outfile: 'dist/main.labs.js',
        bundle: true,
        sourcemap: true,
        loader: {
            '.html': 'text',
        },
    },
    runtime: {
        entryPoints: ['src/createArrowCloudRuntime.js'],
        outfile: 'dist/arrow-cloud-runtime.js',
        bundle: true,
        format: 'esm',
        minify: true,
    },
    'labs-runtime': {
        entryPoints: ['src/createArrowCloudLabsRuntime.js'],
        outfile: 'dist/arrow-cloud-labs-runtime.js',
        bundle: true,
        format: 'esm',
        sourcemap: true,
        loader: {
            '.html': 'text',
        },
    },
};

const target = process.argv[2];
const watch = process.argv.includes('--watch');

if (!Object.hasOwn(configurations, target)) {
    throw new Error(`Unknown build target: ${target}`);
}

const buildInfo = getBuildInfo();

const options = {
    ...configurations[target],
    define: {
        __ARROW_CLOUD_BUILD__: JSON.stringify(buildInfo),
    },
};

if (watch) {
    const buildContext = await context(options);

    await buildContext.watch();
} else {
    const result = await build(options);

    if (target === 'production') {
        await writeFile('dist/main.meta.json', JSON.stringify(result.metafile));

        const analysis = await analyzeMetafile(result.metafile, {
            verbose: true,
        });

        console.log(analysis);
    }
}

console.log(`Arrow Cloud ${buildInfo.identifier} (${buildInfo.branch})`);