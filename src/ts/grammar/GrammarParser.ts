import nearley = require("nearley");
import { CombinedGraphicalElement } from "../graphics/CombinedGraphicalElement";
import { GraphicalWire } from "../graphics/GraphicalWire";
import { CombinedElement } from "../CombinedElement";
import { GraphicalElement } from "../graphics/GraphicalElement";
import { GraphicalNor } from "../graphics/GraphicalNor";
import { NeverError } from "../NeverError";
import { GraphicalSinkTerminal } from "../graphics/GraphicalSinkTerminal";
import { GraphicalSourceTerminal } from "../graphics/GraphicalSourceTerminal";
import { GraphicalSplit } from "../graphics/GraphicalSplit";
import { GraphicalDecoder } from "../graphics/GraphicalDecoder";
import { GraphicalDFlipFlop } from "../graphics/GraphicalDFlipFlop";
import { GraphicalRegister } from "../graphics/GraphicalRegister";
import { GraphicalRSFlipFlop } from "../graphics/GraphicalRSFlipFlop";
import { GraphicalMultiplexer } from "../graphics/GraphicalMultiplexer";
import { GraphicalHalfAdder } from "../graphics/GraphicalHalfAdder";
import { GraphicalFullAdder } from "../graphics/GraphicalFullAdder";
import { GraphicalOr } from "../graphics/GraphicalOr";
import { GraphicalAnd } from "../graphics/GraphicalAnd";
import { GraphicalXor } from "../graphics/GraphicalXor";
import { GraphicalMicro16 } from "../graphics/GraphicalMicro16";
import { GraphicalMicro16Registers } from "../graphics/GraphicalMicro16Registers";
import { GraphicalMicro16Alu } from "../graphics/GraphicalMicro16Alu";
import { GraphicalMicro16Mic } from "../graphics/GraphicalMicro16Mic";
import { GraphicalMicro16Store } from "../graphics/GraphicalMicro16Store";
import { GraphicalMicro16Clock } from "../graphics/GraphicalMicro16Clock";
import { GraphicalManyNors } from "../graphics/GraphicalManyNors";
const grammar = require("../../grammar/grammar.js");

export class GrammarParser {

    public static parse(descriptions: string[], noElementInstancesForTesting: boolean = false, knownElementNames: string[] = []): GrammarParser.ParseResult {

        let parsedElements = new Array<GrammarParser.Element[]>(descriptions.length);
        let parsedConfigs = new Array<GrammarParser.Parameter[]>(descriptions.length);

        for(let i = 0; i < descriptions.length; i++) {

            let description = descriptions[i];

            let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
            parser.feed(description);
            parser.finish();

            let parsed = parser.results[0] as GrammarParser.Parsed;

            parsedElements[i] = parsed.elements;
            parsedConfigs[i] = parsed.config;

        }

        let parsed: GrammarParser.Parsed = {
            config: ([] as GrammarParser.Parameter[]).concat(...parsedConfigs),
            elements: ([] as GrammarParser.Element[]).concat(...parsedElements)
        };

        if(!parsed.elements.length) {
            throw new Error("nothing parsed");
        }

        return GrammarParser.fromParsed(parsed, noElementInstancesForTesting, knownElementNames);

    }

