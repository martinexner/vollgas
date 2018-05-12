import { StubGraphicalElement } from "./StubGraphicalElement";
import { ConnectedElement } from "./../ConnectedElement";
import { DataSource } from "../DataSource";

export interface GraphicalElement {

    element: ConnectedElement;
    graphics: PIXI.Graphics;

    baseCoordinates: StubGraphicalElement.Coordinates;
    connectorCoordinates: StubGraphicalElement.ConnectorCoordinates|undefined;

    getName(): string;
    prefixName(prefix: string): void;

    getDefaultHeight(): number;

    redraw(progress: number): void;

    initConnectorCoordinates(elementHeight: number): void;
    initBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void;
    initElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void;
    initGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): void;

}