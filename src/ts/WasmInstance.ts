import { DataSource } from "./DataSource";
import { ConnectedElement } from "./ConnectedElement";
import { Circuit } from "./Circuit";
import { NeverError } from "./NeverError";

export class WasmInstance {

    private code: number[];

    private stepFunction: (numSteps: number) => void;

    constructor(private dataSource: DataSource, moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap, calculations: ConnectedElement.Calculation[]) {

        let testUint8Array = new Uint8Array([0x78, 0x56, 0x34, 0x12]);
        let testUint32Array = new Uint32Array(testUint8Array.buffer);

        if(testUint32Array[0] !== 0x12345678) {
            throw new Error(`system is not little-endian; this is not implemented`);
        }

        let functionBodyCode = this.makeFunctionBodyCode(moduloOperations, moduloOperationsMap, calculations);

        this.code = ([] as number[]).concat(

            WasmInstance.MAGIC_NUMBER,
            WasmInstance.VERSION,

            // type section
            this.makeTypeSectionWithHeader(),

            // import section
            this.makeImportSectionWithHeader(dataSource),

            // function section
            this.makeFunctionSectionWithHeader(),

            // export section
            this.makeExportSectionWithHeader(),

            // code section
            this.makeCodeSectionWithHeader(functionBodyCode)

        );
        
    }

    async instantiate() {

        let memory = new WebAssembly.Memory({
            initial: Math.ceil(this.dataSource.getTargetNumBytes() / WasmInstance.WASM_PAGE_SIZE),
            maximum: Math.ceil(this.dataSource.getTargetNumBytes() / WasmInstance.WASM_PAGE_SIZE)
        });

        let instance = await WebAssembly.instantiate(new Uint8Array(this.code), {
            imports: {
                memory: memory
            }
        });

        this.dataSource.setBuffer(memory.buffer);

        let stepFunction = instance.instance.exports.step;

        if(!stepFunction) {
            throw new Error(`expected step function to be exported by wasm module, got exports: ${instance.instance.exports}`);
        }

        this.stepFunction = stepFunction;

    }

    step(numSteps: number) {
        return this.stepFunction(numSteps);
    }

