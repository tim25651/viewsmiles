# viewsmiles

Hello!

## Features

- When hovered over a SMILES string in python code, the extension will display the molecule in a Hover window. Adapts to the current theme.

## Release Notes

### 0.0.1

Initial release of viewsmiles. Doesn't work on other computers than mine. See TODO.

### 0.0.2

First workaround for canvas via try-catch. Still not fully functional. See TODO.
Implemented simple Map cache for SMILES strings.

### 0.0.3

Implement a approximation for the bounding boxes if canvas is not available. Still not fully functional. Canvas works if the vsix is built on the same computer and 
all dependencies are installed. It doesn't work on other computers or via SSH.

**Enjoy!**

## TODO
- Canvas doesn't work on other computers. To fix this everything we needs canvas in smiles-drawer/src/SvgDrawer.js is commented out. But so, the bounding box of text (each non-carbon atom) is not calculated correctly. This can lead to a large padding or little parts cut off (no CCCN -> doesnt show the H-atoms). This is a bug that needs to be fixed. ("canvas": "^2.11.2")
    - Even with workaround of .node packaging (see esbuild.js, commented parts)
- 2nd quick and dirty fix is the commenting of require.resolve which can't find the path anymore after bundling. As it's currently not used, it can be commented out.
- Both fixes are in the xhr_fix.sh and will be run on packaging.
- Add support for more file types. (python is just the one I use)
    - It just needs to calculate what a string is and if it is a SMILES string, then it should display the molecule.
- A real TODO is the calculation of the SVG size. Currently, it's just a fixed size. This should be calculated based on the size of the molecule, better the aspect ratio of the molecule.
- Another one, is converting the SMILES string to kekule if the viewsmiles.kekule setting is true. (Currently, it's always false or ignored, respectively.)
- Salts don't work