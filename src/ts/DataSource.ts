import { ConnectedElement } from "./ConnectedElement";
import { NeverError } from "./NeverError";
import { Circuit } from "./Circuit";

const nOffset = 2;

export class DataSource {

    addressArray: Uint32Array;
    array: Uint8Array;

    n = -1;

    public readonly addressesOffset: number;
    public readonly numAddresses: number;
    public readonly dataOffset: number;
    public readonly numData: number;

    constructor(private targetNumBytes: number, moduloOperations: ConnectedElement.IRotatingAddress[], private moduloOperationsMap: Circuit.ModuloOperationsMap) {

        this.addressesOffset = nOffset;
        this.numAddresses = moduloOperations.length;
        this.dataOffset = 4 * (this.addressesOffset + this.numAddresses);
        this.numData = targetNumBytes - this.dataOffset;

    }

    getTargetNumBytes() {
        return this.targetNumBytes;
    }

    setBuffer(buffer: ArrayBuffer) {
        this.array = new Uint8Array(buffer);
        this.addressArray = new Uint32Array(buffer);
    }

    getAddressValueReader(address: ConnectedElement.Address) {

        if(address.type === "StaticAddress") {

            let index = address.info.address;
            return () => this.array[index] === 1;

        } else if(address.type === "RotatingAddress") {

            const mod = address.info.mod;
            const offset = address.info.address;
            const moduloOperationIndex = this.moduloOperationsMap[address.info.mod][address.info.startOffset];
            return (localOffset = 0) => this.array[offset + ((this.addressArray[moduloOperationIndex] + localOffset) % mod)] === 1;

        } else {
            
            throw new NeverError(address, "unexpected address type");

        }

    }

    getAddressValueWriter(address: ConnectedElement.Address) {

        if(address.type === "StaticAddress") {

            let index = address.info.address;
            return (value: boolean) => this.array[index] = (value ? 1 : 0);

        } else if(address.type === "RotatingAddress") {

            const mod = address.info.mod;
            const offset = address.info.address;
            const moduloOperationIndex = this.moduloOperationsMap[address.info.mod][address.info.startOffset];
            return (value: boolean, localOffset = 0) => this.array[offset + ((this.addressArray[moduloOperationIndex] + localOffset) % mod)] = (value ? 1 : 0);

        } else {
            
            throw new NeverError(address, "unexpected address type");

        }

    }

}

export namespace DataSource {

    export class RotatingAddressInstance {
        rotatingAddress: ConnectedElement.RotatingAddress;
        currentLocalIndex: number;
    }

    export type RotatingAddressInfo = {
        array: Uint8Array;
        getCurrentIndex: () => number;
        addressOffset: number;
        mod: number;
    }

}