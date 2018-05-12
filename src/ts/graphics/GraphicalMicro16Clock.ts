import { Micro16Clock } from "../elements/Micro16Clock";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";
import { ConnectedElement } from "../ConnectedElement";
import { GraphicalDecoder } from "./GraphicalMultiplexer";

export class GraphicalMicro16Clock extends StubGraphicalElement<Micro16Clock> {

    private width: number;
    private height: number;
    private lineWidth: number;

    constructor(name: string, private instructionDelay?: number, private aluDelay?: number, private registersDelay?: number) {

        super(name);

    }

    public getDefaultHeight(): number {
        return GraphicalOr.DEFAULT_HEIGHT;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;

        let scale = elementHeight / this.getDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        
        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 0, 3, false);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return new Micro16Clock(this.getName(), this.instructionDelay, this.aluDelay, this.registersDelay);
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): PIXI.Graphics {
        let scale = elementHeight / this.getDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, "CK", scale * GraphicalOr.DEFAULT_HEIGHT);
    }

    public redraw(progress: number): void {
        GraphicalOr.redraw(this.graphics, this.width, this.height, this.lineWidth, GraphicalDecoder.COMPACT_COLOR);
    }

}