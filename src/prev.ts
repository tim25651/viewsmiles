
// v0.0.4
// import * as canvas from 'canvas';

// v0.0.4
// var loggedCanvasNotFound = false;


// v0.0.4
// function getRealBBox(cvs: canvas.Canvas, logData: boolean, text: string, fontSize: number, fontFamily: string, lineHeight: number = 0.9) {

//     const ctx = cvs.getContext("2d");
//     ctx.font = `${fontSize}pt ${fontFamily}`;
//     let textMetrics = ctx.measureText(text);

//     let compWidth = Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);

//     const real = {
//         width: textMetrics.width > compWidth ? textMetrics.width : compWidth,
//         height: (Math.abs(textMetrics.actualBoundingBoxAscent) + Math.abs(textMetrics.actualBoundingBoxAscent)) * lineHeight
//     };

//     // width error
//     // @ts-ignore
//     const width_error = (real.width - appr.width) / real.width;
//     // height error
//     // @ts-ignore
//     const height_error = (real.height - appr.height) / real.height;


//     if (errorMap.hasOwnProperty(text)) {
//         // @ts-ignore
//         if (errorMap[text].width !== width_error || errorMap[text].height !== height_error) {
//             logData = true;
//             console.log("ERROR DATA IS DIFFERENT");
//         }
//     }

//     if (logData) {
//         console.log("fontSize:", fontSize, text + ": {width: " + width_error + ", height: " + height_error + "}, \n", "real:", real, "appr:", appr);
//     }

//     return real;



// v0.0.4
// function measureText --
        // try {
        //     const cvs = canvas.createCanvas(300, 150); // default size from chromium

        //     return getRealBBox(cvs, logData, text, fontSize, fontFamily, lineHeight);

        // } catch (e) {
        //     if (!loggedCanvasNotFound) {
        //         console.log("canvas not found: disable bounding box, could lead to cut off atoms");
        //         loggedCanvasNotFound = true;
        //     }
            
        //     if (logData) {
        //         console.log("real is null, but no error data for text:", text, "fontSize:", fontSize, "appr:", appr);
        //     }
        //     return adjustApproximation(appr, errorFactor);
        // }


// function activate --
// works
                        // vscode setting to enable/disable kekule

                        // todo: add kekule support
                        // const kekule: boolean = vscode.workspace.getConfiguration('viewsmiles').get('kekule', false);
                        // console.log("kekule?", kekule);

                        // todo: add kekule support
                        //if (kekule) {
                        //    resolve(new vscode.Hover(new vscode.MarkdownString("Kekule is not implemented yet")));
                        //} else {

                        // }

                        // todo: add kekule support
                        // if (parseTree === null) {
                        //     throw new Error("parseTree is null");
                        // }

                        // console.log(smiles, "parsed");
                        // console.log(parseTree);