    private makeFunctionBodyCode(moduloOperations: ConnectedElement.IRotatingAddress[], moduloOperationsMap: Circuit.ModuloOperationsMap, calculations: ConnectedElement.Calculation[]) {

        let code: number[] = [];

        // load n and set_local it
        code.push(...WasmInstance.OPCODE.I32_CONST); // push i32 constant...
        code.push(...WasmInstance.varint(0)); // ...0 onto the stack
        code.push(...WasmInstance.OPCODE.I64_LOAD); // pop a value from the stack and load as i64...
        code.push(...WasmInstance.varuint(3)); // ...a value from memory with alignment 8 (log2(8) = 3)... TODO: is 3 or 6 (log2(64) = 6) the correct value here?
        code.push(...WasmInstance.varuint(0)); // ...from address defined by the value popped from the stack (= 0) + this offset value (also 0) = 0
        code.push(...WasmInstance.OPCODE.SET_LOCAL); // pop and set the value as the new value of...
        code.push(...WasmInstance.varuint(1)); // ...local variable 1 (= n)

        // create a block and a loop inside that block (the former is necessary for breaking out of the loop)
        code.push(...WasmInstance.OPCODE.BLOCK); // a block around the loop to be able to break out of the loop that...
        code.push(...WasmInstance.TYPE.EMPTY); // ...does not yield any value
        code.push(...WasmInstance.OPCODE.LOOP); // a loop that...
        code.push(...WasmInstance.TYPE.EMPTY); // ...does not yield any value

        // if the first function parameter (= steps) is zero, break out of the loop
        code.push(...WasmInstance.OPCODE.GET_LOCAL); // push parameter...
        code.push(...WasmInstance.varuint(0)); // ...with index 0 (= steps) onto the stack
        code.push(...WasmInstance.OPCODE.I32_EQZ); // pop the value, push 1 if it was zero, 0 otherwise
        code.push(...WasmInstance.OPCODE.BR_IF); // pop the value, if it was 1, branch...
        code.push(...WasmInstance.varuint(1)); // ...with target 2 blocks outwards; otherwise do nothing

        // (if steps is not zero yet) subtract 1 from steps and continue with this iteration of the loop
        code.push(...WasmInstance.OPCODE.GET_LOCAL); // push parameter...
        code.push(...WasmInstance.varuint(0)); // ...with index 0 (= steps) onto the stack
        code.push(...WasmInstance.OPCODE.I32_CONST); // push the constant value...
        code.push(...WasmInstance.varint(1)); // ...1 onto the stack
        code.push(...WasmInstance.OPCODE.I32_SUB); // pop two times, subtract the value popped first from the value popped second and push the result
        code.push(...WasmInstance.OPCODE.SET_LOCAL); // pop and set the value as the new value of...
        code.push(...WasmInstance.varuint(0)); // ...parameter 0 (= steps)

        // increase n
        code.push(...WasmInstance.OPCODE.GET_LOCAL); // push local variable...
        code.push(...WasmInstance.varuint(1)); // ...with index 1 (= n) onto the stack
        code.push(...WasmInstance.OPCODE.I64_CONST); // push i64 constant...
        code.push(...WasmInstance.varint(1)); // ...1 onto the stack
        code.push(...WasmInstance.OPCODE.I64_ADD); // pop 2 values from the stack (the value read from the memory and the constant 1), add them, and push the result back onto the stack
        code.push(...WasmInstance.OPCODE.SET_LOCAL); // pop and set the value as the new value of...
        code.push(...WasmInstance.varuint(1)); // ...local variable 1 (= n)

        for(let i = 0; i < moduloOperations.length; i++) {

            let operation = moduloOperations[i];

            code.push(...WasmInstance.OPCODE.I32_CONST); // (the address for the I32_STORE later) push an i32 constant...
            code.push(...WasmInstance.varint(0)); // (the address for the I32_STORE later) ...onto the stack, which will be our modulo result address (= 0 because we will use the offset)

            code.push(...WasmInstance.OPCODE.GET_LOCAL); // push local variable...
            code.push(...WasmInstance.varuint(1)); // ...with index 1 (= n) onto the stack

            // if we have a startOffset, add it to n
            if(operation.startOffset !== 0) {
                if(operation.startOffset < 0 || (operation.startOffset % 1) !== 0) {
                    throw new Error(`RotatingAddress.startOffset: expected unsigned integer, got: ${operation.startOffset}`);
                }
                code.push(...WasmInstance.OPCODE.I64_CONST); // push i64 constant...
                code.push(...WasmInstance.varint(operation.startOffset)); // ...startOffset onto the stack
                code.push(...WasmInstance.OPCODE.I64_ADD); // pop 2 values from the stack, add them, and push the result back onto the stack
            }

            code.push(...WasmInstance.OPCODE.I64_CONST); // push i64 constant...
            code.push(...WasmInstance.varint(operation.mod)); // ...mod onto the stack

            code.push(...WasmInstance.OPCODE.I64_REM_U); // pop 2 values from the stack, calculate the second modulo the first and push the result back onto the stack

            code.push(...WasmInstance.OPCODE.I64_STORE32); // pop two values from the stack and store the first-popped i64 value as i32...
            code.push(...WasmInstance.varuint(2)); // ...to memory with alignment 4 (log2(4) = 2)... TODO: is 2 or 5 (log2(32) = 5) the correct value here?
            code.push(...WasmInstance.varuint(4 * operation.address)); // ...to address defined by the second value popped from the stack (= 0) + this offset value (= this modulo result's address); operation.addressOffset is in units of 4 bytes (i32) and already contains the offset (= 2) for n

            // TODO modulo results could additionally be cached as local variables (we need them in memory anyway so that javascript functions can access them), maybe this would be faster?

        }

        for(let i = 0; i < calculations.length; i++) {

            let calculation = calculations[i];

            code.push(...this.makeCalculationCode(calculation, moduloOperationsMap, i));

        }

        code.push(...WasmInstance.OPCODE.BR); // to continue the loop, branch...
        code.push(...WasmInstance.varuint(0)); // ...with target 1 blocks outwards

        code.push(...WasmInstance.OPCODE.END); // end loop
        code.push(...WasmInstance.OPCODE.END); // end outer block

        // store n back into the memory
        code.push(...WasmInstance.OPCODE.I32_CONST); // (the address for the I64_STORE later) push i32 constant...
        code.push(...WasmInstance.varint(0)); // (the address for the I64_STORE later) ...0 onto the stack
        code.push(...WasmInstance.OPCODE.GET_LOCAL); // push local variable...
        code.push(...WasmInstance.varuint(1)); // ...with index 1 (= n) onto the stack
        code.push(...WasmInstance.OPCODE.I64_STORE); // pop two values from the stack and store the first-popped value as i64...
        code.push(...WasmInstance.varuint(3)); // ...to memory with alignment 8 (log2(8) = 3)... TODO: is 3 or 6 (log2(64) = 6) the correct value here?
        code.push(...WasmInstance.varuint(0)); // ...to address defined by the second value popped from the stack (= 0) + this offset value (also 0) = 0

        // function end
        code.push(...WasmInstance.OPCODE.END);

        return code;

    }