    public static fromParsed(parsed: GrammarParser.Parsed, noElementInstancesForTesting: boolean = false, knownElementNames: string[] = []): GrammarParser.ParseResult {

        let elements = parsed.elements;

        let params = this.parseParameters(undefined, undefined, parsed.config, {
            height: {
                default: GrammarParser.DEFAULT_TOTAL_HEIGHT
            },
            autoSource: {
                default: false
            },
            autoSourceDeltaX: {
                default: -2*GraphicalWire.DEFAULT_ELEMENT_DISTANCE
            },
            autoSourceDeltaY: {
                default: 0
            },
            stepsPerSecond: {
                default: -1
            },
            cyclesPerStep: {
                default: 0,
            },
            delayPerWindowHeight: {
                default: -1
            },
            echoData: {
                default: false
            },
            echoFunctions: {
                default: false
            },
            disableGraphics: {
                default: false
            }
        });

        let elementsMap: {[name: string]: GrammarParser.ProcessedElement} = {};

        let wireNamesMap: {[name: string]: true} = {};

        let wireDescriptions: CombinedGraphicalElement.WiringDescription[] = [];
        let elementDescriptions: CombinedGraphicalElement.WiringDescription[] = [];

        for(let elementName of knownElementNames) {

            if(elementsMap[elementName]) {
                throw new Error("duplicate known element " + elementName);
            }

            elementsMap[elementName] = {
                element: undefined,
                inputs: {},
                outputs: {}
            };

        }

        for(let element of elements) {

            if(elementsMap[element.name]) {
                throw new Error("duplicate element " + element.name);
            }

            elementsMap[element.name] = {
                element: element,
                inputs: {},
                outputs: {}
            };

        }

        for(let parsedElement of elements) {

            let elementName = parsedElement.name;
            let element = elementsMap[elementName];

            if(!element.element) {
                continue;
            }

            for(let outsideInput of element.element.outsideInputs) {

                let inputIndex = outsideInput.inputIndex !== null ? outsideInput.inputIndex : GrammarParser.getNextFreeIndex(element.inputs);

                for(let i = 0; i <= outsideInput.more; i++) {

                    if(element.inputs[inputIndex + i]) {
                        throw new Error(`cannot set input ${inputIndex} of element ${elementName} as outside input: input is already occupied`);
                    }

                    if(params.autoSource) {

                        let autoSourceElement = GrammarParser.makeAutoSource(elementName, inputIndex + i, params.autoSourceDeltaX, params.autoSourceDeltaY);

                        if(elementsMap[autoSourceElement.name]) {
                            throw new Error(`cannot create autosource element for element ${elementName}: element ${autoSourceElement.name} exists`);
                        }

                        elements.push(autoSourceElement);

                        elementsMap[autoSourceElement.name] = {
                            element: autoSourceElement,
                            inputs: {},
                            outputs: {}
                        };

                        element.inputs[inputIndex + i] = {
                            name: autoSourceElement.name,
                            outputIndex: 0
                        };

                    } else {

                        element.inputs[inputIndex + i] = {
                            name: "outside",
                            outputIndex: outsideInput.outputIndex + i
                        };

                    }

                }

            }

            for(let externalOutput of element.element.externalOutputs) {

                for(let i = 0; i <= externalOutput.more; i++) {

                    let outputIndex = externalOutput.outputIndex + i;

                    if(element.outputs[outputIndex]) {
                        throw new Error(element.element.name + ": cannot use output index " + outputIndex + " for external output twice");
                    }
    
                    element.outputs[outputIndex] = true;

                }

            }

            for(let i = 0; i < element.element.wires.length; i++) {

                let wire = element.element.wires[i];


                let outputIndex = wire.outputIndex !== null ? wire.outputIndex : GrammarParser.getNextFreeIndex(element.outputs);

                for(let offset = 0; offset <= wire.more; offset++) {
                    if(element.outputs[outputIndex + offset]) {
                        throw new Error(element.element.name + ", wire index " + i + ": cannot use output index " + (outputIndex + offset) + " twice");
                    }
                }

                for(let offset = 0; offset <= wire.more; offset++) {
                    element.outputs[outputIndex + offset] = true;
                }


                let lastCoordinatesOriginal = wire.coordinates[wire.coordinates.length - 1] as CombinedGraphicalElement.ConnectorCoordinatesReference;

                if(!lastCoordinatesOriginal.name || lastCoordinatesOriginal.connector !== "input" || lastCoordinatesOriginal.index === undefined) {
                    throw new Error(element.element.name + ", wire index " + i + ": wire needs to terminate in some input connector of some element");
                }


                let targetElementName = lastCoordinatesOriginal.name;
                let targetElement = elementsMap[targetElementName];

                if(!targetElement) {
                    throw new Error(element.element.name + ", wire index " + i + ": unknown element name in terminating input connector reference: " + lastCoordinatesOriginal.name);
                }


                let targetInputIndex = lastCoordinatesOriginal.index !== null ? lastCoordinatesOriginal.index : GrammarParser.getNextFreeIndex(targetElement.inputs);

                for(let offset = 0; offset <= wire.more; offset++) {
                    if(targetElement.inputs[targetInputIndex + offset] && targetElement.inputs[targetInputIndex + offset].name !== element.element.name) {
                        throw new Error(element.element.name + ", wire index " + i + ": target element input index " + (targetInputIndex + offset) + " is occupied");
                    }
                }

                let connectorCoordinateOutputIndex = outputIndex + Math.floor(wire.more / 2);

                let lastCoordinates: CombinedGraphicalElement.ConnectorCoordinatesReference = {
                    name: lastCoordinatesOriginal.name,
                    connector: lastCoordinatesOriginal.connector,
                    index: targetInputIndex + Math.floor(wire.more / 2)
                };


                let wireName = elementName + "_o" + outputIndex + "_" + targetElementName + "_i" + targetInputIndex + "_wire";

                if(elementsMap[wireName] || wireNamesMap[wireName]) {
                    throw new Error(element.element.name + ", wire index " + i + ": cannot assign wire name " + wireName + " because it is already used");
                }

                wireNamesMap[wireName] = true;

                let initialValue = wire.initialValue !== null ? wire.initialValue : undefined;

                let graphicalWire = new GraphicalWire(wireName, initialValue, 1 + wire.more);

                let wireInputs = [];
                for(let offset = 0; offset <= wire.more; offset++) {
                    wireInputs.push({
                        name: elementName,
                        outputIndex: outputIndex + offset
                    });
                }

                wireDescriptions.push({
                    name: wireName,
                    element: noElementInstancesForTesting ? ("GraphicalWire" as any) : graphicalWire,
                    height: "auto",
                    inputs: wireInputs,
                    externalOutputs: [],
                    coordinates: [
                        {
                            name: elementName,
                            connector: "output",
                            index: connectorCoordinateOutputIndex
                        },
                        ...(wire.coordinates.slice(0, wire.coordinates.length - 1)),
                        lastCoordinates
                    ]
                });


                for(let offset = 0; offset <= wire.more; offset++) {
                    targetElement.inputs[targetInputIndex + offset] = {
                        name: wireName,
                        outputIndex: offset
                    };
                }

            }

        }

        for(let parsedElement of elements) {

            let elementName = parsedElement.name;
            let element = elementsMap[elementName];

            if(!element.element) {
                continue;
            }

            let numInputs = 0;
            for(let index in element.inputs) {
                numInputs++;
            }

            let inputs = new Array<CombinedGraphicalElement.InputDescription>(numInputs);
            for(let i = 0; i < inputs.length; i++) {
                if(!element.inputs[i]) {
                    throw new Error("element " + elementName + ": input index " + i + " is not connected");
                }

                inputs[i] = element.inputs[i];
            }

            let numWireOutputs = 0;
            for(let wire of element.element.wires) {
                numWireOutputs++;
                numWireOutputs += wire.more;
            }

            let numExternalOutputs = 0;
            for(let externalOutput of element.element.externalOutputs) {
                numExternalOutputs++;
                numExternalOutputs += externalOutput.more;
            }

            let externalOutputs = new Array<number>(numExternalOutputs);
            let i = 0;
            for(let externalOutput of element.element.externalOutputs) {
                for(let j = 0; j <= externalOutput.more; j++) {
                    externalOutputs[i] = externalOutput.outputIndex + j;
                    i++;
                }
            }

            let graphicalElement = GrammarParser.makeElement(element, inputs, numWireOutputs + numExternalOutputs);

            elementDescriptions.push({
                name: elementName,
                element: noElementInstancesForTesting ? (graphicalElement.constructor.name as any) : graphicalElement,
                height: "auto",
                inputs: inputs,
                externalOutputs: externalOutputs,
                coordinates: [element.element.base]
            });

        }

        return {
            height: params.height,
            stepsPerSecond: params.stepsPerSecond >= 0 ? params.stepsPerSecond : undefined,
            cyclesPerStep: params.cyclesPerStep > 0 ? params.cyclesPerStep : undefined,
            delayPerWindowHeight: params.delayPerWindowHeight < 0 ? undefined : params.delayPerWindowHeight,
            echoData: params.echoData,
            echoFunctions: params.echoFunctions,
            disableGraphics: params.disableGraphics,
            wiringDescriptions: [
                ...elementDescriptions,
                ...wireDescriptions
            ]
        };

    }

