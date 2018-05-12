import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class SourceTerminal extends LogicElement {

    constructor(name: string, private source: () => boolean) {
        super(name, 0, 1, source());
    }

    makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations {

        let address = new ConnectedElement.StaticAddress({
            space: outputSpace,
            address: 0,
            hint: `static output address for source terminal ${this.getName()}`
        });

        return {
            calculations: [],
            outputAddresses: [address]
        };

    }

    makeUpdateFunctions(): LogicElement.UpdateFunction[] {

        return [{
            function: (inputValues, outputValues) => {
                outputValues[0] = this.source();
                return true;
            },
            interval: 1
        }];

    }
    
}