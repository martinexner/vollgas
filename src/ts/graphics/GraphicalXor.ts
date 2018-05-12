import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { DataSource } from "DataSource";

export class GraphicalXor extends CompactCombinedGraphicalElement {

    private width: number;
    private height: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    private outputValueReader: () => boolean;

    constructor(name: string, detailed: boolean = false, private defaultHeight = GraphicalOr.DEFAULT_HEIGHT) {

        super(name, 2*GraphicalOr.DEFAULT_HEIGHT + 3*GraphicalWire.DEFAULT_ELEMENT_DISTANCE, detailed);

        let elements: string[] = [];

        const elemDist = GraphicalWire.DEFAULT_ELEMENT_DISTANCE;
        const lY = GraphicalOr.DEFAULT_HEIGHT + 3*elemDist;

        elements.push(`a_split split @0:${lY-2*elemDist} <0 >p:n~a_nor >a_nb_nor/i1-${elemDist}:p~p:n~a_nb_nor/i1`);
        elements.push(`b_split split @${elemDist}:${lY-1*elemDist} <1 >p:n~b_nor >na_b_nor/i0-${elemDist}:p~p:n~na_b_nor/i0`);
        
        elements.push(`b_nor nor @${2*elemDist}:0 >p+${elemDist}:p~p:n~a_nb_nor/i0`);
        elements.push(`a_nor nor @${2*elemDist}:${lY} >p+${elemDist}:p~p:n~na_b_nor/i1`);

        elements.push(`a_nb_nor nor @b_nor/o0+${3*elemDist}:0 >p+${2*elemDist}:p~p:n~nor/i0`);
        elements.push(`na_b_nor nor @a_nor/o0+${3*elemDist}:${lY} >p+${1*elemDist}:p~p:n~nor/i1`);

        elements.push(`nor nor @a_nb_nor/o0+${3*elemDist}:${lY} >not`);

        elements.push(`not nor @nor/o0+${elemDist}:${lY} 0>>`);

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight() {
        return this.defaultHeight;
    }

    protected makeWiringDescriptions() {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;

        let scale = elementHeight / this.makeDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 2, 1);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {
        
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "=1", scale * GraphicalOr.DEFAULT_HEIGHT);
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();
        GraphicalOr.redraw(this.graphics, this.width, this.height, this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR);

    }

}