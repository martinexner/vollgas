import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalDecoder extends CompactCombinedGraphicalElement {

    private height: number;
    private width: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, private numInBits: number, detailed: boolean = false, private mirrorConnectors: boolean = false, private defaultHeight = GraphicalOr.DEFAULT_HEIGHT) {

        super(name, numInBits * 2*GraphicalNor.DEFAULT_HEIGHT + GraphicalNor.DEFAULT_HEIGHT, detailed);

        let elements: string[] = [];

        for(let i = 0; i < numInBits; i++) {

            let y = (numInBits - 1 - i) * 2*GraphicalNor.DEFAULT_HEIGHT;
            let yNor = y + GraphicalNor.DEFAULT_HEIGHT/2 + 20;

            let currentBitNotSetElement = `in${i} split @0:${y} <${i} >p:n~in_nor${i}`;
            let currentBitSetElement = `in_nor${i} nor i0@20:${yNor}`;

            for(let n = 0; n < 2**numInBits; n++) {

                let x = (n + 1) * 2*GraphicalNor.DEFAULT_HEIGHT + i * 2*GraphicalWire.DEFAULT_HEIGHT;

                let bitNotSet = !((n >> i) & 1);

                if(bitNotSet) {
                    if((n+1) >= 2**numInBits) {
                        currentBitNotSetElement += ` >${x}:p~p:n~out_nor${n}`;
                    } else {
                        currentBitNotSetElement += ` >connector_split${i}_${n}`;
                        elements.push(currentBitNotSetElement);
                        currentBitNotSetElement = `connector_split${i}_${n} split @${x}:${y} >p:n~out_nor${n}`;
                    }
                } else {
                    if((n+1) >= 2**numInBits) {
                        currentBitSetElement += ` >${x}:p~p:n~out_nor${n}`;
                    } else {
                        currentBitSetElement += ` >connector_split${i}_${n}`;
                        elements.push(currentBitSetElement);
                        currentBitSetElement = `connector_split${i}_${n} split @${x}:${yNor} >p:n~out_nor${n}`;
                    }
                }

            }

            elements.push(currentBitNotSetElement);
            elements.push(currentBitSetElement);

        }

        for(let n = 2**numInBits - 1; n >= 0; n--) {
            let x = (n + 1) * 2*GraphicalNor.DEFAULT_HEIGHT + numInBits*2*GraphicalWire.DEFAULT_HEIGHT;
            let y = numInBits * 2*GraphicalNor.DEFAULT_HEIGHT;
            elements.push(`out_nor${n} nor @${x}:${y} 0>>`);
        }

        elements.reverse();

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

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, this.numInBits, 2**this.numInBits, this.mirrorConnectors);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "DC", scale * GraphicalOr.DEFAULT_HEIGHT);
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