    private makeCalculationCode(calculation: ConnectedElement.Calculation, moduloOperationsMap: Circuit.ModuloOperationsMap, calculationIndex: number) {

        if(!calculation.target) {
            throw new Error(`target-less calculations not implemented: calculation index ${calculationIndex}: ${calculation}`);
        }

        return ([] as number[]).concat(

            // push the target address (0 for static addresses, the current modulo result for rotating addresses) onto the stack for later writing to it
            this.makeAddressAddressPushCode(calculation.target, moduloOperationsMap),

            // push the value onto the stack
            this.makeValueSourceReaderCode(calculation.value, moduloOperationsMap),

            // write the value to the target address
            WasmInstance.OPCODE.I32_STORE8, // pop two values from the stack and store the first-popped value as i8...
            WasmInstance.varuint(0), // ...to memory with alignment 1 (log2(1) = 0)...
            WasmInstance.varuint(calculation.target.info.address) // ...to address defined by the second value popped from the stack (= 0 for static addresses or the current modulo result for rotating addresses) + this offset value (the actual static address or rotating address offset)

        );

    }

    private makeAddressAddressPushCode(target: ConnectedElement.StaticAddress|ConnectedElement.RotatingAddress, moduloOperationsMap: Circuit.ModuloOperationsMap) {

        switch(target.type) {
            case "StaticAddress": {
                return ([] as number[]).concat(
                    WasmInstance.OPCODE.I32_CONST, // push i32 constant...
                    WasmInstance.varint(0), // ...0 onto the stack (static addresses will use the offset immediate for addressing)
                );
            }
            case "RotatingAddress": {
                let moduloOperationIndex = moduloOperationsMap[target.info.mod][target.info.startOffset];
                return this.makeModuloResultPushCode(moduloOperationIndex);
                // this leaves the current modulo result on the stack
            }
            default: {
                throw new NeverError(target, "unexpected value source type");
            }
        }

    }

    private makeModuloResultPushCode(moduloOperationIndex: number) {

        return ([] as number[]).concat(
            WasmInstance.OPCODE.I32_CONST, // push i32 constant...
            WasmInstance.varint(0), // ...0 onto the stack
            WasmInstance.OPCODE.I32_LOAD, // pop a value from the stack and load as i32...
            WasmInstance.varuint(0), // ...a value from memory with alignment 1 (log2(1) = 0)...
            WasmInstance.varuint(4 * moduloOperationIndex) // ...from address defined by the value popped from the stack (= 0) + this offset value (the static modulo result address; moduloOperationIndex is in units of 4 bytes)
            // this leaves the current modulo result on the stack
        );

    }

    private makeValueSourceReaderCode(valueSource: ConnectedElement.ValueSource, moduloOperationsMap: Circuit.ModuloOperationsMap) {

        switch(valueSource.type) {
            case "StaticAddress":
            case "RotatingAddress": {
                return this.makeAddressReaderCode(valueSource, moduloOperationsMap);
            }
            case "AndRule":
            case "OrRule": {
                return this.makeRuleReaderCode(valueSource, moduloOperationsMap);
            }
            case "NotRule": {
                return this.makeNotRuleReaderCode(valueSource, moduloOperationsMap);
            }
            case "AlternatingValue": {
                return this.makeAlternatingValueReaderCode(valueSource, moduloOperationsMap);
            }
            default: {
                throw new NeverError(valueSource, "unexpected value source type");
            }
        }

    }

    private makeAddressReaderCode(address: ConnectedElement.StaticAddress|ConnectedElement.RotatingAddress, moduloOperationsMap: Circuit.ModuloOperationsMap) {

        return ([] as number[]).concat(
            this.makeAddressAddressPushCode(address, moduloOperationsMap), // leaves 0 (for static addresses) or the current modulo result (for rotating addresses) on the stack
            WasmInstance.OPCODE.I32_LOAD8_U, // pop a value from the stack and load as i32...
            WasmInstance.varuint(0), // ...a value from memory with alignment 0 (log2(1) = 0)...
            WasmInstance.varuint(address.info.address) // ...from address defined by the value popped from the stack (= 0 for static addresses or the current modulo result for rotating addresses) + this offset value (static address or rotating address offset)
        );

    }