    private static getNextFreeIndex(map: {[index: number]: any}) {

        for(let i = 0;; i++) {
            if(map[i] === undefined) {
                return i;
            }
        }

    }

    private static makeAutoSource(elementName: string, inputIndex: number, xDelta: number, yDelta: number): GrammarParser.Element {

        let sourceName = `autosource_${elementName}_input${inputIndex}`;

        return {
            name: sourceName,
            type: "source",
            parameters: [],
            base: {
                base: {
                    connector: "output",
                    index: 0
                },
                coordinates: {
                    x: {
                        delta: xDelta,
                        from: {
                            name: elementName,
                            connector: "input",
                            index: inputIndex
                        }
                    },
                    y: {
                        delta: yDelta,
                        from: {
                            name: elementName,
                            connector: "input",
                            index: inputIndex
                        }
                    }
                }
            },
            outsideInputs: [],
            externalOutputs: [],
            wires: [
                {
                    outputIndex: 0,
                    more: 0,
                    coordinates: [
                        {
                            name: elementName,
                            connector: "input",
                            index: inputIndex
                        }
                    ],
                    initialValue: null
                }
            ]
        };

    }

    private static parseParameters<T extends {[key: string]: GrammarParser.ParameterDescription<any>}>(elementName: string|undefined, typeName: string|undefined, values: GrammarParser.Parameter[], parameters: T) {

        let elementNameDesc = elementName ? `element ${elementName}` : "root";
        let typeNameDesc = typeName ? `type ${typeName}` : "config";

        let parameterValues: {[P in keyof T]: T[P]["default"]} = {} as any;

        for(let value of values) {

            let paramDesc = parameters[value.key];

            if(!paramDesc) {
                throw new Error(`${elementNameDesc}: unknown parameter for ${typeNameDesc}: ${value.key}`);
            }

            let paramValue: any;

            if(paramDesc.parse) {

                try {
                    paramValue = paramDesc.parse(value.value);
                } catch(e) {
                    throw new Error(`${elementNameDesc}: parsing of parameter ${value.key} failed for ${typeNameDesc}: ` + e.name + ": " + e.message + "\n" + e.stack);
                }

            } else if((typeof paramDesc.default) === "number") {

                paramValue = parseInt(value.value);

                if(isNaN(paramValue)) {
                    throw new Error(`${elementNameDesc}: parsing of parameter ${value.key} failed for ${typeNameDesc}: number expected, got: ${value.value}`);
                }

            } else if((typeof paramDesc.default) === "boolean") {

                if(value.value !== "true" && value.value !== "false") {
                    throw new Error(`${elementNameDesc}: parsing of parameter ${value.key} failed for ${typeNameDesc}: boolean expected, got: ${value.value}`);
                }

                paramValue = (value.value === "true");

            } else {

                paramValue = value.value;

            }

            parameterValues[value.key] = paramValue;

        }

        for(let parameterName in parameters) {

            if(!parameterValues.hasOwnProperty(parameterName)) {

                let parameterInfo = parameters[parameterName];

                if(parameterInfo.required) {
                    throw new Error(`${elementNameDesc}: missing parameter ${parameterName} for ${typeNameDesc}`);
                } else {
                    parameterValues[parameterName] = parameterInfo.default;
                }

            }

        }

        for(let parameterName in parameterValues) {

            let paramDesc = parameters[parameterName];

            if(paramDesc.check) {

                let paramValue = parameterValues[parameterName];

                if(!paramDesc.check(paramValue)) {
                    throw new Error(`element ${elementName}: parsing of parameter ${parameterName} failed for ${typeNameDesc}: check function returned false for value ${paramValue}: ${paramDesc.check.toString()}`);
                }

            }

        }

        return parameterValues;

    }

