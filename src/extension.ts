import * as vscode from 'vscode';
import * as smidrawer from 'smiles-drawer';
import * as jsdom from 'jsdom';
const NodeCache = require('node-cache');

console.log("viewsmiles version 0.0.5");

// debugTooLong: if true, we mark too long strings, but could lead to hover spam (e. g, large multiline strings)
const debugTooLong = false;

// stdTimeToLive: how long is a VScode session? (1h)
// checkPeriod: how often to check for expired items (1h)
const smilesCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 60 * 60, maxKeys: 1000 });
const lspCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 60 * 60, maxKeys: 1000 });

async function getHover(document: vscode.TextDocument, position: vscode.Position): Promise<string | null> {

    // while the promise is pending, we fill the cache, thus no other calls are made for the same position
    lspCache.set(`${position.line}:${position.character}`, { time: Date.now(), hover: null });

    const hoverInfo = await vscode.commands.executeCommand<vscode.Hover[]>('vscode.executeHoverProvider', document.uri, position);

    // if there is no hover info, return null
    if (!hoverInfo || hoverInfo.length === 0) {
        return null;
    }

    // Extract and concatenate hover contents
    const hoverText = hoverInfo
        .map(hover => hover.contents.map(content => (typeof content === 'string' ? content : content.value)).join('\n'))
        .join('\n');

    // regex filter: Literal['...']
    const regex = /Literal\['(.*?)'\]/g;
    const matches = hoverText.match(regex);

    let match: string | null = null;

    if (matches) {
        // return the first match
        match = matches[0];
        // unescape double backslashes
        match = match.replace(/\\\\/g, '\\');
    }

    return match;
}

function measureText(text: string, fontSize: number, fontFamily: string, lineHeight: number = 0.9) {

    const errorFactor = errorMap.get(text) || { width: 1, height: 1 };
    const appr = {
        width: text.length * fontSize * 0.6 * (96 / 72),
        height: fontSize * (96 / 72)
    };
    const adjusted = {
        width: appr.width * (1 + errorFactor.width),
        height: appr.height * (1 + errorFactor.height)
    };

    // 1. case if the font size is not 11 (because our error ad<justment is based on 11pt font size)
    // 2. case if the text (the element) is not yet in the errorMap
    if (!errorMap.has(text) || fontSize !== 11) {
        console.log("canvas is disabled, using approximation, but we got some errors!");
        console.log("text:", text, "fontSize:", fontSize, "appr:", appr, "errorFactor:", errorMap.get(text));
    }

    return adjusted;
}

function imageToHover(imageUri: string): vscode.Hover {
    const markdownString = new vscode.MarkdownString(`![structure](${imageUri})`);
    markdownString.isTrusted = true;
    return new vscode.Hover(markdownString);
}

