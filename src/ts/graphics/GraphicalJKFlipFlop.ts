import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalRSFlipFlop } from "./GraphicalRSFlipFlop";
import { GraphicalAnd } from "./GraphicalAnd";
import { GraphicalSplit } from "./GraphicalSplit";
import { GrammarParser } from "../grammar/GrammarParser";
import { DataSource } from "../DataSource";

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
              y: 3.5*GraphicalOr.DEFAULT_HEIGHT,
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
            externalOutputs: [],
            coordinates: [{
              x: 10*GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
              y: 2*GraphicalOr.DEFAULT_HEIGHT,
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
              { x: {delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE/2, from: "prev" }, y: "prev"},
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
          /*  {
                name: "JAND",
                element: new GraphicalAnd("JAND", 3, initialValue),
                height: "auto",
                inputs: [{ name: "outside",  // SESTODO to phase detector
                        outputIndex: 1
                    },
                    {
                        name: "outside", // J input
                        outputIndex: 2
                    },
                    {
                        name: "Q_to_J",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        x: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                        y: 2*GraphicalOr.DEFAULT_HEIGHT
                    }
                ]
            },
            {
                name: "R_nor",
                element: new GraphicalNor("R_nor", 2, initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "outside",
                        outputIndex: 0
                    },
                    {
                        name: "S_to_R_loop",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        x: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                        y: 0
                    }
                ]
            },
            {
                name: "R_out_split",
                element: new GraphicalSplit("R_out_split", 2, 1),
                height: "auto",
                inputs: [
                    {
                        name: "R_nor_out_wire",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [1],
                coordinates: [
                    {
                        x: {
                            delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                            from: {
                                name: "R_nor",
                                connector: "output",
                                index: 0
                            },
                        },
                        y: {
                            name: "R_nor",
                            connector: "output",
                            index: 0
                        }
                    }
                ]
            },
            {
                name: "S_nor",
                element: new GraphicalNor("S_nor", 2, !initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "R_to_S_loop",
                        outputIndex: 0
                    },
                    {
                        name: "J_to_S",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        x: {
                            delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                            from: {
                                name: "J_and",
                                connector: "output",
                                index: 0
                            },
                        },
                        y: 2*GraphicalOr.DEFAULT_HEIGHT
                    }
                ]
            },
            {
                name: "S_out_split",
                element: new GraphicalSplit("S_out_split", 2, 1),
                height: "auto",
                inputs: [
                    {
                        name: "S_nor_out_wire",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [1],
                coordinates: [
                    {
                        x: {
                            delta: GraphicalWire.DEFAULT_ELEMENT_DISTANCE,
                            from: {
                                name: "S_nor",
                                connector: "output",
                                index: 0
                            },
                        },
                        y: {
                            name: "S_nor",
                            connector: "output",
                            index: 0
                        }
                    }
                ]
            },


            {
                name: "R_nor_out_wire",
                element: new GraphicalWire("R_nor_out_wire", initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "R_nor",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "R_nor",
                        connector: "output",
                        index: 0
                    },
                    {
                        name: "R_out_split",
                        connector: "input",
                        index: 0
                    }
                ]
            },
            {
                name: "S_nor_out_wire",
                element: new GraphicalWire("S_nor_out_wire0", !initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "S_nor",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "S_nor",
                        connector: "output",
                        index: 0
                    },
                    {
                        name: "S_out_split",
                        connector: "input",
                        index: 0
                    }
                ]
            },

            {
                name: "R_to_S_loop",
                element: new GraphicalWire("R_to_S_loop", initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "R_out_split",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "R_out_split",
                        connector: "output",
                        index: 0
                    },
                    {
                        x: "prev",
                        y: GraphicalOr.DEFAULT_HEIGHT
                    },
                    {
                        x: "next",
                        y: 2*GraphicalOr.DEFAULT_HEIGHT
                    },
                    {
                        x: 0,
                        y: "next"
                    },
                    {
                        name: "S_nor",
                        connector: "input",
                        index: 0
                    }
                ]
            },
            {
                name: "S_to_R_loop",
                element: new GraphicalWire("S_to_R_loop", !initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "S_out_split",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "S_out_split",
                        connector: "output",
                        index: 0
                    },
                    {
                        x: "prev",
                        y: 2*GraphicalOr.DEFAULT_HEIGHT
                    },
                    {
                        x: "next",
                        y: GraphicalOr.DEFAULT_HEIGHT
                    },
                    {
                        x: 0,
                        y: "next"
                    },
                    {
                        name: "R_nor",
                        connector: "input",
                        index: 1
                    }
                ]
            },
            {
                name: "Q_to_J",
                element: new GraphicalWire("Q_to_K0", !initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "S_out_split",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "S_out_split",
                        connector: "output",
                        index: 0
                    },
                    {
                        name: "J_and",
                        connector: "input",
                        index: 0
                    }
                ]
            },
            {
                name: "J_to_S",
                element: new GraphicalWire("J_to_S0", !initialValue),
                height: "auto",
                inputs: [
                    {
                        name: "J_and",
                        outputIndex: 0
                    }
                ],
                externalOutputs: [],
                coordinates: [
                    {
                        name: "J_and",
                        connector: "output",
                        index: 0
                    },
                    {
                        name: "S_nor",
                        connector: "input",
                        index: 0
                    }
                ]
            },*/
        ];
    }

    protected makeDefaultHeight() {
        return GraphicalDFlipFlop.DEFAULT_HEIGHT;
    }

    protected makeWiringDescriptions(): CombinedGraphicalElement.WiringDescription[] {
        return this.wiringDescriptions;
    }

    protected makeConnectorCoordinates(elementHeight: number): StubGraphicalElement.ConnectorCoordinates {

        this.height = elementHeight;
        this.width = GraphicalOr.getWidth(this.height);
        this.lineWidth = GraphicalOr.getLineWidth(this.height);

        return GraphicalOr.makeConnectorCoordinates(this.width, this.height, 2, 2);

    }

    protected makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): StubGraphicalElement.Coordinates {
        return coordinates[0];
    }

    protected onElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]): void {

    }

    protected makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource): PIXI.Graphics {
        //this.outputValueReader = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(0)());
        return GraphicalOr.makeGraphics(this.height, this.width, "JK");
    }

    protected doRedraw(progress: number): void {

        let value = this.outputValueReader();

        this.graphics.clear();
        this.graphics.lineStyle(this.lineWidth, value ? GraphicalWire.HIGH_COLOR : GraphicalWire.LOW_COLOR, 1);
        this.graphics.drawRect(0, 0, this.width, this.height);

    }

}

export namespace GraphicalDFlipFlop {

    export const DEFAULT_HEIGHT = GraphicalOr.DEFAULT_HEIGHT;

}
