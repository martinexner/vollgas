import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalMicro16Mic extends CombinedGraphicalElement {

    constructor(name: string) {

        let elements: string[] = [];

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const elemSpace = GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const busDist = GraphicalWire.DEFAULT_BUS_DISTANCE;

        const elemWidth = GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT);
        const haWidth = 3*wireDist + elemWidth + 3*wireDist;

        const elemHeight = GraphicalOr.DEFAULT_HEIGHT;
        const muxHeight = elemHeight;
        const haElemHeight = elemHeight/2;
        const regHeight = elemHeight;
        const faHeight = 2*haElemHeight + elemSpace;

        const haX = 0;
        const distributorX = haX + 8*haWidth;
        const regX = distributorX + 4*busDist;
        const collectorX = haX;
        const muxX = regX + elemWidth + busDist + 3*wireDist;
        const jumpNotX = muxX;

        const busY = 0;
        const distributorY = busY + busDist;
        const regY = distributorY;
        const faY = regY + regHeight + elemSpace;
        const collectorY = faY + faHeight + elemSpace;
        const jumpNotY = regY + regHeight + 4*wireDist;

        let distributorWires: string[] = [];

        for(let i = 0; i < 8; i++) {

            let x = haX + i*haWidth;

            if(i < 1) {
                // add index 0 later
            } else {
                elements.push(`add${i} ha detailed=true overrideHeight=${haElemHeight} @${x}:${faY} 1>p+${2*wireDist}:p~p:n~collector/i${i}` + ((i < 7) ? ` 0>p+${1*wireDist}:p~p:n~add${i+1}/i1` : ""));
            }

            distributorWires.push(`>n:p~add${i}/i0`);

        }

        // now add index 0
        elements.push(`add0 split @${haX}:add1/i1 >add1/i1 >p:n~nor0`);
        elements.push(`nor0 nor overrideHeight=${haElemHeight} i0@${haX+1*wireDist}:add1/o1 >p+${2*wireDist}:p~p:n~collector/i0`);

        elements.push(`reg reg mirrorConnectors=true @${regX}:${regY} 8<8 0+7>out_split`);

        elements.push(`distributor split line=true @${distributorX}:${distributorY} ${distributorWires.join(" ")}`);

        elements.push(`out_split split @distributor/i3+${2*busDist}:distributor/i3 0+7>> 8+7>distributor`);

        elements.push(`collector split line=true @${collectorX}:${collectorY} 0+7>p-${busDist}:p~p:${busY}~n:p~n+${busDist}:n~mux/i0`);

        elements.push(`mux mux mirrorConnectors=true overrideHeight=${muxHeight} o3@${muxX}:reg/i3 9<0+7 0+7>reg`);

        elements.push(`jump_not nor @${jumpNotX}:${jumpNotY} >p+${3*wireDist}:p~p:n~mux/i8`);

        elements.push(`jump_split split @jump_not/i0-${2*wireDist}:jump_not/i0 <9 >jump_not >p:${jumpNotY-2*wireDist}~n:p~n+${2*wireDist}:n~mux/i17`);

        super(name, collectorY + elemHeight, GrammarParser.parse(elements).wiringDescriptions);

    }

}