    private static makeElement(processedElement: GrammarParser.ProcessedElement, inputs: CombinedGraphicalElement.InputDescription[], numOutputs: number): GraphicalElement {

        let element = processedElement.element!;

        let type = element.type;

        switch(type) {
            case "nor": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_INIT_OVERRIDEHEIGHT_MIRRORCONNECTORS);
                return new GraphicalNor(element.name, inputs.length, params.init, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.mirrorConnectors);
            }
            case "or": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT_MIRRORCONNECTORS);
                return new GraphicalOr(element.name, inputs.length, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.mirrorConnectors);
            }
            case "and": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT);
                return new GraphicalAnd(element.name, inputs.length, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined);
            }
            case "xor": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT);
                return new GraphicalXor(element.name, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined);
            }
            case "sink": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {});
                return new GraphicalSinkTerminal(element.name);
            }
            case "source": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {});
                return new GraphicalSourceTerminal(element.name, false);
            }
            case "split": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_INIT_OVERRIDEHEIGHT,
                    numInBits: {
                        default: inputs.length,
                        check: (n) => n >= 0
                    },
                    numOutChannels: {
                        default: numOutputs / Math.max(inputs.length, 1)
                    },
                    line: {
                        default: false
                    },
                    displayValue: {
                        default: "" as ""|"aboveLeft"|"aboveRight"|"belowLeft"|"belowRight",
                        check: (s) => s === "" || s === "aboveLeft" || s === "aboveRight" || s === "belowLeft" || s === "belowRight"
                    }
                });
                return new GraphicalSplit(element.name, params.numOutChannels, params.numInBits, params.line, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.init, params.displayValue ? params.displayValue : undefined);
            }
            case "decoder": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT_MIRRORCONNECTORS,
                    numInBits: {
                        default: Math.max(inputs.length, Math.ceil(Math.log2(numOutputs))),
                        check: (n) => n > 0
                    }
                });
                return new GraphicalDecoder(element.name, params.numInBits, params.detailed, params.mirrorConnectors, params.overrideHeight >= 0 ? params.overrideHeight : undefined);
            }
            case "rsff": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_INIT);
                return new GraphicalRSFlipFlop(element.name, params.init);
            }
            case "dff": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, GrammarParser.PARAMS_DETAILED_INIT);
                return new GraphicalDFlipFlop(element.name, params.detailed, params.init);
            }
            case "reg": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT,
                    numInBits: {
                        default: Math.max(numOutputs, inputs.length - 1),
                        check: (n) => n >= 0
                    },
                    mirrorConnectors: {
                        default: false
                    },
                    readOnly: {
                        default: false
                    },
                    initHex: {
                        default: ""
                    }
                });
                return new GraphicalRegister(element.name, params.numInBits, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.mirrorConnectors, params.readOnly, params.initHex.length ? params.initHex : undefined);
            }
            case "mux": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT,
                    numInChannels: {
                        default: Math.ceil(inputs.length / (numOutputs + 1)),
                        check: (n) => n > 0
                    },
                    numOutBits: {
                        default: numOutputs,
                        check: (n) => n > 0
                    },
                    wireDist: {
                        default: -1
                    },
                    mirrorConnectors: {
                        default: false
                    }
                });
                return new GraphicalMultiplexer(element.name, params.numInChannels, params.numOutBits, params.detailed, params.wireDist >= 0 ? params.wireDist : undefined, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.mirrorConnectors);
            }
            case "ha": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT,
                    additionalAndOutput: {
                        default: false
                    }
                });
                return new GraphicalHalfAdder(element.name, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.additionalAndOutput);
            }
            case "fa": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    ...GrammarParser.PARAMS_DETAILED_OVERRIDEHEIGHT,
                    additionalAndOutput: {
                        default: false
                    }
                });
                return new GraphicalFullAdder(element.name, params.detailed, params.overrideHeight >= 0 ? params.overrideHeight : undefined, params.additionalAndOutput);
            }
            case "micro16": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    code: {
                        default: "",
                        required: true
                    },
                    instructionDelay: {
                        default: -1
                    },
                    aluDelay: {
                        default: -1
                    },
                    registersDelay: {
                        default: -1
                    }
                });
                return new GraphicalMicro16(element.name, params.code, params.instructionDelay >= 0 ? params.instructionDelay : undefined, params.aluDelay >= 0 ? params.aluDelay : undefined, params.registersDelay >= 0 ? params.registersDelay : undefined);
            }
            case "micro16regs": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {});
                return new GraphicalMicro16Registers(element.name);
            }
            case "micro16alu": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {});
                return new GraphicalMicro16Alu(element.name);
            }
            case "micro16mic": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {});
                return new GraphicalMicro16Mic(element.name);
            }
            case "micro16store": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    code: {
                        default: "",
                        required: true
                    }
                });
                return new GraphicalMicro16Store(element.name, params.code);
            }
            case "micro16clock": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    instructionDelay: {
                        default: -1
                    },
                    aluDelay: {
                        default: -1
                    },
                    registersDelay: {
                        default: -1
                    }
                });
                return new GraphicalMicro16Clock(element.name, params.instructionDelay >= 0 ? params.instructionDelay : undefined, params.aluDelay >= 0 ? params.aluDelay : undefined, params.registersDelay >= 0 ? params.registersDelay : undefined);
            }
            case "manynors": {
                let params = GrammarParser.parseParameters(element.name, type, element.parameters, {
                    n: {
                        default: 1,
                        check: (n) => n > 0,
                        required: true
                    }
                });
                return new GraphicalManyNors(element.name, params.n);
            }
        }

        throw new NeverError(type, "element " + element.name + ": unknown type: " + element.type);

    }

}

