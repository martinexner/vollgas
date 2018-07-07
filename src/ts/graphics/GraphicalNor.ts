import { Nor } from "../elements/Nor";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { DataSource } from "../DataSource";


export class GraphicalNor extends StubGraphicalElement<Nor> {

    private outputValueReader: () => boolean;

    private height: number;
    private orWidth: number;
    private notRadius: number;
    private lineWidth: number;
    private orX: number;
    private notCenterX: number;
    private notCenterY: number;

    constructor(name: string, private numInputs: number, private initialValue: boolean = false, private defaultHeight = GraphicalNor.DEFAULT_HEIGHT, private mirrorConnectors = false) {
        super(name);
    }

    getDefaultHeight() {
        return this.defaultHeight;
    }

    makeConnectorCoordinates(elementHeight: number) {

        let scale = elementHeight / this.getDefaultHeight();

        this.height = elementHeight;
        this.orWidth = GraphicalOr.getWidth(scale * GraphicalNor.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalNor.DEFAULT_HEIGHT);
        this.notRadius = scale * GraphicalNor.DEFAULT_HEIGHT/12;
        this.orX = this.mirrorConnectors ? 2*this.notRadius : 0;
        this.notCenterX = (this.mirrorConnectors ? 0 : this.orWidth) + this.notRadius;
        this.notCenterY = this.height/2;

        return GraphicalOr.makeConnectorCoordinates(this.orWidth + 2*this.notRadius, this.height, this.numInputs, 1, this.mirrorConnectors);

    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return coordinates[0];
    }

    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        let element = new Nor(this.getName(), this.numInputs, this.initialValue, GraphicalNor.ADDITIONAL_DELAY);
        return element;
    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {

        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());

        let scale = elementHeight / this.getDefaultHeight();

        return GraphicalOr.makeGraphics(this.height, this.orWidth, undefined, scale * GraphicalNor.DEFAULT_HEIGHT, this.orX);

    }

    redraw(progress: number) {

        let value = this.outputValueReader();

        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawRect(this.orX, 0, this.orWidth, this.height);
        this.graphics.drawCircle(this.notCenterX, this.notCenterY, this.notRadius);

    }

}

export namespace GraphicalNor {

    export const DEFAULT_HEIGHT = GraphicalOr.DEFAULT_HEIGHT;

    export const DEFAULT_WIDTH = GraphicalOr.getWidth(DEFAULT_HEIGHT) + Math.floor(GraphicalNor.DEFAULT_HEIGHT/6);

    export let ADDITIONAL_DELAY = 0; // might be overwritten by GraphicalCircuit

}
