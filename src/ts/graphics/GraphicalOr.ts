import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { DataSource } from "../DataSource";

export class GraphicalOr extends CompactCombinedGraphicalElement {

    public static getWidth(height: number) {
        return Math.floor(3*height/4);
    }

    public static getLineWidth(height: number) {
        return Math.ceil(height/24);
    }

    public static makeConnectorCoordinates(width: number, height: number, numInputs: number, numOutputs = 1, mirrorConnectors = false) {

        let inputCoordinates = new Array<StubGraphicalElement.Coordinates>(numInputs);

        for(let i = 0; i < inputCoordinates.length; i++) {
            inputCoordinates[i] = {
                x: mirrorConnectors ? width : 0,
                y: (i + 1) * height / (inputCoordinates.length + 1)
            };
        }

        let outputCoordinates = new Array<StubGraphicalElement.Coordinates>(numOutputs);

        for(let i = 0; i < outputCoordinates.length; i++) {
            outputCoordinates[i] = {
                x: mirrorConnectors ? 0 : width,
                y: (i + 1) * height / (outputCoordinates.length + 1)
            };
        }

        return {
            input: inputCoordinates,
            output: outputCoordinates
        };

    }

    public static makeGraphics(height: number, width: number, desc: string|undefined = "≥1", textSizeReferenceHeight: number|undefined = undefined, textLeftOffset = 0) {

        let graphics = new PIXI.Graphics();

        if(desc) {
            if(textSizeReferenceHeight === undefined) {
                textSizeReferenceHeight = height;
            }

            let text = new PIXI.Text(desc, {
                fontSize: 2*textSizeReferenceHeight/5,
                fontFamily: "Arial",
                fill: GraphicalOr.TEXT_COLOR
            });

            text.anchor.set(0.5, 0.5);
            text.x = width/2 + textLeftOffset;
            text.y = height/2;
            graphics.addChild(text);
        }

        return graphics;

    }

    public static redraw(graphics: PIXI.Graphics, width: number, height: number, lineWidth: number, color: number) {
        graphics.clear();
        graphics.lineStyle(lineWidth, color, 1);
        graphics.drawRect(0, 0, width, height);
    }

    //

    private width: number;
    private height: number;
    private lineWidth: number;

    private outputValueReader: () => boolean;

    constructor(name: string, private numInputs: number, detailed: boolean = false, private defaultHeight = GraphicalOr.DEFAULT_HEIGHT, private mirrorConnectors = false, private initialValue = false) {
        super(name, GraphicalNor.DEFAULT_HEIGHT, detailed);
    }

    protected makeDefaultHeight() {
        return this.defaultHeight;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {

        let nor1Inputs = new Array<CombinedGraphicalElement.InputDescription>(this.numInputs);

        for(let i = 0; i < nor1Inputs.length; i++) {
            nor1Inputs[i] = {
                name: "outside",
                outputIndex: i
            };
        }

        return [
            {
                name: "nor1",
                element: new GraphicalNor("nor1", this.numInputs, !this.initialValue),
                height: "auto",
                inputs: nor1Inputs,
                externalOutputs: [],
                coordinates: [
                    {
                        x: 0,
                        y: 0
                    }
                ]
            }, {
                name: "nor2",
                element: new GraphicalNor("nor2", 1, this.initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "wire",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [0],
                coordinates: [
                    {
                        x: {
                            delta: 20,
                            from: {
                                name: "nor1",
                                connector: "output",
                                index: 0
                            }
                        },
                        y: 0
                    }
                ]
            }, {
                name: "wire",
                element: new GraphicalWire("wire", !this.initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "nor1",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "nor1",
                        connector: "output",
                        index: 0
                    },
                    {
                        name: "nor2",
                        connector: "input",
                        index: 0
                    }
                ]
            }
        ];

    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;

        let scale = elementHeight / this.makeDefaultHeight();

        this.width = GraphicalOr.getWidth(scale * GraphicalOr.DEFAULT_HEIGHT);
        this.lineWidth = GraphicalOr.getLineWidth(scale * GraphicalOr.DEFAULT_HEIGHT);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, this.numInputs, 1, this.mirrorConnectors);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {
        
    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        let scale = elementHeight / this.makeDefaultHeight();
        return GraphicalOr.makeGraphics(this.height, this.width, undefined, scale * GraphicalOr.DEFAULT_HEIGHT);
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();
        GraphicalOr.redraw(this.graphics, this.width, this.height, this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR);
        
    }

}

export namespace GraphicalOr {

    export const DEFAULT_HEIGHT = 36;

    export const DEFAULT_ELEMENT_SPACE = 4;

    export const TEXT_COLOR = 0x000000;

}