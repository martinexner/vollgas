import { Split } from "../elements/Split";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalOr } from "./GraphicalOr";
import { DataSource } from "../DataSource";

export class GraphicalSplit extends StubGraphicalElement<Split> {

    private defaultHeight: number;
    private radius: number;
    private lineWidth: number;
    private lineHeight: number;
    private valueReaders: (() => boolean)[];

    private text: PIXI.Text|undefined;

    constructor(name: string, private numOutChannels: number, private numInBits: number, private drawLine = false, defaultHeight?: number, private initialValue = false, private displayValue?: "aboveLeft"|"aboveRight"|"belowLeft"|"belowRight") {

        super(name);

        this.valueReaders = new Array(Math.max(this.numInBits, 1));

        if(defaultHeight === undefined) {
            defaultHeight = drawLine ? GraphicalOr.DEFAULT_HEIGHT : Math.ceil(GraphicalSplit.DEFAULT_HEIGHT * GraphicalWire.getHeightMultiplicator(Math.max(this.numInBits, 1)));
        }

        this.defaultHeight = defaultHeight;

    }

    getDefaultHeight() {
        return this.defaultHeight;
    }

    makeConnectorCoordinates(elementHeight: number) {

        if(this.drawLine) {

            return GraphicalOr.makeConnectorCoordinates(0, elementHeight, this.numInBits, (Math.max(this.numOutChannels, 1) * Math.max(this.numInBits, 1)));

        } else {

            let inputConnectorCoordinates: StubGraphicalElement.Coordinates[] = [];

            for(let i = 0; i < this.numInBits; i++) {
                inputConnectorCoordinates.push({
                    x: 0,
                    y: 0
                });
            }

            let outputConnectorCoordinates: StubGraphicalElement.Coordinates[] = [];

            for(let i = 0; i < (Math.max(this.numOutChannels, 1) * Math.max(this.numInBits, 1)); i++) {
                outputConnectorCoordinates.push({
                    x: 0,
                    y: 0
                });
            }

            return {
                input: inputConnectorCoordinates,
                output: outputConnectorCoordinates
            };

        }

    }

    makeBaseCoordinates(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {
        return coordinates[0];
    }

    makeElement(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[]) {

        let element = new Split(this.getName(), this.numOutChannels, this.numInBits, this.initialValue);
        return element;

    }

    makeGraphics(elementHeight: number, coordinates: StubGraphicalElement.Coordinates[], dataSource: DataSource) {

        this.radius = elementHeight/2;

        let scale = elementHeight / this.getDefaultHeight();
        this.lineWidth = scale * GraphicalWire.DEFAULT_HEIGHT;
        this.lineHeight = elementHeight;
        
        for(let i = 0; i < this.valueReaders.length; i++) {
            this.valueReaders[i] = dataSource.getAddressValueReader(this.element.getOutputValueAddressProvider(i)());
        }

        let graphics = new PIXI.Graphics();

        if(this.displayValue) {

            let numHexDigits = Math.ceil(Math.max(this.numInBits, 1) / 4);

            let text = new PIXI.Text("0".repeat(numHexDigits), {
                fontSize: scale * 2*GraphicalOr.DEFAULT_HEIGHT/5,
                fontFamily: "Courier New",
                fill: GraphicalOr.TEXT_COLOR
            });

            text.anchor.set(this.displayValue.endsWith("Left") ? 1 : 0, this.displayValue.startsWith("above") ? 1 : 0);
            text.x = this.displayValue.endsWith("Left") ? (this.drawLine ? 0 : -this.radius) : (this.drawLine ? this.lineWidth : this.radius);
            text.y = this.displayValue.startsWith("above") ? (this.drawLine ? 0 : -this.radius) : (this.drawLine ? this.lineHeight : this.radius);
            graphics.addChild(text);

            this.text = text;

        }

        return graphics;

    }

    private getOutputValueText() {
        
        const hexDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

        let digitStrings = new Array<string>(Math.ceil(this.valueReaders.length / 4));
        let currentDigitIndex = 0;
        let currentHexDigitValue = 0;

        for(let i = this.valueReaders.length-1; i >= 0; i--) {

            currentHexDigitValue <<= 1;
            currentHexDigitValue |= this.valueReaders[i]() ? 1 : 0;

            if((i % 4) === 0) {
                digitStrings[currentDigitIndex] = hexDigits[currentHexDigitValue];
                currentDigitIndex++;
                currentHexDigitValue = 0;
            }

        }

        return digitStrings.join("");

    }

    redraw(progress: number) {

        this.graphics.clear();

        let color = GraphicalWire.getLineColor(GraphicalWire.getDrawableOutputValueFromReaders(this.valueReaders));

        if(this.drawLine) {
            this.graphics.lineStyle(this.lineWidth, color, 1);
            this.graphics.moveTo(0, 0);
            this.graphics.lineTo(0, this.lineHeight);
        } else {
            this.graphics.beginFill(color, 1);
            this.graphics.drawCircle(0, 0, this.radius);
        }

        if(this.text) {

            let valueText = this.getOutputValueText();

            if(this.text.text !== valueText) {
                this.text.text = valueText;
            }

        }

    }
    
}

export namespace GraphicalSplit {

    export const DEFAULT_HEIGHT = 5;

}