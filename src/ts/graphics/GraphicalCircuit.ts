import { Circuit } from "./../Circuit";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalWire } from "./GraphicalWire";
import { GraphicalNor } from "./GraphicalNor";

export class GraphicalCircuit {

    public app: PIXI.Application|undefined;

    public circuit: Circuit;

    constructor(public graphicalElement: StubGraphicalElement<any>, private disableGraphics = false, private stepsPerSecond = 50, private delayPerWindowHeight = GraphicalWire.DEFAULT_DELAY_PER_WINDOW_HEIGHT, private echoData = false, private cyclesPerStep?: number, private additionalNorDelay?: number) {

    }

    async init(echoFunctions = false) {

        let width: number;
        let height: number;

        try {
            width = window.innerWidth;
            height = window.innerHeight;
        } catch(e) {
            width = 800;
            height = 600;
        }

        GraphicalWire.DELAY_PER_PIXEL = this.delayPerWindowHeight / height;

        if(this.additionalNorDelay !== undefined && this.additionalNorDelay >= 0) {
            GraphicalNor.ADDITIONAL_DELAY = this.additionalNorDelay;
        }

        let coordinates = [{ x: 0, y: 0 }];

        this.graphicalElement.initConnectorCoordinates(height);
        this.graphicalElement.initBaseCoordinates(height, coordinates);
        this.graphicalElement.initElement(height, coordinates);

        this.circuit = new Circuit(this.graphicalElement.element);
        await this.circuit.init(echoFunctions);

        if(!this.disableGraphics) {
            this.graphicalElement.initGraphics(height, coordinates, this.circuit.dataSource);
        }

        if(!this.disableGraphics) {

            let graphics = this.graphicalElement.graphics;

            if(!graphics) {
                throw new Error("graphical element fails to provide graphics");
            }

            this.app = new PIXI.Application({
                width: width,
                height: height,
                antialias: true,
                transparent: true
            });
            this.app.stage.addChild(graphics);

            this.graphicalElement.redraw(0);

            if(this.stepsPerSecond > 0) {

                let intervalMsec = 1000 / this.stepsPerSecond;
                let msec = -1;

                let ticker = this.app.ticker.add(() => {

                    if(msec < 0) {
                        msec = 0;
                        return;
                    }

                    msec += ticker.elapsedMS;

                    while(msec >= intervalMsec) {

                        msec -= intervalMsec;

                        if(this.echoData) {
                            console.log(`data source after step ${this.circuit.dataSource.n}:`);
                            console.log("addresses", this.circuit.dataSource.addressArray);
                            console.log("data", this.circuit.dataSource.array);
                        }

                        this.circuit.step(this.cyclesPerStep);

                    }

                    let progress = msec / intervalMsec;

                    this.graphicalElement.redraw(progress);

                });

            }

        }

    }

}
