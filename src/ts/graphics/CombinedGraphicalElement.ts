import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedElement } from "../CombinedElement";
import { GraphicalElement } from "./GraphicalElement";
import { DataSource } from "../DataSource";


export class CombinedGraphicalElement extends StubGraphicalElement<any> {

    private elementInfosList: CombinedGraphicalElement.ElementInfo[] = [];
    private elementsList: GraphicalElement[] = [];

    private elementWiringDescriptions: CombinedElement.WiringDescription[];

    private combinedElement: CombinedElement;

    constructor(name: string, private totalHeight: number, protected wiringDescriptions: CombinedGraphicalElement.WiringDescription[]) {
        super(name);
    }

    getDefaultHeight() {
        return this.totalHeight;
    }

    private scaleCoordinateValue(value: number, elementHeight: number) {
        return value * elementHeight / this.totalHeight;
    }

    private resolveCoordinatesDescription(wiringDescription: CombinedGraphicalElement.WiringDescription, childCoordinates: StubGraphicalElement.Coordinates[], i: number, elementsMap: {[name: string]: GraphicalElement|undefined}, nextValueSubscribers: {[P in keyof StubGraphicalElement.Coordinates]: ({coordinates: StubGraphicalElement.Coordinates, coordinate: keyof StubGraphicalElement.Coordinates})[]}, prevValues: {[P in keyof StubGraphicalElement.Coordinates]: number|undefined}, elementHeight: number) {

        let newCoordinates: StubGraphicalElement.Coordinates;

        let xSet: boolean;
        let ySet: boolean;

        newCoordinates = {
            x: 0,
            y: 0
        };

        let coordinatesDescription = wiringDescription.coordinates[i];

        if((coordinatesDescription as any).base) {

            let basedCoordinates = (coordinatesDescription as CombinedGraphicalElement.BasedCoordinatesDescription);
            let connectorCoordinates = this.resolveOwnRelativeConnectorCoordinatesReference(basedCoordinates.base, wiringDescription.element, wiringDescription.name);

            newCoordinates.x -= connectorCoordinates.x;
            newCoordinates.y -= connectorCoordinates.y;

            coordinatesDescription = basedCoordinates.coordinates;

        }

        if((coordinatesDescription as any).x !== undefined && (coordinatesDescription as any).y !== undefined) {
            
            xSet = this.resolveCoordinateValueDescription((coordinatesDescription as CombinedGraphicalElement.CoordinatesValueDescription).x, wiringDescription, i, newCoordinates, "x", elementsMap, nextValueSubscribers, prevValues, elementHeight);
            ySet = this.resolveCoordinateValueDescription((coordinatesDescription as CombinedGraphicalElement.CoordinatesValueDescription).y, wiringDescription, i, newCoordinates, "y", elementsMap, nextValueSubscribers, prevValues, elementHeight);

        } else {

            let reference = (coordinatesDescription as CombinedGraphicalElement.ConnectorCoordinatesReference);
            let connectorCoordinates = this.resolveConnectorCoordinatesReference(reference, elementsMap);

            newCoordinates.x += connectorCoordinates.x;
            newCoordinates.y += connectorCoordinates.y;

            xSet = ySet = true;

        }

        childCoordinates[i] = newCoordinates;

        if(xSet) {
            this.updateSubscribersAndPrevValues(nextValueSubscribers, prevValues, newCoordinates, "x");
        }

        if(ySet) {
            this.updateSubscribersAndPrevValues(nextValueSubscribers, prevValues, newCoordinates, "y");
        }

    }

    private updateSubscribersAndPrevValues(nextValueSubscribers: {[P in keyof StubGraphicalElement.Coordinates]: ({coordinates: StubGraphicalElement.Coordinates, coordinate: keyof StubGraphicalElement.Coordinates})[]}, prevValues: {[P in keyof StubGraphicalElement.Coordinates]: number|undefined}, newCoordinates: StubGraphicalElement.Coordinates, coordinate: keyof StubGraphicalElement.Coordinates) {

        let prevValue = newCoordinates[coordinate];

        prevValues[coordinate] = prevValue;

        let subscribers = nextValueSubscribers[coordinate];
        for(let i = subscribers.length - 1; i >= 0; i--) {
            let subscriber = subscribers[i];
            subscriber.coordinates[subscriber.coordinate] += prevValue;
            prevValue = subscriber.coordinates[subscriber.coordinate];
        }

        nextValueSubscribers[coordinate] = [];

    }

