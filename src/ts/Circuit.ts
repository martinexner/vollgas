import { ConnectedElement } from "./ConnectedElement";
import { DataSource } from "./DataSource";
import { NeverError } from "./NeverError";
import { WasmInstance } from "./WasmInstance";

export class Circuit {

    dataSource: DataSource;

    private writeOutputsCalculations: ConnectedElement.Calculation[];
    private readInputsCalculations: ConnectedElement.Calculation[];
    private updateFunctionInstances: Circuit.UpdateFunctionInstance[];
    private initiallyTrueAddresses: ConnectedElement.StaticAddress[];

    private updateModulosFunction: (a: Uint32Array, n: number) => void;
    private writeOutputsFunction: (d: Uint8Array, a: Uint32Array, n: number) => void;
    private readInputsFunction: (d: Uint8Array, a: Uint32Array, n: number) => void;

    private wasmInstance: WasmInstance|undefined;

    private doSteps: (numSteps: number) => void;

    constructor(private element: ConnectedElement) {

        

    }

    async init(echoFunctions = false) {

        let space: ConnectedElement.Space = new ConnectedElement.Space();

        this.writeOutputsCalculations = this.element.getWriteOutputsCalculations(space);
        this.readInputsCalculations = this.element.getReadInputsCalculations();

        let updateFunctions = this.element.getUpdateFunctions();

        this.initiallyTrueAddresses = this.element.getInitiallyTrueAddresses();

        let moduloOperationsMap: Circuit.ModuloOperationsMap = {};
        let moduloOperations: ConnectedElement.IRotatingAddress[] = [];

        // those will also fill moduloOperations and moduloOperationsMap
        let readInputsFunctionProvider = this.makeFunctionProvider(this.readInputsCalculations, moduloOperations, moduloOperationsMap);
        let writeOutputsFunctionProvider = this.makeFunctionProvider(this.writeOutputsCalculations, moduloOperations, moduloOperationsMap);

        let currentSpace: ConnectedElement.Space|undefined = space;

        while(currentSpace) {

            for(let address of currentSpace.addresses) {
                // call this just so that additional rotating addresses that are not referenced by any operation directly are also added to the modulo operations list
                this.makeValueSourceAccessor(address, moduloOperations, moduloOperationsMap, true);
            }

            currentSpace = currentSpace.next;

        }

        space.offset = 8 + 4 * moduloOperations.length; // 8 bytes for n, 4 bytes per modulo result

        for(;;) {

            space.calculateSizeAndOffsetNext();

            if(!space.next) {
                break;
            }

            space = space.next;

        }

        this.updateModulosFunction = this.makeModulosUpdateFunction(moduloOperations);

        this.readInputsFunction = readInputsFunctionProvider();
        this.writeOutputsFunction = writeOutputsFunctionProvider();

        if(echoFunctions) {
            console.log("updateModulosFunction", this.updateModulosFunction.toString());

            console.log("readInputsFunction", this.readInputsFunction.toString());
            console.log("writeOutputsFunction", this.writeOutputsFunction.toString());
        }

        let calculations = [
            ...this.readInputsCalculations,
            ...this.writeOutputsCalculations
        ];

        this.dataSource = new DataSource(space.offset + space.size, moduloOperations, moduloOperationsMap);

        try {
            this.wasmInstance = new WasmInstance(this.dataSource, moduloOperations, moduloOperationsMap, calculations);
            await this.wasmInstance.instantiate();
            console.log("using wasm");
        } catch(e) {
            console.log(`wasm failed, falling back to javascript function; error:`);
            console.log(e.stack);
            this.wasmInstance = undefined;
            this.dataSource.setBuffer(new ArrayBuffer(this.dataSource.getTargetNumBytes()));
        }

        // initialize n = -1
        for(let i = 0; i < 8; i++) {
            this.dataSource.array[i] = 0xFF;
        }

        for(let address of this.initiallyTrueAddresses) {
            this.dataSource.array[address.info.address] = 1;
        }

        this.updateFunctionInstances = new Array(updateFunctions.length);
        for(let i = 0; i < updateFunctions.length; i++) {

            let updateFunction = updateFunctions[i];

            let addressReaders = new Array(updateFunction.inputAddresses.length);
            for(let j = 0; j < updateFunction.inputAddresses.length; j++) {
                addressReaders[j] = this.dataSource.getAddressValueReader(updateFunction.inputAddresses[j]);
            }

            let addressWriters = new Array(updateFunction.outputAddresses.length);
            for(let j = 0; j < updateFunction.outputAddresses.length; j++) {
                addressWriters[j] = this.dataSource.getAddressValueWriter(updateFunction.outputAddresses[j]);
            }

            this.updateFunctionInstances[i] = {
                updateFunction,
                addressReaders,
                addressWriters,
                stepsLeft: 0
            };
            
        }

        if(this.wasmInstance) {

            this.doSteps = (numSteps) => this.wasmInstance!.step(numSteps);

        } else {

            this.doSteps = (numSteps) => {

                for(let i = 0; i < numSteps; i++) {
                    this.dataSource.n++;

                    this.updateModulosFunction(this.dataSource.addressArray, this.dataSource.n);

                    this.readInputsFunction(this.dataSource.array, this.dataSource.addressArray, this.dataSource.n);
                    this.writeOutputsFunction(this.dataSource.array, this.dataSource.addressArray, this.dataSource.n);
                }

            }

        }

    }

