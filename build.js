const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  platform: 'node',
  target: 'node16',
  sourcemap: true, // Optional: include source maps
  external: ['vscode', 'smiles-drawer', 'svgdom'], // Treat 'vscode' as an external module
}).catch(() => process.exit(1));