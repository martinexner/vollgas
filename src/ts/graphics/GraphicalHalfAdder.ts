import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalHalfAdder extends CompactCombinedGraphicalElement {

    private height: number;
    private width: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, detailed: boolean = false, private defaultElementHeight = GraphicalOr.DEFAULT_HEIGHT, additionalAndOutput = false) {

        super(name, 2*defaultElementHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE, detailed);

        let elements: string[] = [];

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const elemX = 3*wireDist;
        const xorY = defaultElementHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;

        elements.push(`and and overrideHeight=${defaultElementHeight} @${elemX}:0 ${additionalAndOutput ? ">and_split" : "0>>"}`);

        if(additionalAndOutput) {
            elements.push(`and_split split @and/o0+${3*wireDist}:and/o0 0>> 1>>`);
        }
        
        elements.push(`xor xor overrideHeight=${defaultElementHeight} @${elemX}:${xorY} 0>>`);

        elements.push(`a_split split @${wireDist}:and/i0 <0 >and >p:n~xor`);
        elements.push(`b_split split @0:and/i1 <1 >and >p:n~xor`);

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight(): number {
        return this.defaultElementHeight;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates | undefined {

        this.height = elementHeight;

        let scale = elementHeight / this.makeDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 2, 2);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "HA", scale * GraphicalOr.DEFAULT_HEIGHT);
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