import { NeverError } from "./NeverError";

export interface ConnectedElement {

    getName(): string;

    getOwnType(): string|undefined;
    getDelay(): number;
    getChildren(): ConnectedElement[];

    getNumOutputs(): number;
    getOutputValueAddressProvider(outputIndex: number): ConnectedElement.OutputValueAddressProvider;

    readInputFrom(inputIndex: number, sourceConnectedElement: ConnectedElement, sourceOutputIndex: number): void;

    getWriteOutputsCalculations(space: ConnectedElement.Space): ConnectedElement.Calculations;
    getReadInputsCalculations(): ConnectedElement.Calculations;

    getUpdateFunctions(): ConnectedElement.UpdateFunction[];

    getInitiallyTrueAddresses(): ConnectedElement.StaticAddress[];

}

export namespace ConnectedElement {

    export type OutputValueAddressProvider = () => ConnectedElement.Address;

    //

    export class Space {

        offset = 0;
        size = 0;
        next: Space|undefined = undefined;
        addresses: Address[] = [];

        getNew() {

            if(this.next) {
                throw new Error("next Space was already created");
            }

            return this.next = new Space();

        }

        onAddress(address: Address) {
            this.addresses.push(address);
        }

        calculateSizeAndOffsetNext() {

            for(let address of this.addresses) {
                switch(address.type) {
                    case "StaticAddress": {
                        this.size = Math.max(this.size, address.info.address + 1);
                        address.info.address += this.offset;
                        break;
                    }
                    case "RotatingAddress": {
                        this.size = Math.max(this.size, address.info.address + address.info.mod);
                        address.info.address += this.offset;
                        break;
                    }
                    default: {
                        throw new NeverError(address, "unexpected address type");
                    }
                }
            }

            if(this.next) {
                this.next.offset = this.offset + this.size;
            }

        }

    };

    export type Calculations = Calculation[];

    export type Calculation = {
        target: Address|undefined;
        value: ValueSource;
    };

    export type Address = StaticAddress | RotatingAddress;

    export class StaticAddress {

        type: "StaticAddress" = "StaticAddress";

        constructor(readonly info: IStaticAddress) {
            info.space.onAddress(this);
        }

    }

    export interface IStaticAddress {
        space: Space;
        address: number;
        hint: string;
    }

    export class RotatingAddress {

        type: "RotatingAddress" = "RotatingAddress";

        constructor(readonly info: IRotatingAddress) {
            info.space.onAddress(this);
        }

        private dummy() {

        }

    }

    export interface IRotatingAddress {
        space: Space;
        address: number;
        mod: number;
        startOffset: number;
        hint: string;
    }

    export type ValueSource = Address|Rule|AlternatingValue;

    export type Rule = AndRule|OrRule|NotRule;

    export type AndRule = {
        type: "AndRule";
        value: ValueSource[];
    };

    export type OrRule = {
        type: "OrRule";
        value: ValueSource[];
    };

    export type NotRule = {
        type: "NotRule";
        value: ValueSource;
    };

    export type AlternatingValue = {
        type: "AlternatingValue";
        offDuration: number;
        onDuration: number;
        startOffset: number;
    };

    //

    export type UpdateFunction = {
        function: () => boolean;
        interval: number;
        inputAddresses: Address[];
        inputValues: boolean[];
        outputAddresses: Address[];
        outputValues: boolean[];
    }

}