    private resolveCoordinateValueDescription(value: CombinedGraphicalElement.CoordinateValueDescription, wiringDescription: CombinedGraphicalElement.WiringDescription, i: number, newCoordinates: StubGraphicalElement.Coordinates, coordinate: keyof StubGraphicalElement.Coordinates, elementsMap: {[name: string]: GraphicalElement|undefined}, nextValueSubscribers: {[P in keyof StubGraphicalElement.Coordinates]: ({coordinates: StubGraphicalElement.Coordinates, coordinate: keyof StubGraphicalElement.Coordinates})[]}, prevValues: {[P in keyof StubGraphicalElement.Coordinates]: number|undefined}, elementHeight: number): boolean {

        if((typeof value) === "number") {
            
            newCoordinates[coordinate] += this.scaleCoordinateValue(value as number, elementHeight);  // add it to allow for previously setting a delta value
            return true;

        } else if(value === "next") {

            nextValueSubscribers[coordinate].push({
                coordinates: newCoordinates,
                coordinate: coordinate
            });
            return false;

        } else if(value === "prev") {

            let scaledPrevValue = prevValues[coordinate];

            if(scaledPrevValue === undefined) {
                throw new Error(this.getName() + ": graphical element " + wiringDescription.name + ", coordinates index " + i + ": no previous value yet for " + coordinate);
            }

            if(nextValueSubscribers[coordinate].length) {
                throw new Error(this.getName() + ": graphical element " + wiringDescription.name + ", coordinates index " + i + ": previous " + coordinate + " value referenced, but previous value references next");
            }

            newCoordinates[coordinate] += scaledPrevValue; // add it to allow for previously setting a delta value

            return true;

        } else if((value as any).delta !== undefined) {

            let relativeReference = (value as CombinedGraphicalElement.RelativeCoordinateReference);

            newCoordinates[coordinate] += this.scaleCoordinateValue(relativeReference.delta, elementHeight); // add it to allow for previously setting a delta value
            return this.resolveCoordinateValueDescription(relativeReference.from, wiringDescription, i, newCoordinates, coordinate, elementsMap, nextValueSubscribers, prevValues, elementHeight);

        } else if((value as CombinedGraphicalElement.ConnectorCoordinatesReference).name) {

            newCoordinates[coordinate] += this.resolveConnectorCoordinatesReference(value as CombinedGraphicalElement.ConnectorCoordinatesReference, elementsMap)[coordinate]; // add it to allow for previously setting a delta value

            return true;

        } else {

            throw new Error(this.getName() + ": graphical element " + wiringDescription.name + ", coordinates index " + i + ": unknown coordinate value description for " + coordinate);

        }

    }

    private resolveConnectorCoordinatesReference(reference: CombinedGraphicalElement.ConnectorCoordinatesReference, elementsMap: {[name: string]: GraphicalElement|undefined}): StubGraphicalElement.Coordinates {

        let referencedElement = elementsMap[reference.name];

        if(!referencedElement) {
            throw new Error(this.getName() + ": no such wiring description name (yet; remember: no forward references): " + reference.name);
        }

        let relativeCoordinates = this.resolveOwnRelativeConnectorCoordinatesReference(reference, referencedElement, reference.name);

        return {
            x: referencedElement.baseCoordinates.x + relativeCoordinates.x,
            y: referencedElement.baseCoordinates.y + relativeCoordinates.y
        };

    }

