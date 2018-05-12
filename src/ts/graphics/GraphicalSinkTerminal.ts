import { SinkTerminal } from "../elements/SinkTerminal";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalWire } from "./GraphicalWire";

export class GraphicalSinkTerminal extends StubGraphicalElement<SinkTerminal> {

    private radius: number;
    private value: boolean;

    constructor(name: string) {
        super(name);
    }

    getDefaultHeight() {
        return 20;
    }

    makeConnectorCoordinates(elementHeight: number) {

        this.radius = elementHeight/2;

        return {
            input: [
                {
                    x: 0,
                    y: 0
                }
            ],
            output: []
        };

    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return coordinates[0];
    }

    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return new SinkTerminal(this.getName(), (value) => {
            this.value = value;
        });
    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return new PIXI.Graphics();
    }

    redraw(progress: number) {

        this.graphics.clear();
        this.graphics.beginFill(this.value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawCircle(0, 0, this.radius);

    }
    
}