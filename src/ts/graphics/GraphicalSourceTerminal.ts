import { SourceTerminal } from "../elements/SourceTerminal";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalWire } from "./GraphicalWire";

export class GraphicalSourceTerminal extends StubGraphicalElement<SourceTerminal> {

    private radius: number;

    constructor(name: string, private value: boolean) {
        super(name);
    }

    getDefaultHeight() {
        return 20;
    }

    makeConnectorCoordinates(elementHeight: number) {

        this.radius = elementHeight/2;

        return {
            input: [],
            output: [
                {
                    x: 0,
                    y: 0
                }
            ]
        };

    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return coordinates[0];
    }

    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return new SourceTerminal(this.getName(), () => this.value);
    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {

        let graphics = new PIXI.Graphics();
        graphics.interactive = true;

        graphics.on("pointertap", () => {
            this.value = !this.value;
        });

        return graphics;

    }

    redraw(progress: number) {

        this.graphics.clear();
        this.graphics.beginFill(this.value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawCircle(0, 0, this.radius);

    }
    
}