    private getModuloOperationIndex(moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap, mod: number, startOffset: number) {

        if(!moduloOperationsMap[mod]) {
            moduloOperationsMap[mod] = {};
        }

        if(moduloOperationsMap[mod][startOffset] === undefined) {
            let index = moduloOperations.length + 2; // 2 * 4 bytes (i32 = 4 bytes) offset for n (i64)
            moduloOperationsMap[mod][startOffset] = index;
            moduloOperations.push({
                space: undefined!,
                startOffset: startOffset,
                mod: mod,
                address: index,
                hint: `modulo operation ${index}: ((n + ${startOffset}) % ${mod})`
            });
        }

        return moduloOperationsMap[mod][startOffset];

    }

    private makeFunctionProvider(calculations: ConnectedElement.Calculation[], moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => ((d: Uint8Array, a: Uint32Array, n: number) => void) {

        let lines: (() => string)[] = [];

        for(let calculation of calculations) {
            let line = this.makeLine(calculation, moduloOperations, moduloOperationsMap);
            lines.push(line);
        }

        return () => new Function("d", "a", "n", lines.map((f) => f()).join("\n")) as (d: Uint8Array, a: Uint32Array, n: number) => void;

    }

    private makeLine(calculation: ConnectedElement.Calculation, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => string {

        let targetAccessor: (() => string)|undefined = undefined;

        if(calculation.target) {
            targetAccessor = this.makeValueSourceAccessor(calculation.target, moduloOperations, moduloOperationsMap);
        }
        
        let sourceAccessor = this.makeValueSourceAccessor(calculation.value, moduloOperations, moduloOperationsMap, true);

        return () => {

            let line = "";

            if(targetAccessor) {
                line += `${targetAccessor()} = ((`;
            }
            
            line += `${sourceAccessor()}`
            
            if(targetAccessor) {
                line += `) ? 1 : 0)`;
            }

            line += ";";

            return line;

        };

    }

    private makeValueSourceAccessor(valueSource: ConnectedElement.ValueSource, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap, read = false): () => string {

        switch(valueSource.type) {
            case "StaticAddress": {
                return this.makeStaticAddressAccessor(valueSource, read);
            }
            case "RotatingAddress": {
                return this.makeRotatingAddressAccessor(valueSource, moduloOperations, moduloOperationsMap, read);
            }
            case "AndRule": {
                return this.makeAndRuleAccessor(valueSource, moduloOperations, moduloOperationsMap);
            }
            case "OrRule": {
                return this.makeOrRuleAccessor(valueSource, moduloOperations, moduloOperationsMap);
            }
            case "NotRule": {
                return this.makeNotRuleAccessor(valueSource, moduloOperations, moduloOperationsMap);
            }
            case "AlternatingValue": {
                return this.makeAlternatingValueAccessor(valueSource, moduloOperations, moduloOperationsMap);
            }
            default: {
                throw new NeverError(valueSource, "unexpected value source type");
            }
        }

    }

    private makeStaticAddressAccessor(address: ConnectedElement.StaticAddress, read = false) {
        return () => `d[${address.info.address}] /*${address.info.hint}*/` + (read ? " === 1" : "");
    }

    private makeRotatingAddressAccessor(address: ConnectedElement.RotatingAddress, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap, read = false) {

        let moduloOperationIndex = this.getModuloOperationIndex(moduloOperations, moduloOperationsMap, address.info.mod, address.info.startOffset);
        return () => `d[${address.info.address} + a[${moduloOperationIndex}]] /*${address.info.hint}*/` + (read ? " === 1" : "");

    }

    private makeAndRuleAccessor(rule: ConnectedElement.AndRule, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => string {

        let accessors = rule.value.map((subValueSource) => this.makeValueSourceAccessor(subValueSource, moduloOperations, moduloOperationsMap, true));
        return () => accessors.map((accessor) => `(${accessor()})`).join(" && ");

    }

    private makeOrRuleAccessor(rule: ConnectedElement.OrRule, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => string {

        let accessors = rule.value.map((subValueSource) => this.makeValueSourceAccessor(subValueSource, moduloOperations, moduloOperationsMap, true));
        return () => accessors.map((accessor) => `(${accessor()})`).join(" || ");

    }

    private makeNotRuleAccessor(rule: ConnectedElement.NotRule, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => string {

        let accessor = this.makeValueSourceAccessor(rule.value, moduloOperations, moduloOperationsMap, true);
        return () => `!(${accessor()})`;

    }

    private makeAlternatingValueAccessor(value: ConnectedElement.AlternatingValue, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap): () => string {

        let mod = value.offDuration + value.onDuration;
        let moduloOperationIndex = this.getModuloOperationIndex(moduloOperations, moduloOperationsMap, mod, value.startOffset);
        return () => `a[${moduloOperationIndex}] < ${value.onDuration}`;

    }

    private makeModulosUpdateFunction(moduloOperations: ConnectedElement.IRotatingAddress[]): (a: Uint32Array, n: number) => void {

        let lines: string[] = [];

        for(let operation of moduloOperations) {
            lines.push(`a[${operation.address}] = ((n + ${operation.startOffset}) % ${operation.mod}); /*${operation.hint}*/`);
        }

        return new Function("a", "n", lines.join("\n")) as (a: Uint32Array, n: number) => void;

    }

    step(numCycles = 1) {

        for(let updateFunctionInstance of this.updateFunctionInstances) {

            if(updateFunctionInstance.stepsLeft <= 0) {

                for(let i = 0; i < updateFunctionInstance.addressReaders.length; i++) {
                    updateFunctionInstance.updateFunction.inputValues[i] = updateFunctionInstance.addressReaders[i]();
                }

                let updated = updateFunctionInstance.updateFunction.function();

                if(updated) {
                    for(let i = 0; i < updateFunctionInstance.addressWriters.length; i++) {
                        updateFunctionInstance.addressWriters[i](updateFunctionInstance.updateFunction.outputValues[i]);
                    }
                }

                updateFunctionInstance.stepsLeft = updateFunctionInstance.updateFunction.interval;

            }

            updateFunctionInstance.stepsLeft -= numCycles;

        }

        this.doSteps(numCycles);

    }

}

export namespace Circuit {

    export type ModuloOperationsMap = {
        [mod: number]: {
            [startOffset: number]: number
        }
    };

    export type UpdateFunctionInstance = {
        updateFunction: ConnectedElement.UpdateFunction;
        addressReaders: (() => boolean)[];
        addressWriters: ((value: boolean) => void)[];
        stepsLeft: number;
    }

}