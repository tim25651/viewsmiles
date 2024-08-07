import * as vscode from 'vscode';
import * as smidrawer from 'smiles-drawer';

async function importSvgDom() {
    const svgdom = await import('svgdom');
    console.log("svgdom imported;");
    return svgdom;
}

export function activate(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerHoverProvider('python', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position, /"[^"]*"|'[^']*'/);
            if (range) {
                const smiles = document.getText(range).slice(1, -1);
                if (/^[A-Za-z0-9@+\-\[\]\(\)=#$]{1,}$/.test(smiles)) {
                    return new Promise<vscode.Hover | null>((resolve) => {
                        

                        let parseTree = null;
                            try {
                                parseTree = smidrawer.Parser.parse(smiles, {});
                            }
                            catch (e) { 
                                // invalid smiles
                                // do not log as it will be too noisy
                                // maybe environment variable to enable logging?
                                    }
                            if (parseTree === null) {
                                resolve(null);
                                return;
                            }
                            
                            console.log(parseTree);

                            importSvgDom().then((svgdom) => {

                                // set the SVG document to be used by the drawer
                                global.document = svgdom.createSVGDocument();

                                // create a new drawer
                                const opts = {width: 200, height: 200};
                                const drawer = new smidrawer.SvgDrawer(opts, true);
                                
                                // get the current theme
                                const vsCodeTheme = vscode.window.activeColorTheme.kind;
                                // if 1 or 4, it's light theme
                                // if 2 or 3, it's dark theme
                                const theme = vsCodeTheme === 1 || vsCodeTheme === 4 ? 'light' : 'dark';

                                // draw the molecule from the parse tree
                                const svg: SVGElement = drawer.draw(parseTree, "svg", theme, null, false);

                                // so we don't need to scroll to see the whole image
                                svg.style.maxWidth = '100%';
                                svg.style.maxHeight = '100%';

                                // convert the svg element to a data uri
                                const imageUri = `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`;
                                console.log(imageUri);
                                const markdownString = new vscode.MarkdownString(`![structure](${imageUri})`);
                                markdownString.isTrusted = true;

                                // return the hover
                                resolve(new vscode.Hover(markdownString));
                            });
                            
                        
                    });
                }
            }
            return null;
        }
    });

    context.subscriptions.push(provider);
}

export function deactivate() {}
