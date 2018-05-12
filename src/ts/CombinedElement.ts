import { ConnectedElement } from "./ConnectedElement";
import { LogicElement } from "./LogicElement";


export class CombinedElement implements ConnectedElement {

    public inputReceiverDescriptions: CombinedElement.ValueLocationDescription[] = [];
    public outputSourceDescriptions: CombinedElement.ValueLocationDescription[] = [];

    private connectedElements: ConnectedElement[];

    constructor(private name: string, elementWiringDescriptions: CombinedElement.WiringDescription[]) {

        this.connectedElements = new Array<ConnectedElement>(elementWiringDescriptions.length);
        let connectedElementsMap: {[name: string]: ConnectedElement|undefined} = {};

        let tempInputReceiverDescriptions: (CombinedElement.ValueLocationDescription|undefined)[] = [];

        for(let i = 0; i < elementWiringDescriptions.length; i++) {

            this.connectedElements[i] = elementWiringDescriptions[i].element;
            connectedElementsMap[elementWiringDescriptions[i].name] = elementWiringDescriptions[i].element;

        }
        
        for(let elementIndex = 0; elementIndex < elementWiringDescriptions.length; elementIndex++) {

            let wiringDescription = elementWiringDescriptions[elementIndex];
            let connectedElement = wiringDescription.element;

            for(let inputIndex = 0; inputIndex < wiringDescription.inputs.length; inputIndex++) {

                let inputDescription = wiringDescription.inputs[inputIndex];

                if(inputDescription.name === "outside") {

                    while(inputDescription.outputIndex >= tempInputReceiverDescriptions.length) {
                        tempInputReceiverDescriptions.push(undefined);
                    }

                    if(tempInputReceiverDescriptions[inputDescription.outputIndex]) {
                        throw new Error(this.name + ": input index " + inputDescription.outputIndex + " of this combined element is already connected to inside element " + tempInputReceiverDescriptions[inputDescription.outputIndex]!.wiringDescriptionName + " and therefore can not be connected to inside element " + wiringDescription.name);
                    }

                    tempInputReceiverDescriptions[inputDescription.outputIndex] = {
                        element: connectedElement,
                        wiringDescriptionName: wiringDescription.name,
                        index: inputIndex
                    };

                } else {

                    let sourceElement = connectedElementsMap[inputDescription.name];

                    if(!sourceElement) {
                        throw new Error(this.name + ": unknown element name: " + inputDescription.name);
                    }

                    connectedElement.readInputFrom(inputIndex, sourceElement, inputDescription.outputIndex);

                }

            }

            for(let externalOutputIndex of wiringDescription.externalOutputs) {
                this.outputSourceDescriptions.push({
                    element: connectedElement,
                    wiringDescriptionName: wiringDescription.name,
                    index: externalOutputIndex
                });
            }

        }

        for(let i = 0; i < tempInputReceiverDescriptions.length; i++) {

            let valueLocationDescription = tempInputReceiverDescriptions[i];

            if(!valueLocationDescription) {
                throw new Error(this.name + ": input index " + i + " is not connected to any inner element, but higher input index exists");
            }

            this.inputReceiverDescriptions.push(valueLocationDescription);

        }

    }

    getName() {
        return this.name;
    }

    getOwnType() {
        return undefined;
    }

    getDelay() {
        return 0;
    }

    getChildren() {
        return this.connectedElements;
    }

    readInputFrom(inputIndex: number, sourceElement: ConnectedElement, sourceOutputIndex: number) {

        if(inputIndex < this.inputReceiverDescriptions.length) {

            let inputReceiverDescription = this.inputReceiverDescriptions[inputIndex];
            inputReceiverDescription.element.readInputFrom(inputReceiverDescription.index, sourceElement, sourceOutputIndex);

        } else {
            throw new Error(this.name + ": input index " + inputIndex + " is out of bounds for this element");
        }
        
    }

    getNumOutputs() {
        return this.outputSourceDescriptions.length;
    }

    getOutputValueAddressProvider(outputIndex: number) {
        let outputSourceDescription = this.outputSourceDescriptions[outputIndex];
        return outputSourceDescription.element.getOutputValueAddressProvider(outputSourceDescription.index);
    }

    getWriteOutputsCalculations(space: ConnectedElement.Space) {

        let calculations = [];

        for(let connectedElement of this.connectedElements) {

            let childCalculations = connectedElement.getWriteOutputsCalculations(space);
            calculations.push(...childCalculations);

            while(space.next) {
                space = space.next;
            }

            space = space.getNew();

        }

        return calculations;

    }

    getReadInputsCalculations() {

        let calculations = [];

        for(let connectedElement of this.connectedElements) {

            let childCalculations = connectedElement.getReadInputsCalculations();
            calculations.push(...childCalculations);

        }

        return calculations;

    }

    getUpdateFunctions() {

        let updateFunctions = [];

        for(let connectedElement of this.connectedElements) {

            let childUpdateFunctions = connectedElement.getUpdateFunctions();
            updateFunctions.push(...childUpdateFunctions);

        }

        return updateFunctions;

    }

    getInitiallyTrueAddresses() {
        
        let calculations = [];

        for(let connectedElement of this.connectedElements) {

            let childCalculations = connectedElement.getInitiallyTrueAddresses();
            calculations.push(...childCalculations);

        }

        return calculations;

    }

}

export namespace CombinedElement {

    export interface WiringDescription {
        name: string;
        element: ConnectedElement;
        inputs: InputDescription[];
        externalOutputs: number[];
    }

    export interface InputDescription {
        name: "outside"|WiringDescription["name"];
        outputIndex: number;
    }

    export interface ValueLocationDescription {
        element: ConnectedElement;
        wiringDescriptionName: WiringDescription["name"];
        index: number;
    }

}