    private resolveOwnRelativeConnectorCoordinatesReference(reference: CombinedGraphicalElement.OwnConnectorCoordinatesReference, referencedElement: GraphicalElement, wiringDescriptionName: CombinedGraphicalElement.WiringDescription["name"]) {

        let connectorCoordinates = referencedElement.connectorCoordinates;

        if(!connectorCoordinates) {
            throw new Error(this.getName() + ": wiring description name " + wiringDescriptionName + " has no connector coordinates");
        }

        let coordinatesList = connectorCoordinates[reference.connector];

        if(reference.index >= coordinatesList.length) {
            throw new Error(this.getName() + ": wiring description name " + wiringDescriptionName + " has no connector coordinates index " + reference.index + " at connector " + reference.connector);
        }

        return coordinatesList[reference.index];

    }

    private resolveHeight(wiringDescription: CombinedGraphicalElement.WiringDescription): number {

        let height = wiringDescription.height;

        if(height === "auto") {
            return wiringDescription.element.getDefaultHeight();
        } else {
            return height;
        }

    }

    makeConnectorCoordinates(elementHeight: number) {

        for(let wiringDescription of this.wiringDescriptions) {
            wiringDescription.element.prefixName(this.getName() + "/");
            wiringDescription.element.initConnectorCoordinates(this.scaleCoordinateValue(this.resolveHeight(wiringDescription), elementHeight));
        }

        let elementsMap: {[name: string]: GraphicalElement|undefined} = {};
        this.elementWiringDescriptions = new Array<CombinedElement.WiringDescription>(this.wiringDescriptions.length);

        for(let i = 0; i < this.wiringDescriptions.length; i++) {

            let wiringDescription = this.wiringDescriptions[i];

            let childCoordinates = new Array<StubGraphicalElement.Coordinates>(wiringDescription.coordinates.length);

            let prevValues = {
                x: undefined,
                y: undefined
            };

            let nextValueSubscribers = {
                x: [],
                y: []
            };

            for(let i = 0; i < childCoordinates.length; i++) {
                this.resolveCoordinatesDescription(wiringDescription, childCoordinates, i, elementsMap, nextValueSubscribers, prevValues, elementHeight);
            }

            if(nextValueSubscribers.x.length) {
                throw new Error(this.getName() + ": graphical element " + wiringDescription.name + ": forward x value references left, but no more coordinates");
            }

            if(nextValueSubscribers.y.length) {
                throw new Error(this.getName() + ": graphical element " + wiringDescription.name + ": forward y value references left, but no more coordinates");
            }

            let childElementHeight = this.scaleCoordinateValue(this.resolveHeight(wiringDescription), elementHeight);

            wiringDescription.element.initBaseCoordinates(childElementHeight, childCoordinates);
            wiringDescription.element.initElement(childElementHeight, childCoordinates);

            elementsMap[wiringDescription.name] = wiringDescription.element;

            this.elementInfosList.push({
                wiringDescription: wiringDescription,
                elementHeight: childElementHeight,
                coordinates: childCoordinates
            });

            this.elementsList.push(wiringDescription.element);

            this.elementWiringDescriptions[i] = {
                name: wiringDescription.name,
                element: wiringDescription.element.element,
                inputs: wiringDescription.inputs,
                externalOutputs: wiringDescription.externalOutputs
            };

        }

        //

        this.combinedElement = new CombinedElement(this.name, this.elementWiringDescriptions);

        let connectorCoordinates: StubGraphicalElement.ConnectorCoordinates = {
            input: [],
            output: []
        };
        
        for(let valueLocationDescription of this.combinedElement.inputReceiverDescriptions) {

            let inputElement = elementsMap[valueLocationDescription.wiringDescriptionName]!;
            let elementConnectorCoordinates = inputElement.connectorCoordinates;

            if(!elementConnectorCoordinates) {
                throw new Error(this.getName() + ": element " + inputElement.getName() + " reads input, but does not provide connector coordinates");
            }

            let inputCoordinates = elementConnectorCoordinates.input[valueLocationDescription.index];

            if(!inputCoordinates) {
                throw new Error(this.getName() + ": element " + inputElement.getName() + " reads input, but does not provide connector coordinates for input index " + valueLocationDescription.index);
            }

            connectorCoordinates.input.push({
                x: inputElement.baseCoordinates.x + inputCoordinates.x,
                y: inputElement.baseCoordinates.y + inputCoordinates.y
            });

        }

        for(let valueLocationDescription of this.combinedElement.outputSourceDescriptions) {

            let outputElement = elementsMap[valueLocationDescription.wiringDescriptionName]!;
            let elementConnectorCoordinates = outputElement.connectorCoordinates;

            if(!elementConnectorCoordinates) {
                throw new Error(this.getName() + ": element " + outputElement.getName() + " delivers output, but does not provide connector coordinates");
            }

            let outputCoordinates = elementConnectorCoordinates.output[valueLocationDescription.index];

            if(!outputCoordinates) {
                throw new Error(this.getName() + ": element " + outputElement.getName() + " delivers output, but does not provide connector coordinates for output index " + valueLocationDescription.index);
            }

            connectorCoordinates.output.push({
                x: outputElement.baseCoordinates.x + outputCoordinates.x,
                y: outputElement.baseCoordinates.y + outputCoordinates.y
            });

        }

        return connectorCoordinates;

    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return coordinates[0];
    }
    
    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return this.combinedElement;
    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {

        let graphics = new PIXI.Graphics();

        for(let i = this.elementInfosList.length - 1; i >= 0; i--) {

            let elementInfo = this.elementInfosList[i];

            elementInfo.wiringDescription.element.initGraphics(elementInfo.elementHeight, elementInfo.coordinates, dataSource);

            let childGraphics = elementInfo.wiringDescription.element.graphics;

            if(!childGraphics) {
                throw new Error(this.getName() + ": element " + elementInfo.wiringDescription.name + " fails to provide graphics");
            }

            childGraphics.x = elementInfo.wiringDescription.element.baseCoordinates.x;
            childGraphics.y = elementInfo.wiringDescription.element.baseCoordinates.y;

            graphics.addChild(childGraphics);

        }

        return graphics;

    }

