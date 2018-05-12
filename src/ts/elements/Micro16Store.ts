import { LogicElement } from "../LogicElement";
import { ConnectedElement } from "../ConnectedElement";

export class Micro16Store extends LogicElement {

    private lines: boolean[][];
    private currentLineIndex = -1;

    constructor(name: string, code: string) {

        super(name, 8, 32);

        if((code.length % 8) !== 0) {
            throw new Error(`${this.getName()}: code length is ${code.length}, but needs to be a multiple of 8`);
        }

        this.lines = new Array(code.length / 8);

        for(let i = 0; i < this.lines.length; i++) {

            let instruction = parseInt(code.substr(8*i, 8), 16);
            let bits = new Array<boolean>(32);

            for(let j = 31; j >= 0; j--) {
                bits[j] = !!(instruction & 1);
                instruction >>= 1;
            }

            this.lines[i] = bits;

        }

    }

    makeCalculations(inputSpace: ConnectedElement.Space, outputSpace: ConnectedElement.Space): LogicElement.Calculations {

        let outputAddresses = [];

        for(let i = 0; i < 32; i++) {

            let address = new ConnectedElement.StaticAddress({
                space: outputSpace,
                address: i,
                hint: `static output address for output ${i} of micro16 store ${this.getName()}`
            });

            outputAddresses.push(address);

        }

        return {
            calculations: [],
            outputAddresses: outputAddresses
        };

    }

    makeUpdateFunctions(): LogicElement.UpdateFunction[] {

        return [{
            function: (inputValues, outputValues) => {

                let index = 0;

                for(let inputValue of inputValues) {
                    index <<= 1;
                    index |= (inputValue ? 1 : 0);
                }

                if(index === this.currentLineIndex) {
                    return false;
                }

                let line = (index < this.lines.length) ? this.lines[index] : undefined;

                for(let i = 0; i < outputValues.length; i++) {
                    outputValues[i] = !!(line && line[i]);
                }

                this.currentLineIndex = index;

                return true;

            },
            interval: 1, // TODO
            reverseInputs: true
        }];

    }
    
}