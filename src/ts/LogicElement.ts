import { ConnectedElement } from "./ConnectedElement";


export abstract class LogicElement implements ConnectedElement {

    abstract makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations;
    abstract makeUpdateFunctions(): LogicElement.UpdateFunction[];

    //
    
    private inputValueAddressProviders: (ConnectedElement.OutputValueAddressProvider|undefined)[];

    protected outputAddresses: ConnectedElement.StaticAddress[];
    private generatedInputAddresses: ConnectedElement.StaticAddress[];

    private inputSpace: ConnectedElement.Space;

    constructor(private name: string, protected readonly numInputs: number, protected readonly numOutputs: number, protected readonly initialValue: boolean = false) {

        this.inputValueAddressProviders = new Array(numInputs);
        this.generatedInputAddresses = new Array(numInputs);

    }

    getName() {
        return this.name;
    }

    getOwnType() {
        return "LogicElement/" + this.constructor.name;
    }

    getDelay() {
        return 0;
    }

    getChildren() {
        return [];
    }

    readInputFrom(inputIndex: number, sourceElement: ConnectedElement, sourceOutputIndex: number) {

        if(inputIndex < this.inputValueAddressProviders.length) {

            if(sourceOutputIndex >= sourceElement.getNumOutputs()) {
                throw new Error(this.name + ": need output index " + sourceOutputIndex + ", but " + sourceElement.getName() + " only has " + sourceElement.getNumOutputs() + " outputs");
            }

            this.inputValueAddressProviders[inputIndex] = sourceElement.getOutputValueAddressProvider(sourceOutputIndex);

        } else {
            throw new Error(this.name + ": input index " + inputIndex + " is out of bounds for this element");
        }

    }

    getNumOutputs() {
        return this.numOutputs;
    }

    getOutputValueAddressProvider(outputIndex: number) {

        if(outputIndex >= this.numOutputs) {
            throw new Error(`${this.getName()}: output index ${outputIndex} is out of bounds for this element`);
        }

        return () => this.outputAddresses[outputIndex];

    }

    getWriteOutputsCalculations(space: ConnectedElement.Space) {

        this.inputSpace = space;
        space = space.getNew();

        let calculations = this.makeCalculations(this.inputSpace, space);

        if(calculations.outputAddresses.length !== this.numOutputs) {
            throw new Error(`${this.getName()}: expected ${this.numOutputs} output addresses, but got ${calculations.outputAddresses.length}`);
        }

        for(let outputAddress of calculations.outputAddresses) {
            if(outputAddress.info.space !== space) {
                throw new Error(`${this.getName()}: output addresses need to be in outputSpace`);
            }
        }

        this.outputAddresses = calculations.outputAddresses;

        return calculations.calculations;
        
    }

    getReadInputsCalculations() {

        let calculations: ConnectedElement.Calculation[] = [];

        for(let i = 0; i < this.inputValueAddressProviders.length; i++) {

            let addressProvider = this.inputValueAddressProviders[i];

            if(!addressProvider) {
                throw new Error(this.getName() + ": input " + i + " is not connected");
            }

            let inputValueAddress = addressProvider();

            let generatedInputAddress = new ConnectedElement.StaticAddress({
                address: i,
                space: this.inputSpace,
                hint: `automatically generated static input address of logic element ${this.getName()}`
            });

            this.generatedInputAddresses[i] = generatedInputAddress;

            calculations.push({
                target: generatedInputAddress,
                value: inputValueAddress
            });

        }

        return calculations;

    }

    getUpdateFunctions() {

        let functions = this.makeUpdateFunctions();

        let updateFunctions: ConnectedElement.UpdateFunction[] = [];

        for(let func of functions) {

            let inputValues = new Array<boolean>(this.generatedInputAddresses.length);
            let outputValues = new Array<boolean>(this.outputAddresses.length);

            let inputAddresses = this.generatedInputAddresses;

            if(func.reverseInputs) {
                inputAddresses = inputAddresses.slice().reverse();
            }

            updateFunctions.push({
                function: () => func.function(inputValues, outputValues),
                interval: func.interval,
                inputAddresses: inputAddresses,
                inputValues: inputValues,
                outputAddresses: this.outputAddresses,
                outputValues: outputValues
            });

        }

        return updateFunctions;

    }

    getInitiallyTrueAddresses() {

        return this.initialValue ? this.outputAddresses : [];

    }

}

export namespace LogicElement {

    export type Calculations = {
        calculations: ConnectedElement.Calculations;
        outputAddresses: ConnectedElement.StaticAddress[];
    }

    export type UpdateFunction = {
        function: (inputValues: boolean[], outputValues: boolean[]) => boolean;
        interval: number;
        reverseInputs?: boolean;
    }

}
