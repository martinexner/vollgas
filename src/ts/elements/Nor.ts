import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class Nor extends LogicElement {

    private additionalDelayBufferAddress: ConnectedElement.RotatingAddress|undefined = undefined;

    constructor(name: string, numInputs: number, initialValue: boolean = false, private additionalDelay: number = 0) {
        super(name, numInputs, 1, initialValue);

        if(numInputs <= 0) {
            throw new Error(`${this.getName()}: need at least one input`);
        }
    }

    makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations {

        let norAddresses: ConnectedElement.StaticAddress[] = [];

        for(let i = 0; i < this.numInputs; i++) {
            norAddresses.push(new ConnectedElement.StaticAddress({
                space: inputSpace,
                address: i,
                hint: `static input address for input ${i} of nor ${this.getName()}`
            }));
        }

        let outputAddress = new ConnectedElement.StaticAddress({
            space: outputSpace,
            address: 0,
            hint: `static output address of nor ${this.getName()}`
        });

        let resultTargetAddress: ConnectedElement.Address = outputAddress;

        let calculations: ConnectedElement.Calculation[] = [];

        if(this.additionalDelay) {
            this.additionalDelayBufferAddress = new ConnectedElement.RotatingAddress({
                space: outputSpace,
                address: 1,
                mod: this.additionalDelay,
                startOffset: 0,
                hint: `additional output delay buffer address for ${this.getName()}`
            });

            resultTargetAddress = this.additionalDelayBufferAddress;

            // copy the oldest value from the delay buffer to the output address
            calculations.push({
                target: outputAddress,
                value: resultTargetAddress
            });
        }

        calculations.push({
            target: resultTargetAddress,
            value: {
                type: "NotRule",
                value: {
                    type: "OrRule",
                    value: norAddresses
                }
            }
        });

        return {
            calculations: calculations,
            outputAddresses: [outputAddress]
        };

    }

    makeUpdateFunctions() {
        return [];
    }

    getInitiallyTrueAddresses() {

        let addresses: ConnectedElement.StaticAddress[] = [];

        if(this.initialValue) {

            addresses.push(...this.outputAddresses);

            if(this.additionalDelayBufferAddress) {
                addresses.push(...this.additionalDelayBufferAddress.getAllAddresses());
            }

        }

        return addresses;

    }

}
