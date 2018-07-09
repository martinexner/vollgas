import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalRSFlipFlop } from "./GraphicalRSFlipFlop";
import { GraphicalAnd } from "./GraphicalAnd";
import { GraphicalSplit } from "./GraphicalSplit";
import { GraphicalSinkTerminal } from "./GraphicalSinkTerminal";
import { GrammarParser } from "../grammar/GrammarParser";
import { DataSource } from "../DataSource";

// example call:
// file:///home/sseifried/Source/vollgas/docs/demo.html#autoSource=true**x*jkff*detailed=true*@100:100*%3C0+2
export class GraphicalJKFlipFlop extends CompactCombinedGraphicalElement {

    private width: number;
    private height: number;
    private lineWidth: number;

    private outputValueReader: () => boolean;

    private wiringDescriptions: CombinedGraphicalElement.WiringDescription[];

    constructor(name: string, detailed: boolean = false, private initialValue: boolean = false) {

        super(name, 7*GraphicalNor.DEFAULT_HEIGHT, detailed);

        this.wiringDescriptions = [
          //
          // circuit elements
          //
          {
            name: "CLK_SPLIT",
            element: new GraphicalSplit("CLK_SPLIT0", 2, 1),
            height: "auto",
            inputs: [{ name: "outside", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [{
              x: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 3*GraphicalOr.DEFAULT_HEIGHT,
              }]
          },
          {
            name: "CLK_NOT",
            element: new GraphicalNor("CLK_NOT0", 1, initialValue),
            height: "auto",
            inputs: [{ name: "CLK_SPLIT_to_CLK_NOT", outputIndex: 0}],
            externalOutputs: [],
            coordinates: [{
              x: {
                  delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                  from: { name: "CLK_SPLIT", connector: "output", index: 0
                  },
              },
              y: 7*GraphicalOr.DEFAULT_HEIGHT,
            }],
          },
          {
            name: "CLK_AND",
            element: new GraphicalAnd("CLK_AND0", 2, initialValue),
            height: "auto",
            inputs: [
              { name: "CLK_SPLIT_to_CLK_AND", outputIndex: 0},
              { name: "CLK_NOT_to_CLK_AND", outputIndex: 0},
            ],
            externalOutputs: [],
            coordinates: [{
              x: {
                  delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                  from: { name: "CLK_NOT", connector: "output", index: 0 },
              },
              y: {
                  delta: -(GraphicalOr.DEFAULT_HEIGHT/3),
                  from: { name: "CLK_SPLIT", connector: "output", index: 0 },
              },
            }]
          },
          {
            name: "CLK_OUT",
            element: new GraphicalSplit("CLK_SPLIT1", 2, 1),
            height: "auto",
            inputs: [{ name: "CLK_AND_to_CLK_OUT", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [{
              x: {
                  delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                  from: { name: "CLK_AND", connector: "output", index: 0 },
              },
              y: { name: "CLK_AND", connector: "output", index: 0 },
            }],
          },
          {
            name: "K_AND",
            element: new GraphicalAnd("K_AND0", 3, initialValue),
            height: "auto",
            inputs: [
              { name: "Q_to_K_AND", outputIndex: 0},
              { name: "outside", outputIndex: 1},
              { name: "CLK_OUT_to_K_AND", outputIndex: 0},
            ],
            externalOutputs: [],
            coordinates: [{
              x: 8*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: GraphicalOr.DEFAULT_HEIGHT,
            }]
          },
          {
            name: "J_AND",
            element: new GraphicalAnd("J_AND0", 3, initialValue),
            height: "auto",
            inputs: [
              { name: "CLK_OUT_to_J_AND", outputIndex: 0},
              { name: "outside", outputIndex: 2},
              { name: "Qn_to_J_AND", outputIndex: 0},
            ],
            externalOutputs: [],
            coordinates: [{
              x: 8*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 5*GraphicalOr.DEFAULT_HEIGHT,
            }]
          },
          {
            name: "RSFLIPFLOP",
            element: new GraphicalRSFlipFlop("RSFLIPFLOP0", initialValue),
            height: "auto",
            inputs: [
              { name: "K_AND_to_RSFF", outputIndex: 0},
              { name: "J_AND_to_RSFF", outputIndex: 0},
            ],
            externalOutputs: [1],
            coordinates: [{
              x: 10*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 2*GraphicalOr.DEFAULT_HEIGHT,
            }]
          },
          {
            name: "Q_SINK",
            element: new GraphicalSinkTerminal("Q_SINK0"),
            height: "auto",
            inputs: [
              { name: "RSFF_to_Q_SINK", outputIndex: 0},
            ],
            externalOutputs: [],
            coordinates: [{
              x: 16*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 2.5*GraphicalOr.DEFAULT_HEIGHT,
            }]
          },
          {
            name: "Qn_SINK",
            element: new GraphicalSinkTerminal("Qn_SINK0"),
            height: "auto",
            inputs: [
              { name: "RSFF_to_Qn_SINK", outputIndex: 0},
            ],
            externalOutputs: [],
            coordinates: [{
              x: 16*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 4.5*GraphicalOr.DEFAULT_HEIGHT,
            }]
          },
          //
          // wiring
          //
          {
            name: "CLK_SPLIT_to_CLK_NOT",
            element: new GraphicalWire("CLK_SPLIT_to_CLK_NOT0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_SPLIT", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_SPLIT", connector: "output", index: 0 },
              { x: "prev", y: "next" },
              { name: "CLK_NOT", connector: "input", index: 0 }
            ]
          },
          {
            name: "CLK_SPLIT_to_CLK_AND",
            element: new GraphicalWire("CLK_SPLIT_to_CLK_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_SPLIT", outputIndex: 1 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_SPLIT", connector: "output", index: 0 },
              { name: "CLK_AND", connector: "input", index: 0 }
            ]
          },
          {
            name: "CLK_NOT_to_CLK_AND",
            element: new GraphicalWire("CLK_NOT_to_CLK_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_NOT", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_NOT", connector: "output", index: 0 },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev"},
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev" },
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev"},
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev" },
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev"},
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev" },
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev"},
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE, from: "prev" }, y: "prev" },
              { x: "prev", y: {delta: -0.5*GraphicalOr.DEFAULT_HEIGHT, from: "prev" } },
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "next" }, y: "next"},
              { name: "CLK_AND", connector: "input", index: 1 }
            ]
          },
          {
            name: "CLK_AND_to_CLK_OUT",
            element: new GraphicalWire("CLK_AND_to_CLK_OUT0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_AND", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_AND", connector: "output", index: 0 },
              { name: "CLK_OUT", connector: "input", index: 0 },
            ]
          },
          {
            name: "CLK_OUT_to_K_AND",
            element: new GraphicalWire("CLK_OUT_to_K_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_OUT", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_OUT", connector: "output", index: 0 },
              { x: "prev", y: "next" },
              { name: "K_AND", connector: "input", index: 2 },
            ]
          },
          {
            name: "CLK_OUT_to_J_AND",
            element: new GraphicalWire("CLK_OUT_to_J_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "CLK_OUT", outputIndex: 1 }],
            externalOutputs: [],
            coordinates: [
              { name: "CLK_OUT", connector: "output", index: 0 },
              { x: "prev", y: "next" },
              { name: "J_AND", connector: "input", index: 0 },
            ]
          },
          {
            name: "K_AND_to_RSFF",
            element: new GraphicalWire("K_AND_to_RSFF0", initialValue),
            height: "auto",
            inputs: [{ name: "K_AND", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "K_AND", connector: "output", index: 0 },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "prev" }, y: "prev"},
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "next" }, y: "next"},
              { name: "RSFLIPFLOP", connector: "input", index: 0 },
            ]
          },
          {
            name: "J_AND_to_RSFF",
            element: new GraphicalWire("J_AND_to_RSFF0", initialValue),
            height: "auto",
            inputs: [{ name: "J_AND", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "J_AND", connector: "output", index: 0 },
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "prev" }, y: "prev"},
              { x: {delta: -GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "next" }, y: "next"},
              { name: "RSFLIPFLOP", connector: "input", index: 1 },
            ]
          },
          {
            name: "Q_to_K_AND",
            element: new GraphicalWire("Q_to_K_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "RSFLIPFLOP", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "RSFLIPFLOP", connector: "output", index: 0 },
              { x: "prev", y: GraphicalOr.DEFAULT_HEIGHT/2 },
              { x: 7*GraphicalWire.DEFAULT_ELEMENT_DISTANCE, y: GraphicalOr.DEFAULT_HEIGHT/2 },
              { x: 7*GraphicalWire.DEFAULT_ELEMENT_DISTANCE, y: "next" },
              { name: "K_AND", connector: "input", index: 0 },
            ]
          },
          {
            name: "Qn_to_J_AND",
            element: new GraphicalWire("Qn_to_J_AND0", initialValue),
            height: "auto",
            inputs: [{ name: "RSFLIPFLOP", outputIndex: 1 }],
            externalOutputs: [],
            coordinates: [
              { name: "RSFLIPFLOP", connector: "output", index: 1 },
              { x: "prev", y: 6.5*GraphicalOr.DEFAULT_HEIGHT },
              { x: 7*GraphicalWire.DEFAULT_ELEMENT_DISTANCE, y: 6.5*GraphicalOr.DEFAULT_HEIGHT },
              { x: 7*GraphicalWire.DEFAULT_ELEMENT_DISTANCE, y: "next" },
              { name: "J_AND", connector: "input", index: 2 },
            ]
          },
          {
            name: "RSFF_to_Q_SINK",
            element: new GraphicalWire("RSFF_to_Q_SINK0", initialValue),
            height: "auto",
            inputs: [{ name: "RSFLIPFLOP", outputIndex: 0 }],
            externalOutputs: [],
            coordinates: [
              { name: "RSFLIPFLOP", connector: "output", index: 0 },
              { name: "Q_SINK", connector: "input", index: 0 },
            ]
          },
          {
            name: "RSFF_to_Qn_SINK",
            element: new GraphicalWire("RSFF_to_Qn_SINK0", initialValue),
            height: "auto",
            inputs: [{ name: "RSFLIPFLOP", outputIndex: 1 }],
            externalOutputs: [],
            coordinates: [
              { name: "RSFLIPFLOP", connector: "output", index: 1 },
              { name: "Qn_SINK", connector: "input", index: 0 },
            ]
          },
        ];
    }

    protected makeDefaultHeight() {
        return GraphicalJKFlipFlop.DEFAULT_HEIGHT;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;
        this.width = GraphicalOr.getWidth(this.height);
        this.lineWidth = GraphicalOr.getLineWidth(this.height);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 3, 2);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {

    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());

        let graphics = new PIXI.Graphics();
        let textSizeReferenceHeight: number = this.height*0.6;

        let textJ = new PIXI.Text("J", {
            fontSize: textSizeReferenceHeight/5,
            fontFamily: "Arial",
            fill: GraphicalOr.TEXT_COLOR
        });

        let textK = new PIXI.Text("K", {
            fontSize: textSizeReferenceHeight/5,
            fontFamily: "Arial",
            fill: GraphicalOr.TEXT_COLOR
        });

        let textCLK = new PIXI.Text("CLK", {
            fontSize: textSizeReferenceHeight/5,
            fontFamily: "Arial",
            fill: GraphicalOr.TEXT_COLOR
        });

        let textQ = new PIXI.Text("Q", {
            fontSize: textSizeReferenceHeight/5,
            fontFamily: "Arial",
            fill: GraphicalOr.TEXT_COLOR
        });

        let textQn = new PIXI.Text("Qn", {
            fontSize: textSizeReferenceHeight/5,
            fontFamily: "Arial",
            fill: GraphicalOr.TEXT_COLOR
        });

        textJ.anchor.set(0, 0.5);
        textJ.x = 10;
        textJ.y = this.height/4;

        textK.anchor.set(0, 0.5);
        textK.x = 10;
        textK.y = 3*this.height/4;

        textCLK.anchor.set(0, 0.5);
        textCLK.x = 10 + this.width/6;
        textCLK.y = this.height/2;

        textQ.anchor.set(1, 0.5);
        textQ.x = this.width - 10;
        textQ.y = this.height/4;

        textQn.anchor.set(1, 0.5);
        textQn.x = this.width - 10;
        textQn.y = 3*this.height/4;

        graphics.addChild(textJ);
        graphics.addChild(textK);
        graphics.addChild(textCLK);
        graphics.addChild(textQ);
        graphics.addChild(textQn);
        return graphics;
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();

        // draw rectangle
        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth/2, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawRect(0, 0, this.width, this.height);

        // draw rising edge triangle
        this.graphics.moveTo(0,this.height/2 - this.height/10);
        this.graphics.lineTo(this.width/6, this.height/2);
        this.graphics.lineTo(0, this.height/2 + this.height/10);
    }

}

export namespace GraphicalJKFlipFlop {

    export const DEFAULT_HEIGHT = GraphicalOr.DEFAULT_HEIGHT*2;

}