    redraw(progress: number) {

        for(let element of this.elementsList) {
            element.redraw(progress);
        }

    }

}

export namespace CombinedGraphicalElement {

    export interface WiringDescription {
        name: string;
        element: GraphicalElement;
        height: "auto"|number;
        inputs: InputDescription[];
        externalOutputs: number[];
        coordinates: CoordinatesDescription[];
    }

    export interface InputDescription {
        name: "outside"|WiringDescription["name"];
        outputIndex: number;
    }

    export interface OwnConnectorCoordinatesReference {
        connector: keyof StubGraphicalElement.ConnectorCoordinates;
        index: number;
    }

    export type WiringDescriptionIdentifier = {
        name: string;
    };

    export type ConnectorCoordinatesReference = OwnConnectorCoordinatesReference & WiringDescriptionIdentifier;

    export type CoordinatesValueDescription = {
        [P in keyof StubGraphicalElement.Coordinates]: CoordinateValueDescription;
    }

    export interface RelativeCoordinateReference {
        delta: StubGraphicalElement.Coordinates["x"],
        from: StubGraphicalElement.Coordinates["x"]|ConnectorCoordinatesReference|"next"|"prev"
    }

    export interface BasedCoordinatesDescription {
        base: OwnConnectorCoordinatesReference;
        coordinates: CoordinatesValueDescription|ConnectorCoordinatesReference;
    }

    export type CoordinateValueDescription = StubGraphicalElement.Coordinates["x"]|ConnectorCoordinatesReference|RelativeCoordinateReference|"next"|"prev";

    export type RemoteCoordinatesDescription = CoordinatesValueDescription|ConnectorCoordinatesReference;

    export type CoordinatesDescription = RemoteCoordinatesDescription|BasedCoordinatesDescription;

    //

    export interface ElementInfo {
        wiringDescription: CombinedGraphicalElement.WiringDescription;
        elementHeight: number;
        coordinates: StubGraphicalElement.Coordinates[];
    }

}