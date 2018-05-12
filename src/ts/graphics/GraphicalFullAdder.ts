import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalFullAdder extends CompactCombinedGraphicalElement {

    private height: number;
    private width: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, detailed: boolean = false, private defaultElementHeight = GraphicalOr.DEFAULT_HEIGHT, additionalAndOutput = false) {

        super(name, 2*(2*defaultElementHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE) + defaultElementHeight + 4*GraphicalOr.DEFAULT_ELEMENT_SPACE + GraphicalWire.DEFAULT_DISTANCE, detailed);

        let elements: string[] = [];

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const elemX = 3*wireDist;
        const orY = 2*defaultElementHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE + 2*GraphicalOr.DEFAULT_ELEMENT_SPACE + GraphicalWire.DEFAULT_DISTANCE;
        const lHaY = orY + defaultElementHeight + 2*GraphicalOr.DEFAULT_ELEMENT_SPACE;

        const aboveOrWiresY = orY - GraphicalOr.DEFAULT_ELEMENT_SPACE - GraphicalWire.DEFAULT_DISTANCE;
        const belowOrWireY = lHaY - GraphicalOr.DEFAULT_ELEMENT_SPACE;

        elements.push(`or or overrideHeight=${defaultElementHeight} @${elemX}:${orY} 0>>`);

        elements.push(`upper_ha ha detailed=true overrideHeight=${defaultElementHeight}${additionalAndOutput ? " additionalAndOutput=true" : ""} @0:0 <0+1
${additionalAndOutput ? `1>> 0>` : `0>p+${3*wireDist}:p~`}p:${aboveOrWiresY+wireDist}~${elemX-2*wireDist}:p~p:n~or/i0
>p+${2*wireDist}:p~p:${aboveOrWiresY}~${elemX-3*wireDist}:p~p:n~lower_ha/i0`);

        elements.push(`lower_ha ha detailed=true overrideHeight=${defaultElementHeight} @0:${lHaY} 1<2 1>> >p+${2*wireDist}:p~p:${belowOrWireY}~${elemX-2*wireDist}:p~p:n~or/i1`);

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

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 3, 2);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "FA", scale * GraphicalOr.DEFAULT_HEIGHT);
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