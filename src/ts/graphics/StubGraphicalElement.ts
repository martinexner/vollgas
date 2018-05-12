import { ConnectedElement } from "../ConnectedElement";
import { GraphicalElement } from "./GraphicalElement";
import { DataSource } from "../DataSource";

export abstract class StubGraphicalElement<ElementType extends ConnectedElement> implements GraphicalElement {

    public element: ElementType;
    public graphics: PIXI.Graphics;

    public baseCoordinates: StubGraphicalElement.Coordinates;
    public connectorCoordinates: StubGraphicalElement.ConnectorCoordinates|undefined;

    constructor(protected name: string) {

    }

    public getName() {
        return this.name;
    }

    public prefixName(prefix: string) {
        this.name = prefix + this.name;
    }

    protected abstract makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates|undefined;
    protected abstract makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates;
    protected abstract makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): ElementType;
    protected abstract makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics;

    public abstract redraw(progress: number): void;
    public abstract getDefaultHeight(): number;

    public initConnectorCoordinates(elementHeight: number) {
        this.connectorCoordinates = this.makeConnectorCoordinates(elementHeight);
    }

    public initBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        this.baseCoordinates = this.makeBaseCoordinates(elementHeight, coordinates);
    }

    public initElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        this.element = this.makeElement(elementHeight, coordinates);
    }

    public initGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {
        this.graphics = this.makeGraphics(elementHeight, coordinates, dataSource);
    }

}

export namespace StubGraphicalElement {

    export interface Coordinates {
        x: number;
        y: number;
    }

    export interface ConnectorCoordinates {
        input: Coordinates[];
        output: Coordinates[];
    }

}