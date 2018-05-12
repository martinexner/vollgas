import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalMicro16Alu extends CombinedGraphicalElement {

    constructor(name: string) {

        let elements: string[] = [];

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const busDist = GraphicalWire.DEFAULT_BUS_DISTANCE;
        const elemSpace = GraphicalOr.DEFAULT_ELEMENT_SPACE;

        const elemHeight = Math.floor(GraphicalOr.DEFAULT_HEIGHT / 2);
        const regsHeight = (16 + 1)*wireDist;
        const zeroNorHeight = 2*regsHeight;
        const notsHeight = elemHeight;
        const decHeight = GraphicalOr.DEFAULT_HEIGHT;
        const fasHeight = 2*(2*elemHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE) + elemHeight + 4*GraphicalOr.DEFAULT_ELEMENT_SPACE + GraphicalWire.DEFAULT_DISTANCE;
        const muxHeight = (4*17 + 1) * wireDist;
        const shifterElementsHeight = elemHeight;
        const outSplitHeight = regsHeight;
        const logicOrsHeight = decHeight;

        const muxWidth = GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT);
        const regsWidth = GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT);
        const fasWidth = 3*GraphicalWire.DEFAULT_DISTANCE + GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT) + 3*GraphicalWire.DEFAULT_DISTANCE;
        const fasAndSpacesWidth = fasWidth + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const shifterBlockWidth = 5*wireDist + GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT) + 5*wireDist;
        const logicOrsWidth = GraphicalOr.getWidth(logicOrsHeight);
        const displayWidth = 2*regsWidth;

        const muxX = 18*wireDist;
        const zeroNorX = muxX;
        const muxAfterX = muxX + muxWidth;
        const calcX = muxAfterX + 2*GraphicalOr.DEFAULT_ELEMENT_SPACE + 19*wireDist + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const displaySplitX = calcX + 16*fasWidth + 16*GraphicalOr.DEFAULT_ELEMENT_SPACE + 4*wireDist;
        const regsX = displaySplitX + displayWidth;
        const decX = displaySplitX;
        const shifterX = muxX;
        const outSplitX = 0;
        const shifterNorX = decX;

        const muxY = 0;
        const zeroNorY = muxY + muxHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const aRegY = muxY;
        const aNotsY = aRegY + regsHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE + 16*wireDist + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const bRegY = aNotsY + notsHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const faY = bRegY + regsHeight + decHeight;
        const belowFaWiresY = faY + fasHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;
        const logicWiresY = belowFaWiresY + 18*wireDist;
        const shifterInWiresY = logicWiresY + 3*wireDist;
        const shifterElementsY = shifterInWiresY + 18*wireDist;
        const shifterControlWiresY = shifterElementsY + 4*shifterElementsHeight + 6*elemSpace;
        const outSplitY = shifterControlWiresY + 2*wireDist + elemSpace;
        const shifterNorY = outSplitY;

        let aRegWires: string[] = [];
        let bRegWires: string[] = [];

        let aDisplaySplitWires: string[] = [];
        let bDisplaySplitWires: string[] = [];

        let muxWires: string[] = [];

        elements.push(`out_split split line=true overrideHeight=${outSplitHeight} displayValue=belowRight @${outSplitX}:${outSplitY} 0+15>>`);

        for(let i = 0; i < 16; i++) {
            muxWires.push(`>n:p~mux_split${i}`);
        }

        elements.push(`mux mux overrideHeight=${muxHeight} mirrorConnectors=true @${muxX}:${muxY} ${muxWires.join(" ")}`);

        elements.push(`zero_nor nor overrideHeight=${zeroNorHeight} @${zeroNorX}:${zeroNorY} >${muxAfterX+4*wireDist}:p~p:${logicWiresY}~n-${2*wireDist}:p~n:p~n-${3*wireDist}:n~logic_z_or/i1`);

        for(let i = 0; i < 16; i++) {

            let shifterWire = ` >p:${shifterInWiresY+(15-i)*wireDist}~n:p~shifter_split${i}`;

            if(i >= 15) {
                elements.push(`negative_split split @zero_nor/i${i}-${(17-i)*wireDist}:${zeroNorY+zeroNorHeight+2*wireDist}${shifterWire} >${muxAfterX+3*wireDist}:p~p:n~logic_n_or/i0`);
                shifterWire = ` >negative_split`;
            }

            elements.push(`mux_split${i} split @zero_nor/i${i}-${(17-i)*wireDist}:zero_nor/i${i} >zero_nor/i${i}${shifterWire}`);

        }

        elements.push(`logic_n_or or i0@${decX}:${logicWiresY+wireDist} <38 >p+${3*wireDist}:p~p:n~logic_and/i1`);

        elements.push(`logic_z_or or i0@${decX}:logic_n_or/i0-${logicOrsHeight+elemSpace} <37 >p+${2*wireDist}:p~p:n~logic_and/i0`);

        elements.push(`logic_and and o0@logic_z_or/o0+${logicOrsWidth+5*wireDist}:logic_z_or/o0 0>>`);

        for(let i = 0; i < 16; i++) {

            let x = calcX + i*fasAndSpacesWidth;

            elements.push(`not${i} nor overrideHeight=${notsHeight} @${x+2*wireDist}:${aNotsY} >p+${2*wireDist}:p~p:n~mux/i${i+17}`);

            let cWire = i >= 15 ? "" : (i > 0) ? ` 0>p+${3*wireDist}:p~p:n~add${i+1}/i2` : ` 0>p:n~add${i+1}/i2`;
            elements.push(`add${i} ${(i > 0) ? "fa" : "ha"} detailed=true overrideHeight=${elemHeight} additionalAndOutput=true @${x}:${faY}${cWire}
1>p:n~mux/i${i+51}
2>p+${2*wireDist}:p~p:${belowFaWiresY+(i+1)*wireDist}~${muxAfterX+(21-i)*wireDist}:p~p:n~mux/i${i+34}`);

            elements.push(`a_split${i} split @add${i}/i1:mux/i${i} >not_split${i} >mux/i${i}`);

            elements.push(`not_split${i} split @a_split${i}/i0:not${i}/i0 >add${i}/i1 >not${i}`);

            aRegWires.push(`>areg_display_split/i${i}`);
            bRegWires.push(`>breg_display_split/i${i}`);

            aDisplaySplitWires.push(`>a_split${i}`);
            bDisplaySplitWires.push(`>n:p~add${i}/i0`);

        }

        elements.push(`areg reg overrideHeight=${regsHeight} mirrorConnectors=true @${regsX}:${aRegY} <0+15 ${aRegWires.join(" ")}`);
        elements.push(`breg reg overrideHeight=${regsHeight} mirrorConnectors=true @${regsX}:${bRegY} <16+15 ${bRegWires.join(" ")}`);

        elements.push(`areg_display_split split line=true overrideHeight=${regsHeight} displayValue=belowRight i7@${displaySplitX}:areg/o7 ${aDisplaySplitWires.join(" ")}`);
        elements.push(`breg_display_split split line=true overrideHeight=${regsHeight} displayValue=aboveRight i7@${displaySplitX}:breg/o7 ${bDisplaySplitWires.join(" ")}`);

        elements.push(`regs_enable_split split @areg/i16+${2*wireDist}:areg/i16 <32 >areg/i16 >p:n~breg/i16`);

        elements.push(`dec decoder mirrorConnectors=true o2@${decX}:mux/i67 <33+1
>p-${2*wireDist}:p~p:n~mux/i16
>p-${4*wireDist}:p~${Math.floor(calcX+1.5*fasAndSpacesWidth)}:n~mux/i50
>mux/i67
>p-${3*wireDist}:p~p:n~mux/i33`);

        for(let i = 0; i < 16; i++) {

            let x = shifterX + i*shifterBlockWidth + 5*wireDist;

            let fwdY = shifterElementsY;
            let bwdY = fwdY + shifterElementsHeight + 2*elemSpace;
            let defY = bwdY + shifterElementsHeight + 2*elemSpace;
            let orY = defY + shifterElementsHeight + elemSpace;

            let fwdWireY = bwdY - elemSpace;
            let bwdWireY = defY - elemSpace;

            let splitTargets: string[] = [];

            elements.push(`shifter_forward_and${i} and overrideHeight=${shifterElementsHeight} @${x}:${fwdY}` + ((i < 15) ? ` >p+${4*wireDist}:p~p:${fwdWireY}~n:p~n+${3*wireDist}:n~shifter_or${i+1}/i1` : ""));

            elements.push(`shifter_backward_and${i} and overrideHeight=${shifterElementsHeight} @${x}:${bwdY}` + ((i > 0) ? ` >p+${2*wireDist}:p~p:${bwdWireY}~n:p~n+${4*wireDist}:n~shifter_or${i-1}` : ""));

            elements.push(`shifter_and${i} and overrideHeight=${shifterElementsHeight} @${x}:${defY} >p+${2*wireDist}:p~p:n~shifter_or${i}/i0`);

            elements.push(`shifter_split${i} split @shifter_forward_and${i}/i0-${2*wireDist}:shifter_forward_and${i}/i0 >shifter_forward_and${i} >shifter_backward_split${i}`);
            elements.push(`shifter_backward_split${i} split @shifter_backward_and${i}/i0-${2*wireDist}:shifter_backward_and${i}/i0 >shifter_backward_and${i} >p:n~shifter_and${i}`);

            elements.push(`shifter_or${i} or mirrorConnectors=true overrideHeight=${shifterElementsHeight} @${x}:${orY} >p-${5*wireDist}:p~p:n~out_split`);

            if(i > 0) {

                let modifiers = ["forward_", "backward_", ""];

                for(let j = 0; j < modifiers.length; j++) {

                    let modifier = modifiers[j];

                    let target = (i > 1) ? `${modifier}control_split${i-1}` : `n:p~n-${(4-j)*wireDist}:n~shifter_${modifier}and${i-1}`;
                    elements.push(`${modifier}control_split${i} split @${x-(4-j)*wireDist}:${shifterControlWiresY+j*wireDist} >p:n~shifter_${modifier}and${i} >${target}`);

                }

            }

        }

        elements.push(`shifter_nor nor mirrorConnectors=true @${shifterNorX}:${shifterNorY} >p-${2*wireDist}:p~p:n~control_split15`);
        elements.push(`shifter_nor_forward_split split @shifter_nor/i0+${3*wireDist}:shifter_nor/i0 <35 >shifter_nor/i0 >p:n~forward_control_split15`);
        elements.push(`shifter_nor_backward_split split @shifter_nor/i1+${2*wireDist}:shifter_nor/i1 <36 >shifter_nor/i1 >p:n~backward_control_split15`);

        super(name, outSplitY + outSplitHeight, GrammarParser.parse(elements).wiringDescriptions);

    }

}