import { Wire } from "../elements/Wire";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { DataSource } from "../DataSource";
import { ConnectedElement } from "../ConnectedElement";

const highlightBufferRows = false;

export class GraphicalWire extends StubGraphicalElement<Wire> {

    public static getHeightMultiplicator(numBits: number) {
        return 1 + Math.sqrt(Math.log2(numBits));
    }

    public static getDrawableOutputValueFromReaders(readers: (() => boolean)[]) {

        let sum = 0;

        for(let i = 0; i < readers.length; i++) {
            sum += readers[i]() ? 1 : 0;
        }

        return sum / readers.length;

    }

    public static getLineColor(value: number) {
        return 0x10000 * Math.floor(GraphicalWire.LOW_R + value * (GraphicalWire.HIGH_R - GraphicalWire.LOW_R))
            +    0x100 * Math.floor(GraphicalWire.LOW_G + value * (GraphicalWire.HIGH_G - GraphicalWire.LOW_G))
            +            Math.floor(GraphicalWire.LOW_B + value * (GraphicalWire.HIGH_B - GraphicalWire.LOW_B));
    }

    //

    private lineWidth: number;
    private delayBufferValueReaders: ((offset: number) => boolean)[];
    private outputValueReaders: (() => boolean)[];

    private lines: GraphicalWire.LineDescription[] = [];

    private dataSource: DataSource;

    constructor(name: string, private initialValue: boolean = false, private num: number = 1) {
        super(name);
    }

    getDefaultHeight() {
        return Math.ceil(GraphicalWire.DEFAULT_HEIGHT * GraphicalWire.getHeightMultiplicator(this.num));
    }

    makeConnectorCoordinates(elementHeight: number) {
        return undefined;
    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return {
            x: 0,
            y: 0
        };
    }
    
    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {

        if(!this.lines || this.lines.length) {
            this.lines = [];
        }

        let totalDistance = 0;

        for(let i = coordinates.length - 1; i > 0; i--) {

            let from = coordinates[i];
            let to = coordinates[i - 1];

            let xDelta = to.x - from.x;
            let yDelta = to.y - from.y;

            let localDistance = Math.sqrt(xDelta**2 + yDelta**2);

            let fromDistance = totalDistance;
            totalDistance += localDistance;

            this.lines.push({
                from: from,
                xDelta: xDelta,
                yDelta: yDelta,
                fromProgress: fromDistance,
                toProgress: totalDistance,
                coversProgress: localDistance
            });

        }

        for(let line of this.lines) {
            line.fromProgress /= totalDistance;
            line.toProgress /= totalDistance;
            line.coversProgress /= totalDistance;
        }

        let delay = (GraphicalWire.DELAY_PER_PIXEL > 0) ? Math.max(Math.floor(GraphicalWire.DELAY_PER_PIXEL * totalDistance), 1) : 0;
        let element = new Wire(this.getName(), delay, this.initialValue, this.num);

        return element;

    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {

        this.lineWidth = elementHeight;

        this.dataSource = dataSource;

        if(this.element.getDelay()) {
            this.delayBufferValueReaders = new Array(this.element.getNumOutputs());

            for(let i = 0; i < this.delayBufferValueReaders.length; i++) {
                this.delayBufferValueReaders[i] = dataSource.getAddressValueReader(this.element.getDelayBufferAddressProvider(i)());
            }
        }

        this.outputValueReaders = new Array(this.element.getNumOutputs());

        for(let i = 0; i < this.outputValueReaders.length; i++) {
            this.outputValueReaders[i] = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(i)());
        }

        return new PIXI.Graphics();

    }

    private getDrawableOutputValue() {

        let sum = 0;

        for(let i = 0; i < this.outputValueReaders.length; i++) {
            sum += this.outputValueReaders[i]() ? 1 : 0;
        }

        return sum / this.outputValueReaders.length;

    }

