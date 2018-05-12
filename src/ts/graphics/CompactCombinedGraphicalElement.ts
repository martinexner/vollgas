import { GraphicalElement } from "./GraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { ConnectedElement } from "./../ConnectedElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { DataSource } from "../DataSource";

export abstract class CompactCombinedGraphicalElement implements GraphicalElement {

    public element: ConnectedElement;

    public graphics: PIXI.Graphics;
    private compactGraphics: PIXI.Graphics;

    public baseCoordinates: StubGraphicalElement.Coordinates;
    private compactBaseCoordinates: StubGraphicalElement.Coordinates;

    public connectorCoordinates: StubGraphicalElement.ConnectorCoordinates|undefined;
    private compactConnectorCoordinates: StubGraphicalElement.ConnectorCoordinates|undefined;

    private combinedGraphicalElement: CombinedGraphicalElement;

    constructor(private name: string, private totalHeight: number, private detailed: boolean) {

    }

    public getName() {
        return this.name;
    }

    public prefixName(prefix: string) {
        this.name = prefix + this.name;
    }

    protected abstract makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[];

    protected abstract makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates|undefined;
    protected abstract makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates;
    protected abstract makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics;

    protected abstract onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void;
    protected abstract doRedraw(progress: number): void;

    protected abstract makeDefaultHeight(): number;

    public initConnectorCoordinates(elementHeight: number) {

        let wiringDescriptions = this.makeWiringDescriptions();
        this.combinedGraphicalElement = new CombinedGraphicalElement(this.name, this.totalHeight, wiringDescriptions);
        this.combinedGraphicalElement.initConnectorCoordinates(elementHeight);

        this.compactConnectorCoordinates = this.makeConnectorCoordinates(elementHeight);

        this.connectorCoordinates = this.detailed ? this.combinedGraphicalElement.connectorCoordinates : this.compactConnectorCoordinates;

    }

    public initBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {

        this.combinedGraphicalElement.initBaseCoordinates(elementHeight, coordinates);
        this.compactBaseCoordinates = this.makeBaseCoordinates(elementHeight, coordinates);

        this.baseCoordinates = this.detailed ? this.combinedGraphicalElement.baseCoordinates : this.compactBaseCoordinates;

    }

    public initElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        this.combinedGraphicalElement.initElement(elementHeight, coordinates);
        this.element = this.combinedGraphicalElement.element;
        this.onElement(elementHeight, coordinates);
    }

    public initGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {

        this.combinedGraphicalElement.initGraphics(elementHeight, coordinates, dataSource);
        this.compactGraphics = this.makeGraphics(elementHeight, coordinates, dataSource);

        this.graphics = this.detailed ? this.combinedGraphicalElement.graphics : this.compactGraphics;

    }

    public redraw(progress: number) {
        if(this.detailed) {
            this.combinedGraphicalElement.redraw(progress);
        } else {
            this.doRedraw(progress);
        }
    }

    getDefaultHeight() {
        return this.detailed ? this.totalHeight : this.makeDefaultHeight();
    }

}