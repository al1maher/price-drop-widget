const esbuild = require('esbuild');

const sharedConfig = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    minify: true,
    target: ['es2020'],
    sourcemap: true,
};

Promise.all([
    // ESM build
    esbuild.build({
        ...sharedConfig,
        format: 'esm',
        outfile: 'dist/price-drop-widget.esm.js',
    }),
    // UMD/IIFE build for browser script tag
    esbuild.build({
        ...sharedConfig,
        format: 'iife',
        globalName: 'PriceDropWidget',
        outfile: 'dist/price-drop-widget.min.js',
    }),
]).then(() => {
    console.log('Build complete');
}).catch(() => process.exit(1));
