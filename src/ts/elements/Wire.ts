import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class Wire implements ConnectedElement {

    private inputValueAddressProviders: ConnectedElement.OutputValueAddressProvider[];
    private outputAddresses: ConnectedElement.StaticAddress[];
    private delayBufferAddresses: ConnectedElement.RotatingAddress[];

    private delay: number;

    private writeOutputCalculations: ConnectedElement.Calculation[];

    constructor(private name: string, delay: number, private initialValue = false, num = 1) {

        if(delay < 0) {
            delay = 0;
        }

        this.delay = delay;

        this.inputValueAddressProviders = new Array(num);

        if(this.delay) {
            this.outputAddresses = new Array(num);
            this.delayBufferAddresses = new Array(num);
        }

    }

    getName() {
        return this.name;
    }

    getOwnType() {
        return this.constructor.name;
    }

    getDelay() {
        return this.delay;
    }

    getChildren() {
        return [];
    }

    readInputFrom(inputIndex: number, sourceElement: ConnectedElement, sourceOutputIndex: number) {

        if(inputIndex >= this.inputValueAddressProviders.length) {
            throw new Error(this.getName() + ": input index " + inputIndex + " is out of bounds");
        }

        this.inputValueAddressProviders[inputIndex] = sourceElement.getOutputValueAddressProvider(sourceOutputIndex);

    }

    getNumOutputs() {
        return this.inputValueAddressProviders.length;
    }

    getOutputValueAddressProvider(outputIndex: number) {
        if(this.delay) {
            return () => this.outputAddresses[outputIndex];
        } else {
            return () => this.inputValueAddressProviders[outputIndex]();
        }
    }

    getDelayBufferAddressProvider(outputIndex: number) {
        return () => this.delayBufferAddresses[outputIndex];
    }

    getWriteOutputsCalculations(space: ConnectedElement.Space) {

        for(let i = 0; i < this.inputValueAddressProviders.length; i++) {
            if(!this.inputValueAddressProviders[i]) {
                throw new Error(this.getName() + ": input " + i + " is not connected");
            }
        }

        this.writeOutputCalculations = [];

        if(this.delay) {

            for(let i = 0; i < this.inputValueAddressProviders.length; i++) {

                let outputSourceAddress = new ConnectedElement.StaticAddress({
                    space: space,
                    address: i,
                    hint: `wire output address for channel ${i} of ${this.getName()}`
                });

                this.outputAddresses[i] = outputSourceAddress;

                let inputTargetAddress = new ConnectedElement.RotatingAddress({
                    space: space,
                    address: this.inputValueAddressProviders.length + i*this.delay,
                    mod: this.delay,
                    startOffset: 0,
                    hint: `wire input address for channel ${i} of ${this.getName()}`
                });

                this.delayBufferAddresses[i] = new ConnectedElement.RotatingAddress({
                    ...inputTargetAddress.info,
                    startOffset: 1,
                    hint: `wire delay buffer read address for channel ${i} of ${this.getName()}`
                });

                this.writeOutputCalculations.push({
                    target: inputTargetAddress,
                    value: undefined! // will be set in getReadInputsCalculations()
                });

            }

        }

        return this.writeOutputCalculations;

    }

    getReadInputsCalculations() {

        let calculations: ConnectedElement.Calculation[] = [];

        if(this.delay) {

            for(let i = 0; i < this.inputValueAddressProviders.length; i++) {

                let inputSourceAddress = this.inputValueAddressProviders[i]();

                if(!inputSourceAddress) {
                    throw new Error(`${this.getName()}: input provider ${i} failed to provide an address`);
                }

                let writeOutputCalculation = this.writeOutputCalculations[i];

                writeOutputCalculation.value = inputSourceAddress;

                calculations.push({
                    target: this.outputAddresses[i],
                    value: writeOutputCalculation.target!
                });

            }

        }

        return calculations;

    }

    getUpdateFunctions() {
        return [];
    }

    getInitiallyTrueAddresses() {

        let addresses: ConnectedElement.StaticAddress[] = [];

        if(this.delay && this.initialValue) {

            for(let i = 0; i < this.delayBufferAddresses.length; i++) {

                let rotatingAddress = this.delayBufferAddresses[i];

                for(let j = 0; j < rotatingAddress.info.mod; j++) {
                    addresses.push(new ConnectedElement.StaticAddress({
                        space: rotatingAddress.info.space,
                        address: rotatingAddress.info.address + j,
                        hint: `static wire delay buffer address for channel ${i} of ${this.getName()}`
                    }));
                }

            }

            addresses.push(...this.outputAddresses);

        }

        return addresses;

    }

}