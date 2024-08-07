declare module 'smiles-drawer' {
    export module Parser {
        export function parse(smiles: string, options: Object): Object;
    }
    export class SvgDrawer {
        constructor(options: Object, clear: Boolean);

        /**
         * Draws the parsed smiles data to an svg element.
         *
         * @param {Object} data The tree returned by the smiles parser.
         * @param {?(String|SVGElement)} target The id of the HTML svg element the structure is drawn to - or the element itself.
         * @param {String} themeName='dark' The name of the theme to use. Built-in themes are 'light' and 'dark'.
         * @param {?(Object|null)} weights=null An object containing the weights of the atoms. The keys are the atom indexes and the values are the weights.
         * @param {?(Boolean)} infoOnly=false Only output info on the molecule without drawing anything to the canvas.
         * @param {?(Array<number>)} highlight_atoms=[] An array of atom indexes to highlight.
         * @param {?(Boolean)} weightsNormalized=false Whether to highlight bonds.
         *
         * @returns {SVGElement} The svg element
         */
        draw(data: Object, target: string | SVGElement, themeName: string, weights?: (Object|null), infoOnly?: boolean
            , highlight_atoms?: Array<number>, weightsNormalized?: boolean): SVGElement;

    }
}