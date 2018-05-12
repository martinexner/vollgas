import { ConnectedElement } from "../ConnectedElement";

export class Split implements ConnectedElement {

    private inputValueAddressProviders: ConnectedElement.OutputValueAddressProvider[];
    private fixedValueAddress: ConnectedElement.StaticAddress;

    constructor(private name: string, private numOutChannels: number, private numInBits: number, private initialValue = false) {
        this.inputValueAddressProviders = new Array(numInBits);
    }

    getName() {
        return this.name;
    }

    getOwnType() {
        return this.constructor.name;
    }

    getDelay() {
        return 0;
    }

    getChildren() {
        return [];
    }

    readInputFrom(inputIndex: number, sourceElement: ConnectedElement, sourceOutputIndex: number) {
        this.inputValueAddressProviders[inputIndex] = sourceElement.getOutputValueAddressProvider(sourceOutputIndex);
    }

    getNumOutputs() {
        return this.numOutChannels * this.numInBits;
    }

    getOutputValueAddressProvider(outputIndex: number) {
        if(this.numInBits) {
            return () => this.inputValueAddressProviders[outputIndex % this.inputValueAddressProviders.length]();
        } else {
            return () => this.fixedValueAddress;
        }
    }

    getWriteOutputsCalculations(space: ConnectedElement.Space) {

        this.fixedValueAddress = new ConnectedElement.StaticAddress({
            space: space,
            address: 0,
            hint: `static fixed value address for split ${this.getName()}`
        });

        return [];

    }

    getReadInputsCalculations() {

        if(this.numInBits) {
            for(let i = 0; i < this.inputValueAddressProviders.length; i++) {
                if(!this.inputValueAddressProviders[i]) {
                    throw new Error(this.getName() + ": input " + i + " is not connected");
                }
            }
        }

        return [];

    }

    getUpdateFunctions() {
        return [];
    }

    getInitiallyTrueAddresses() {

        if(!this.numInBits && this.initialValue) {
            return [this.fixedValueAddress];
        } else {
            return [];
        }

    }

}