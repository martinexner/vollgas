import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class Micro16Clock extends LogicElement {

    private delays: number[];

    constructor(name: string, instructionDelay = 800, aluDelay = 1400, registersDelay = 400) {
        super(name, 0, 3);
        this.delays = [instructionDelay, aluDelay, registersDelay];
    }

    makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations {

        let calculations: LogicElement.Calculations = {
            calculations: [],
            outputAddresses: []
        };

        let delaySum = 0;
        for(let delay of this.delays) {
            delaySum += delay;
        }

        let onDurationSoFar = 0;

        for(let i = 0; i < this.delays.length; i++) {

            let address = new ConnectedElement.StaticAddress({
                space: outputSpace,
                address: i,
                hint: `static output address for output ${i} of micro16 clock ${this.getName()}`
            });

            calculations.calculations.push({
                target: address,
                value: {
                    type: "AlternatingValue",
                    onDuration: this.delays[i],
                    offDuration: delaySum - this.delays[i],
                    startOffset: delaySum - onDurationSoFar
                }
            });

            onDurationSoFar += this.delays[i];

            calculations.outputAddresses.push(address);

        }

        return calculations;

    }

    makeUpdateFunctions() {
        return [];
    }
    
}