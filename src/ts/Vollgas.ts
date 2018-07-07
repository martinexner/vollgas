import { GrammarParser } from "./grammar/GrammarParser";
import { CombinedGraphicalElement } from "./graphics/CombinedGraphicalElement";
import { GraphicalCircuit } from "./graphics/GraphicalCircuit";

export default class Vollgas {

    public static usingGrammar(descriptions: string[]) {
        let parseResult = GrammarParser.parse(descriptions);
        return new Vollgas(parseResult);
    }

    public static from(description: GrammarParser.Parsed) {
        let parseResult = GrammarParser.fromParsed(description);
        return new Vollgas(parseResult);
    }

    //

    private graphicalCircuit: GraphicalCircuit;

    constructor(public parseResult: GrammarParser.ParseResult) {

    }

    async init(): Promise<any> {

        let element = new CombinedGraphicalElement("root_element", this.parseResult.height, this.parseResult.wiringDescriptions);

        this.graphicalCircuit = new GraphicalCircuit(element, this.parseResult.disableGraphics, this.parseResult.stepsPerSecond, this.parseResult.delayPerWindowHeight, this.parseResult.echoData, this.parseResult.cyclesPerStep, this.parseResult.additionalNorDelay);

        await this.graphicalCircuit.init(this.parseResult.echoFunctions);

        if(!this.parseResult.disableGraphics) {
            return this.graphicalCircuit.app!.view;
        } else {
            return undefined;
        }

    }

    manualStep(numSteps?: number) {
        this.graphicalCircuit.circuit.step(numSteps);
    }

    manualStepAndRedraw(numSteps?: number) {
        this.manualStep(numSteps);
        this.graphicalCircuit.graphicalElement.redraw(0);
    }

}