async function hoverSmiles(smilesPromise: Promise<string | null>): Promise<vscode.Hover | null> {
    const smiles = await smilesPromise;

    return new Promise<vscode.Hover | null>((resolve) => {
        // console.log("hoverSmiles", smiles);
        if (!smiles) {
            return resolve(null);
        }

        if (!/^[A-Za-z0-9@+\-\[\]\(\)=#$\\\/.…]{1,}$/.test(smiles)) {
            // F\C=C\F will be filtered out but it should be valid
            // console.log("filtered out", smiles);
            return resolve(null);
        }

        // if the smiles is too long, we skip it and mark it as too long when debugTooLong is enabled
        if (smiles.endsWith("…") && debugTooLong) {
            resolve(new vscode.Hover("String too long to parse"));
        }

        if (smilesCache.has(smiles)) {
            const imageUri = smilesCache.get(smiles);
            if (!imageUri) {
                throw new Error("smiles cache hit but no imageUri");
            }
            return resolve(imageToHover(imageUri));
        }

        let parseTree = null;

        try {
            parseTree = smidrawer.Parser.parse(smiles, {});
        }
        catch (e) {
            // console.log("invalid smiles", smiles);
            // invalid smiles
            // do not log as it will be too noisy
            // maybe environment variable to enable logging?
        }
        if (parseTree === null) {
            resolve(null);
            return;
        }


        global.document = new jsdom.JSDOM().window.document;

        // create a new drawer
        const opts = { width: 200, height: 200, compactDrawing: false };
        const drawer = new smidrawer.SvgDrawer(opts, true);

        // get the current theme
        const vsCodeTheme = vscode.window.activeColorTheme.kind;
        // if 1 or 4, it's light theme
        // if 2 or 3, it's dark theme
        const theme = vsCodeTheme === 1 || vsCodeTheme === 4 ? 'light' : 'dark';

        // console.log("theme", theme);

        smidrawer.SvgWrapper.measureText = measureText;

        const svg: SVGElement = drawer.draw(parseTree, "svg", theme);
        // so we don't need to scroll to see the whole image
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';

        // convert the svg element to a data uri
        const imageUri = `data:image/svg+xml,${encodeURIComponent(svg.outerHTML)}`;
        smilesCache.set(smiles, imageUri);
        // return the hover
        return resolve(imageToHover(imageUri));
    });
}

async function getSmiles(document: vscode.TextDocument, position: vscode.Position, currHoverPromise: Promise<string | null> | string | null): Promise<string | null> {
    // await with timeout

    if (typeof currHoverPromise === 'string') {
        return currHoverPromise;
    }

    const currHover = await currHoverPromise;

    lspCache.set(`${position.line}:${position.character}`, { time: Date.now(), hover: currHover });

    if (!currHover) {
        const range = document.getWordRangeAtPosition(position, /"[^"]*"|'[^']*'/);
        // if len over 140 we skip it
        if (range === undefined || range.end.character - range.start.character > 140) {
            return "…"; // marks as too long
        }
        return document.getText(range).slice(1, -1);
    }

    // remove Literal[' and '] from the hover
    return currHover.slice(9, -2);
}


export function activate(context: vscode.ExtensionContext) {

    const provider = vscode.languages.registerHoverProvider('python', {
        provideHover(document, position, token) {
            // mark hover checks with timestamps to not spam calls to Language Server Protocol
            const last = lspCache.get(`${position.line}:${position.character}`) || { time: 0, hover: null };

            // time difference is less than 1sec
            if (Date.now() - last.time < 1000) {
                const smilesPromise = getSmiles(document, position, last.hover);
                return hoverSmiles(smilesPromise);
            }

            // const hoverPromise = null;
            const hoverPromise = getHover(document, position);
            const smilesPromise = getSmiles(document, position, hoverPromise);
            return hoverSmiles(smilesPromise);
        }
    });

    context.subscriptions.push(provider);
}

export function deactivate() { }

// assets
// maybe we should move this to a separate file
const errorMap = new Map<string, { width: number, height: number }>([
    ["C", { width: 0.1808000000000001, height: 0.23690289887472993 }],
    ["O", { width: 0.23197818119832958, height: 0.23739112478715807 }],
    ["N", { width: 0.1691683569979717, height: 0.22384151593453921 }],
    ["P", { width: 0.14374762447738512, height: 0.22384151593453921 }],
    ["S", { width: 0.1004093041828892, height: 0.23690289887472993 }],
    ["Si", { width: 0.3495881383855023, height: 0.23690289887472993 }],
    ["F", { width: 0.0725401399752986, height: 0.22384151593453921 }],
    ["Na", { width: 0.08538949505201736, height: 0.22384151593453921 }],
    ["Se", { width: 0.02163834753813594, height: 0.23690289887472993 }],
    ["Cl", { width: -0.27070436437989126, height: 0.23690289887472993 }],
    ["I", { width: -1.1328284023668636, height: 0.22384151593453921 }],
    ["Br", { width: -0.10411076395270463, height: 0.22384151593453921 }],
    ["Mg", { width: 0.14068564344633586, height: 0.22384151593453921 }],
    ["K", { width: 0.1873015873015874, height: 0.22384151593453921 }],
    ["H", { width: 0.1691683569979717, height: 0.22384151593453921 }],
    ["Ti", { width: -0.5076459762422618, height: 0.22384151593453921 }],
]);


// debug functions
// debug function to limit the amount of logs
const lastLoggedTimes = new Map<string, number>();
function limitedLog(key: string, message?: any, ...optionalParams: any[]) {
    const lastLoggedTime = lastLoggedTimes.get(key) || 0;
    if (Date.now() > lastLoggedTime + 1000) {
        lastLoggedTimes.set(key, Date.now());
        console.log(message, ...optionalParams);
    }
}

