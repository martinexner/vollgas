import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { GraphicalNor } from "./GraphicalNor";
import { DataSource } from "../DataSource";

export class GraphicalManyNors extends CompactCombinedGraphicalElement {

    private width: number;
    private orWidth: number;
    private height: number;
    private lineWidth: number;
    private notRadius: number;
    private notCenterX: number;
    private notCenterY: number;

    private readonly drawCircle: boolean;

    private outputValueReader: () => boolean;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, num: number, detailed: boolean = false, init: boolean = false) {

        super(name, GraphicalNor.DEFAULT_HEIGHT, detailed);

        this.drawCircle = (num % 2) !== 0;

        let elements: string[] = [];

        const elemDist = GraphicalOr.DEFAULT_ELEMENT_SPACE;

        if((num % 2) === 0) {
            init = !init;
        }

        for(let i = 0; i < num; i++) {
            elements.push(`nor${i} nor init=${init} @${i > 0 ? `nor${i-1}/o0+${elemDist}` : "0"}:0${i <= 0 ? " <0" : ""} ${(i+1) >= num ? "0>>" : `>nor${i+1}=${init}`}`);
            init = !init;
        }

        this.wiringDescriptions = GrammarParser.parse(elements).wiringDescriptions;

    }

    protected makeDefaultHeight() {
        return GraphicalNor.DEFAULT_HEIGHT;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        let scale = elementHeight / this.getDefaultHeight();

        this.height = elementHeight;
        this.orWidth = GraphicalOr.getWidth(scale * GraphicalNor.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalNor.DEFAULT_HEIGHT);
        this.notRadius = scale * GraphicalNor.DEFAULT_HEIGHT/12;
        this.notCenterX = this.orWidth + this.notRadius;
        this.notCenterY = this.height/2;
        this.width = this.orWidth + (this.drawCircle ? 2*this.notRadius : 0);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 1, 1);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {

    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {

        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        let scale = elementHeight / this.getDefaultHeight();

        return GraphicalOr.makeGraphics(this.height, this.orWidth, undefined, scale * GraphicalNor.DEFAULT_HEIGHT);

    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();

        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawRect(0, 0, this.orWidth, this.height);

        if(this.drawCircle) {
            this.graphics.drawCircle(this.notCenterX, this.notCenterY, this.notRadius);
        }

    }

}