    private makeRuleReaderCode(rule: ConnectedElement.AndRule|ConnectedElement.OrRule, moduloOperationsMap: Circuit.ModuloOperationsMap): number[] {

        let code = [];
        let op;

        switch(rule.type) {
            case "AndRule": {
                op = WasmInstance.OPCODE.I32_AND;
                break;
            }
            case "OrRule": {
                op = WasmInstance.OPCODE.I32_OR;
                break;
            }
            default: {
                throw new NeverError(rule, "unexpected rule type");
            }
        }

        for(let i = 0; i < rule.value.length; i++) {

            let valueSource = rule.value[i];
            code.push(...this.makeValueSourceReaderCode(valueSource, moduloOperationsMap)); // read the value from valueSource and leave it on the stack

            if(i > 0) { // as soon as we have two values on the stack...
                code.push(...op); // ...logical-and them and leave the result on the stack
            }

        }

        return code;

    }

    private makeNotRuleReaderCode(rule: ConnectedElement.NotRule, moduloOperationsMap: Circuit.ModuloOperationsMap): number[] {

        return ([] as number[]).concat(
            this.makeValueSourceReaderCode(rule.value, moduloOperationsMap),
            WasmInstance.OPCODE.I32_EQZ // = not
        );

    }

    private makeAlternatingValueReaderCode(alternatingValue: ConnectedElement.AlternatingValue, moduloOperationsMap: Circuit.ModuloOperationsMap): number[] {

        let mod = alternatingValue.offDuration + alternatingValue.onDuration;
        let moduloOperationIndex = moduloOperationsMap[mod][alternatingValue.startOffset];

        return ([] as number[]).concat(
            this.makeModuloResultPushCode(moduloOperationIndex), // leaves the current modulo result on the stack
            WasmInstance.OPCODE.I32_CONST, // push a constant...
            WasmInstance.varint(alternatingValue.onDuration), // ...alternatingValue.onDuration onto the stack
            WasmInstance.OPCODE.I32_LT_U // pop 2 values from the stack, push 1 if the value popped second is lower than the value popped first, 0 otherwise
            // leaves 1 on the stack if the current modulo result is lower than alternatingValue.onDuration, 0 otherwise
        );

    }

    //

    private makeSectionHeaderWithPayload(type: number[], sectionPayload: number[]) {

        return ([] as number[]).concat(
            type,
            WasmInstance.varuint(sectionPayload.length),
            sectionPayload
        );

    }

    private makeTypeSectionWithHeader() {

        let typeSectionPayload = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of type declarations
            WasmInstance.TYPE.FUNC, // we're declaring a function here
            WasmInstance.varuint(1), // with one parameter
            WasmInstance.TYPE.I32, // of type i64
            0x00 // no return types
        );

        return this.makeSectionHeaderWithPayload(WasmInstance.SECTION_TYPE.TYPE, typeSectionPayload);

    }

    private makeImportSectionWithHeader(dataSource: DataSource) {

        let importModuleName = "imports";
        let importFieldName = "memory";

        let importSectionPayload = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of imports
            WasmInstance.varuint32LengthAndBytes(importModuleName),
            WasmInstance.varuint32LengthAndBytes(importFieldName),
            WasmInstance.EXTERNAL_KIND.MEMORY,
            // memory_type:
            0x01, // maximum field of resizable_limits is present
            WasmInstance.varuint(Math.ceil(dataSource.getTargetNumBytes() / WasmInstance.WASM_PAGE_SIZE)), // initial size in units of wasm pages
            WasmInstance.varuint(Math.ceil(dataSource.getTargetNumBytes() / WasmInstance.WASM_PAGE_SIZE)) // maximum size in units of wasm pages
        );

        return this.makeSectionHeaderWithPayload(WasmInstance.SECTION_TYPE.IMPORT, importSectionPayload);

    }

    private makeFunctionSectionWithHeader() {

        let functionSectionPayload = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of functions
            WasmInstance.varuint(0) // type index for the signature of our function
        );

        return this.makeSectionHeaderWithPayload(WasmInstance.SECTION_TYPE.FUNCTION, functionSectionPayload);

    }

    private makeExportSectionWithHeader() {

        let exportSectionPayload = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of exports
            // export_entry:
            WasmInstance.varuint32LengthAndBytes("step"), // field_len and field_str (= name of exported thing)
            WasmInstance.EXTERNAL_KIND.FUNCTION, // we're exporting a function
            WasmInstance.varuint(0) // the function index
        );

        return this.makeSectionHeaderWithPayload(WasmInstance.SECTION_TYPE.EXPORT, exportSectionPayload);

    }

    private makeCodeSectionWithHeader(functionBodyCode: number[]) {

        let functionBody = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of local variable entries
            WasmInstance.varuint(1), // number of local variables with the following type
            WasmInstance.TYPE.I64, // a local variable with type i64
            functionBodyCode
        );

        let codeSectionPayload = ([] as number[]).concat(
            WasmInstance.varuint(1), // number of codes (= function bodies)
            // function_body:
            WasmInstance.varuint(functionBody.length), // "size of function body to follow, in bytes"
            functionBody
        );

        return this.makeSectionHeaderWithPayload(WasmInstance.SECTION_TYPE.CODE, codeSectionPayload);

    }

}