export namespace GrammarParser {

    export const DEFAULT_TOTAL_HEIGHT = 600;

    export interface ParameterDescription<S> {
        default: S;
        required?: boolean,
        parse?: (value: string) => S,
        check?: (value: S) => boolean
    }

    export const PARAMS_DETAILED = {
        detailed: {
            default: false
        }
    };

    export const PARAMS_INIT = {
        init: {
            default: false
        }
    };

    export const PARAMS_OVERRIDEHEIGHT = {
        overrideHeight: {
            default: -1
        }
    };

    export const PARAMS_MIRRORCONNECTORS = {
        mirrorConnectors: {
            default: false
        }
    };

    export const PARAMS_DETAILED_INIT = {
        ...PARAMS_DETAILED,
        ...PARAMS_INIT
    };

    export const PARAMS_DETAILED_OVERRIDEHEIGHT = {
        ...PARAMS_DETAILED,
        ...PARAMS_OVERRIDEHEIGHT
    };

    export const PARAMS_DETAILED_OVERRIDEHEIGHT_MIRRORCONNECTORS = {
        ...PARAMS_DETAILED_OVERRIDEHEIGHT,
        ...PARAMS_MIRRORCONNECTORS
    };

    export const PARAMS_INIT_OVERRIDEHEIGHT = {
        ...PARAMS_INIT,
        ...PARAMS_OVERRIDEHEIGHT
    };

