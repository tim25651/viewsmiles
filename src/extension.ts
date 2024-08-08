import * as vscode from 'vscode';
import * as smidrawer from 'smiles-drawer';
import * as jsdom from 'jsdom';
import * as canvas from 'canvas';

const errorMap = {
    C: {width: 0.1808000000000001, height: 0.23690289887472993},
    O: {width: 0.23197818119832958, height: 0.23739112478715807},
    N: {width: 0.1691683569979717, height: 0.22384151593453921},
    P: {width: 0.14374762447738512, height: 0.22384151593453921},
    S: {width: 0.1004093041828892, height: 0.23690289887472993},
    Si: {width: 0.3495881383855023, height: 0.23690289887472993},
    F: {width: 0.0725401399752986, height: 0.22384151593453921},
    Na: {width: 0.08538949505201736, height: 0.22384151593453921},
    Se: {width: 0.02163834753813594, height: 0.23690289887472993},
    Cl: {width: -0.27070436437989126, height: 0.23690289887472993},
    I: {width: -1.1328284023668636, height: 0.22384151593453921},
    Br: {width: -0.10411076395270463, height: 0.22384151593453921},
    Mg: {width: 0.14068564344633586, height: 0.22384151593453921},
    K: {width: 0.1873015873015874, height: 0.22384151593453921},
    H: {width: 0.1691683569979717, height: 0.22384151593453921}
    }

function getBBox(text: string, fontSize: number, fontFamily: string) {

    function pointsToPixels(points: number) {
        return points * (96 / 72);
    }
    
    function calculateTextWidth(text: string, fontSizeInPt: number, fontFamily: string) {
        const fontSizeInPx = pointsToPixels(fontSizeInPt);
        const avgCharWidth = fontSizeInPx * 0.6; // Approximation
    
        return text.length * avgCharWidth;
    }
    
    let width = calculateTextWidth(text, fontSize, 'Arial');
    let height = pointsToPixels(fontSize); // Font height in pixels
    
    return {
        width: width,
        height: height
    };
}

console.log("viewsmiles version 0.0.3");

const cache = new Map<string, string>();
var logged_canvas_not_found = false;

function measureText(text: string, fontSize: number, fontFamily: string, lineHeight: number = 0.9) {

    //
    const appr = getBBox(text, fontSize, fontFamily);

    let temp_canvas = null;
    try {
        temp_canvas = canvas.createCanvas(300, 150); // default size from chromium
    } catch (e) {
        // console.log("error:", e);
        if (!logged_canvas_not_found) {
            console.log("canvas not found: disable bounding box, could lead to cut off atoms");
            logged_canvas_not_found = true;
        }
    }
    const cvs = temp_canvas;


    let log_data = false;
    if (fontSize !== 11) {
        log_data = true;
        console.log("FONT SIZE IS NOT 11");
    }
    if (!errorMap.hasOwnProperty(text)) {
        log_data = true;
        console.log("NO ERROR DATA FOR TEXT");
    }

    if (cvs === null) {
        // adjust for error
        if (errorMap.hasOwnProperty(text)) {
        // @ts-ignore
        const error = errorMap[text];
        return {
            width: appr.width * (1 + error.width),
            height: appr.height * (1 + error.height)
        };
        }
        if (log_data) {
            console.log("real is null, but no error data for text:", text, "fontSize:", fontSize, "appr:", appr);
        }
        return appr;
    }

    const ctx = cvs.getContext("2d");
    ctx.font = `${fontSize}pt ${fontFamily}`;
    let textMetrics = ctx.measureText(text);

    let compWidth = Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
    
    const real = {
      width: textMetrics.width > compWidth ? textMetrics.width : compWidth,
      height: (Math.abs(textMetrics.actualBoundingBoxAscent) + Math.abs(textMetrics.actualBoundingBoxAscent)) * lineHeight
    };
  
    // width error
    // @ts-ignore
    const width_error = (real.width - appr.width) / real.width;
    // height error
    // @ts-ignore
    const height_error = (real.height - appr.height) / real.height;

    // @ts-ignore
    if (errorMap[text].width !== width_error || errorMap[text].height !== height_error)
    {
        log_data = true;
        console.log("ERROR DATA IS DIFFERENT");
    }

    if (log_data) {
        console.log("fontSize:", fontSize, text + ": {width: " + width_error + ", height: " + height_error + "}, \n", "real:", real, "appr:", appr);
    }
    
    
    return real;

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
                        // const imageUri = `data:image/svg+xml,${encodeURIComponent(svg_)}`;
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
