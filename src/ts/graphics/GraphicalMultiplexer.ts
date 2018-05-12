import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GrammarParser } from "../grammar/GrammarParser";
import { GraphicalOr } from "./GraphicalOr";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { GraphicalWire } from "./GraphicalWire";

export class GraphicalMultiplexer extends CompactCombinedGraphicalElement {

    private static inputChannelBase(numOutBits: number, inputChannelIndex: number, wireDist: number) {
        return inputChannelIndex * ((numOutBits + 2) * wireDist + GraphicalOr.DEFAULT_HEIGHT);
    }

    private static outputBitBase(numInChannels: number, outputBitIndex: number, wireDist: number) {
        return outputBitIndex * (2*GraphicalWire.DEFAULT_ELEMENT_DISTANCE + GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT) + 2*GraphicalWire.DEFAULT_ELEMENT_DISTANCE + Math.max(0, numInChannels-1)*wireDist + GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT) + 2*GraphicalWire.DEFAULT_ELEMENT_DISTANCE);
    }

    //

    private height: number;
    private width: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, private numInChannels: number, private numOutBits: number, detailed = false, private wireDist = GraphicalWire.DEFAULT_DISTANCE, private overrideHeight?: number, private mirrorConnectors = false) {

        super(name, GraphicalMultiplexer.inputChannelBase(numOutBits, numInChannels, wireDist) + numOutBits*wireDist, detailed);

        const elemDist = GraphicalWire.DEFAULT_ELEMENT_DISTANCE;

        let elements: string[] = [];

        let width = GraphicalMultiplexer.outputBitBase(numInChannels, numOutBits, wireDist);
        let outputSplitX = width;

        for(let c = 0; c < numInChannels; c++) {

            let baseY = GraphicalMultiplexer.inputChannelBase(numOutBits, c, wireDist);

            let enableSplitY = baseY + numOutBits * wireDist;
            let enableSplit = "";

            let andY = baseY + (numOutBits + 1) * wireDist

            for(let i = 0; i < numOutBits; i++) {

                let y = baseY + (numOutBits-i-1) * wireDist;
                let inputIndex = c * (numOutBits + 1) + i;

                let and = `and_${c}_${i}`;
                let andX = GraphicalMultiplexer.outputBitBase(numInChannels, i, wireDist) + 2*elemDist;

                let or = `or_${i}`;

                let wireDelta = elemDist + c*wireDist;
                elements.push(`${and} and @${andX}:${andY} >n:p~n-${wireDelta}:n~${or}`);

                elements.push(`input_split${c}_${i} split @0:${y} <${inputIndex} >n:p~n-${elemDist}:n~${and}/i0`);

                if(i <= 0) {
                    let enableInputIndex = (c + 1) * (numOutBits + 1) - 1;
                    enableSplit = `enable_split${c} split @0:${enableSplitY} <${enableInputIndex} >p:n~${and}/i1`;
                } else if((i+1) < numOutBits) {
                    enableSplit += ` >enable_split${c}_${i}`;
                    elements.push(enableSplit);
                    enableSplit = `enable_split${c}_${i} split @${and}/i1-${2*elemDist}:${enableSplitY} >p:n~${and}/i1`;
                } else {
                    enableSplit += ` >n:p~n-${2*elemDist}:n~${and}/i1`;
                    elements.push(enableSplit);
                }

                if((c+1) >= numInChannels) {

                    let outputSplit = `output_split${i}`;
                    let outputSplitY = andY + GraphicalOr.DEFAULT_HEIGHT + (numOutBits-i-1)*wireDist;
                    elements.push(`${outputSplit} split @${outputSplitX}:${outputSplitY} 0>>`);

                    let orX = andX + GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT) + 2*GraphicalWire.DEFAULT_ELEMENT_DISTANCE + (numInChannels - 1)*wireDist;
                    elements.push(`${or} or @${orX}:${andY} >p+${elemDist}:p~p:n~${outputSplit}`);
                    
                }

            }

        }

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight(): number {
        return this.overrideHeight !== undefined ? this.overrideHeight : (this.numInChannels * (this.numOutBits + 1) + 2) * this.wireDist;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates | undefined {

        this.height = elementHeight;

        let scale = elementHeight / this.makeDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, this.numInChannels * (this.numOutBits + 1), this.numOutBits, this.mirrorConnectors);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "MX", scale * GraphicalOr.DEFAULT_HEIGHT);
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