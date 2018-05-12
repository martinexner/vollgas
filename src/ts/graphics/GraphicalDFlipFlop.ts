import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalRSFlipFlop } from "./GraphicalRSFlipFlop";
import { GraphicalSplit } from "./GraphicalSplit";
import { GrammarParser } from "../grammar/GrammarParser";
import { DataSource } from "../DataSource";

export class GraphicalDFlipFlop extends CompactCombinedGraphicalElement {

    private width: number;
    private height: number;
    private lineWidth: number;

    private outputValueReader: () => boolean;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, detailed: boolean = false, private initialValue: boolean = false) {

        super(name, 7*GraphicalNor.DEFAULT_HEIGHT, detailed);

        const elemDist = GraphicalWire.DEFAULT_ELEMENT_DISTANCE;
        const elemHeight = GraphicalNor.DEFAULT_HEIGHT;

        const norWidth = GraphicalNor.DEFAULT_WIDTH;

        const rNorX = 6*elemDist + 2*norWidth;

        const rNorY = 0;
        const rNorAfterY = rNorY + elemHeight;
        const sNorY = rNorAfterY + elemHeight;
        const e1Nor0Y = sNorY + 2*elemHeight;
        const e1Nor0AfterY = e1Nor0Y + elemHeight;
        const e1Nor1Y = e1Nor0AfterY + elemHeight;

        let elements: string[] = [];

        elements.push(`r_nor nor init=false @${rNorX}:${rNorY} >p+${elemDist}:p~p:n~r/i0=false`);

        elements.push(`d_split split @0:r_nor/i0 <0 >r_nor >p:n~d_nor`);

        elements.push(`d_nor nor @d_split/o0+${elemDist}:d_split/o0+${elemDist} >p+${elemDist}:p~p:n~s_nor/i0`);

        elements.push(`s_nor nor init=false @r_nor/i0:${sNorY} >p+${elemDist}:p~p:n~s/i1=false`);

        elements.push(`e_nor nor init=true o0@d_nor/o0:s_nor/i1 <1 >e0_split=true`);

        elements.push(`e0_split split @e_nor/o0+${elemDist}:e_nor/o0 >e_split=true >p:${e1Nor0AfterY}~n:${e1Nor1Y}~n-${elemDist}:n~e1_nor1=true`);

        elements.push(`e1_nor0 nor @e_nor/i0:${e1Nor0Y} >p+${2*elemDist}:p~p:n~e1_nor=true`);

        elements.push(`e1_nor1 nor @e_nor/i0:${e1Nor1Y} >p+${elemDist}:p~p:${e1Nor1Y}~n:${e1Nor0AfterY}~n-${elemDist}:n~e1_nor0=false`);

        elements.push(`e1_nor nor i0@e1_nor0/o0+${3*elemDist}:e1_nor0/o0+${norWidth} >n:p~e1_split=false`);

        elements.push(`e1_split split @s_nor/i2-${elemDist}:s_nor/i2 >s_nor/i2=false >p:n~r_nor/i2=false`);

        elements.push(`e_split split @s_nor/i1-${2*elemDist}:s_nor/i1 >s_nor=true >p:n~r_nor=true`);

        elements.push(`r nor init=${initialValue} @r_nor/o0+${3*elemDist}:${rNorY} >r_split=${initialValue}`);

        elements.push(`s nor init=${!initialValue} @r/i0:${sNorY} >p+${elemDist}:p~p:${sNorY}~n:${rNorAfterY}~n-${elemDist}:n~r/i1=${!initialValue}`);

        elements.push(`r_split split @r/o0+${elemDist}:r/o0 0>> >p:${rNorAfterY}~n:${sNorY}~n-${elemDist}:n~s/i0=${initialValue}`);

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight() {
        return GraphicalDFlipFlop.DEFAULT_HEIGHT;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;
        this.width = GraphicalOr.getWidth(this.height);
        this.lineWidth = GraphicalOr.getLineWidth(this.height);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 2, 2);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {
        
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        return GraphicalOr.makeGraphics(this.height, this.width, "D");
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();

        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawRect(0, 0, this.width, this.height);
        
    }

}

export namespace GraphicalDFlipFlop {

    export const DEFAULT_HEIGHT = GraphicalOr.DEFAULT_HEIGHT;

}