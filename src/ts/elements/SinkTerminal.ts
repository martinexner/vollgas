import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class SinkTerminal extends LogicElement {

    constructor(name: string, private sink: (value: boolean) => void) {
        super(name, 1, 0);
    }

    makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations {

        return {
            calculations: [],
            outputAddresses: []
        };

    }

    makeUpdateFunctions(): LogicElement.UpdateFunction[] {

        return [{
            function: (inputValues, outputValues) => {
                this.sink(inputValues[0]);
                return false;
            },
            interval: 1
        }];

    }
    
}