    private getDrawableDelayBufferValue(index: number) {

        let sum = 0;

        for(let i = 0; i < this.delayBufferValueReaders.length; i++) {
            sum += this.delayBufferValueReaders[i](index) ? 1 : 0;
        }

        return sum / this.delayBufferValueReaders.length;

    }

    redraw(progress: number) {

        let currentLineIndex = 0;
        let currentLine = this.lines[currentLineIndex];

        this.graphics.clear();

        this.graphics.moveTo(currentLine.from.x, currentLine.from.y);

        let delay = this.element.getDelay();
        let currentValue = this.getDrawableOutputValue();

        for(let i = 0; i < delay; i++) {

            let bufferRowProgress = (1 - progress);
            let overallLineProgress = (i + bufferRowProgress) / delay;

            let value = this.getDrawableDelayBufferValue(i);

            if(value !== currentValue || highlightBufferRows) {

                if(highlightBufferRows) {
                    const bright = ((i % 2) !== 0);
                    this.graphics.lineStyle(this.lineWidth, currentValue > 0 ? (bright ? GraphicalWire.HIGH_BRIGHT_COLOR : GraphicalWire.HIGH_COLOR) : (bright ? GraphicalWire.LOW_BRIGHT_COLOR : GraphicalWire.LOW_COLOR), 1);
                } else {
                    this.graphics.lineStyle(this.lineWidth, GraphicalWire.getLineColor(currentValue), 1);
                }

                while(overallLineProgress > currentLine.toProgress) {
                    currentLineIndex++;
                    currentLine = this.lines[currentLineIndex];
                    this.graphics.lineTo(currentLine.from.x, currentLine.from.y);
                }

                let localLineProgress = (overallLineProgress - currentLine.fromProgress) / currentLine.coversProgress;

                let stopX = currentLine.from.x + (currentLine.xDelta * localLineProgress);
                let stopY = currentLine.from.y + (currentLine.yDelta * localLineProgress);

                this.graphics.lineTo(stopX, stopY);

            }

            currentValue = value;

        }

        if(highlightBufferRows) {
            this.graphics.lineStyle(this.lineWidth, currentValue > 0 ? GraphicalWire.HIGH_DARK_COLOR : GraphicalWire.LOW_DARK_COLOR, 1);
        } else {
            this.graphics.lineStyle(this.lineWidth, GraphicalWire.getLineColor(currentValue), 1);
        }

        do {
            currentLine = this.lines[currentLineIndex];
            this.graphics.lineTo(currentLine.from.x + currentLine.xDelta, currentLine.from.y + currentLine.yDelta);
        } while(++currentLineIndex < this.lines.length);

    }

}

export namespace GraphicalWire {

    export const DEFAULT_DELAY_PER_WINDOW_HEIGHT = 100;
    export let DELAY_PER_PIXEL = 0; // will be overwritten by GraphicalCircuit

    export const DEFAULT_HEIGHT = 2;

    export const DEFAULT_DISTANCE = 3;
    export const DEFAULT_BUS_DISTANCE = 10;

    export const DEFAULT_ELEMENT_DISTANCE = 20;

    export const HIGH_R = 0x00;
    export const HIGH_G = 0xD8;
    export const HIGH_B = 0x0A;

    export const HIGH_COLOR = (HIGH_R << 16) | (HIGH_G << 8) | HIGH_B;
    export const HIGH_DARK_COLOR = 0x008800;
    export const HIGH_BRIGHT_COLOR = 0x88FF88;

    export const LOW_R = 0x84;
    export const LOW_G = 0x00;
    export const LOW_B = 0x00;

    export const LOW_COLOR = (LOW_R << 16) | (LOW_G << 8) | LOW_B;
    export const LOW_DARK_COLOR = 0x880000;
    export const LOW_BRIGHT_COLOR = 0xFF8888;

    export interface LineDescription {
        from: StubGraphicalElement.Coordinates;
        xDelta: number;
        yDelta: number;
        fromProgress: number;
        toProgress: number;
        coversProgress: number;
    }

}