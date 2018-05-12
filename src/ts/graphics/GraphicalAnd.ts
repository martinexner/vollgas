import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { DataSource } from "../DataSource";

export class GraphicalAnd extends CompactCombinedGraphicalElement {

    private width: number;
    private height: number;
    private lineWidth: number;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    private outputValueReader: () => boolean;

    constructor(name: string, private numInputs: number, detailed: boolean = false, private defaultHeight = GraphicalOr.DEFAULT_HEIGHT, private initialValue = false) {

        super(name, numInputs * (GraphicalOr.DEFAULT_HEIGHT + GraphicalWire.DEFAULT_ELEMENT_DISTANCE), detailed);

        let elements: string[] = [];

        const elemDist = GraphicalWire.DEFAULT_ELEMENT_DISTANCE;

        for(let i = 0; i < numInputs; i++) {

            let y = i * (GraphicalOr.DEFAULT_HEIGHT + GraphicalWire.DEFAULT_ELEMENT_DISTANCE);
            let wireDelta = elemDist + i*GraphicalWire.DEFAULT_DISTANCE;

            elements.push(`in_nor${i} nor init=${!initialValue} @0:${y} <${i} >n:p~n-${wireDelta}:n~out_nor=${!initialValue}`);

            if((i+1) >= numInputs) {
                elements.push(`out_nor nor init=${initialValue} @in_nor${i}/o0+${wireDelta + elemDist}:${y} 0>>`);
            }

        }

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

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, this.numInputs);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {
        
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "&", scale * GraphicalOr.DEFAULT_HEIGHT);
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();
        GraphicalOr.redraw(this.graphics, this.width, this.height, this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR);
        
    }

}