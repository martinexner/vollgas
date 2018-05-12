import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalRegister extends CompactCombinedGraphicalElement {

    private height: number;
    private width: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, private numInBits: number, detailed: boolean = false, private defaultHeight = GraphicalOr.DEFAULT_HEIGHT, private mirrorConnectors = false, private readOnly = false, initHex?: string) {

        super(name, numInBits * (GraphicalDFlipFlop.DEFAULT_HEIGHT + 2*GraphicalWire.DEFAULT_HEIGHT), detailed);

        let initValues = new Array<boolean>(numInBits);
        initValues.fill(false);

        if(initHex) {

            let initialValue = parseInt(initHex, 16);

            for(let i = 0; i < numInBits; i++) {
                initValues[i] = !!(initialValue & 1);
                initialValue >>= 1;
            }

        }

        let elements: string[] = [];

        for(let i = 0; i < numInBits; i++) {

            let y = i * (GraphicalDFlipFlop.DEFAULT_HEIGHT + 2*GraphicalWire.DEFAULT_HEIGHT);
            elements.push(`dff${i} dff init=${initValues[i]} @20:${y}` + (readOnly ? "" : ` 0<${i}`) + ((numInBits <= 1 && !readOnly) ? " 1<1" : "") + ` 0>>`);

            if(readOnly) {
                elements.push(`data_split${i} split init=false @10:dff${i}/i0 >dff${i}/i0`);
            }

            if(i > 0) {
                elements.push(`split${i} split init=false @0:dff${i}/i1` + ((i >= (numInBits-1) && !readOnly) ? ` <${numInBits}` : "") + ` >dff${i}` + ((i > 1) ? ` >split${i-1}` : ` >p:n~dff0/i1`));
            }

        }

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight(): number {
        return this.defaultHeight;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates | undefined {

        this.height = elementHeight;

        let scale = elementHeight / this.makeDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, this.numInBits + (this.readOnly ? 0 : 1), this.numInBits, this.mirrorConnectors);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "RG", scale * GraphicalOr.DEFAULT_HEIGHT);
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {
        
    }

    protected doRedraw(progress: number): void {
        GraphicalOr.redraw(this.graphics, this.width, this.height, this.lineWidth, GraphicalDecoder.COMPACT_COLOR);
    }

}

export namespace GraphicalDecoder {

    export const COMPACT_COLOR = 0x000000;

}