export namespace WasmInstance {

    export const WASM_PAGE_SIZE = (1 << 16); // 64 KiB

    //

    export const MAGIC_NUMBER = bytes("\0asm");
    export const VERSION = [0x01, 0x00, 0x00, 0x00];

    export const TYPE = {
        I32: [0x7f],
        I64: [0x7e],
        F32: [0x7d],
        F64: [0x7c],
        ANYFUNC: [0x70],
        FUNC: [0x60],
        EMPTY: [0x40]
    };

    export const EXTERNAL_KIND = {
        FUNCTION: [0x00],
        MEMORY: [0x02]
    };

    export const SECTION_TYPE = {
        TYPE: [0x01],
        IMPORT: [0x02],
        FUNCTION: [0x03],
        TABLE: [0x04],
        MEMORY: [0x05],
        GLOBAL: [0x06],
        EXPORT: [0x07],
        START: [0x08],
        ELEMENT: [0x09],
        CODE: [0x0a],
        DATA: [0x0b]
    };

    export const OPCODE = {
        // control flow:
        UNREACHABLE: [0x00],
        NOP: [0x01],
        BLOCK: [0x02],
        LOOP: [0x03],
        IF: [0x04],
        ELSE: [0x05],
        END: [0x0b],
        BR: [0x0c],
        BR_IF: [0x0d],
        BR_TABLE: [0x0e],
        RETURN: [0x0f],

        // variable access:
        GET_LOCAL: [0x20],
        SET_LOCAL: [0x21],
        TEE_LOCAL: [0x22],
        GET_GLOBAL: [0x23],
        SET_GLOBAL: [0x24],

        // memory-related operators:
        I32_LOAD: [0x28],
        I64_LOAD: [0x29],
        I32_LOAD8_U: [0x2d],
        I32_STORE: [0x36],
        I64_STORE: [0x37],
        I32_STORE8: [0x3a],
        I64_STORE32: [0x3e],

        // constants:
        I32_CONST: [0x41],
        I64_CONST: [0x42],

        // comparison operators:
        I32_EQZ: [0x45],
        I32_LT_U: [0x49],
        I64_EQZ: [0x50],

        // numeric operators:
        I32_SUB: [0x6b],
        I32_AND: [0x71],
        I32_OR: [0x72],
        I64_ADD: [0x7c],
        I64_SUB: [0x7d],
        I64_REM_U: [0x82],

        // conversion:
        I64_EXTEND_U_I32: [0xad]
    };

    export function varuint(num: number) {

        if(num < 0 || (num % 1) !== 0) {
            throw new Error(`varuint: expected unsigned integer, got: ${num}`);
        }

        let bytes = [];

        for(;;) {

            let part = num & 0x7F;
            num >>= 7;

            if(num !== 0) {
                part |= 0x80;
            }

            bytes.push(part);

            if(num === 0) {
                break;
            }
            
        }

        return bytes;

    }

    export function varint(num: number) {

        if((num % 1) !== 0) {
            throw new Error(`varuint: expected signed integer, got: ${num}`);
        }

        let bytes = [];

        for(;;) {

            let part = num & 0x7F;
            num >>= 7;

            let done = (num === 0 && (part & 0x40) === 0) || (num === -1 && (part & 0x40) !== 0);

            if(!done) {
                part |= 0x80;
            }

            bytes.push(part);

            if(done) {
                break;
            }
            
        }

        return bytes;

    }

    export function bytes(str: string) {
        return str.split("").map((c) => c.charCodeAt(0));
    }

    export function varuint32LengthAndBytes(str: string) {
        let b = bytes(str);
        return varuint(b.length).concat(b);
    }

}