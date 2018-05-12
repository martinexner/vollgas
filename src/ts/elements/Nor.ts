import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class Nor extends LogicElement {

    constructor(name: string, numInputs: number, initialValue: boolean = false) {
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

        return {
            calculations: [
                {
                    target: outputAddress,
                    value: {
                        type: "NotRule",
                        value: {
                            type: "OrRule",
                            value: norAddresses
                        }
                    }
                }
            ],
            outputAddresses: [outputAddress]
        };

    }

    makeUpdateFunctions() {
        return [];
    }

}