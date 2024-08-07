import * as vscode from 'vscode';
import * as smidrawer from 'smiles-drawer';
import * as jsdom from 'jsdom';
import * as canvas from 'canvas';

const cache = new Map<string, string>();
var logged_canvas_not_found = false;

function measureText(text: string, fontSize: number, fontFamily: string, lineHeight: number = 0.9) {
    // console.log("overridden measureText");
    
    let temp_element = null;
    try {
        temp_element = canvas.createCanvas(300, 150); // default size from chromium
    }
    catch (e) {
        // we want to log this only once
        if (!logged_canvas_not_found) {
            console.log("canvas not found: disable bounding box, could lead to cut off atoms");
            logged_canvas_not_found = true;
        }
    }
    if (!temp_element) {
        return null;
    }
    const element = temp_element;
    const ctx = element.getContext("2d");
    ctx.font = `${fontSize}pt ${fontFamily}`;
    let textMetrics = ctx.measureText(text);

    let compWidth = Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
    return {
        'width': textMetrics.width > compWidth ? textMetrics.width : compWidth,
        'height': (Math.abs(textMetrics.actualBoundingBoxAscent) + Math.abs(textMetrics.actualBoundingBoxAscent)) * lineHeight
    };
    }

export function activate(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerHoverProvider('python', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position, /"[^"]*"|'[^']*'/);
            if (range) {
                const smiles = document.getText(range).slice(1, -1);
                if (/^[A-Za-z0-9@+\-\[\]\(\)=#$]{1,}$/.test(smiles)) {
                    if (cache.has(smiles)) {
                        // console.log("cache hit");
                        const imageUri = cache.get(smiles);
                        return new vscode.Hover(new vscode.MarkdownString(`![structure](${imageUri})`));
                    }

                    return new Promise<vscode.Hover | null>((resolve) => {

                        // works
                        // vscode setting to enable/disable kekule

                        const kekule: boolean = vscode.workspace.getConfiguration('viewsmiles').get('kekule', false);
                        // console.log("kekule?", kekule);
                        
                        let parseTree = null;

                        if (kekule) {
                            resolve(new vscode.Hover(new vscode.MarkdownString("Kekule is not implemented yet")));
                        } else {
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
                        }

                        if (parseTree === null) {
                            throw new Error("parseTree is null");
                        }
                        console.log(smiles, "parsed");
                        // console.log(parseTree);

                        global.document = new jsdom.JSDOM().window.document;

                        // create a new drawer
                        const opts = { width: 200, height: 200 };
                        const drawer = new smidrawer.SvgDrawer(opts, true);

                        // get the current theme
                        const vsCodeTheme = vscode.window.activeColorTheme.kind;
                        // if 1 or 4, it's light theme
                        // if 2 or 3, it's dark theme
                        const theme = vsCodeTheme === 1 || vsCodeTheme === 4 ? 'light' : 'dark';

                        // console.log("theme", theme);

                        smidrawer.SvgWrapper.measureText = measureText;

                        const svg: SVGElement = drawer.draw(parseTree, "svg", theme, null, false);

                        // so we don't need to scroll to see the whole image
                        svg.style.maxWidth = '100%';
                        svg.style.maxHeight = '100%';

                        // convert the svg element to a data uri
                        const imageUri = `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`;
                        // console.log(imageUri);
                        cache.set(smiles, imageUri);

                        const markdownString = new vscode.MarkdownString(`![structure](${imageUri})`);
                        markdownString.isTrusted = true;

                        // return the hover
                        resolve(new vscode.Hover(markdownString));



                    });
                }
            }
            return null;
        }
    });

    context.subscriptions.push(provider);
}

export function deactivate() { }