    export const PARAMS_INIT_OVERRIDEHEIGHT_MIRRORCONNECTORS = {
        ...PARAMS_INIT_OVERRIDEHEIGHT,
        ...PARAMS_MIRRORCONNECTORS
    };

    //

    export type ElementType = "nor"|"or"|"and"|"xor"|"source"|"sink"|"split"|"decoder"|"rsff"|"dff"|"reg"|"mux"|"ha"|"fa"|"micro16"|"micro16regs"|"micro16alu"|"micro16mic"|"micro16store"|"micro16clock"|"manynors";

    export type ElementBase = CombinedGraphicalElement.BasedCoordinatesDescription|CombinedGraphicalElement.CoordinatesValueDescription;

    export interface ElementOutsideInput {
        inputIndex: null|CombinedGraphicalElement.OwnConnectorCoordinatesReference["index"];
        outputIndex: CombinedGraphicalElement.OwnConnectorCoordinatesReference["index"];
        more: number;
    }

    export interface ElementExternalOutput {
        outputIndex: CombinedGraphicalElement.OwnConnectorCoordinatesReference["index"];
        more: number;
    }

    export interface ElementWire {
        outputIndex: null|CombinedGraphicalElement.OwnConnectorCoordinatesReference["index"];
        more: number;
        coordinates: CombinedGraphicalElement.RemoteCoordinatesDescription[];
        initialValue: null|boolean;
    }

    export interface Parameter {
        key: string;
        value: string;
    }

    export interface Element {
        name: CombinedGraphicalElement.WiringDescription["name"];
        type: ElementType;
        parameters: Parameter[];
        base: ElementBase;
        outsideInputs: ElementOutsideInput[];
        externalOutputs: ElementExternalOutput[];
        wires: ElementWire[];
    }

    export interface Parsed {
        config: Parameter[];
        elements: Element[];
    }

    export interface ProcessedElement {
        inputs: InputLocationsMap;
        outputs: OutputsMap;
        element: Element|undefined; // undefined for known, outside-defined elements
    }

    export interface InputLocationsMap {
        [index: number]: CombinedGraphicalElement.InputDescription;
    }

    export interface OutputsMap {
        [index: number]: true;
    }

    //

    export type ParseResult = {
        height: number;
        stepsPerSecond: number|undefined;
        cyclesPerStep: number|undefined;
        delayPerWindowHeight: number|undefined;
        echoData: boolean;
        echoFunctions: boolean;
        disableGraphics: boolean;
        wiringDescriptions: CombinedGraphicalElement.WiringDescription[];
    };

}
