import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalSourceTerminal } from "./GraphicalSourceTerminal";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalSplit } from "./GraphicalSplit";

export class GraphicalRSFlipFlop extends CombinedGraphicalElement {

    constructor(name: string, initialValue: boolean = false) {

        super(name, 180, [
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
                        name: "outside",
                        outputIndex: 1
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
            }
        ]);

    }

}